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
const logger = require('./utils/logger');
const fs = require('fs-extra');
const chalk = require('chalk');
const path = require('path');
const axios = require('axios');
const NodeCache = require('node-cache');
const moment = require('moment-timezone');
const express = require('express');
const { exec, spawn, execSync } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const { smsg, decodeJid } = require('./lib/simple');
const qrcode = require('qrcode-terminal');
const { compressCredsFile } = require('./utils/creds');
const { Boom } = require('@hapi/boom');
require('dotenv').config();
const antiBan = require('./middleware/antiban');
const { formatPhoneNumber, addWhatsAppSuffix, formatOwnerNumbers } = require('./utils/phoneNumber');
const config = require('./config'); // Import config.js

// Global variables
global.authState = null;
let hans = null;
let credsSent = false;
let isShuttingDown = false;

// Initialize Express server for keep-alive
const app = express();
const PORT = process.env.PORT || 5000;

// Bot configuration
const owner = formatOwnerNumbers(process.env.OWNER_NUMBER || '254710772666');
const sessionName = config.session.id;
const botName = config.botName;
const TIME_ZONE = process.env.TIME_ZONE || "Africa/Nairobi";

// Initialize store with proper pino instance
const store = makeInMemoryStore({ 
    logger: logger.child({ component: 'store' }) 
});
const msgRetryCounterCache = new NodeCache();

// Enhanced logging for session configuration
logger.info('Bot startup configuration:', {
    sessionId: sessionName,
    authDir: config.session.authDir,
    owner: owner,
    botName: botName
});

// Keep-alive ping endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'WhatsApp Bot Server Running',
        botName: botName,
        uptime: process.uptime(),
        sessionId: sessionName
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

        // Optional keep-alive ping for hosted environments
        if (process.env.ENABLE_KEEP_ALIVE === 'true') {
            setInterval(() => {
                axios.get(`http://0.0.0.0:${PORT}/`)
                    .catch(() => logger.debug('Keep-alive ping'));
            }, 5 * 60 * 1000);
        }
    });
};

// Use session configuration from config.js
const sessionConfig = {
    ...config.session,
    logger: pino({ level: config.session.logLevel })
};

// Enhanced auth state loading with better error handling
const loadAuthState = async () => {
    try {
        // Local auth state handling
        const authInfo = await useMultiFileAuthState(sessionConfig.authDir);

        // Validate auth state
        if (!authInfo?.state || !authInfo?.saveCreds) {
            logger.warn('Invalid auth state detected, creating new session');
            await fs.ensureDir(sessionConfig.authDir);
            return await useMultiFileAuthState(sessionConfig.authDir);
        }

        return authInfo;
    } catch (error) {
        logger.error('Critical error loading auth state:', error);
        throw error;
    }
};

