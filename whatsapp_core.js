const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const pino = require('pino');

// Global connection state
let sock = null;
let retryCount = 0;
const MAX_RETRIES = 3;
const AUTH_DIR = './auth_info_baileys';

// Initialize logger for critical errors only
const logger = pino({ 
    level: 'error',
    transport: {
        target: 'pino-pretty',
        options: { 
            colorize: true,
            hideObject: true,
            ignore: 'pid,hostname,time'
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
    console.log(chalk.white('5. Wait for the QR code to appear'));
    console.log(chalk.white('6. Make sure you have a stable internet connection\n'));
}

async function cleanAuth() {
    try {
        await fs.promises.rm(AUTH_DIR, { recursive: true, force: true });
        await fs.promises.mkdir(AUTH_DIR, { recursive: true });
    } catch (error) {
        logger.warn('Error cleaning auth directory:', error);
    }
}

async function startWhatsApp() {
    try {
        await showBanner();

        // Clean auth state
        await cleanAuth();

        // Initialize auth state
        const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

        // Create WhatsApp socket with minimal logging
        sock = makeWASocket({
            auth: state,
            printQRInTerminal: true,
            browser: ['Flash-Bot', 'Chrome', '1.0.0'],
            logger: pino({ level: 'silent' }), // Silence Baileys logs
            connectTimeoutMs: 60000,
            qrTimeout: 60000,
            keepAliveIntervalMs: 10000,
            retryRequestDelayMs: 5000,
            defaultQueryTimeoutMs: 60000,
            markOnlineOnConnect: true,
            version: [2, 2323, 4],
            shouldIgnoreJid: jid => !jid.includes('@s.whatsapp.net'),
            generateHighQualityLinkPreview: false
        });

        // Connection handling
        sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
            if (connection === 'open') {
                retryCount = 0;
                console.log(chalk.green('\n✓ Successfully connected to WhatsApp\n'));
                console.log(chalk.cyan('• Bot Status: Online'));
                console.log(chalk.cyan('• User:', sock.user.id));
                console.log(chalk.cyan('• Type !menu to see available commands\n'));

                // Send startup message
                try {
                    await sock.sendMessage(sock.user.id, {
                        text: '🤖 *WhatsApp Bot Online!*\n\nSend !menu to see available commands'
                    });
                } catch (error) {
                    logger.error('Failed to send startup message');
                }
            }

            if (connection === 'connecting') {
                if (qr) {
                    console.log(chalk.yellow('\nNew QR Code generated:'));
                    console.log(chalk.yellow('──────────────────────────────────────\n'));
                    // QR code will be displayed by Baileys
                    console.log(chalk.cyan('\nWaiting for you to scan the QR code...'));
                } else {
                    console.log(chalk.yellow('\nEstablishing connection...'));
                }
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = (lastDisconnect?.error instanceof Boom) ?
                    statusCode !== DisconnectReason.loggedOut : true;

                // Clear socket instance
                sock = null;

                if (shouldReconnect && retryCount < MAX_RETRIES) {
                    retryCount++;
                    const delay = Math.min(2000 * retryCount, 6000);

                    // Clean auth state before retry
                    await cleanAuth();

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
                    console.log(chalk.yellow('Troubleshooting steps:'));
                    console.log(chalk.white('1. Ensure your WhatsApp is up to date'));
                    console.log(chalk.white('2. Check your internet connection'));
                    console.log(chalk.white('3. Try closing WhatsApp and reopening it'));
                    console.log(chalk.white('4. Restart this application if issues persist\n'));
                    process.exit(1);
                }
            }
        });

        // Credentials update handling
        sock.ev.on('creds.update', saveCreds);

        // Error handling
        process.on('uncaughtException', (error) => {
            logger.error('Fatal error occurred:', error);
            console.log(chalk.red('\n× Fatal error occurred. Please restart the application.\n'));
            process.exit(1);
        });

        process.on('unhandledRejection', (reason) => {
            logger.error('Unhandled rejection:', reason);
        });

    } catch (error) {
        logger.error('Startup error:', error);
        console.log(chalk.red('\n× Failed to start WhatsApp bot. Please check your internet connection and try again.\n'));
        process.exit(1);
    }
}

startWhatsApp().catch((error) => {
    logger.error('Failed to start WhatsApp bot:', error);
    console.log(chalk.red('\n× Failed to initialize WhatsApp connection. Please try again.\n'));
    process.exit(1);
});