const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");
const pino = require('pino');
const logger = require('./utils/logger');
const config = require('./config');
const express = require('express');

async function startBot() {
    try {
        logger.info('Starting WhatsApp bot...');
        const { state, saveCreds } = await useMultiFileAuthState('auth_info');

        const sock = makeWASocket({
            logger: pino({ level: 'silent' }), // Reduce noise in logs
            printQRInTerminal: true,
            auth: state,
            browser: ['𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻', 'Chrome', '112.0.5615.49']
        });

        // Direct message handling
        sock.ev.on('messages.upsert', async ({ messages }) => {
            try {
                const msg = messages[0];

                // Early returns for invalid messages
                if (!msg || !msg.message) return;

                // Get the actual message content
                const messageType = Object.keys(msg.message)[0];
                let messageContent = '';

                // Extract message based on type
                switch (messageType) {
                    case 'conversation':
                        messageContent = msg.message.conversation;
                        break;
                    case 'extendedTextMessage':
                        messageContent = msg.message.extendedTextMessage.text;
                        break;
                    case 'imageMessage':
                        messageContent = msg.message.imageMessage.caption;
                        break;
                    case 'videoMessage':
                        messageContent = msg.message.videoMessage.caption;
                        break;
                    default:
                        return; // Unsupported message type
                }

                // Debug log
                logger.info('Message received:', {
                    type: messageType,
                    content: messageContent,
                    from: msg.key.remoteJid
                });

                // Check for command prefix
                const prefix = config.prefix || '.';
                if (!messageContent.startsWith(prefix)) return;

                // Parse command
                const args = messageContent.slice(prefix.length).trim().split(/\s+/);
                const command = args.shift()?.toLowerCase();

                if (!command) return;

                // Log command processing
                logger.info('Processing command:', { command, args });

                // Send acknowledgment
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `📝 Processing command: ${command}`
                });

                // Process command
                const handler = require('./handler');
                await handler(sock, msg, { messages }, {});

            } catch (error) {
                logger.error('Error in message handler:', error);
            }
        });

        // Connection handling
        sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                if (shouldReconnect) {
                    logger.info('Reconnecting...');
                    startBot();
                }
            } else if (connection === 'open') {
                logger.info('Bot connected successfully!');
            }
        });

        sock.ev.on('creds.update', saveCreds);

    } catch (error) {
        logger.error('Error in bot startup:', error);
        process.exit(1);
    }
}

// Express server setup
const app = express();
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.json({ status: 'WhatsApp Bot Server Running' });
});

app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on port ${PORT}`);
    startBot();
});