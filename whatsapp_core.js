const { default: makeWASocket, useMultiFileAuthState, Browsers, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const NodeCache = require("node-cache");
const pino = require('pino');
const readline = require("readline");
const path = require('path');
const qrcode = require("qrcode-terminal");
const chalk = require('chalk'); // Added chalk dependency

// Auth directory configuration
const AUTH_DIR = path.join(__dirname, 'auth_info_baileys');

// Configure cache for retry handling
const msgRetryCounterCache = new NodeCache();

async function ensureCleanAuth() {
    logger.info('Cleaning auth directory...');
    await fs.promises.rm(AUTH_DIR, { recursive: true, force: true });
    await fs.promises.mkdir(AUTH_DIR, { recursive: true });
    logger.info('Auth directory cleaned and recreated');
}

async function getPhoneNumber() {
    while (true) {
        try {
            logger.info('Please enter your WhatsApp phone number details:');
            logger.info('────────────────────────────────────────');
            logger.info('Examples:');
            logger.info('• Country code: 91 (for India)');
            logger.info('• Phone number: 1234567890');
            logger.info('Note: Enter only the digits, no spaces or special characters');
            logger.info('────────────────────────────────────────');

            const phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number 😍\nFor example: +916909137213 : `)));
            let formattedNumber = phoneNumber.replace(/[^0-9]/g, '');

            // Validate phone number format
            if (!formattedNumber || formattedNumber.length < 10) {
                logger.error('Invalid phone number format. Please try again.');
                continue;
            }

            logger.info('────────────────────────────────────────');
            logger.info(`Phone number validated: +${formattedNumber}`);
            logger.info('────────────────────────────────────────\n');

            return formattedNumber;
        } catch (error) {
            logger.error('Error:', error.message);
            logger.info('Please try again with the correct format\n');
        }
    }
}

const question = (text) => new Promise((resolve) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question(text, (answer) => {
        rl.close();
        resolve(answer.trim());
    });
});

async function initializeWhatsApp() {
    try {
        // Get latest version
        let { version, isLatest } = await fetchLatestBaileysVersion();
        logger.info('Using WhatsApp version:', version, 'isLatest:', isLatest);

        // Get phone number
        const phoneNumber = await getPhoneNumber();

        // Clean auth state
        await ensureCleanAuth();

        // Initialize auth state
        const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

        logger.info('\nPlease follow these steps to pair your device:');
        logger.info('1. Open WhatsApp on your phone');
        logger.info('2. Go to Settings > Linked Devices');
        logger.info('3. Tap on "Link a Device"');
        logger.info('4. When prompted, enter the pairing code that will be shown here');
        logger.info('Waiting for pairing code to be generated...\n');

        // Create socket with enhanced configuration
        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            mobile: false,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            browser: ['Chrome (Linux)', '', ''],
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            msgRetryCounterCache,
            defaultQueryTimeoutMs: undefined,
            pairingCode: true,
            phoneNumber: parseInt(phoneNumber)
        });

        // Handle connection updates
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            // Log full update for debugging
            logger.info('Connection update:', JSON.stringify(update, null, 2));

            if (update.pairingCode) {
                let code = update.pairingCode;
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                logger.info('╔════════════════════════════════╗');
                logger.info(`║  Pairing Code: ${code}  ║`);
                logger.info('╚════════════════════════════════╝\n');
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom) ?
                    lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut : true;

                if (shouldReconnect) {
                    logger.info('Reconnecting...');
                    setTimeout(initializeWhatsApp, 3000);
                } else {
                    logger.info('Connection closed permanently');
                }
            } else if (connection === 'open') {
                logger.info('WhatsApp connection opened successfully!');

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

        return sock;
    } catch (error) {
        logger.error('Error in WhatsApp connection setup:', error);
        throw error;
    }
}

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

// Start the application
initializeWhatsApp().catch(err => {
    logger.error('Fatal error:', err);
    process.exit(1);
});