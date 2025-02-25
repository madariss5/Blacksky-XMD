const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const path = require('path');
const qrcode = require('qrcode-terminal'); 
const messageHandler = require('./handlers/message');
const logger = require('./utils/logger');
const config = require('./config');

// Heroku doesn't persist files, so we'll use environment variable for session if available
const getAuthState = async () => {
    if (process.env.SESSION_ID) {
        return {
            state: {
                creds: {
                    me: {
                        id: process.env.SESSION_ID
                    }
                }
            },
            saveCreds: async () => {
                // In Heroku, we can't save to file system
                logger.info('Session saved to environment');
            }
        };
    }
    return await useMultiFileAuthState('auth_info_baileys');
};

async function connectToWhatsApp() {
    const { state, saveCreds } = await getAuthState();

    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
        logger: logger,
        browser: ['𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻', 'Chrome', '1.0.0']
    });

    // Handle connection updates
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            // Display QR code in terminal
            qrcode.generate(qr, { small: true });
            console.log('\nScan the QR code above with WhatsApp to start the bot\n');
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)
                ? lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
                : true;

            console.log('Connection closed due to:', lastDisconnect?.error?.output?.payload?.message || 'unknown error');
            console.log('Reconnecting:', shouldReconnect);

            if (shouldReconnect) {
                setTimeout(() => {
                    console.log('Attempting to reconnect...');
                    connectToWhatsApp();
                }, 5000); // Wait 5 seconds before reconnecting
            } else {
                console.log('Connection closed permanently. Please restart the bot.');
            }
        } else if (connection === 'open') {
            console.log('Connected to WhatsApp');
            const sessionId = sock.authState.creds.me?.id || 'Not available';
            console.log('Session ID:', sessionId);
            logger.info(`Session ID: ${sessionId}`);

            // If running on Heroku and session ID isn't set, log it for configuration
            if (!process.env.SESSION_ID) {
                console.log('\n=== IMPORTANT ===');
                console.log('Set this session ID in your Heroku config vars:');
                console.log(`SESSION_ID=${sessionId}`);
                console.log('==================\n');
            }

            // Send startup message to owner
            try {
                await sock.sendMessage(config.ownerNumber, {
                    text: `*🚀 Bot Successfully Connected!*\n\n` +
                          `• Bot Name: ${config.botName}\n` +
                          `• Owner: ${config.ownerName}\n` +
                          `• Session ID: ${sessionId}\n` +
                          `• Connection Time: ${new Date().toLocaleString()}\n\n` +
                          `Bot is now online and ready to use! 🎉\n` +
                          `Use ${config.prefix}menu to see available commands.`
                });
                logger.info('Startup message sent to owner');
            } catch (error) {
                logger.error('Failed to send startup message:', error);
            }
        }
    });

    // Handle credentials update
    sock.ev.on('creds.update', saveCreds);

    // Handle incoming messages
    sock.ev.on('messages.upsert', async ({ messages }) => {
        try {
            await messageHandler(sock, messages[0]);
        } catch (error) {
            logger.error('Error in message handling:', error);
            // Try to notify owner about the error
            try {
                await sock.sendMessage(config.ownerNumber, {
                    text: `*⚠️ Bot Error*\n\n${error.message}\n\nCheck the logs for more details.`
                });
            } catch (notifyError) {
                logger.error('Failed to notify owner about error:', notifyError);
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
        logger.error('Fatal error:', err);
        // Exit with error code to trigger restart if using PM2
        process.exit(1);
    }
})();