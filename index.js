const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const path = require('path');
const qrcode = require('qrcode-terminal'); // Add explicit import for QR code
const messageHandler = require('./handlers/message');
const logger = require('./utils/logger');
const config = require('./config');

async function connectToWhatsApp() {
    // Get authentication state
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    // Create WA socket
    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
        logger: logger
    });

    // Handle connection updates
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)
                ? lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
                : true;

            console.log('Connection closed due to:', lastDisconnect?.error, 'Reconnecting:', shouldReconnect);

            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('Connected to WhatsApp');
        }
    });

    // Handle credentials updates
    sock.ev.on('creds.update', saveCreds);

    // Handle messages
    sock.ev.on('messages.upsert', async ({ messages }) => {
        try {
            await messageHandler(sock, messages[0]);
        } catch (error) {
            logger.error('Error in message handling:', error);
        }
    });
}

// Start the bot
connectToWhatsApp().catch(err => logger.error('Fatal error:', err));