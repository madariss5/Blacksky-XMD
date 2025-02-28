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

// Initialize express app with basic routes
const app = express();
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.send('WhatsApp Bot is running!');
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Initialize store and auth directory
const store = makeInMemoryStore({ logger: pino({ level: "silent" }) });
const authDir = path.join(__dirname, 'auth_info_baileys');
fs.ensureDirSync(authDir);

// Initialize WhatsApp connection
async function startWhatsApp() {
    try {
        // Reset auth state
        await fs.remove(authDir);
        await fs.ensureDir(authDir);

        const { state, saveCreds } = await useMultiFileAuthState(authDir);
        const { version } = await fetchLatestBaileysVersion();

        logger.info('Starting WhatsApp with version:', version);

        const sock = makeWASocket({
            version,
            logger: pino({ level: "silent" }),
            printQRInTerminal: true,
            auth: state,
            browser: ['BLACKSKY-MD', 'Chrome', '1.0.0']
        });

        store.bind(sock.ev);

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

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                logger.info('New QR code received');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom)? 
                    lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;

                logger.info('Connection closed:', { shouldReconnect });

                if (shouldReconnect) {
                    setTimeout(startWhatsApp, 3000);
                }
            }

            if (connection === 'open') {
                logger.info('Connected successfully');
            }
        });

        sock.ev.on('creds.update', saveCreds);

        return sock;
    } catch (error) {
        logger.error('WhatsApp initialization error:', error);
        throw error;
    }
}

// Start server and WhatsApp bot
async function main() {
    try {
        // Start express server
        const server = await new Promise((resolve, reject) => {
            const server = app.listen(PORT, '0.0.0.0', () => {
                logger.info(`Server listening on port ${PORT}`);
                resolve(server);
            });

            server.on('error', (error) => {
                logger.error(`Server error: ${error.message}`);
                reject(error);
            });
        });

        // Initialize WhatsApp
        await startWhatsApp();
        logger.info('WhatsApp bot initialized successfully');

    } catch (error) {
        logger.error('Startup error:', error);
        process.exit(1);
    }
}

// Start the application
main().catch(error => {
    logger.error('Fatal error:', error);
    process.exit(1);
});

// Error handlers
process.on('uncaughtException', error => {
    logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', error => {
    logger.error('Unhandled Rejection:', error);
});