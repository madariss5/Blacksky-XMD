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
logger.info('Starting application...');
logger.info(`Environment: ${process.env.NODE_ENV}`);
logger.info(`Port: ${process.env.PORT || 5000}`);
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

// Express server setup for Heroku
const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'WhatsApp Bot Server Running',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Express error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server and bot
const startApplication = async () => {
    try {
        logger.info('Starting Express server...');
        // Start Express server
        await new Promise((resolve, reject) => {
            const server = app.listen(PORT, '0.0.0.0')
                .once('error', (err) => {
                    logger.error('Failed to start server:', err);
                    reject(err);
                })
                .once('listening', () => {
                    logger.info(`Server started and listening on port ${PORT}`);
                    resolve();
                });
        });

        logger.info('Starting WhatsApp bot...');
        // Start WhatsApp bot
        await startBot();

    } catch (error) {
        logger.error('Application startup failed:', error);
        process.exit(1);
    }
};

// Initialize the application
startApplication().catch(err => {
    logger.error('Startup failed:', err);
    process.exit(1);
});

async function startBot() {
    try {
        logger.info('Initializing WhatsApp bot...');
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
                logger.info('Connection closed. Should reconnect:', shouldReconnect);
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