// Enhanced credentials handling
async function saveAndSendCreds(socket) {
    try {
        if (!credsSent && global.authState && socket?.user?.id) {
            const credsFile = path.join(process.cwd(), 'creds.json');
            const formattedCreds = JSON.stringify(global.authState, null, 2);

            // Save with error handling
            try {
                await fs.writeFile(credsFile, formattedCreds, 'utf8');
                logger.info('Credentials saved temporarily');

                await compressCredsFile(credsFile);
                logger.info('Credentials compressed successfully');

                // Send with retry mechanism
                let retries = 3;
                while (retries > 0) {
                    try {
                        await socket.sendMessage(socket.user.id, {
                            document: fs.readFileSync(credsFile),
                            mimetype: 'application/json',
                            fileName: 'creds.json',
                            caption: '🔐 Bot Credentials Backup\nStore this file safely for future use.'
                        });
                        logger.info('Credentials sent successfully');
                        break;
                    } catch (err) {
                        retries--;
                        if (retries === 0) throw err;
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }

                // Cleanup
                await fs.remove(credsFile);
                logger.info('Temporary credentials file cleaned up');
                credsSent = true;
            } catch (err) {
                logger.error('Error in credential handling:', err);
                throw err;
            }
        }
    } catch (error) {
        logger.error('Critical error in saveAndSendCreds:', error);
        // Don't throw, allow continuation
    }
}

// Add retry count tracking
let connectionRetryCount = 0;
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 3000;

// Add decodeJid to the socket object
function addSocketMethods(sock) {
    sock.decodeJid = decodeJid;
    return sock;
}

// Enhanced HANS initialization
async function startHANS() {
    try {
        await startServer();
        logger.info('Loading WhatsApp session...');

        // Load auth state with validation
        const { state, saveCreds } = await loadAuthState();
        if (!state) {
            throw new Error('Failed to load authentication state');
        }
        global.authState = state;

        // Version check with validation
        const { version, isLatest } = await fetchLatestBaileysVersion();
        logger.info(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

        // Create socket with enhanced config
        hans = makeWASocket({
            ...sessionConfig,
            version,
            auth: state,
            msgRetryCounterCache,
            getMessage: async (key) => {
                if (store) {
                    const msg = await store.loadMessage(key.remoteJid, key.id);
                    return msg?.message || undefined;
                }
                return { conversation: '' };
            }
        });

        // Add utility methods
        hans = addSocketMethods(hans);
        store.bind(hans.ev);

        // Connection handling with improved retry logic
        hans.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                logger.info('New QR Code received, please scan:');
                qrcode.generate(qr, { small: true });

                // Also send a message to indicate QR code is ready
                console.log('\n🔍 Please scan the QR code above to connect your WhatsApp\n');
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
                logger.info('WhatsApp connection established successfully!', {
                    sessionId: sessionName,
                    authDir: config.session.authDir,
                    botNumber: hans?.user?.id
                });

                try {
                    if (!credsSent) {
                        await saveAndSendCreds(hans);
                    }

                    // Verify hans.user exists before sending message
                    if (hans?.user?.id) {
                        const cleanBotNumber = formatPhoneNumber(hans.user.id);
                        logger.info('Bot connected successfully:', {
                            botNumber: cleanBotNumber,
                            sessionId: sessionName
                        });

                        // Send success message to bot's own number
                        await hans.sendMessage(hans.user.id, {
                            text: `🟢 𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻 bot successfully connected!\n\n` +
                                  `Session ID: ${sessionName}\n` +
                                  `Bot Number: ${cleanBotNumber}\n\n` +
                                  `Type .help or .menu to see available commands.`
                        }).catch(err => {
                            logger.error('Failed to send success message:', err);
                        });
                    } else {
                        logger.warn('Bot user ID not available, skipping success message');
                    }
                } catch (error) {
                    logger.error('Error in connection open handler:', error);
                }
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

                // Check message type and format
                const messageType = getContentType(msg.message);
                if (!messageType) {
                    logger.debug('Invalid message type, skipping');
                    return;
                }

                // Apply anti-ban middleware with enhanced error handling
                try {
                    const shouldProcess = await antiBan.processMessage(hans, msg);
                    if (!shouldProcess) {
                        logger.debug('Message blocked by anti-ban middleware');
                        return;
                    }
                } catch (antibanError) {
                    logger.error('Error in anti-ban middleware:', antibanError);
                    return;
                }

                const m = smsg(hans, msg, store);
                if (!m) {
                    logger.debug('Failed to parse message, skipping');
                    return;
                }

                // Load handler dynamically to prevent caching issues
                try {
                    const handler = require('./handler');
                    await handler(hans, m, chatUpdate, store);
                } catch (handlerError) {
                    logger.error('Error in message handler:', {
                        error: handlerError.message,
                        messageType,
                        chat: m.chat,
                        sender: m.sender
                    });
                }
            } catch (err) {
                logger.error('Error processing message:', err);
            }
        });

        // Add rate limiting for credential updates
        const credUpdateCache = new NodeCache({ stdTTL: 5 }); // 5 seconds TTL

        hans.ev.on('creds.update', async () => {
            try {
                const now = Date.now();
                const lastUpdate = credUpdateCache.get('lastUpdate');

                if (lastUpdate && (now - lastUpdate) < 5000) {
                    logger.debug('Skipping rapid credential update');
                    return;
                }

                credUpdateCache.set('lastUpdate', now);
                await saveCreds();

                // Backup credentials
                await compressCredsFile(sessionConfig.authDir);
                logger.info('Credentials updated and backed up successfully');
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