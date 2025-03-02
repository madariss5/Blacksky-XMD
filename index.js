const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");
const pino = require('pino');
const logger = require('./utils/logger');
const { getUptime } = require('./utils');
const fs = require('fs-extra');
const path = require('path');

// Command handlers
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Initialize command map
const commands = new Map();

// Load commands
logger.info('Loading commands...');
for (const file of commandFiles) {
    try {
        const command = require(path.join(commandsPath, file));
        if (typeof command === 'object') {
            Object.entries(command).forEach(([cmdName, handler]) => {
                // Skip menu command explicitly
                if (cmdName !== 'menu' && cmdName !== 'help') {
                    commands.set(cmdName, handler);
                    logger.info(`Loaded command: ${cmdName} from ${file}`);
                }
            });
        }
    } catch (error) {
        logger.error(`Error loading commands from ${file}:`, error);
    }
}

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

        // Handle messages
        sock.ev.on('messages.upsert', async ({ messages }) => {
            try {
                const msg = messages[0];
                if (!msg?.message) return;

                const messageText = msg.message?.conversation || 
                              msg.message?.extendedTextMessage?.text || 
                              msg.message?.imageMessage?.caption || 
                              msg.message?.videoMessage?.caption || '';

                // Process command if message starts with prefix
                if (messageText.startsWith('.')) {
                    const args = messageText.slice(1).trim().split(/\s+/);
                    const command = args.shift().toLowerCase();

                    if (commands.has(command)) {
                        try {
                            await commands.get(command)(sock, msg, args);
                        } catch (error) {
                            logger.error(`Error executing command ${command}:`, error);
                            await sock.sendMessage(msg.key.remoteJid, {
                                text: '❌ Error executing command'
                            });
                        }
                    }
                }
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

// Express server for keeping the bot alive
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.json({
        status: 'Bot Running',
        uptime: getUptime(),
        commands: Array.from(commands.keys())
    });
});

app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on port ${PORT}`);
    startBot();
});