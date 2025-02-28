require('dotenv').config();
const express = require('express');
const { 
    default: makeWASocket,
    useMultiFileAuthState,
    makeInMemoryStore,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const config = require("./config");
const fs = require("fs-extra");
const path = require("path");
const qrcode = require('qrcode-terminal');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize store with better error handling (from original)
const store = makeInMemoryStore({ logger: pino({ level: "silent" }) });

try {
    store.readFromFile('./baileys_store.json');
} catch (error) {
    logger.warn('Could not read store file:', error.message);
    logger.info('Creating new store file');
}

// Save store more frequently with error handling (from original)
setInterval(() => {
    try {
        store.writeToFile('./baileys_store.json');
    } catch (error) {
        logger.error('Failed to write store:', error.message);
    }
}, 10000);


// Configure logger (combination of original and edited)
const logger = pino({
    level: "debug",
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard'
        }
    }
});

// Express endpoint
app.get('/', (req, res) => {
    res.send('WhatsApp Bot is running!');
});

// Start server (from original)
const startServer = () => {
    try {
        app.listen(PORT, '0.0.0.0', () => {
            logger.info(`Server running on port ${PORT}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

async function connectToWhatsApp() {
    const authDir = "./auth_info_baileys";

    try {
        // Verify auth state before proceeding (from original)
        if (!await verifyAuthState(authDir)) {
            throw new Error('Auth state verification failed');
        }

        // Fetch latest version (from edited)
        const { version } = await fetchLatestBaileysVersion();
        logger.info(`Using Baileys version: ${version}`);

        // Load auth state (from edited, but retains error handling from original)
        const { state, saveCreds } = await useMultiFileAuthState(authDir);
        logger.info('Auth state loaded successfully');

        // Create socket (combination of original and edited)
        const sock = makeWASocket({
            version,
            printQRInTerminal: true,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger)
            },
            logger: pino({ level: "silent" }),
            browser: ["BLACKSKY-MD", "Chrome", "1.0.0"],
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 30000, // from edited
            emitOwnEvents: true,
            markOnlineOnConnect: true,
            qrTimeout: 40000,
            getMessage: async (key) => { // from original
                if (store) {
                    const msg = await store.loadMessage(key.remoteJid, key.id);
                    return msg?.message || undefined;
                }
                return undefined;
            }
        });

        // Bind store (from edited, but retains error handling from original)
        try {
            store.bind(sock.ev);
            logger.info('Store bound to socket events successfully');
        } catch (error) {
            logger.error('Failed to bind store:', error);
        }

        // Import and verify message handler (from original)
        const messageHandler = require('./handlers/message');
        logger.info('Message handler loaded and verified');


        // Handle messages (combination of original and edited)
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;

            try {
                const msg = messages[0];
                if (!msg?.message) {
                    logger.debug('Empty message received, skipping');
                    return;
                }

                logger.debug('Processing message:', {
                    type: Object.keys(msg.message)[0],
                    from: msg.key.remoteJid,
                    pushName: msg.pushName
                });

                await messageHandler(sock, msg);
            } catch (error) {
                logger.error('Message processing error:', {
                    error: error.message,
                    stack: error.stack
                });

                // Attempt to notify user of error (from original)
                try {
                    await sock.sendMessage(messages[0].key.remoteJid, {
                        text: '❌ Error processing message. Please try again.'
                    });
                } catch (sendError) {
                    logger.error('Failed to send error message:', sendError);
                }
            }
        });

        // Handle connection updates (combination of original and edited)
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                qrcode.generate(qr, { small: true });
                logger.info('New QR code generated. Please scan with WhatsApp to authenticate.');
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom) ?
                    lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;

                logger.info('Connection closed:', {
                    error: lastDisconnect?.error?.message,
                    statusCode: lastDisconnect?.error?.output?.statusCode,
                    shouldReconnect
                });

                if (shouldReconnect) {
                    logger.info('Attempting reconnection...');
                    setTimeout(connectToWhatsApp, 3000);
                } else {
                    logger.warn('Session ended - clearing auth state');
                    try {
                        await fs.remove(authDir);
                        logger.info('Auth state cleared successfully');
                        setTimeout(connectToWhatsApp, 5000);
                    } catch (error) {
                        logger.error('Failed to clear auth state:', error);
                    }
                }
            }

            if (connection === 'open') {
                logger.info('Connection established successfully!');

                // Verify bot is working by sending a test message (from original)
                try {
                    await sock.sendMessage(config.ownerNumber, {
                        text: '🤖 Bot is now online and ready!'
                    });
                    logger.info('Successfully sent ready message to owner');
                } catch (error) {
                    logger.error('Failed to send ready message:', error);
                }
            }
        });

        // Save auth state (from edited, but retains error handling from original)
        sock.ev.on('creds.update', async () => {
            try {
                await saveCreds();
                logger.info('Credentials updated and saved successfully');
            } catch (error) {
                logger.error('Failed to save credentials:', error);
            }
        });

        return sock;
    } catch (error) {
        logger.error('Fatal connection error:', {
            message: error.message,
            stack: error.stack
        });

        // Clear auth state and retry (from original)
        try {
            await fs.remove(authDir);
            logger.info('Auth state cleared after fatal error');
        } catch (clearError) {
            logger.error('Failed to clear auth state:', clearError);
        }

        // Implement exponential backoff for retries (from original)
        setTimeout(connectToWhatsApp, 5000);
        return null;
    }
}

// Start bot with improved error handling and retry logic (from original)
(async () => {
    let retryCount = 0;
    const maxRetries = 5;

    while (retryCount < maxRetries) {
        try {
            const sock = await connectToWhatsApp();
            if (sock) {
                logger.info('Bot started successfully');
                retryCount = 0; // Reset retry count on success
                break;
            }
            retryCount++;
            logger.info(`Connection attempt ${retryCount}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, 5000 * retryCount)); // Exponential backoff
        } catch (error) {
            retryCount++;
            logger.error(`Failed to start bot (attempt ${retryCount}/${maxRetries}):`, error);
            if (retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 5000 * retryCount));
            } else {
                logger.error('Max retries reached, please check your configuration and try again');
                process.exit(1);
            }
        }
    }
})();

// Enhanced error handlers with more context (from original)
process.on('uncaughtException', error => {
    logger.error('Uncaught Exception:', {
        error: error.message,
        stack: error.stack,
        type: error.name
    });
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection:', {
        reason: reason instanceof Error ? reason.message : reason,
        stack: reason instanceof Error ? reason.stack : undefined,
        promise: promise
    });
});

//Helper function from original
async function verifyAuthState(authDir) {
    try {
        await fs.ensureDir(authDir);
        const files = await fs.readdir(authDir);
        if (files.length === 0) {
            logger.info('Fresh installation - auth files will be created');
            return true;
        }
        logger.info('Auth files exist and are readable');
        return true;
    } catch (error) {
        logger.error('Auth state verification failed:', error);
        return false;
    }
}