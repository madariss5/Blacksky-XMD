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
        logger: logger
    });

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
            const sessionId = sock.authState.creds.me?.id || 'Not available';
            console.log('Session ID:', sessionId);
            logger.info(`Session ID: ${sessionId}`);

            // If running on Heroku (SESSION_ID exists), send deployment success message
            if (process.env.SESSION_ID) {
                try {
                    // Send message to owner number
                    await sock.sendMessage(config.ownerNumber, {
                        text: `*🚀 Bot Successfully Deployed on Heroku!*\n\n` +
                              `• Bot Name: ${config.botName}\n` +
                              `• Owner: ${config.ownerName}\n` +
                              `• Session ID: ${sessionId}\n` +
                              `• Deployment Time: ${new Date().toLocaleString()}\n\n` +
                              `Bot is now running 24/7 on Heroku! 🎉\n` +
                              `Use ${config.prefix}menu to see available commands.`
                    });
                    logger.info('Deployment success message sent to owner');
                } catch (error) {
                    logger.error('Failed to send deployment message:', error);
                }
            }

            // If using Heroku and session ID isn't set, log it for configuration
            if (!process.env.SESSION_ID) {
                console.log('\n=== IMPORTANT ===');
                console.log('Set this session ID in your Heroku config vars:');
                console.log(`SESSION_ID=${sessionId}`);
                console.log('==================\n');
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

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