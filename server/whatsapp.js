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
        this.retriesLeft = 5; // Increased retries
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

            // Ensure auth directory exists
            await fs.ensureDir(this.authDir);

            const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
            const { version } = await fetchLatestBaileysVersion();

            logger.info('Creating WhatsApp socket with version:', version);

            // Enhanced socket configuration based on SHABAN-MD-V5
            this.sock = makeWASocket({
                version,
                logger: pino({ level: "silent" }), // Reduce noise but log important events
                printQRInTerminal: true,
                auth: {
                    creds: state.creds,
                    keys: state.keys
                },
                browser: ['BLACKSKY-MD', 'Safari', '1.0.0'], // Updated browser config
                connectTimeoutMs: 60000,
                qrTimeout: 60000,
                defaultQueryTimeoutMs: 30000,
                keepAliveIntervalMs: 10000,
                emitOwnEvents: true,
                markOnlineOnConnect: true,
                retryRequestDelayMs: 2000,
                fireInitQueries: true,
                generateHighQualityLinkPreview: true,
                syncFullHistory: true,
                userDeviceIdForUserHandle: 'BLACKSKY-BOT'
            });

            this.store.bind(this.sock.ev);

            // Enhanced connection handling
            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;
                logger.info('Connection status update:', {
                    connection,
                    hasQR: !!qr,
                    disconnectReason: lastDisconnect?.error?.output?.statusCode
                });

                if (qr) {
                    logger.info('New QR code received, displaying in terminal...');
                    // Log QR data for debugging
                    logger.info('QR data length:', qr.length);
                    logger.info('QR data first 50 chars:', qr.substring(0, 50));
                }

                if (connection === 'open') {
                    this.isConnected = true;
                    this.retriesLeft = 5; // Reset retries on successful connection
                    logger.info('WhatsApp connection established successfully!');
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
                        const delay = (5 - this.retriesLeft) * this.retryTimeout; // Progressive delay
                        logger.info(`Attempting reconnection in ${delay}ms... (${this.retriesLeft} retries left)`);
                        this.initializationPromise = null;
                        setTimeout(() => this.initialize(), delay);
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

            // Enhanced credentials update handling
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
                const delay = (5 - this.retriesLeft) * this.retryTimeout;
                logger.info(`Retrying initialization in ${delay}ms... (${this.retriesLeft} retries left)`);
                setTimeout(() => this.initialize(), delay);
            } else {
                throw error;
            }
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