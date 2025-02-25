const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const path = require('path');
const fs = require('fs').promises;
const qrcode = require('qrcode-terminal'); 
const messageHandler = require('./handlers/message');
const logger = require('./utils/logger');
const config = require('./config');
const SessionManager = require('./utils/session');

// Create sessions directory if it doesn't exist
const SESSION_DIR = './sessions/flash-md';
const sessionManager = new SessionManager(SESSION_DIR);

async function connectToWhatsApp() {
    // Initialize session directory
    await sessionManager.initialize();

    // Clean up old sessions
    await sessionManager.cleanupOldSessions();

    // Use file-based auth state
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
        logger: logger,
        // Update browser identification to match latest WhatsApp Web
        browser: ['WhatsApp Desktop', 'Desktop', '1.0.0'],
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
        emitOwnEvents: true,
        retryRequestDelayMs: 2500
    });

    // Handle connection updates
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrcode.generate(qr, { small: true });
            console.log('\n=== SCAN QR CODE ===');
            console.log('Scan the QR code above with WhatsApp to start the bot');
            console.log('=====================\n');
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)
                ? lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
                : true;

            console.log('Connection closed due to:', lastDisconnect?.error?.output?.payload?.message || 'unknown error');
            console.log('Reconnecting:', shouldReconnect);

            if (shouldReconnect) {
                setTimeout(connectToWhatsApp, 3000);
            }
        } else if (connection === 'open') {
            console.log('Connected to WhatsApp');

            // Save session data for Heroku deployment
            const sessionData = JSON.stringify({
                creds: sock.authState.creds,
                keys: sock.authState.keys
            });

            // Save session info
            await sessionManager.saveSessionInfo(
                sock.authState.creds.me?.id || 'Not available',
                sessionData
            );

            console.log('\n=== HEROKU DEPLOYMENT INFO ===');
            console.log('Add these to your Heroku config vars:');
            console.log(`SESSION_ID=${sock.authState.creds.me?.id || 'Not available'}`);
            console.log(`SESSION_DATA=${sessionData}`);
            console.log('==============================\n');

            // Send success message to owner
            try {
                await sock.sendMessage(config.ownerNumber, {
                    text: `*🚀 Flash-MD Connected Successfully!*\n\n` +
                          `• Bot Name: ${config.botName}\n` +
                          `• Owner: ${config.ownerName}\n` +
                          `• Session ID: ${sock.authState.creds.me?.id || 'Not available'}\n` +
                          `• Time: ${new Date().toLocaleString()}\n\n` +
                          `Bot is ready! Use ${config.prefix}menu to see commands.`
                });
            } catch (error) {
                console.log('Failed to send owner message:', error);
            }
        }
    });

    // Save credentials when updated
    sock.ev.on('creds.update', saveCreds);

    // Handle messages
    sock.ev.on('messages.upsert', async ({ messages }) => {
        if (!messages[0]) return;
        try {
            await messageHandler(sock, messages[0]);
        } catch (error) {
            console.error('Error handling message:', error);
            try {
                await sock.sendMessage(config.ownerNumber, {
                    text: `*⚠️ Error*\n\n${error.message}`
                });
            } catch (err) {
                console.error('Failed to send error notification:', err);
            }
        }
    });
}

// Start the bot with error handling
(async () => {
    try {
        await connectToWhatsApp();
    } catch (err) {
        console.error('Fatal error:', err);
        process.exit(1);
    }
})();