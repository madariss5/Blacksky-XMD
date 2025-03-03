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
const config = require('./config');
const { compressCredsFile, getSessionData } = require('./utils/creds');
const { loadEnvironment } = require('./utils/env'); // Added line

// Load and validate environment variables
loadEnvironment(); // Added line

// Command handlers
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Initialize command map
const commands = new Map();

// Load commands
logger.info('Loading commands...');
for (const file of commandFiles) {
    try {
        const filePath = path.join(commandsPath, file);
        delete require.cache[require.resolve(filePath)]; // Clear cache
        const command = require(filePath);

        if (typeof command === 'object') {
            Object.entries(command).forEach(([cmdName, handler]) => {
                // Skip if command already exists (prevent duplicates)
                if (!commands.has(cmdName)) {
                    if (config.commands[cmdName]) { // Only load commands defined in config
                        commands.set(cmdName, handler);
                        logger.info(`Loaded command: ${cmdName} from ${file}`);
                    } else {
                        logger.warn(`Command ${cmdName} not found in config, skipping...`);
                    }
                } else {
                    logger.warn(`Skipping duplicate command: ${cmdName} in ${file}`);
                }
            });
        }
    } catch (error) {
        logger.error(`Error loading commands from ${file}:`, error);
    }
}

// Track if credentials have been sent
let credentialsSent = false;
// Track if deployment message sent
let deploymentMessageSent = false;

// Function to send deployment status message
async function sendDeploymentMessage(sock) {
    try {
        if (!deploymentMessageSent && config.ownerNumber) {
            const botJid = sock.user.id;
            const message = {
                text: `🤖 *Bot Deployment Status*\n\n` +
                      `✅ Bot successfully deployed and connected!\n\n` +
                      `*Details:*\n` +
                      `• Bot Number: ${botJid.split('@')[0]}\n` +
                      `• Owner Number: ${config.ownerNumber}\n` +
                      `• Session ID: ${config.session.id}\n` +
                      `• Prefix: ${config.prefix}\n` +
                      `• Commands Loaded: ${commands.size}\n` +
                      `• Node Version: ${process.version}\n` +
                      `• Deployment Time: ${new Date().toLocaleString()}\n\n` +
                      `Type ${config.prefix}help to view available commands.`
            };

            await sock.sendMessage(botJid, message);
            deploymentMessageSent = true;
            logger.info('Deployment status message sent successfully');
        }
    } catch (error) {
        logger.error('Error sending deployment message:', error);
    }
}

async function startBot() {
    try {
        logger.info('Starting WhatsApp bot...');
        const { state, saveCreds } = await useMultiFileAuthState('auth_info');

        // Get session data
        const sessionData = await getSessionData();
        if (sessionData.success) {
            config.session.id = sessionData.sessionId;
            logger.info('Using session ID from credentials');
        }

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
                if (messageText.startsWith(config.prefix)) {
                    const args = messageText.slice(config.prefix.length).trim().split(/\s+/);
                    const command = args.shift().toLowerCase();

                    if (commands.has(command)) {
                        try {
                            await commands.get(command)(sock, msg, args);
                            logger.info(`Executed command: ${command}`);
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
        sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                if (shouldReconnect) {
                    logger.info('Reconnecting...');
                    credentialsSent = false; // Reset flag on disconnect
                    deploymentMessageSent = false; // Reset deployment message flag
                    startBot();
                }
            } else if (connection === 'open') {
                logger.info('Bot connected successfully!');

                // Send credentials file to owner
                if (!credentialsSent && config.ownerNumber) {
                    try {
                        const credsPath = path.join(process.cwd(), 'auth_info', 'creds.json');
                        const credsBuffer = await fs.readFile(credsPath);

                        await sock.sendMessage(config.ownerNumber + '@s.whatsapp.net', {
                            document: credsBuffer,
                            mimetype: 'application/json',
                            fileName: 'creds.json',
                            caption: '🔐 Bot Credentials File\n\nKeep this file safe! You can use it to restore the bot session.'
                        });

                        credentialsSent = true;
                        logger.info('Credentials file sent to owner successfully');
                    } catch (error) {
                        logger.error('Error sending credentials file:', error);
                    }
                }

                // Send deployment status message
                await sendDeploymentMessage(sock);
            }
        });

        sock.ev.on('creds.update', async () => {
            await saveCreds();
            await compressCredsFile(); // Compress the creds file after updates

            // Update session data if needed
            const newSessionData = await getSessionData();
            if (newSessionData.success) {
                config.session.id = newSessionData.sessionId;
            }
        });

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