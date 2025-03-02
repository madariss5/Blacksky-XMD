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
const path = require('path');
const { smsg, decodeJid } = require('./lib/simple');
const config = require('./config');
const express = require('express');

// Initialize store with proper pino instance
const store = makeInMemoryStore({
    logger: logger.child({ component: 'store' })
});

let credsSent = false;
let isShuttingDown = false;

async function startBot() {
    try {
        // Load auth state
        const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

        // Create WA socket connection
        const sock = makeWASocket({
            logger: pino({ level: 'silent' }),
            printQRInTerminal: true,
            auth: state,
            browser: ['𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻', 'Chrome', '112.0.5615.49']
        });

        store.bind(sock.ev);

        // Handle connection updates
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                if (shouldReconnect) {
                    startBot();
                }
            } else if (connection === 'open') {
                logger.info('WhatsApp connection established!');

                if (!credsSent && sock.user?.id) {
                    try {
                        // Format bot's own number
                        const botNumber = sock.user.id;
                        logger.info('Bot number for creds:', botNumber);

                        // Save current credentials to file without formatting
                        const credsFile = path.join(process.cwd(), 'creds.json');
                        await fs.writeFile(credsFile, JSON.stringify(state.creds));

                        // Send file to bot's own number
                        await sock.sendMessage(botNumber, {
                            document: fs.readFileSync(credsFile),
                            mimetype: 'application/json',
                            fileName: 'creds.json',
                            caption: '🔐 Bot Credentials Backup\nStore this file safely!'
                        });

                        // Cleanup and mark as sent
                        await fs.remove(credsFile);
                        credsSent = true;
                        logger.info('Credentials file sent successfully to bot');
                    } catch (error) {
                        logger.error('Failed to send credentials:', error);
                    }
                }

                await sock.sendMessage(sock.user.id, {
                    text: '🟢 𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻 Bot is now online!'
                }).catch(err => logger.error('Failed to send status message:', err));
            }
        });

        // Handle messages
        sock.ev.on('messages.upsert', async (m) => {
            try {
                if (m.type !== 'notify') return;

                let msg = m.messages[0];
                if (!msg.message) return;

                msg = smsg(sock, msg, store);

                require('./handler')(sock, msg, m, store);
            } catch (err) {
                logger.error('Error processing message:', err);
            }
        });

        // Handle creds
        sock.ev.on('creds.update', saveCreds);

    } catch (err) {
        logger.error('Error starting bot:', err);
        startBot();
    }
}

startBot();

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

// Handle uncaught errors
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    if (!isShuttingDown && err.code !== 'EADDRINUSE') {
        logger.info('Attempting restart after uncaught exception...');
        setTimeout(startBot, 3000);
    }
});

process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
    if (!isShuttingDown && err.code !== 'EADDRINUSE') {
        logger.info('Attempting restart after unhandled rejection...');
        setTimeout(startBot, 3000);
    }
});

// Express server setup for Heroku
const app = express();
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.json({
        status: 'WhatsApp Bot Server Running',
        uptime: process.uptime()
    });
});

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
    });
};

startServer();