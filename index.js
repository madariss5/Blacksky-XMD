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


// Global state for auth
global.authState = null;

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
let isShuttingDown = false;

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

// Function to save credentials
async function saveCredsToFile() {
    try {
        if (global.authState) {
            const credsFile = path.join(process.cwd(), 'creds.json');
            await fs.writeJson(credsFile, global.authState, { spaces: 2 });
            logger.info('✓ Credentials saved successfully');
        }
    } catch (error) {
        logger.error('Error saving credentials:', error);
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

        const hans = makeWASocket({
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

        // Batch connection updates to reduce spam
        let connectionUpdateTimeout;
        hans.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            // Clear existing timeout
            if (connectionUpdateTimeout) {
                clearTimeout(connectionUpdateTimeout);
            }

            // Batch updates with 1 second delay
            connectionUpdateTimeout = setTimeout(() => {
                logger.debug('Connection state updated:', {
                    currentState: connection,
                    hasQR: !!qr,
                    disconnectReason: lastDisconnect?.error?.output?.statusCode
                });
            }, 1000);

            if (qr) {
                logger.info('Please scan this QR code to connect:');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
                logger.warn('Connection closed due to:', reason);

                if (reason === DisconnectReason.loggedOut) {
                    logger.warn('Device Logged Out, Please Delete Session and Scan Again.');
                    await fs.remove('./auth_info_baileys');
                    process.exit(0);
                } else if (!isShuttingDown) {
                    logger.info('Reconnecting...');
                    setTimeout(startHANS, 3000);
                }
            }

            if (connection === 'open') {
                logger.info('WhatsApp connection established successfully!');
                await saveCredsToFile();

                hans.sendMessage(hans.user.id, { 
                    text: `🟢 ${botName} is now active and ready to use!`
                });
            }
        });

        // Batch message updates
        let messageUpdateTimeout;
        hans.ev.on('messages.upsert', async chatUpdate => {
            try {
                // Clear existing timeout
                if (messageUpdateTimeout) {
                    clearTimeout(messageUpdateTimeout);
                }

                // Batch message processing with 500ms delay
                messageUpdateTimeout = setTimeout(async () => {
                    try {
                        let msg = JSON.parse(JSON.stringify(chatUpdate.messages[0]));
                        if (!msg.message) return;

                        msg.message = (Object.keys(msg.message)[0] === 'ephemeralMessage') 
                            ? msg.message.ephemeralMessage.message 
                            : msg.message;

                        if (msg.key && msg.key.remoteJid === 'status@broadcast') return;

                        const m = smsg(hans, msg, store);
                        require('./handler')(hans, m, chatUpdate, store);
                    } catch (parseError) {
                        logger.error('Error parsing message:', parseError);
                    }
                }, 500);
            } catch (err) {
                logger.error('Error in message handler:', err);
            }
        });

        hans.ev.on('creds.update', async () => {
            await saveCreds();
            // Also update our creds.json when credentials change
            await saveCredsToFile();
        });

        hans.ev.on('messages.upsert', async chatUpdate => {
            try {
                let msg = JSON.parse(JSON.stringify(chatUpdate.messages[0]));
                if (!msg.message) return;

                msg.message = (Object.keys(msg.message)[0] === 'ephemeralMessage') 
                    ? msg.message.ephemeralMessage.message 
                    : msg.message;

                if (msg.key && msg.key.remoteJid === 'status@broadcast') return;

                try {
                    const m = smsg(hans, msg, store);
                    require('./handler')(hans, m, chatUpdate, store);
                } catch (parseError) {
                    logger.error('Error parsing message:', parseError);
                }
            } catch (err) {
                logger.error('Error in message handler:', err);
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
        // Save credentials one last time before shutting down
        await saveCredsToFile();
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