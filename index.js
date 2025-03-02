const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
    jidDecode
} = require("@whiskeysockets/baileys");
const pino = require('pino');
const logger = require('./utils/logger');
const { smsg } = require('./lib/simple');
const config = require('./config');
const express = require('express');
const fs = require('fs-extra');
const path = require('path');

// Initialize store
const store = makeInMemoryStore({
    logger: pino({ level: 'silent' })
});

async function startBot() {
    try {
        logger.info('Starting WhatsApp bot...');

        // Initialize auth state
        const { state, saveCreds } = await useMultiFileAuthState('auth_info');

        // Create WA Socket
        const sock = makeWASocket({
            logger: pino({ level: 'info' }), // Set to info to see QR code
            printQRInTerminal: true,         // Enable QR code in terminal
            auth: state,
            browser: ['𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻', 'Chrome', '112.0.5615.49']
        });

        store.bind(sock.ev);

        // Handle connection updates
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                logger.info('New QR Code received:', qr);
            }

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                logger.info('Connection closed. Reconnecting:', shouldReconnect);
                if (shouldReconnect) {
                    startBot();
                }
            } else if (connection === 'open') {
                logger.info('WhatsApp connection established!');
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

        // Save credentials
        sock.ev.on('creds.update', saveCreds);

    } catch (err) {
        logger.error('Error starting bot:', err);
        process.exit(1);
    }
}

// Start Express server for health checks
const app = express();
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.json({
        status: 'WhatsApp Bot Server Running',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Start server and bot
async function startApplication() {
    try {
        // Start Express server
        await new Promise((resolve, reject) => {
            app.listen(PORT, '0.0.0.0')
                .once('error', reject)
                .once('listening', resolve);
        });

        logger.info(`Server started on port ${PORT}`);

        // Start WhatsApp bot
        await startBot();

    } catch (error) {
        logger.error('Application startup failed:', error);
        process.exit(1);
    }
}

// Start the application
startApplication().catch(err => {
    logger.error('Startup failed:', err);
    process.exit(1);
});