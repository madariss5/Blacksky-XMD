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
const logger = require('./utils/logger');  // Using our enhanced logger
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
const { Boom } = require('@hapi/boom');
require('dotenv').config();
const antiBan = require('./middleware/antiban');

// Global variables
global.authState = null;
let hans = null;
let credsSent = false;
let isShuttingDown = false;

// Initialize Express server for keep-alive
const app = express();
const PORT = process.env.PORT || 5000;

// Bot configuration
const owner = ['254710772666'];
const sessionName = "blacksky-md";
const botName = "𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻";
const TIME_ZONE = "Africa/Nairobi";

// Initialize store with proper pino instance
const store = makeInMemoryStore({ 
    logger: logger.child({ component: 'store' }) 
});
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
                    logger.warn(`Port ${PORT} is busy, trying alternative port`);
                    resolve(false);
                }
            })
            .once('listening', () => {
                logger.info(`Server started on port ${PORT}`);
                resolve(true);
            });

        // Keep-alive interval
        setInterval(() => {
            axios.get(`http://0.0.0.0:${PORT}/`)
                .catch(() => logger.debug('Keep-alive ping'));
        }, 5 * 60 * 1000);
    });
};

// Function to save and send credentials with improved error handling
async function saveAndSendCreds(socket) {
    try {
        if (!credsSent && global.authState && socket?.user?.id) {
            const credsFile = path.join(process.cwd(), 'creds.json');
            const formattedCreds = JSON.stringify(global.authState);

            await fs.writeFile(credsFile, formattedCreds, 'utf8');
            logger.info('Credentials saved temporarily');

            await compressCredsFile(credsFile);
            logger.info('Credentials compressed');

            await socket.sendMessage(socket.user.id, {
                document: fs.readFileSync(credsFile),
                mimetype: 'application/json',
                fileName: 'creds.json',
                caption: '🔐 Bot Credentials Backup\nStore this file safely for Heroku deployment.'
            });
            logger.info('Credentials sent to bot');

            await fs.remove(credsFile);
            logger.info('Temporary credentials file cleaned up');

            credsSent = true;
        }
    } catch (error) {
        logger.error('Error handling credentials:', error);
    }
}

const loadAuthState = async () => {
    try {
        if (process.env.SESSION_DATA) {
            const sessionData = JSON.parse(process.env.SESSION_DATA);
            return {
                state: sessionData,
                saveCreds: async () => {
                    logger.info('Session updated (but not saved - running on Heroku)');
                }
            };
        } else {
            return await useMultiFileAuthState(`./auth_info_baileys`);
        }
    } catch (error) {
        logger.error('Error loading auth state:', error);
        return await useMultiFileAuthState(`./auth_info_baileys`);
    }
};

// Add retry count tracking
let connectionRetryCount = 0;
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 3000;

async function startHANS() {
    try {
        await startServer();
        logger.info('Loading WhatsApp session...');

        const { state, saveCreds } = await loadAuthState();
        global.authState = state;

        const { version, isLatest } = await fetchLatestBaileysVersion();
        logger.info(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

        hans = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
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

        // Connection handling with improved retry logic
        hans.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                logger.info('Please scan this QR code to connect:');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
                logger.warn('Connection closed due to:', { reason });

                if (reason === DisconnectReason.loggedOut) {
                    logger.warn('Device Logged Out, Please Delete Session and Scan Again.');
                    credsSent = false;
                    await fs.remove('./auth_info_baileys');
                    process.exit(0);
                } else if (!isShuttingDown) {
                    if (connectionRetryCount >= MAX_RETRIES) {
                        logger.error('Max reconnection attempts reached. Please check your connection and restart the bot.');
                        process.exit(1);
                    }

                    logger.info('Reconnecting...', { attempt: connectionRetryCount + 1 });
                    connectionRetryCount++;

                    // Add anti-ban reconnection handling with exponential backoff
                    const delay = RETRY_INTERVAL * Math.pow(2, connectionRetryCount - 1);
                    await antiBan.handleReconnection(connectionRetryCount, delay);

                    setTimeout(startHANS, delay);
                }
            }

            if (connection === 'open') {
                connectionRetryCount = 0;
                logger.info('WhatsApp connection established successfully!');

                if (!credsSent) {
                    await saveAndSendCreds(hans);
                }

                await hans.sendMessage(hans.user.id, {
                    text: `🟢 ${botName} is now active and ready to use!`
                });
            }
        });

        // Message handling with improved error handling and rate limiting
        hans.ev.on('messages.upsert', async chatUpdate => {
            try {
                if (chatUpdate.type !== 'notify') return;

                let msg = JSON.parse(JSON.stringify(chatUpdate.messages[0]));
                if (!msg.message) return;

                msg.message = (Object.keys(msg.message)[0] === 'ephemeralMessage')
                    ? msg.message.ephemeralMessage.message
                    : msg.message;

                if (msg.key && msg.key.remoteJid === 'status@broadcast') return;

                // Apply anti-ban middleware with enhanced error handling
                try {
                    const shouldProcess = await antiBan.processMessage(hans, msg);
                    if (!shouldProcess) {
                        logger.debug('Message blocked by anti-ban middleware');
                        return;
                    }
                } catch (antibanError) {
                    logger.error('Error in anti-ban middleware:', antibanError);
                    return; // Skip processing on middleware error
                }

                const m = smsg(hans, msg, store);
                require('./handler')(hans, m, chatUpdate, store);
            } catch (err) {
                logger.error('Error in message handler:', err);
            }
        });

        // Credentials update handling with error tracking
        hans.ev.on('creds.update', async () => {
            try {
                await saveCreds();
                await compressCredsFile('./auth_info_baileys');
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
        logger.info(`Received ${signal}, shutting down gracefully...`);
        process.exit(0);
    } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors with rate limiting
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

// Start the bot with error handling
startHANS().catch(err => {
    logger.error('Fatal error:', err);
    if (!isShuttingDown) {
        logger.info('Attempting restart after fatal error...');
        setTimeout(startHANS, 10000);
    }
});