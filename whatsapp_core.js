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

function validatePhoneNumber(phoneNumber) {
    // Remove any spaces, dashes, or plus signs
    const cleanNumber = phoneNumber.replace(/[\s\-\+]/g, '');
    // Check if it's a valid number format (just digits)
    if (!/^\d+$/.test(cleanNumber)) {
        throw new Error('Phone number should contain only digits');
    }
    return cleanNumber;
}

async function initializeWhatsApp() {
    try {
        // Ensure clean auth state
        await ensureCleanAuth();

        // Validate phone number first
        if (!process.env.OWNER_NUMBER) {
            throw new Error('OWNER_NUMBER environment variable is not set');
        }

        const phoneNumber = validatePhoneNumber(process.env.OWNER_NUMBER);
        logger.info('Starting pairing process for number:', phoneNumber);

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
            phoneNumber: phoneNumber // Make sure this is just digits
        });

        logger.info('Please follow these steps to pair your device:');
        logger.info('1. Open WhatsApp on your phone');
        logger.info('2. Go to Settings > Linked Devices');
        logger.info('3. Tap on "Link a Device"');
        logger.info('4. When prompted, enter the pairing code that will be shown here');
        logger.info('Waiting for pairing code to be generated...');

        // Handle connection updates
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            // Log connection updates
            logger.info('Connection state update:', { 
                connection, 
                disconnectReason: lastDisconnect?.error?.output?.statusCode,
                fullUpdate: update // Log the full update object for debugging
            });

            if (connection === 'open') {
                logger.info('WhatsApp connection opened successfully');

                // Log successful connection details
                logger.info('Connected with:', {
                    user: sock.user,
                    platform: sock.ws.socket.platform,
                    timestamp: new Date().toISOString()
                });
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom)? 
                    lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut : true;

                logger.info('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);

                if (shouldReconnect) {
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
        logger.error('Error in WhatsApp connection setup:', error);
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