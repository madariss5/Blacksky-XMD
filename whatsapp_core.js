const { default: makeWASocket, useMultiFileAuthState, Browsers, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const pino = require('pino');

let sock = null;
let retryCount = 0;
let lastQRTime = 0;
const MAX_RETRIES = 3;
const AUTH_DIR = './auth_info_baileys';

// Initialize logger
const logger = pino({
    level: process.env.DEBUG === 'true' ? 'debug' : 'info',
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
    console.log(chalk.white('5. Scan the QR code when it appears\n'));
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
        await cleanAuth();

        const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

        // Create WhatsApp socket with minimal configuration
        sock = makeWASocket({
            auth: state,
            printQRInTerminal: true,
            browser: Browsers.ubuntu('Chrome'),
            version: [2, 2245, 9],
            logger: pino({ level: 'silent' })
        });

        // Connection handling
        sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
            try {
                if (connection === 'close') {
                    const statusCode = lastDisconnect?.error?.output?.statusCode;
                    const shouldReconnect = (lastDisconnect?.error instanceof Boom) ?
                        statusCode !== DisconnectReason.loggedOut : true;

                    if (shouldReconnect && retryCount < MAX_RETRIES) {
                        retryCount++;
                        const delay = Math.min(2000 * retryCount, 6000);
                        console.log(chalk.yellow(`\nConnection closed. Retry ${retryCount} of ${MAX_RETRIES}`));
                        console.log(chalk.yellow(`Waiting ${delay/1000} seconds before next attempt...\n`));
                        setTimeout(startWhatsApp, delay);
                    } else {
                        console.log(chalk.red('\n× Connection closed. Please try again.\n'));
                        process.exit(1);
                    }
                }

                if (connection === 'open') {
                    console.log(chalk.green('\n✓ Successfully connected to WhatsApp\n'));
                    console.log(chalk.cyan('• Bot Status: Online'));
                    console.log(chalk.cyan('• User:', sock.user.id));
                    console.log(chalk.cyan('• Type !menu to see available commands\n'));
                }
            } catch (error) {
                logger.error('Error in connection handler:', error);
            }
        });

        // Credentials update handling
        sock.ev.on('creds.update', saveCreds);

    } catch (error) {
        logger.error('Startup error:', error);
        process.exit(1);
    }
}

// Start WhatsApp connection
console.log(chalk.cyan('\nStarting WhatsApp bot...\n'));
startWhatsApp().catch(error => {
    logger.error('Fatal error:', error);
    process.exit(1);
});