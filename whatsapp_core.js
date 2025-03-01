const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const NodeCache = require('node-cache');

let sock = null;
let connectionRetries = 0;
let lastQRTime = 0;
const MAX_RETRIES = 3;
const QR_INTERVAL = 30000; // 30 seconds between QR codes
const QR_TIMEOUT = 60000; // 60 seconds timeout for QR code scanning

// Initialize logger for errors only
const logger = pino({ 
    level: 'warn', // Only show warnings and errors
    transport: {
        target: 'pino-pretty',
        options: { 
            colorize: true,
            ignore: 'pid,hostname,class',
            messageFormat: '{msg}'
        }
    }
});

// Baileys logger for internal debug only
const baileyLogger = pino({ level: 'silent' });

async function showHeader() {
    console.log(chalk.blue('\n┌─────────────────────────────────────┐'));
    console.log(chalk.blue('│          Flash-Bot Connection        │'));
    console.log(chalk.blue('└─────────────────────────────────────┘\n'));
}

async function showInstructions() {
    console.log(chalk.yellow('Please follow these steps:'));
    console.log(chalk.white('1. Open WhatsApp on your phone'));
    console.log(chalk.white('2. Go to Settings > Linked Devices'));
    console.log(chalk.white('3. Tap on "Link a Device"'));
    console.log(chalk.white('4. Make sure your WhatsApp is up to date'));
    console.log(chalk.white('5. Check that you have a stable internet connection'));
    console.log(chalk.white('6. Wait 5 seconds before scanning'));
    console.log(chalk.white('7. Check that you\'re following the steps exactly as shown'));
    console.log(chalk.white('8. Scan the QR code below\n'));
}

async function startWhatsApp() {
    try {
        await showHeader();
        await showInstructions();

        // Clean auth state
        const authDir = './auth_info_baileys';
        try {
            await fs.promises.rm(authDir, { recursive: true, force: true });
            await fs.promises.mkdir(authDir, { recursive: true });
        } catch (error) {
            logger.warn('Error cleaning auth directory:', error);
        }

        // Initialize authentication state
        const { state, saveCreds } = await useMultiFileAuthState(authDir);

        // Create WhatsApp socket connection
        sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            browser: ['Flash-Bot', 'Chrome', '1.0.0'],
            logger: baileyLogger,
            connectTimeoutMs: 60000,
            qrTimeout: QR_TIMEOUT,
            defaultQueryTimeoutMs: 60000,
            markOnlineOnConnect: true
        });

        // Connection update handler
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                const now = Date.now();
                if (now - lastQRTime >= QR_INTERVAL) {
                    lastQRTime = now;

                    // Clear previous QR code section
                    console.log('\x1b[2K'); // Clear the current line
                    console.log('\x1b[0G'); // Move cursor to start of line

                    // Show new QR code
                    console.log(chalk.cyan('\nNew QR code generated:'));
                    console.log(chalk.yellow('──────────────────────────────────────\n'));
                    qrcode.generate(qr, { small: true });
                    console.log(chalk.cyan('\nWaiting for connection...'));
                    console.log(chalk.yellow(`Next QR code in ${QR_INTERVAL/1000}s if not connected.\n`));
                }
            }

            if (connection === 'connecting') {
                console.log(chalk.cyan('\nAttempting to connect...\n'));
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom) ?
                    lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut : true;

                if (shouldReconnect) {
                    connectionRetries++;

                    // Clear socket instance
                    sock = null;

                    if (connectionRetries < MAX_RETRIES) {
                        // Clean up before retry
                        try {
                            await fs.promises.rm(authDir, { recursive: true, force: true });
                            await fs.promises.mkdir(authDir, { recursive: true });
                        } catch (error) {
                            logger.warn('Error cleaning auth directory:', error);
                        }

                        // Add increasing delay between retries
                        const delay = Math.min(3000 * connectionRetries, 15000);
                        console.log(chalk.yellow(`\nReconnecting in ${delay/1000}s... (${connectionRetries}/${MAX_RETRIES})\n`));
                        setTimeout(startWhatsApp, delay);
                    }
                } else if (lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut) {
                    console.log(chalk.red('\n× Session expired. Starting fresh session...'));
                    connectionRetries = 0;
                    lastQRTime = 0;
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

                try {
                    const startupMessage = '🤖 *WhatsApp Bot Online!*\n\nSend !menu to see available commands';
                    await sock.sendMessage(sock.user.id, { text: startupMessage });
                } catch (error) {
                    logger.error('Failed to send startup message:', error);
                }
            }
        });

        // Credentials update handler
        sock.ev.on('creds.update', saveCreds);

        // Error handlers
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            console.error(chalk.red('\nFatal error:', error.message));
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