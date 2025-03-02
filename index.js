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

        const { state, saveCreds } = await useMultiFileAuthState('auth_info');

        const sock = makeWASocket({
            logger: pino({ level: 'debug' }), // Changed to debug for more verbose logging
            printQRInTerminal: true,
            auth: state,
            browser: ['𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻', 'Chrome', '112.0.5615.49']
        });

        store.bind(sock.ev);

        // Handle messages with improved parsing
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            try {
                if (type !== 'notify') return;

                const msg = messages[0];
                if (!msg) return;

                // Enhanced message logging
                logger.info('Received message:', {
                    messageType: msg.messageType,
                    body: msg.message?.conversation || 
                          msg.message?.extendedTextMessage?.text ||
                          msg.message?.imageMessage?.caption ||
                          msg.message?.videoMessage?.caption,
                    from: msg.key.remoteJid,
                    sender: msg.key.participant || msg.key.remoteJid
                });

                // Direct message handling without smsg wrapper
                const msgData = {
                    ...msg,
                    body: msg.message?.conversation || 
                          msg.message?.extendedTextMessage?.text ||
                          msg.message?.imageMessage?.caption ||
                          msg.message?.videoMessage?.caption || '',
                    type: Object.keys(msg.message || {})[0],
                    key: msg.key
                };

                // Process command
                await require('./handler')(sock, msgData, { messages, type }, store);

            } catch (err) {
                logger.error('Error processing message:', err);
            }
        });

        // Connection handling
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

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

        sock.ev.on('creds.update', saveCreds);

    } catch (err) {
        logger.error('Error starting bot:', err);
        process.exit(1);
    }
}

// Express server setup
const app = express();
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.json({
        status: 'WhatsApp Bot Server Running',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

async function startApplication() {
    try {
        await new Promise((resolve, reject) => {
            app.listen(PORT, '0.0.0.0')
                .once('error', reject)
                .once('listening', resolve);
        });

        logger.info(`Server started on port ${PORT}`);
        await startBot();

    } catch (error) {
        logger.error('Application startup failed:', error);
        process.exit(1);
    }
}

startApplication().catch(err => {
    logger.error('Startup failed:', err);
    process.exit(1);
});