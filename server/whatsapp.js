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
    }

    async initialize() {
        try {
            logger.info('Starting WhatsApp initialization...');
            
            // Ensure auth directory exists
            await fs.ensureDir(this.authDir);

            const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
            const { version } = await fetchLatestBaileysVersion();

            logger.info('Creating WhatsApp socket with version:', version);

            this.sock = makeWASocket({
                version,
                logger: pino({ level: "debug" }),
                printQRInTerminal: true,
                auth: state,
                browser: ['BLACKSKY-MD', 'Safari', '1.0.0'],
                connectTimeoutMs: 60_000,
                defaultQueryTimeoutMs: 0,
                keepAliveIntervalMs: 10000,
                emitOwnEvents: true,
                markOnlineOnConnect: true,
                retryRequestDelayMs: 2000
            });

            this.store.bind(this.sock.ev);

            // Setup connection handling
            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;
                
                logger.info('Connection status update:', {
                    connection,
                    hasQR: !!qr,
                    disconnectReason: lastDisconnect?.error?.output?.statusCode,
                    fullError: lastDisconnect ? JSON.stringify(lastDisconnect.error, null, 2) : null
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
                    const shouldReconnect = (lastDisconnect?.error instanceof Boom) &&
                        lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;
                    
                    logger.info('Connection closed:', {
                        shouldReconnect,
                        retriesLeft: this.retriesLeft,
                        statusCode: lastDisconnect?.error?.output?.statusCode,
                        errorMessage: lastDisconnect?.error?.message
                    });

                    if (shouldReconnect && this.retriesLeft > 0) {
                        this.retriesLeft--;
                        logger.info(`Attempting reconnection in ${this.retryTimeout}ms... (${this.retriesLeft} retries left)`);
                        setTimeout(() => this.initialize(), this.retryTimeout);
                    } else {
                        logger.error('Connection closed permanently:', lastDisconnect?.error);
                        // Clear auth if logged out
                        if (lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut) {
                            await fs.remove(this.authDir);
                            logger.info('Auth directory cleared due to logout');
                        }
                    }
                }
            });

            // Handle credentials updates
            this.sock.ev.on('creds.update', async () => {
                logger.info('Credentials updated, saving...');
                await saveCreds();
            });

            return this.sock;

        } catch (error) {
            logger.error('WhatsApp initialization error:', error);
            if (this.retriesLeft > 0) {
                this.retriesLeft--;
                logger.info(`Retrying initialization in ${this.retryTimeout}ms... (${this.retriesLeft} retries left)`);
                setTimeout(() => this.initialize(), this.retryTimeout);
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
