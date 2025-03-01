const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const pino = require('pino');
const path = require('path');
const chalk = require('chalk');
const qrcode = require('qrcode-terminal');

// Initialize logger with better formatting
const logger = pino({
    level: 'info',
    transport: {
        target: 'pino-pretty',
        options: { colorize: true }
    }
});

let connectionAttempts = 0;
const MAX_RETRIES = 5;
const RECONNECT_INTERVAL = 3000;

async function startWhatsApp() {
    try {
        // Clear terminal and show header
        console.clear();
        console.log(chalk.blue('\n┌─────────────────────────────────────┐'));
        console.log(chalk.blue('│          Flash-Bot Connection        │'));
        console.log(chalk.blue('└─────────────────────────────────────┘\n'));

        // Clean auth state
        const authDir = './auth_info_baileys';
        await fs.promises.rm(authDir, { recursive: true, force: true }).catch(() => {});
        await fs.promises.mkdir(authDir, { recursive: true });

        // Load authentication state
        const { state, saveCreds } = await useMultiFileAuthState(authDir);
        const { version } = await fetchLatestBaileysVersion();

        // Create WhatsApp connection
        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false, // We'll handle QR display ourselves
            auth: state,
            browser: ['Flash-Bot', 'Chrome', '1.0.0'],
            connectTimeoutMs: 60000,
            qrTimeout: 60000,
            defaultQueryTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
            markOnlineOnConnect: true,
            retryRequestDelayMs: 2000
        });

        // Connection update handler
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            logger.info('Connection status:', {
                state: connection,
                attempts: connectionAttempts,
                error: lastDisconnect?.error?.output?.statusCode
            });

            if (qr) {
                // Clear terminal and redraw header when showing new QR
                console.clear();
                console.log(chalk.blue('\n┌─────────────────────────────────────┐'));
                console.log(chalk.blue('│          Flash-Bot Connection        │'));
                console.log(chalk.blue('└─────────────────────────────────────┘\n'));

                console.log(chalk.yellow('Please follow these steps:'));
                console.log('1. Open WhatsApp on your phone');
                console.log('2. Go to Settings > Linked Devices');
                console.log('3. Tap on "Link a Device"');
                console.log('4. Scan the QR code below\n');

                qrcode.generate(qr, { small: true });
                console.log(chalk.yellow('\nWaiting for connection...\n'));
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                if (shouldReconnect && connectionAttempts < MAX_RETRIES) {
                    connectionAttempts++;
                    const delay = Math.min(RECONNECT_INTERVAL * connectionAttempts, 30000); // Max 30s delay

                    console.log(chalk.yellow(`\nConnection closed. Reconnecting (Attempt ${connectionAttempts}/${MAX_RETRIES})...`));
                    setTimeout(startWhatsApp, delay);
                } else if (statusCode === DisconnectReason.loggedOut) {
                    console.log(chalk.red('\n× Session expired. Please scan QR code again.'));
                    connectionAttempts = 0; // Reset attempts for new session
                    setTimeout(startWhatsApp, RECONNECT_INTERVAL);
                } else {
                    console.log(chalk.red('\n× Connection closed permanently.'));
                    console.log(chalk.yellow('Please check your internet connection and restart the application.'));
                    process.exit(1);
                }
            }

            if (connection === 'open') {
                connectionAttempts = 0; // Reset attempts on successful connection
                console.log(chalk.green('\n✓ Connected to WhatsApp'));
                console.log(chalk.cyan('• Status: Online'));
                console.log(chalk.cyan('• User: ' + sock.user.id));

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
        sock.ev.on('creds.update', saveCreds);

        // Error handler
        process.on('uncaughtException', (err) => {
            logger.error('Uncaught Exception:', err);
            console.log(chalk.red('\n× Fatal error: ' + err.message));
            process.exit(1);
        });

    } catch (error) {
        logger.error('Fatal error:', error);
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