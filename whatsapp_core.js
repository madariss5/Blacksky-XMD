const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const NodeCache = require('node-cache');

// Initialize logger with better error tracking
const logger = pino({ 
    level: process.env.LOG_LEVEL || 'info',
    transport: {
        target: 'pino-pretty',
        options: { 
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: true
        }
    }
});

let sock = null;
let connectionRetries = 0;
let lastQRTime = 0;
const MAX_RETRIES = 3;
const QR_INTERVAL = 30000; // 30 seconds between QR codes
const QR_TIMEOUT = 60000; // 60 seconds timeout for QR code scanning

async function showHeader() {
    console.log(chalk.blue('\n┌─────────────────────────────────────┐'));
    console.log(chalk.blue('│          Flash-Bot Connection        │'));
    console.log(chalk.blue('└─────────────────────────────────────┘\n'));
}

async function startWhatsApp() {
    try {
        await showHeader();

        // Clean auth state
        const authDir = './auth_info_baileys';
        try {
            await fs.promises.rm(authDir, { recursive: true, force: true });
            await fs.promises.mkdir(authDir, { recursive: true });
            logger.info('Auth state cleaned');
        } catch (error) {
            logger.warn('Error cleaning auth directory:', error);
        }

        // Initialize authentication state
        const { state, saveCreds } = await useMultiFileAuthState(authDir);
        const { version } = await fetchLatestBaileysVersion();
        logger.info('Using Baileys version:', version);

        // Create WhatsApp socket connection
        sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            auth: state,
            browser: ['Flash-Bot', 'Chrome', '1.0.0'],
            connectTimeoutMs: 60000,
            qrTimeout: QR_TIMEOUT,
            defaultQueryTimeoutMs: 60000,
            msgRetryCounterCache: new NodeCache(),
            generateHighQualityLinkPreview: false,
            markOnlineOnConnect: true,
            fireInitQueries: false,
            syncFullHistory: false
        });

        logger.info('Socket connection initialized');

        // Connection update handler
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            logger.info('Connection state:', {
                state: connection,
                attempts: connectionRetries,
                hasQR: !!qr
            });

            if (qr) {
                const now = Date.now();
                if (now - lastQRTime >= QR_INTERVAL) {
                    lastQRTime = now;

                    await showHeader();
                    console.log(chalk.yellow('Please follow these steps:'));
                    console.log(chalk.white('1. Open WhatsApp on your phone'));
                    console.log(chalk.white('2. Go to Settings > Linked Devices'));
                    console.log(chalk.white('3. Tap on "Link a Device"'));
                    console.log(chalk.white('4. Make sure your WhatsApp is up to date'));
                    console.log(chalk.white('5. Check that you have a stable internet connection'));
                    console.log(chalk.white('6. Wait 5 seconds before scanning'));
                    console.log(chalk.white('7. Scan the QR code below\n'));

                    // Add delay before showing QR
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    qrcode.generate(qr, { small: true });
                    console.log(chalk.cyan('\nWaiting for connection...'));
                    console.log(chalk.yellow(`Next QR code will be shown in ${QR_INTERVAL/1000} seconds if not connected.\n`));

                    logger.info('New QR code generated, waiting for scan');
                } else {
                    logger.info('Skipping QR code display - too soon');
                }
            }

            if (connection === 'connecting') {
                console.log(chalk.yellow('\nConnecting to WhatsApp...'));
                logger.info('Attempting connection to WhatsApp');
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = (lastDisconnect?.error instanceof Boom) ?
                    statusCode !== DisconnectReason.loggedOut : true;

                logger.info('Connection closed:', {
                    statusCode,
                    shouldReconnect,
                    retries: connectionRetries
                });

                // Clear socket instance
                sock = null;

                if (shouldReconnect && connectionRetries < MAX_RETRIES) {
                    connectionRetries++;
                    console.log(chalk.yellow(`\nConnection closed. Retrying (${connectionRetries}/${MAX_RETRIES})...`));

                    // Clean up before retry
                    try {
                        await fs.promises.rm(authDir, { recursive: true, force: true });
                        await fs.promises.mkdir(authDir, { recursive: true });
                        logger.info('Auth cleared for retry');
                    } catch (error) {
                        logger.warn('Error cleaning auth directory:', error);
                    }

                    setTimeout(startWhatsApp, 3000);
                } else if (statusCode === DisconnectReason.loggedOut) {
                    console.log(chalk.red('\n× Session expired. Starting fresh session...'));
                    logger.warn('Session expired, restarting...');
                    connectionRetries = 0;
                    setTimeout(startWhatsApp, 3000);
                } else {
                    console.log(chalk.red('\n× Connection closed permanently.'));
                    console.log(chalk.yellow('Please ensure:'));
                    console.log(chalk.yellow('1. Your WhatsApp mobile app is up to date'));
                    console.log(chalk.yellow('2. You have a stable internet connection'));
                    console.log(chalk.yellow('3. You\'re following the steps exactly as shown'));
                    console.log(chalk.yellow('4. Try restarting the application if issues persist\n'));
                    process.exit(1);
                }
            }

            if (connection === 'open') {
                connectionRetries = 0;
                lastQRTime = 0; // Reset QR timer on successful connection

                console.log(chalk.green('\n✓ Connected successfully!'));
                console.log(chalk.cyan('• Status: Online'));
                console.log(chalk.cyan('• User: ' + sock.user.id));

                logger.info('Connection established:', {
                    user: sock.user.id,
                    platform: process.platform,
                    version: process.version
                });

                try {
                    const startupMessage = '🤖 *WhatsApp Bot Online!*\n\nSend !menu to see available commands';
                    await sock.sendMessage(sock.user.id, { text: startupMessage });
                    logger.info('Startup message sent');
                } catch (error) {
                    logger.error('Failed to send startup message:', error);
                }
            }
        });

        // Credentials update handler
        sock.ev.on('creds.update', async () => {
            logger.info('Credentials updated - saving');
            await saveCreds();
        });

        // Error handlers
        process.on('uncaughtException', (err) => {
            logger.error('Uncaught Exception:', err);
            console.error(chalk.red('\nFatal error:', err.message));
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection:', {
                reason,
                promise
            });
        });

    } catch (error) {
        logger.error('Fatal error:', error);
        console.error(chalk.red('\nStartup error:', error.message));
        process.exit(1);
    }
}

// Start the connection
console.log(chalk.cyan('\nInitializing WhatsApp connection...'));
startWhatsApp().catch(err => {
    logger.error('Startup error:', err);
    console.error(chalk.red('\nStartup error:', err.message));
    process.exit(1);
});