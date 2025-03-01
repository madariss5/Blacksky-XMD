const { default: makeWASocket, useMultiFileAuthState, Browsers, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const pino = require('pino');
const readline = require("readline");
const path = require('path');
const qrcode = require("qrcode-terminal");

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
    await fs.promises.rm(AUTH_DIR, { recursive: true, force: true });
    await fs.promises.mkdir(AUTH_DIR, { recursive: true });
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

function getUserInput(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
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
            logger.info('────────────────────────────────────────\n');

            return fullNumber;
        } catch (error) {
            logger.error('Error:', error.message);
            logger.info('Please try again with the correct format\n');
        }
    }
}

async function initializeWhatsApp() {
    try {
        let { version } = await fetchLatestBaileysVersion();
        logger.info('Using WhatsApp version:', version);

        // Get phone number first
        const phoneNumber = await getPhoneNumber();

        logger.info('Starting WhatsApp connection initialization...');

        // Clean and initialize auth directory
        await ensureCleanAuth();

        // Load auth state
        const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

        logger.info('\nPlease follow these steps to pair your device:');
        logger.info('1. Open WhatsApp on your phone');
        logger.info('2. Go to Settings > Linked Devices');
        logger.info('3. Tap on "Link a Device"');
        logger.info('4. When prompted, enter the pairing code that will be shown here');
        logger.info('Waiting for pairing code to be generated...\n');

        // Create WhatsApp socket with pairing code configuration
        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            auth: state,
            browser: Browsers.ubuntu('Chrome'),
            mobile: false,
            pairingCode: true,
            phoneNumber: parseInt(phoneNumber)
        });

        // Handle connection updates
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            logger.info('Connection update received:', {
                connection,
                disconnectReason: lastDisconnect?.error?.output?.statusCode,
                hasPairingCode: !!update.pairingCode
            });

            if (update.pairingCode) {
                logger.info('╔════════════════════════════════╗');
                logger.info(`║   PAIRING CODE: ${update.pairingCode}   ║`);
                logger.info('╚════════════════════════════════╝\n');
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom) ?
                    lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut : true;

                logger.info('Connection closed, reconnecting:', shouldReconnect);

                if (shouldReconnect) {
                    setTimeout(initializeWhatsApp, 3000);
                }
            } else if (connection === 'open') {
                logger.info('WhatsApp connection opened successfully!');
                sock.sendPresenceUpdate('available');

                const startupMessage = '🤖 *WhatsApp Bot Online!*\n\n' +
                    'Send !menu to see available commands';

                try {
                    await sock.sendMessage(`${phoneNumber}@s.whatsapp.net`, {
                        text: startupMessage
                    });
                    logger.info('Startup message sent successfully');
                } catch (error) {
                    logger.error('Failed to send startup message:', error);
                }
            }
        });

        // Handle credentials update
        sock.ev.on('creds.update', saveCreds);
        logger.info('Credentials update handler registered');

        return sock;
    } catch (error) {
        logger.error('Error in WhatsApp connection setup:', error);
        throw error;
    }
}

// Start the application
initializeWhatsApp().catch(err => {
    logger.error('Fatal error:', err);
    process.exit(1);
});