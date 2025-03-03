const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");
const pino = require('pino')({ 
    level: 'silent',
    transport: {
        target: 'pino-pretty',
        options: {
            translateTime: false,
            ignore: 'pid,hostname,time',
            messageFormat: '{msg}'
        }
    }
}); 
const logger = require('./utils/logger');
const { getUptime } = require('./utils');
const fs = require('fs-extra');
const path = require('path');
const config = require('./config');
const { compressCredsFile, getSessionData } = require('./utils/creds');
const { loadEnvironment } = require('./utils/env');

loadEnvironment();

// Ensure required directories exist
const dirs = ['auth_info', 'auth_info_baileys', 'auth_info/sessions', 'auth_info/creds', 'temp', 'database'];
for (const dir of dirs) {
    try {
        fs.ensureDirSync(dir);
    } catch (error) {
        logger.error(`Failed to create directory ${dir}: ${error.message}`);
        process.exit(1);
    }
}

// Command handlers
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Initialize command map
const commands = new Map();

// Load commands silently without logging
for (const file of commandFiles) {
    try {
        const filePath = path.join(commandsPath, file);
        delete require.cache[require.resolve(filePath)];
        const command = require(filePath);

        if (typeof command === 'object') {
            Object.entries(command).forEach(([cmdName, handler]) => {
                if (!commands.has(cmdName)) {
                    if (config.commands[cmdName]) {
                        commands.set(cmdName, handler);
                    }
                }
            });
        }
    } catch (error) {
        // Silently handle errors
    }
}

let credentialsSent = false;
let deploymentMessageSent = false;

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

            await sock.sendMessage(config.ownerNumber + '@s.whatsapp.net', message);
            deploymentMessageSent = true;
        }
    } catch (error) {
        logger.error(`Failed to send deployment message: ${error.message}`);
    }
}

async function startBot() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info');

        const sessionData = await getSessionData();
        if (sessionData.success) {
            config.session.id = sessionData.sessionId;
        }

        const sock = makeWASocket({
            logger: pino,
            printQRInTerminal: true,
            auth: state,
            browser: ['𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻', 'Chrome', '112.0.5615.49']
        });

        sock.ev.on('messages.upsert', async ({ messages }) => {
            try {
                const msg = messages[0];
                if (!msg?.message) return;

                const messageText = msg.message?.conversation || 
                                  msg.message?.extendedTextMessage?.text || 
                                  msg.message?.imageMessage?.caption || 
                                  msg.message?.videoMessage?.caption || '';

                if (messageText.startsWith(config.prefix)) {
                    const args = messageText.slice(config.prefix.length).trim().split(/\s+/);
                    const command = args.shift().toLowerCase();

                    if (commands.has(command)) {
                        try {
                            await commands.get(command)(sock, msg, args);
                        } catch (error) {
                            logger.error(`Command execution failed: ${error.message}`);
                            await sock.sendMessage(msg.key.remoteJid, {
                                text: '❌ Error executing command'
                            });
                        }
                    }
                }
            } catch (error) {
                logger.error(`Message handling failed: ${error.message}`);
            }
        });

        sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                if (shouldReconnect) {
                    credentialsSent = false;
                    deploymentMessageSent = false;
                    startBot();
                }
            } else if (connection === 'open') {
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
                    } catch (error) {
                        logger.error(`Failed to send credentials: ${error.message}`);
                    }
                }
                await sendDeploymentMessage(sock);
            }
        });

        sock.ev.on('creds.update', async () => {
            await saveCreds();
            await compressCredsFile();

            const newSessionData = await getSessionData();
            if (newSessionData.success) {
                config.session.id = newSessionData.sessionId;
            }
        });

    } catch (error) {
        logger.error(`Bot startup failed: ${error.message}`);
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
        commands: Array.from(commands.keys()),
        environment: process.env.NODE_ENV || 'development',
        platform: process.env.NODE_ENV === 'production' && process.env.DYNO ? 'Heroku' : 'Local'
    });
});

app.listen(PORT, '0.0.0.0', () => {
    startBot();
});