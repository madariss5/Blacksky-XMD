const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs-extra');
const path = require('path');
const pino = require('pino');
const readline = require('readline');

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

function validatePhoneInput(countryCode, phoneNumber) {
    // Remove any non-digit characters
    const cleanCountryCode = countryCode.replace(/\D/g, '');
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');

    // Validate country code format
    if (cleanCountryCode.length === 0) {
        throw new Error('Country code is required');
    }
    if (cleanCountryCode.length > 4) {
        throw new Error('Country code must be between 1-4 digits (e.g., 49 for Germany)');
    }

    // Phone number validation
    if (cleanPhoneNumber.length === 0) {
        throw new Error('Phone number is required');
    }
    if (cleanPhoneNumber.length < 8 || cleanPhoneNumber.length > 12) {
        throw new Error('Phone number must be between 8-12 digits (excluding country code)');
    }

    // Check total length
    const fullNumber = cleanCountryCode + cleanPhoneNumber;
    if (fullNumber.length > 15) {
        throw new Error('Total phone number length cannot exceed 15 digits');
    }

    return fullNumber;
}

async function getPhoneNumber() {
    while (true) {
        try {
            logger.info('Please enter your WhatsApp phone number details:');
            logger.info('────────────────────────────────────────');
            logger.info('Examples:');
            logger.info('• Country code: 49 (for Germany)');
            logger.info('• Phone number: 15561048015');
            logger.info('Note: Enter only the digits, no spaces or special characters');
            logger.info('────────────────────────────────────────');

            const countryCode = await getUserInput('Enter country code (without + or 00): ');
            if (!countryCode) {
                logger.error('Country code cannot be empty. Please try again.');
                continue;
            }

            const phoneNumber = await getUserInput('Enter phone number (without country code): ');
            if (!phoneNumber) {
                logger.error('Phone number cannot be empty. Please try again.');
                continue;
            }

            const fullNumber = validatePhoneInput(countryCode, phoneNumber);
            logger.info('────────────────────────────────────────');
            logger.info(`Phone number validated: +${fullNumber}`);
            logger.info('────────────────────────────────────────');
            return fullNumber;
        } catch (error) {
            logger.error('Error:', error.message);
            logger.info('Please try again with the correct format\n');
        }
    }
}

function getUserInput(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

async function initializeWhatsApp(phoneNumber) {
    try {
        logger.info('Please follow these steps to pair your device:');
        logger.info('1. Open WhatsApp on your phone');
        logger.info('2. Go to Settings > Linked Devices');
        logger.info('3. Tap on "Link a Device"');
        logger.info('4. When prompted, enter the pairing code that will be shown here');
        logger.info('Waiting for pairing code to be generated...');

        // Ensure clean auth state first
        await ensureCleanAuth();

        // Initialize auth state
        logger.info('Initializing auth state...');
        const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

        // Create WhatsApp socket connection
        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger,
            browser: ['Ubuntu', 'Firefox', '20.0.1'],
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 20000,
            keepAliveIntervalMs: 10000,
            emitOwnEvents: true,
            markOnlineOnConnect: true,
            // Enable pairing code
            pairingCode: true,
            phoneNumber: parseInt(phoneNumber) // Convert to number as required by Baileys
        });

        // Handle connection updates
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            // Enhanced logging for debugging
            logger.info('Connection update received:', {
                connection,
                disconnectReason: lastDisconnect?.error?.output?.statusCode,
                hasPairingCode: !!update.pairingCode
            });

            // Display pairing code if available
            if (update.pairingCode) {
                logger.info('╔════════════════════════════════╗');
                logger.info(`║  Pairing Code: ${update.pairingCode}        ║`);
                logger.info('╚════════════════════════════════╝');
            }

            if (connection === 'open') {
                logger.info('WhatsApp connection opened successfully');
                sock.sendPresenceUpdate('available');

                // Log successful connection details
                logger.info('Connected with:', {
                    user: sock.user,
                    platform: sock.ws.socket.platform,
                    timestamp: new Date().toISOString()
                });
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom) ?
                    lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut : true;

                logger.info('Connection closed due to:', {
                    error: lastDisconnect?.error,
                    willReconnect: shouldReconnect
                });

                if (shouldReconnect) {
                    startWhatsApp();
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

async function startWhatsApp() {
    try {
        // Get phone number first
        const phoneNumber = await getPhoneNumber();

        // Then initialize WhatsApp
        logger.info('Starting WhatsApp with pairing code authentication...');
        await initializeWhatsApp(phoneNumber);
    } catch (error) {
        logger.error('Fatal error:', error);
        process.exit(1);
    }
}

// Start the application
startWhatsApp();