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

// Enhance session validation
async function loadAuthState() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(config.session.authDir);
        if (!state?.creds?.me?.id) {
            logger.warn('Invalid or missing credentials, starting fresh session');
            await fs.emptyDir(config.session.authDir);
            return await useMultiFileAuthState(config.session.authDir);
        }
        return { state, saveCreds };
    } catch (error) {
        logger.error('Failed to load auth state:', error);
        throw error;
    }
}

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

// Enhanced message handling
async function handleIncomingMessage(sock, msg, chatUpdate) {
    try {
        if (!msg.message) return;

        const messageType = getContentType(msg.message);
        if (!messageType) {
            logger.debug('Skipping message with invalid type');
            return;
        }

        // Extract message content
        const messageContent = msg.message[messageType]?.text || 
                             msg.message[messageType]?.caption || 
                             msg.message.conversation || '';

        // Process commands
        if (messageContent.startsWith(config.prefix)) {
            const args = messageContent.slice(1).trim().split(/ +/);
            const command = args.shift().toLowerCase();

            // Load command handler
            try {
                const commandsPath = path.join(__dirname, 'commands');
                const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

                for (const file of commandFiles) {
                    const commandModule = require(path.join(commandsPath, file));
                    if (commandModule[command]) {
                        await commandModule[command](sock, msg, args);
                        break;
                    }
                }
            } catch (error) {
                logger.error('Command execution failed:', error);
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Error executing command: ' + error.message
                });
            }
        }
    } catch (error) {
        logger.error('Message handling failed:', error);
    }
}

// Enhanced HANS initialization
async function startHANS() {
    try {
        await startServer();
        logger.info('Loading WhatsApp session...');

        const { state, saveCreds } = await loadAuthState();
        global.authState = state;

        const { version, isLatest } = await fetchLatestBaileysVersion();
        logger.info(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: true,
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

        store.bind(sock.ev);

        // Connection handling
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                logger.info('New QR Code received, please scan:');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
                logger.warn('Connection closed due to:', { reason });

                if (reason === DisconnectReason.loggedOut) {
                    logger.warn('Device logged out, please scan QR code again.');
                    await fs.remove(config.session.authDir);
                    process.exit(1);
                } else if (!isShuttingDown) {
                    logger.info('Reconnecting...');
                    setTimeout(startHANS, 3000);
                }
            }

            if (connection === 'open') {
                logger.info('WhatsApp connection established!');
                await sock.sendMessage(sock.user.id, {
                    text: '🟢 Bot is now online and ready!'
                }).catch(err => logger.error('Failed to send status message:', err));
            }
        });

        // Message handling
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;

            for (const message of messages) {
                await handleIncomingMessage(sock, message, type);
            }
        });

        // Credentials update
        sock.ev.on('creds.update', saveCreds);

        return sock;
    } catch (error) {
        logger.error('Fatal error in startHANS:', error);
        if (!isShuttingDown) {
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