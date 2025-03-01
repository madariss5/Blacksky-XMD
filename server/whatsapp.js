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
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = this._initialize();
        return this.initializationPromise;
    }

    async _initialize() {
        try {
            logger.info('Starting WhatsApp initialization...');

            // Ensure auth directory exists and is clean
            await fs.ensureDir(this.authDir);

            const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
            const { version } = await fetchLatestBaileysVersion();

            logger.info('Creating WhatsApp socket with version:', version);

            this.sock = makeWASocket({
                version,
                logger: pino({ level: "debug" }), // Set to debug for more detailed logs
                printQRInTerminal: true,
                auth: state,
                browser: ["Chrome (Linux)", "Desktop", "1.0.0"],
                connectTimeoutMs: 120000, // Increased timeout
                qrTimeout: 40000, // Added QR timeout
                defaultQueryTimeoutMs: 60000, // Increased query timeout
                keepAliveIntervalMs: 15000, // Increased keepalive
                emitOwnEvents: true,
                markOnlineOnConnect: true,
                retryRequestDelayMs: 2000,
                phoneNumber: process.env.PHONE_NUMBER // Optional: Add phone number if available
            });

            this.store.bind(this.sock.ev);

            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;
                logger.info('Connection status update:', {
                    connection,
                    hasQR: !!qr,
                    disconnectReason: lastDisconnect?.error?.output?.statusCode
                });

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
                    const shouldReconnect = (lastDisconnect?.error instanceof Boom) ?
                        statusCode !== DisconnectReason.loggedOut : true;

                    logger.info('Connection closed:', {
                        shouldReconnect,
                        statusCode,
                        errorMessage: lastDisconnect?.error?.message
                    });

                    if (shouldReconnect && this.retriesLeft > 0) {
                        this.retriesLeft--;
                        logger.info(`Attempting reconnection in ${this.retryTimeout}ms... (${this.retriesLeft} retries left)`);
                        this.initializationPromise = null;
                        setTimeout(() => this.initialize(), this.retryTimeout);
                    } else {
                        logger.error('Connection closed permanently');
                        if (statusCode === DisconnectReason.loggedOut) {
                            await fs.remove(this.authDir);
                            logger.info('Auth directory cleared due to logout');
                        }
                        throw new Error('WhatsApp connection closed permanently');
                    }
                }
            });

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