const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const qrcode = require('qrcode-terminal');
const pino = require('pino');

// Initialize logger with verification info
const logger = pino({ 
    level: 'info',
    transport: {
        target: 'pino-pretty',
        options: { colorize: true }
    }
});

let sock = null;
let connectionRetries = 0;
const MAX_RETRIES = 3;

async function startWhatsApp() {
    try {
        // Show header
        console.clear();
        console.log(chalk.blue('\n┌─────────────────────────────────────┐'));
        console.log(chalk.blue('│          Flash-Bot Connection        │'));
        console.log(chalk.blue('└─────────────────────────────────────┘\n'));

        // Clean auth state
        const authDir = './auth_info_baileys';
        await fs.promises.rm(authDir, { recursive: true, force: true }).catch(() => {});
        await fs.promises.mkdir(authDir, { recursive: true });
        logger.info('Auth directory cleaned and prepared');

        // Initialize authentication state
        const { state, saveCreds } = await useMultiFileAuthState(authDir);
        const { version } = await fetchLatestBaileysVersion();
        logger.info('Using Baileys version:', version);

        // Create WhatsApp socket connection
        sock = makeWASocket({
            version,
            printQRInTerminal: false,
            auth: state,
            browser: ['Flash-Bot', 'Chrome', '1.0.0'],
            logger: pino({ level: 'warn' }),
            connectTimeoutMs: 60000,
            qrTimeout: 60000,
            defaultQueryTimeoutMs: 60000,
            markOnlineOnConnect: true,
            keepAliveIntervalMs: 10000,
            retryRequestDelayMs: 2000,
            fireInitQueries: true,
            downloadHistory: false,
            syncFullHistory: false
        });

        logger.info('Socket connection initialized');

        // Connection update handler with verification
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            logger.info('Connection state update:', {
                state: connection,
                retries: connectionRetries,
                hasQR: !!qr,
                error: lastDisconnect?.error?.output?.statusCode
            });

            if (qr) {
                // Clear screen and show instructions
                console.clear();
                console.log(chalk.blue('\n┌─────────────────────────────────────┐'));
                console.log(chalk.blue('│          Flash-Bot Connection        │'));
                console.log(chalk.blue('└─────────────────────────────────────┘\n'));

                console.log(chalk.yellow('Please follow these steps:'));
                console.log(chalk.white('1. Open WhatsApp on your phone'));
                console.log(chalk.white('2. Go to Settings > Linked Devices'));
                console.log(chalk.white('3. Tap on "Link a Device"'));
                console.log(chalk.white('4. Scan this QR code below\n'));

                qrcode.generate(qr, { small: true });
                console.log(chalk.cyan('\nWaiting for connection...\n'));
                logger.info('QR code generated and displayed');
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = (lastDisconnect?.error instanceof Boom) ?
                    statusCode !== DisconnectReason.loggedOut : true;

                logger.info('Connection closed:', {
                    statusCode,
                    shouldReconnect,
                    retries: connectionRetries,
                    error: lastDisconnect?.error?.message
                });

                if (shouldReconnect && connectionRetries < MAX_RETRIES) {
                    connectionRetries++;
                    console.log(chalk.yellow(`\nConnection closed. Retrying (${connectionRetries}/${MAX_RETRIES})...`));

                    // Clean auth before retry
                    try {
                        await fs.promises.rm(authDir, { recursive: true, force: true });
                        await fs.promises.mkdir(authDir, { recursive: true });
                        logger.info('Auth cleared for retry');
                    } catch (error) {
                        logger.warn('Error cleaning auth directory:', error);
                    }

                    setTimeout(startWhatsApp, 3000);
                } else {
                    if (statusCode === DisconnectReason.loggedOut) {
                        console.log(chalk.red('\n× Session expired. Please scan QR code again.'));
                        logger.warn('Session expired, restart required');
                        setTimeout(startWhatsApp, 3000);
                    } else {
                        console.log(chalk.red('\n× Connection closed permanently.'));
                        console.log(chalk.yellow('Please restart the application.'));
                        process.exit(1);
                    }
                }
            }

            if (connection === 'connecting') {
                console.log(chalk.yellow('\nConnecting to WhatsApp...'));
            }

            if (connection === 'open') {
                connectionRetries = 0;
                console.log(chalk.green('\n✓ Connected successfully!'));
                console.log(chalk.cyan('• Status: Online'));
                console.log(chalk.cyan('• User: ' + sock.user.id));
                logger.info('Connection established successfully:', {
                    user: sock.user.id,
                    platform: process.platform,
                    version: process.version
                });

                try {
                    const startupMessage = '🤖 *WhatsApp Bot Online!*\n\nSend !menu to see available commands';
                    await sock.sendMessage(sock.user.id, { text: startupMessage });
                    logger.info('Startup message sent successfully');
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

        // Error handler
        process.on('uncaughtException', (err) => {
            logger.error('Fatal error:', err);
            console.log(chalk.red('\n× Fatal error: ' + err.message));
            process.exit(1);
        });

    } catch (error) {
        logger.error('Startup error:', error);
        console.log(chalk.red('\n× Startup error: ' + error.message));
        process.exit(1);
    }
}

// Start the connection
console.log(chalk.cyan('\nInitializing WhatsApp connection...'));
startWhatsApp().catch(err => {
    logger.error('Startup error:', err);
    console.log(chalk.red('\n× Startup error: ' + err.message));
    process.exit(1);
});