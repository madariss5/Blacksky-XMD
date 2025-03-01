const pino = require('pino');
const logger = require('pino')();
const { 
    default: makeWASocket,
    useMultiFileAuthState,
    makeInMemoryStore,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const fs = require('fs-extra');
const path = require('path');

class WhatsAppManager {
    constructor() {
        this.store = makeInMemoryStore({ logger: pino({ level: "silent" }) });
        this.authDir = path.join(__dirname, '../auth_info_baileys');
        this.retriesLeft = 3;
        this.retryTimeout = 3000;
        this.sock = null;
        this.isConnected = false;
        this.messageRetryMap = new Map();
        this.initializationPromise = null;
    }

    async initialize() {
        // Prevent multiple initialization attempts
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = this._initialize();
        return this.initializationPromise;
    }

    async _initialize() {
        try {
            logger.info('Starting WhatsApp initialization...');

            // Clean up auth directory and recreate
            await fs.remove(this.authDir);
            await fs.ensureDir(this.authDir);

            const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
            const { version } = await fetchLatestBaileysVersion();

            logger.info('Creating WhatsApp socket with version:', version);

            this.sock = makeWASocket({
                version,
                logger: pino({ level: "silent" }),
                printQRInTerminal: true,
                auth: state,
                browser: ['BLACKSKY-MD', 'Chrome', '112.0.0.0'],
                connectTimeoutMs: 60_000,
                defaultQueryTimeoutMs: 30_000,
                keepAliveIntervalMs: 10000,
                emitOwnEvents: true,
                markOnlineOnConnect: true,
                retryRequestDelayMs: 2000
            });

            this.store.bind(this.sock.ev);

            // Setup connection handling with improved error handling
            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    logger.info('New QR code received, displaying in terminal...');
                }

                if (connection === 'open') {
                    this.isConnected = true;
                    this.retriesLeft = 3;
                    logger.info('WhatsApp connection established successfully');
                    this.sock.sendPresenceUpdate('available');
                }

                if (connection === 'close') {
                    this.isConnected = false;
                    const statusCode = lastDisconnect?.error?.output?.statusCode;
                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                    logger.info('Connection closed:', {
                        shouldReconnect,
                        retriesLeft: this.retriesLeft,
                        statusCode,
                        errorMessage: lastDisconnect?.error?.message
                    });

                    if (shouldReconnect && this.retriesLeft > 0) {
                        this.retriesLeft--;
                        logger.info(`Attempting reconnection in ${this.retryTimeout}ms... (${this.retriesLeft} retries left)`);
                        this.initializationPromise = null; // Reset initialization promise
                        setTimeout(() => this.initialize(), this.retryTimeout);
                    } else {
                        logger.error('Connection closed permanently:', lastDisconnect?.error);
                        if (statusCode === DisconnectReason.loggedOut) {
                            await fs.remove(this.authDir);
                            logger.info('Auth directory cleared due to logout');
                        }
                        throw new Error('WhatsApp connection closed permanently');
                    }
                }
            });

            // Handle messages with improved error handling
            this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
                try {
                    if (type === 'notify') {
                        for (const message of messages) {
                            if (message.key && message.key.remoteJid) {
                                this.messageRetryMap.set(message.key.id, {
                                    retries: 0,
                                    timestamp: Date.now()
                                });
                            }
                        }
                    }
                } catch (error) {
                    logger.error('Error processing message:', error);
                }
            });

            // Handle credentials updates
            this.sock.ev.on('creds.update', async () => {
                try {
                    logger.info('Credentials updated, saving...');
                    await saveCreds();
                } catch (error) {
                    logger.error('Error saving credentials:', error);
                }
            });

            return this.sock;

        } catch (error) {
            logger.error('WhatsApp initialization error:', error);
            this.initializationPromise = null;

            if (this.retriesLeft > 0) {
                this.retriesLeft--;
                logger.info(`Retrying initialization in ${this.retryTimeout}ms... (${this.retriesLeft} retries left)`);
                setTimeout(() => this.initialize(), this.retryTimeout);
            } else {
                throw error;
            }
        }
    }

    async handleMessageRetrieval(key) {
        try {
            const retryData = this.messageRetryMap.get(key.id);
            if (!retryData) return null;

            if (retryData.retries >= 5) {
                this.messageRetryMap.delete(key.id);
                return null;
            }

            if (Date.now() - retryData.timestamp > 60000) {
                this.messageRetryMap.delete(key.id);
                return null;
            }

            retryData.retries++;
            this.messageRetryMap.set(key.id, retryData);

            return null;
        } catch (error) {
            logger.error('Error retrieving message:', error);
            return null;
        }
    }

    getSocket() {
        return this.sock;
    }

    isSocketConnected() {
        return this.isConnected;
    }
}

module.exports = new WhatsAppManager();