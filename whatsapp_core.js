const { default: makeWASocket, useMultiFileAuthState, Browsers, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const pino = require('pino');

// Global connection state
let sock = null;
let retryCount = 0;
let lastQRTime = 0;
const MAX_RETRIES = 3;
const AUTH_DIR = './auth_info_baileys';
const QR_TIMEOUT = 60000;
const QR_INTERVAL = 20000;

// Initialize logger with error tracking
const logger = pino({
    level: 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            levelFirst: true,
            translateTime: true,
        }
    }
});

async function showBanner() {
    console.clear();
    console.log(chalk.cyan('\n┌─────────────────────────────────────┐'));
    console.log(chalk.cyan('│          Flash-Bot Connection        │'));
    console.log(chalk.cyan('└─────────────────────────────────────┘\n'));
    console.log(chalk.yellow('Please follow these steps:'));
    console.log(chalk.white('1. Open WhatsApp on your phone'));
    console.log(chalk.white('2. Go to Settings > Linked Devices'));
    console.log(chalk.white('3. Tap on "Link a Device"'));
    console.log(chalk.white('4. Make sure your app is up to date'));
    console.log(chalk.white('5. Wait for the QR code to appear\n'));
    console.log(chalk.white('6. Make sure you have a stable internet connection\n'));
}

async function cleanAuth() {
    try {
        await fs.promises.rm(AUTH_DIR, { recursive: true, force: true });
        await fs.promises.mkdir(AUTH_DIR, { recursive: true });
        logger.info('Authentication directory cleaned successfully');
    } catch (error) {
        logger.warn('Error cleaning auth directory:', error);
    }
}

async function displayQR(qr) {
    const now = Date.now();
    if (now - lastQRTime >= QR_INTERVAL) {
        lastQRTime = now;
        console.log(chalk.yellow('\nNew QR Code generated:'));
        console.log(chalk.yellow('──────────────────────────────────────\n'));
        require('qrcode-terminal').generate(qr, { small: true });
        console.log(chalk.cyan('\nWaiting for you to scan the QR code...'));
        console.log(chalk.yellow(`QR code will refresh in ${QR_INTERVAL/1000}s if not scanned.\n`));
    }
}

async function startWhatsApp() {
    try {
        await showBanner();
        await cleanAuth();

        // Initialize auth state
        const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
        logger.info('Auth state loaded successfully');

        // Create WhatsApp socket with improved error handling
        sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: logger.child({ level: 'silent' }),
            browser: Browsers.ubuntu('Chrome'),
            connectTimeoutMs: 60000,
            version: [2, 2323, 4],
            keepAliveIntervalMs: 15000,
            markOnlineOnConnect: true,
            defaultQueryTimeoutMs: 60000,
            emitOwnEvents: true
        });

        // Connection handling with improved error logging
        sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
            try {
                logger.info('Connection status update:', { connection, hasQR: !!qr });

                if (qr) {
                    await displayQR(qr);
                }

                if (connection === 'connecting') {
                    console.log(chalk.yellow('\nAttempting to connect to WhatsApp...\n'));
                }

                if (connection === 'close') {
                    const statusCode = lastDisconnect?.error?.output?.statusCode;
                    const shouldReconnect = (lastDisconnect?.error instanceof Boom) ?
                        statusCode !== DisconnectReason.loggedOut : true;

                    // Log detailed disconnect information
                    logger.info('Connection closed:', {
                        statusCode,
                        error: lastDisconnect?.error?.message,
                        shouldReconnect,
                        retryCount
                    });

                    sock = null;

                    if (shouldReconnect && retryCount < MAX_RETRIES) {
                        retryCount++;
                        const delay = Math.min(2000 * retryCount, 6000);
                        console.log(chalk.yellow(`\nConnection closed. Retry ${retryCount} of ${MAX_RETRIES}`));
                        console.log(chalk.yellow(`Waiting ${delay/1000} seconds before next attempt...\n`));
                        setTimeout(startWhatsApp, delay);
                    } else if (statusCode === DisconnectReason.loggedOut) {
                        console.log(chalk.red('\n× Session expired. Starting fresh session...\n'));
                        console.log(chalk.yellow('Restarting authentication process...'));
                        retryCount = 0;
                        setTimeout(startWhatsApp, 2000);
                    } else {
                        console.log(chalk.red('\n× Connection closed permanently.\n'));
                        console.log(chalk.yellow('Please check:'));
                        console.log(chalk.white('1. Your WhatsApp is up to date'));
                        console.log(chalk.white('2. You have a stable internet connection'));
                        console.log(chalk.white('3. Try restarting the application\n'));
                        process.exit(1);
                    }
                }

                if (connection === 'open') {
                    retryCount = 0;
                    lastQRTime = 0;
                    logger.info('Connection opened successfully');
                    console.log(chalk.green('\n✓ Successfully connected to WhatsApp\n'));
                    console.log(chalk.cyan('• Status: Online'));
                    console.log(chalk.cyan('• User:', sock.user.id));
                    console.log(chalk.cyan('• Type !menu to see available commands\n'));

                    try {
                        await sock.sendMessage(sock.user.id, {
                            text: '🤖 *WhatsApp Bot Online!*\n\nSend !menu to see available commands'
                        });
                        logger.info('Startup message sent successfully');
                    } catch (error) {
                        logger.error('Failed to send startup message:', error);
                    }
                }
            } catch (error) {
                logger.error('Error in connection update handler:', error);
            }
        });

        // Credentials update handling
        sock.ev.on('creds.update', async (creds) => {
            try {
                await saveCreds();
                logger.info('Credentials updated successfully');
            } catch (error) {
                logger.error('Error saving credentials:', error);
            }
        });

        // Global error handlers
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            console.log(chalk.red('\n× Fatal error occurred. Please restart the application.\n'));
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            // Don't exit process for unhandled rejections
        });

    } catch (error) {
        logger.error('Failed to start WhatsApp bot:', error);
        console.log(chalk.red('\n× Failed to initialize WhatsApp connection. Please try again.\n'));
        process.exit(1);
    }
}

// Start connection with error handling
startWhatsApp().catch(error => {
    logger.error('Fatal error during startup:', error);
    process.exit(1);
});