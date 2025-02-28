const express = require('express');
const pino = require('pino');
const logger = pino();
const { 
    default: makeWASocket,
    useMultiFileAuthState,
    makeInMemoryStore,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const qrcode = require('qrcode-terminal');
const fs = require('fs-extra');
const path = require('path');
const config = require('./config');

// Initialize express app
const app = express();
const PORT = 5000;  // Using port 5000 which is mapped to 80 in .replit

// Basic route
app.get('/', (req, res) => {
    res.send('WhatsApp Bot is running!');
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime()
    });
});

// Initialize store and auth directory
const store = makeInMemoryStore({ logger: pino({ level: "silent" }) });
const authDir = path.join(__dirname, 'auth_info_baileys');
fs.ensureDirSync(authDir);

async function startWhatsApp() {
    try {
        logger.info('Starting WhatsApp initialization...');

        // Clear auth directory to force new QR code
        await fs.remove(authDir);
        await fs.ensureDir(authDir);

        logger.info('Loading authentication state...');
        const { state, saveCreds } = await useMultiFileAuthState(authDir);

        logger.info('Fetching Baileys version...');
        let version;
        try {
            const versionInfo = await fetchLatestBaileysVersion();
            version = versionInfo.version;
            logger.info('Using Baileys version:', version);
        } catch (error) {
            logger.error('Error fetching Baileys version:', error);
            throw new Error('Failed to fetch Baileys version');
        }

        logger.info('Creating WhatsApp socket...');
        const sock = makeWASocket({
            version,
            logger: pino({ level: "debug" }),  // Set to debug for more detailed logs
            printQRInTerminal: true,
            auth: state,
            browser: ['BLACKSKY-MD', 'Safari', '1.0.0'],
            // Add recommended settings for multi-device
            connectTimeoutMs: 60_000,
            defaultQueryTimeoutMs: 0,
            keepAliveIntervalMs: 10000,
            emitOwnEvents: true,
            markOnlineOnConnect: true
        });

        logger.info('Binding store to socket events...');
        store.bind(sock.ev);

        logger.info('Loading message handler...');
        const messageHandler = require('./handlers/message');

        // Setup message handling
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;
            try {
                const msg = messages[0];
                if (!msg?.message) return;
                logger.info('Processing new message:', {
                    from: msg.key.remoteJid,
                    type: Object.keys(msg.message)[0]
                });
                await messageHandler(sock, msg);
            } catch (error) {
                logger.error('Message handling error:', error);
            }
        });

        // Connection status updates
        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            logger.info('Connection status update:', { 
                connection, 
                hasQR: !!qr,
                disconnectReason: lastDisconnect?.error?.output?.statusCode,
                fullError: lastDisconnect ? JSON.stringify(lastDisconnect.error) : null
            });

            if (qr) {
                logger.info('New QR code received, displaying in terminal...');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom)? 
                    lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;
                logger.info('Connection closed:', { 
                    shouldReconnect,
                    statusCode: lastDisconnect?.error?.output?.statusCode,
                    errorMessage: lastDisconnect?.error?.message
                });
                if (shouldReconnect) {
                    logger.info('Attempting reconnection in 3 seconds...');
                    setTimeout(startWhatsApp, 3000);
                } else {
                    logger.error('Connection closed permanently:', lastDisconnect?.error);
                }
            }

            if (connection === 'open') {
                logger.info('WhatsApp connection established successfully');
                sock.sendPresenceUpdate('available');
            }
        });

        // Credentials update handling
        sock.ev.on('creds.update', async () => {
            logger.info('Credentials updated, saving...');
            await saveCreds();
        });
        logger.info('Credentials update handler registered');

        return sock;
    } catch (error) {
        logger.error('WhatsApp initialization error:', error);
        throw error;
    }
}

// Start server
try {
    app.listen(PORT, '0.0.0.0', async () => {
        logger.info(`Server running on http://0.0.0.0:${PORT}`);
        // Start WhatsApp bot after server is running
        try {
            await startWhatsApp();
        } catch (error) {
            logger.error('Failed to start WhatsApp bot:', error);
        }
    });
} catch (error) {
    logger.error('Server startup error:', error);
    process.exit(1);
}

// Error handling
process.on('uncaughtException', error => {
    logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', error => {
    logger.error('Unhandled Rejection:', error);
});