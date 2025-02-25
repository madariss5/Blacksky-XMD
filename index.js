const chalk = require('chalk');

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
const SESSION_DIR = './sessions/blacksky-md';
const sessionManager = new SessionManager(SESSION_DIR);

let isConnected = false; // Track connection status

async function connectToWhatsApp() {
    // Initialize session directory
    await sessionManager.initialize();

    // Use file-based auth state
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    const sock = makeWASocket({
        printQRInTerminal: false, // We'll handle QR ourselves
        auth: state,
        logger: logger,
        browser: ['𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻', 'Chrome', '116.0.0'], // More stable browser ID
        connectTimeoutMs: 120000, // Increased timeout
        defaultQueryTimeoutMs: 120000, // Increased query timeout
        keepAliveIntervalMs: 10000, // More frequent keepalive
        emitOwnEvents: true,
        retryRequestDelayMs: 5000, // Increased retry delay
        maxRetries: 5, // Added max retries
        version: [2, 2323, 4] // Stable WhatsApp version
    });

    // Handle connection updates
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            try {
                // Clear terminal and show header
                process.stdout.write('\x1Bc');
                console.log('\n=== 𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻 QR CODE ===\n');

                // Generate QR code synchronously
                qrcode.generate(qr, { small: true }, (qrcode) => {
                    console.log(qrcode);
                    console.log('\nScan QR Code above with WhatsApp to start the bot');
                    console.log('1. Open WhatsApp on your phone');
                    console.log('2. Tap Menu or Settings and select Linked Devices');
                    console.log('3. Point your phone camera to this QR code to scan\n');
                });
            } catch (error) {
                logger.error('Failed to generate QR:', error);
                console.log('\nQR Code data:', qr); // Fallback to raw QR
            }
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
            if (!isConnected) { // Only send session info on first successful connection
                isConnected = true;
                console.log('Connected to WhatsApp');

                // Save session data for Heroku deployment
                const sessionData = {
                    creds: sock.authState.creds,
                    keys: sock.authState.keys
                };

                // Save credentials to creds.json file
                try {
                    await fs.writeFile(
                        path.join(__dirname, 'creds.json'),
                        JSON.stringify(sessionData, null, 2)
                    );
                    console.log('Credentials saved to creds.json');

                    // Save session info
                    await sessionManager.saveSessionInfo(
                        sock.authState.creds.me?.id || 'Not available',
                        JSON.stringify(sessionData)
                    );

                    console.log('\n=== HEROKU DEPLOYMENT INFO ===');
                    console.log('Add these to your Heroku config vars:');
                    console.log(`SESSION_ID=${sock.authState.creds.me?.id || 'Not available'}`);
                    console.log('SESSION_DATA=<Copy contents from creds.json>');
                    console.log('==============================\n');

                    // Send success message to owner
                    await sock.sendMessage(config.ownerNumber, {
                        text: `*🚀 𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻 Connected Successfully!*\n\n` +
                              `• Bot Name: ${config.botName}\n` +
                              `• Owner: ${config.ownerName}\n` +
                              `• Session ID: ${sock.authState.creds.me?.id || 'Not available'}\n` +
                              `• Time: ${new Date().toLocaleString()}\n\n` +
                              `Bot is ready! Use ${config.prefix}menu to see commands.\n\n` +
                              `✅ Credentials have been saved to creds.json\n` +
                              `📝 See next message for Heroku deployment data`
                    });

                    // Send creds.json content as a separate message
                    const credsContent = JSON.stringify(sessionData, null, 2);
                    await sock.sendMessage(config.ownerNumber, {
                        text: `*📋 Heroku Deployment Data*\n\n` +
                              `Add this data to your Heroku config vars as *SESSION_DATA*:\n\n` +
                              '```json\n' + credsContent + '\n```\n\n' +
                              `*Session ID:* ${sock.authState.creds.me?.id || 'Not available'}\n` +
                              '✅ Your bot is ready for Heroku deployment!'
                    });

                } catch (error) {
                    console.error('Failed to save credentials:', error);
                    try {
                        await sock.sendMessage(config.ownerNumber, {
                            text: `⚠️ Warning: Failed to save credentials\nError: ${error.message}`
                        });
                    } catch (err) {
                        console.error('Failed to send error message to owner:', err);
                    }
                }
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