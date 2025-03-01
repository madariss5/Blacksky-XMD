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
        this.authDir = path.join(process.cwd(), 'auth_info_baileys');
        this.retriesLeft = 3;
        this.retryTimeout = 3000;
        this.sock = null;
        this.isConnected = false;
        this.initializationPromise = null;
        this.qrDisplayed = false;
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

            logger.info('Creating WhatsApp connection with version:', version);

            this.sock = makeWASocket({
                version,
                logger: pino({ 
                    level: 'debug',
                    timestamp: () => `,"time":"${new Date().toJSON()}"` 
                }),
                printQRInTerminal: false,
                auth: state,
                browser: ['𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻', 'Chrome', '112.0.5615.49'],
                connectTimeoutMs: 60_000,
                qrTimeout: 40000,
                defaultQueryTimeoutMs: 20000,
                keepAliveIntervalMs: 10000,
                emitOwnEvents: true,
                markOnlineOnConnect: true,
                retryRequestDelayMs: 2000,
                fireInitQueries: true,
                syncFullHistory: true
            });

            this.store.bind(this.sock.ev);

            // Enhanced connection state handling
            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                logger.info('Connection state updated:', {
                    currentState: connection,
                    hasQR: !!qr,
                    isConnected: this.isConnected,
                    disconnectReason: lastDisconnect?.error?.output?.statusCode
                });

                if (qr && !this.qrDisplayed) {
                    this.qrDisplayed = true;
                    logger.info('Please scan this QR code to connect:');
                    require('qrcode-terminal').generate(qr, { small: true });
                }

                if (connection === 'open') {
                    this.isConnected = true;
                    this.qrDisplayed = false;
                    this.retriesLeft = 3;
                    logger.info('WhatsApp connection established successfully!');
                    await this.sock.sendPresenceUpdate('available');
                }

                if (connection === 'close') {
                    this.isConnected = false;
                    const statusCode = lastDisconnect?.error?.output?.statusCode;
                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                    logger.info('Connection closed:', {
                        shouldReconnect,
                        statusCode,
                        retriesLeft: this.retriesLeft,
                        error: lastDisconnect?.error?.message
                    });

                    if (shouldReconnect && this.retriesLeft > 0) {
                        this.retriesLeft--;
                        const delay = (3 - this.retriesLeft) * this.retryTimeout;
                        logger.info(`Attempting reconnection in ${delay}ms... (${this.retriesLeft} retries left)`);
                        this.initializationPromise = null;
                        this.qrDisplayed = false;
                        setTimeout(() => this.initialize(), delay);
                    } else if (statusCode === DisconnectReason.loggedOut) {
                        logger.info('Device logged out, clearing auth info...');
                        await fs.remove(this.authDir);
                        await fs.ensureDir(this.authDir);
                        this.qrDisplayed = false;
                        logger.info('Auth directory cleared. Please restart the application to scan new QR code.');
                    }
                }
            });

            // Enhanced credentials update handling
            this.sock.ev.on('creds.update', async () => {
                try {
                    await saveCreds();
                    logger.info('Credentials updated and saved successfully');
                } catch (error) {
                    logger.error('Error saving credentials:', {
                        error: error.message,
                        stack: error.stack
                    });
                }
            });

            return this.sock;

        } catch (error) {
            logger.error('WhatsApp initialization error:', {
                error: error.message,
                stack: error.stack
            });
            this.initializationPromise = null;
            this.qrDisplayed = false;
            throw error;
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