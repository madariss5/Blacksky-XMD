const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs-extra');
const path = require('path');
const pino = require('pino');

// Configure logger
const logger = pino({
    level: 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true
        }
    }
});

// Auth directory configuration
const AUTH_DIR = path.join(__dirname, 'auth_info_baileys');

async function ensureCleanAuth() {
    logger.info('Cleaning auth directory...');
    await fs.remove(AUTH_DIR);
    await fs.ensureDir(AUTH_DIR);
    logger.info('Auth directory cleaned and recreated');
}

async function initializeWhatsApp() {
    try {
        // Ensure clean auth state
        await ensureCleanAuth();

        // Initialize auth state
        logger.info('Initializing auth state...');
        const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

        // Create WhatsApp socket with pairing code config
        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false, // Disable QR code
            logger: logger,
            browser: ['WhatsApp-MD', 'Firefox', '120.0.1'],
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 20000,
            emitOwnEvents: true,
            markOnlineOnConnect: true,
            // Enable pairing code
            pairingCode: true,
            phoneNumber: process.env.OWNER_NUMBER
        });

        // Handle connection updates
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            // Log connection updates
            logger.info('Connection state update:', {
                connection,
                disconnectReason: lastDisconnect?.error?.output?.statusCode,
                timestamp: new Date().toISOString()
            });

            if (connection === 'open') {
                logger.info('Connection established successfully!');
                sock.sendPresenceUpdate('available');

                // Log successful connection details
                logger.info('Connected with:', {
                    user: sock.user,
                    platform: sock.ws.socket.platform,
                    timestamp: new Date().toISOString()
                });
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                logger.info('Connection closed:', { 
                    shouldReconnect,
                    statusCode,
                    errorMessage: lastDisconnect?.error?.message,
                    timestamp: new Date().toISOString()
                });

                if (shouldReconnect) {
                    logger.info('Attempting reconnection in 3 seconds...');
                    setTimeout(initializeWhatsApp, 3000);
                }
            }
        });

        // Handle credentials update
        sock.ev.on('creds.update', async () => {
            logger.info('Credentials updated, saving...');
            await saveCreds();
        });

        // Handle messages for testing
        sock.ev.on('messages.upsert', async ({ messages }) => {
            const message = messages[0];
            if (!message) return;

            logger.info('New message received:', {
                from: message.key.remoteJid,
                type: message.message ? Object.keys(message.message)[0] : 'unknown',
                timestamp: new Date().toISOString()
            });
        });

        return sock;
    } catch (error) {
        logger.error('WhatsApp initialization error:', error);
        throw error;
    }
}

// Check if OWNER_NUMBER is set
if (!process.env.OWNER_NUMBER) {
    logger.error('OWNER_NUMBER environment variable is not set. Cannot proceed with pairing code authentication.');
    process.exit(1);
}

// Start WhatsApp connection
logger.info('Starting WhatsApp core with pairing code authentication...');
initializeWhatsApp().catch(err => {
    logger.error('Fatal error:', err);
    process.exit(1);
});