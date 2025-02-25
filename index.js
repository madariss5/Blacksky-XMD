const chalk = require('chalk');
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, usePairingCode } = require('@whiskeysockets/baileys');
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

    // FLASH-MD Connection Configuration
    const sock = makeWASocket({
        printQRInTerminal: false,
        auth: state,
        logger: logger,
        browser: ["FLASH-MD", "Firefox", "1.0.0"], // Flash-MD browser config
        connectTimeoutMs: 60000,
        qrTimeout: 60000,
        defaultQueryTimeoutMs: 60000,
        generateHighQualityLinkPreview: true,
        syncFullHistory: true,
        markOnlineOnConnect: true,
        shouldIgnoreJid: jid => isJidBroadcast(jid),
        downloadHistory: false,
        getMessage: async (key) => { return { conversation: 'hello' } },
        patchMessageBeforeSending: (message) => {
            const requiresPatch = !!(
                message.buttonsMessage ||
                message.templateMessage ||
                message.listMessage
            );
            if (requiresPatch) {
                message = {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadataVersion: 2,
                                deviceListMetadata: {}
                            },
                            ...message
                        }
                    }
                };
            }
            return message;
        }
    });

    // Enable pairing code
    const phoneNumber = process.env.BOT_NUMBER || '1234567890';
    const usePairing = process.env.USE_PAIRING === 'true';

    // Handle connection updates
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            try {
                // Clear terminal and show header
                process.stdout.write('\x1Bc');
                console.log('\n=== 𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻 CONNECTION ===\n');

                if (usePairing) {
                    console.log('🔄 Generating pairing code...');
                    try {
                        // Get pairing code
                        const code = await sock.requestPairingCode(phoneNumber);
                        console.log('\n╔═══════════════════════════╗');
                        console.log('║   PAIRING CODE GENERATED   ║');
                        console.log('╚═══════════════════════════╝\n');
                        console.log(`Your pairing code: ${chalk.bold.white(code)}\n`);
                        console.log('1. Open WhatsApp on your phone');
                        console.log('2. Go to Linked Devices > Link a Device');
                        console.log('3. Enter the pairing code shown above\n');
                    } catch (error) {
                        logger.error('Failed to generate pairing code:', error);
                        console.log('\nFalling back to QR code...\n');
                    }
                }

                // Always show QR code as fallback
                console.log('Or scan this QR code:\n');
                qrcode.generate(qr, { small: true }, (qrcode) => {
                    console.log(qrcode);
                    console.log('\n1. Open WhatsApp on your phone');
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

                // Save session data for persistence
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

                    // Send success message to owner
                    await sock.sendMessage(config.ownerNumber, {
                        text: `*🚀 𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻 Connected Successfully!*\n\n` +
                              `• Bot Name: ${config.botName}\n` +
                              `• Owner: ${config.ownerName}\n` +
                              `• Session ID: ${sock.authState.creds.me?.id || 'Not available'}\n` +
                              `• Time: ${new Date().toLocaleString()}\n\n` +
                              `Bot is ready! Use ${config.prefix}menu to see commands.`
                    });

                } catch (error) {
                    console.error('Failed to save credentials:', error);
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

// Helper function for JID validation
function isJidBroadcast(jid) {
    return jid.includes('@broadcast');
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