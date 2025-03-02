const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");
const pino = require('pino');
const logger = require('./utils/logger');
const express = require('express');
const messageHandler = require('./handler');
const basicCommands = require('./commands/basic');
const aiCommands = require('./commands/ai');
const mediaCommands = require('./commands/media');

async function startBot() {
    try {
        logger.info('Starting WhatsApp bot...');
        const { state, saveCreds } = await useMultiFileAuthState('auth_info');

        const sock = makeWASocket({
            logger: pino({ level: 'silent' }),
            printQRInTerminal: true,
            auth: state,
            browser: ['𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻', 'Chrome', '112.0.5615.49']
        });

        // Register all commands with logging
        const commandModules = {
            ...basicCommands,
            ...aiCommands,
            ...mediaCommands
        };

        logger.info('Loading command modules:', {
            moduleNames: ['basic', 'ai', 'media'],
            totalCommands: Object.keys(commandModules).length
        });

        Object.entries(commandModules).forEach(([name, handler]) => {
            messageHandler.register(name, handler);
            logger.info(`Registered command: ${name}`);
        });

        // Log total registered commands
        logger.info('Command registration complete:', {
            totalCommands: messageHandler.getCommands().length,
            availableCommands: messageHandler.getCommands()
        });

        // Handle messages
        sock.ev.on('messages.upsert', async ({ messages }) => {
            try {
                const msg = messages[0];
                if (!msg || !msg.message) return;
                await messageHandler(sock, msg);
            } catch (error) {
                logger.error('Error in message handler:', error);
            }
        });

        // Handle connection events
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

// Express server setup with debug endpoints
const app = express();
const PORT = process.env.PORT || 5000;

// Debug endpoint to check registered commands
app.get('/debug/commands', (req, res) => {
    const commands = messageHandler.getCommands();
    res.json({
        totalCommands: commands.length,
        registeredCommands: commands,
        status: 'WhatsApp Bot Server Running'
    });
});

app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on port ${PORT}`);
    startBot();
});