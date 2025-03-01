const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
    jidDecode,
    proto,
    getContentType
} = require("@whiskeysockets/baileys");

const pino = require('pino');
const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
        }
    }
});

const { Boom } = require('@hapi/boom');
const fs = require('fs-extra');
const chalk = require('chalk');
const path = require('path');
const axios = require('axios');
const NodeCache = require('node-cache');
const moment = require('moment-timezone');
const express = require('express');
const { exec, spawn, execSync } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const { smsg } = require('./lib/simple');
const qrcode = require('qrcode-terminal');
const { compressCredsFile } = require('./utils/creds');

// Global variables
global.authState = null;
let hans = null; // Make hans globally accessible
let credsSent = false; // Track if credentials have been sent
let isShuttingDown = false;

// Initialize Express server for keep-alive
const app = express();
const PORT = process.env.PORT || 5000;

// Bot configuration
const owner = ['254710772666']; // Replace with your number
const sessionName = "blacksky-md"; // Session name
const botName = "𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻"; // Bot name
const TIME_ZONE = "Africa/Nairobi"; // Adjust to your timezone

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });
const msgRetryCounterCache = new NodeCache();

// Keep-alive ping endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'WhatsApp Bot Server Running',
        botName: botName,
        uptime: process.uptime()
    });
});

// Start Express server with error handling
const startServer = () => {
    return new Promise((resolve) => {
        const server = app.listen(PORT, '0.0.0.0')
            .once('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    console.log(chalk.yellow(`Port ${PORT} is busy, trying alternative port`));
                    resolve(false);
                }
            })
            .once('listening', () => {
                console.log(chalk.green(`\nServer started on port ${PORT}`));
                resolve(true);
            });

        // Keep-alive interval
        setInterval(() => {
            axios.get(`http://0.0.0.0:${PORT}/`)
                .catch(() => console.log('Keep-alive ping'));
        }, 5 * 60 * 1000); // Every 5 minutes
    });
};

// Function to save and send credentials
async function saveAndSendCreds(socket) {
    try {
        if (!credsSent && global.authState && socket?.user?.id) {
            const credsFile = path.join(process.cwd(), 'creds.json');

            // Format credentials as a single line
            const formattedCreds = JSON.stringify(global.authState);

            // Save credentials to temporary file
            await fs.writeFile(credsFile, formattedCreds, 'utf8');
            logger.info('✓ Credentials saved temporarily');

            // Compress the creds file
            await compressCredsFile(credsFile);
            logger.info('✓ Credentials compressed');

            // Send file to bot's own number
            await socket.sendMessage(socket.user.id, {
                document: fs.readFileSync(credsFile),
                mimetype: 'application/json',
                fileName: 'creds.json',
                caption: '🔐 Bot Credentials Backup\nStore this file safely for Heroku deployment.'
            });
            logger.info('✓ Credentials sent to bot');

            // Delete the temporary file
            await fs.remove(credsFile);
            logger.info('✓ Temporary credentials file cleaned up');

            // Mark credentials as sent
            credsSent = true;
        }
    } catch (error) {
        logger.error('Error handling credentials:', {
            error: error.message,
            stack: error.stack
        });
    }
}

async function startHANS() {
    try {
        await startServer();
        logger.info('\nLoading WhatsApp session...');

        const { state, saveCreds } = await useMultiFileAuthState(`./auth_info_baileys`);
        global.authState = state;

        const { version, isLatest } = await fetchLatestBaileysVersion();
        logger.info(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

        hans = makeWASocket({
            version,
            logger: pino({ level: 'silent' }), // Set Baileys logger to silent
            printQRInTerminal: true,
            auth: state,
            browser: ['𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻', 'Chrome', '112.0.5615.49'],
            msgRetryCounterCache,
            defaultQueryTimeoutMs: undefined,
            connectTimeoutMs: 60_000,
            qrTimeout: 40000,
            keepAliveIntervalMs: 10000,
            emitOwnEvents: true,
            markOnlineOnConnect: true,
            getMessage: async (key) => {
                if (store) {
                    const msg = await store.loadMessage(key.remoteJid, key.id);
                    return msg?.message || undefined;
                }
                return { conversation: '' };
            }
        });

        store.bind(hans.ev);

        // Connection handling
        hans.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                logger.info('Please scan this QR code to connect:');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
                logger.warn('Connection closed due to:', reason);

                if (reason === DisconnectReason.loggedOut) {
                    logger.warn('Device Logged Out, Please Delete Session and Scan Again.');
                    credsSent = false; // Reset credentials sent flag
                    await fs.remove('./auth_info_baileys');
                    process.exit(0);
                } else if (!isShuttingDown) {
                    logger.info('Reconnecting...');
                    setTimeout(startHANS, 3000);
                }
            }

            if (connection === 'open') {
                logger.info('WhatsApp connection established successfully!');

                // Only send credentials once on initial connection
                if (!credsSent) {
                    await saveAndSendCreds(hans);
                }

                await hans.sendMessage(hans.user.id, { 
                    text: `🟢 ${botName} is now active and ready to use!`
                });
            }
        });

        // Message handling - single consolidated handler
        hans.ev.on('messages.upsert', async chatUpdate => {
            try {
                if (chatUpdate.type !== 'notify') return;

                let msg = JSON.parse(JSON.stringify(chatUpdate.messages[0]));
                if (!msg.message) return;

                msg.message = (Object.keys(msg.message)[0] === 'ephemeralMessage') 
                    ? msg.message.ephemeralMessage.message 
                    : msg.message;

                if (msg.key && msg.key.remoteJid === 'status@broadcast') return;

                const m = smsg(hans, msg, store);
                require('./handler')(hans, m, chatUpdate, store);
            } catch (err) {
                logger.error('Error in message handler:', err);
            }
        });

        // Credentials update handling
        hans.ev.on('creds.update', async () => {
            try {
                await saveCreds();
                await compressCredsFile('./auth_info_baileys'); // Assuming this is the correct path
                logger.info('Credentials updated and compressed successfully');
            } catch (error) {
                logger.error('Error updating credentials:', error);
            }
        });

        return hans;
    } catch (err) {
        logger.error('Fatal error in startHANS:', err);
        if (!isShuttingDown) {
            logger.info('Attempting restart in 10 seconds...');
            setTimeout(startHANS, 10000);
        }
    }
}

// Handle graceful shutdown
const shutdown = async (signal) => {
    try {
        isShuttingDown = true;
        logger.info(`\nReceived ${signal}, shutting down gracefully...`);
        process.exit(0);
    } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    if (!isShuttingDown && err.code !== 'EADDRINUSE') {
        logger.info('Attempting restart after uncaught exception...');
        setTimeout(startHANS, 3000);
    }
});

process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
    if (!isShuttingDown && err.code !== 'EADDRINUSE') {
        logger.info('Attempting restart after unhandled rejection...');
        setTimeout(startHANS, 3000);
    }
});

// Start the bot
startHANS().catch(err => {
    logger.error('Fatal error:', err);
    if (!isShuttingDown) {
        logger.info('Attempting restart after fatal error...');
        setTimeout(startHANS, 10000);
    }
});