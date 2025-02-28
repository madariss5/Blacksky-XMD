require('dotenv').config();
const express = require('express');
const { 
    default: makeWASocket,
    useMultiFileAuthState,
    makeInMemoryStore,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const qrcode = require('qrcode-terminal');
const fs = require('fs-extra');
const path = require('path');
const config = require('./config');

// Initialize logger
const logger = pino({
    level: 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard'
        }
    }
});

// Initialize express app and routes first
const app = express();
const PORT = 5000;

app.get('/', (req, res) => {
    res.send('WhatsApp Bot is running!');
});

app.get('/status', (req, res) => {
    res.json({
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

// Start express server with proper error handling
const startServer = () => {
    return new Promise((resolve, reject) => {
        // First check if port is in use
        const net = require('net');
        const tester = net.createServer()
            .once('error', err => {
                if (err.code === 'EADDRINUSE') {
                    logger.error(`Port ${PORT} is already in use`);
                    reject(new Error(`Port ${PORT} is already in use`));
                } else {
                    logger.error('Port check failed:', err);
                    reject(err);
                }
            })
            .once('listening', () => {
                tester.close(() => {
                    // Port is free, start express server
                    const server = app.listen(PORT, '0.0.0.0', () => {
                        logger.info(`Express server running on port ${PORT}`);
                        resolve(server);
                    });

                    server.on('error', (error) => {
                        logger.error('Express server error:', error);
                        reject(error);
                    });
                });
            })
            .listen(PORT);
    });
};

// Initialize store and directories
const authDir = path.join(__dirname, 'auth_info_baileys');
const storeFile = path.join(__dirname, 'baileys_store.json');
fs.ensureDirSync(authDir);

const store = makeInMemoryStore({ logger: pino({ level: "silent" }) });

// Load store data if exists
if (fs.existsSync(storeFile)) {
    store.readFromFile(storeFile);
    logger.info('Store data loaded successfully');
}

// Save store periodically
setInterval(() => {
    try {
        store.writeToFile(storeFile);
    } catch (error) {
        logger.error('Failed to write store:', error.message);
    }
}, 10000);

// Initialize WhatsApp connection
async function startWhatsApp() {
    try {
        // Reset auth state for fresh start
        await fs.remove(authDir);
        await fs.ensureDir(authDir);

        const { state, saveCreds } = await useMultiFileAuthState(authDir);
        if (!state) {
            throw new Error('Failed to initialize auth state');
        }

        const { version } = await fetchLatestBaileysVersion();
        logger.info('Using Baileys version:', version);

        const sock = makeWASocket({
            version,
            logger: pino({ level: "silent" }),
            printQRInTerminal: true,
            auth: state,
            browser: ['BLACKSKY-MD', 'Chrome', '1.0.0'],
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 60000,
            emitOwnEvents: true,
            markOnlineOnConnect: true
        });

        store.bind(sock.ev);
        logger.info('Store bound to socket events');

        const messageHandler = require('./handlers/message');

        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;

            try {
                const msg = messages[0];
                if (!msg?.message) return;
                await messageHandler(sock, msg);
            } catch (error) {
                logger.error('Message handling error:', error);
            }
        });

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('\nQR Code received, please scan:');
                qrcode.generate(qr, { small: true });
                logger.info('New QR code generated');
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom)? 
                    lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;

                logger.info('Connection closed:', {
                    error: lastDisconnect?.error?.message,
                    shouldReconnect
                });

                if (shouldReconnect) {
                    logger.info('Attempting reconnection...');
                    setTimeout(startWhatsApp, 3000);
                } else {
                    logger.warn('Session ended - clearing auth state');
                    await fs.remove(authDir);
                    setTimeout(startWhatsApp, 5000);
                }
            }

            if (connection === 'open') {
                logger.info('Connection established successfully!');
                try {
                    await sock.sendMessage(config.ownerNumber, {
                        text: '🤖 Bot is now online and ready!'
                    });
                } catch (error) {
                    logger.error('Failed to send ready message:', error);
                }
            }
        });

        sock.ev.on('creds.update', saveCreds);

        return sock;
    } catch (error) {
        logger.error('Fatal error in WhatsApp connection:', error);
        throw error;
    }
}

// Main startup sequence
async function main() {
    try {
        // Start server first
        logger.info('Starting express server...');
        await startServer();
        logger.info('Express server started successfully');

        // Then start WhatsApp connection
        logger.info('Initializing WhatsApp connection...');
        await startWhatsApp();
        logger.info('WhatsApp bot initialized successfully');
    } catch (error) {
        logger.error('Fatal startup error:', error);
        process.exit(1);
    }
}

// Start application
main().catch(error => {
    logger.error('Application startup failed:', error);
    process.exit(1);
});

// Error handlers
process.on('uncaughtException', error => {
    logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection:', {
        reason: reason instanceof Error ? reason.message : reason,
        stack: reason instanceof Error ? reason.stack : undefined
    });
});