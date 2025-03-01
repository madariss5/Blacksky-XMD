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

            // Clean up auth directory to force new QR code
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
                browser: ['𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻', 'Chrome', '112.0.5615.49'],
                connectTimeoutMs: 60_000,
                qrTimeout: 40000,
                defaultQueryTimeoutMs: 0,
                keepAliveIntervalMs: 10000,
                emitOwnEvents: true,
                markOnlineOnConnect: true,
                retryRequestDelayMs: 2000,
                userDeviceIdForUserHandle: '𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝔹𝕆𝕋'
            });

            this.store.bind(this.sock.ev);

            this.sock.ev.on('connection.update', (update) => {
                const { connection, lastDisconnect, qr } = update;
                logger.info('Connection status update:', {
                    connection,
                    hasQR: !!qr,
                    disconnectReason: lastDisconnect?.error?.output?.statusCode
                });

                if (qr) {
                    logger.info('New QR code received, displaying in terminal...');
                    require('qrcode-terminal').generate(qr, { small: true });
                }

                if (connection === 'open') {
                    this.isConnected = true;
                    logger.info('WhatsApp connection established successfully!');
                    this.sock.sendPresenceUpdate('available');
                }

                if (connection === 'close') {
                    this.isConnected = false;
                    const shouldReconnect = (lastDisconnect?.error instanceof Boom) ?
                        lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;

                    logger.info('Connection closed:', {
                        shouldReconnect,
                        statusCode: lastDisconnect?.error?.output?.statusCode,
                        errorMessage: lastDisconnect?.error?.message
                    });

                    if (shouldReconnect) {
                        logger.info('Attempting reconnection in 3 seconds...');
                        setTimeout(() => {
                            this.initializationPromise = null;
                            this.initialize();
                        }, 3000);
                    }
                }
            });

            this.sock.ev.on('creds.update', saveCreds);

            // Handle messages with improved error handling
            this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
                try {
                    if (type === 'notify') {
                        logger.info('New message received:', {
                            from: messages[0].key.remoteJid,
                            type: Object.keys(messages[0].message)[0]
                        });
                    }
                } catch (error) {
                    logger.error('Error processing message:', error);
                }
            });

            return this.sock;

        } catch (error) {
            logger.error('WhatsApp initialization error:', error);
            this.initializationPromise = null;
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