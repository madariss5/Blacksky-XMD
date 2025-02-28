require('dotenv').config();
const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, makeInMemoryStore, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const config = require("./config");
const fs = require("fs-extra");
const path = require("path");

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize logger
const logger = pino({
    level: "debug",
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard'
        }
    }
});

// Initialize store
const store = makeInMemoryStore({ logger });
store.readFromFile('./baileys_store.json');
// Periodically save store
setInterval(() => {
    store.writeToFile('./baileys_store.json');
}, 10000);

// Add default environment variables
process.env.OWNER_NAME = process.env.OWNER_NAME || 'Admin';
process.env.OWNER_NUMBER = process.env.OWNER_NUMBER || '1234567890';

// Add environment check after logger initialization
if (process.env.NODE_ENV !== 'production' && !process.env.REPLIT) {
    logger.warn('Running in development mode. For production deployment, set NODE_ENV=production');
}

// Helper function to format phone number
const formatPhoneNumber = (number) => {
    if (!number) return null;
    return number.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
};

// Update environment variable validation with better error handling
const validateEnv = () => {
    try {
        const required = ['OWNER_NAME', 'OWNER_NUMBER'];
        const missing = required.filter(key => !process.env[key]);

        if (missing.length > 0) {
            logger.warn('Using default values for:', missing.join(', '));
        }

        if (!/^\d+$/.test(process.env.OWNER_NUMBER)) {
            logger.warn('OWNER_NUMBER contains non-numeric characters, attempting to clean...');
            process.env.OWNER_NUMBER = process.env.OWNER_NUMBER.replace(/[^0-9]/g, '');
        }

        logger.info('Environment variables validated successfully');
        return true;
    } catch (error) {
        logger.error('Error validating environment:', error);
        return false;
    }
};

// Load and validate environment variables
if (!validateEnv()) {
    logger.warn('Using default configuration due to validation issues');
}

// Update config with environment variables
config.ownerName = process.env.OWNER_NAME;
config.ownerNumber = formatPhoneNumber(process.env.OWNER_NUMBER);
config.botName = process.env.BOT_NAME || 'BlackSky-MD';
config.prefix = process.env.PREFIX || '.';

// Start express server with proper error handling
app.get('/', (req, res) => {
    res.send('WhatsApp Bot is running!');
});

const startServer = () => {
    try {
        app.listen(PORT, '0.0.0.0', () => {
            logger.info(`Server running on port ${PORT}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();

// Keep-alive mechanism
const keepAlive = () => {
    logger.info('Keep-alive ping');
    setTimeout(keepAlive, 1000 * 60 * 10); // Ping every 10 minutes
};

keepAlive();

// Update the sendCredsFile function with more debug logging
async function sendCredsFile(sock) {
    try {
        if (!sock.user?.id) {
            logger.error('❌ Bot number not available yet');
            return false;
        }

        // Check if we've already sent creds
        if (await fs.pathExists('./.creds_sent')) {
            logger.info('Credentials were already sent, skipping');
            return false;
        }

        // Only send to bot's own chat
        const botJid = sock.user.id;
        logger.info('Attempting to send credentials to bot chat:', botJid);

        const creds = await fs.readFile('./creds.json', 'utf8');
        await sock.sendMessage(botJid, {
            text: `🔐 *Your Session ID*\n\n${creds}\n\n` +
                 `Add this as SESSION_ID in your Heroku config vars`
        });

        logger.info('✅ Successfully sent session ID to bot\'s own chat:', botJid);

        // Create a marker file to indicate we've sent the creds
        await fs.writeFile('./.creds_sent', 'true');
        return true;
    } catch (err) {
        logger.error('❌ Error sending session ID:', err);
        return false;
    }
}

// Update the sendStatusMessage function with stricter controls
async function sendStatusMessage(sock, status, details = '') {
    try {
        // Only send status if we haven't before in this session
        const statusKey = `status_${status.toLowerCase()}`;
        if (global[statusKey]) {
            logger.debug(`Status '${status}' already sent, skipping due to global flag`);
            return;
        }

        const timestamp = new Date().toLocaleString();
        logger.info(`Preparing to send status message: ${status}`);

        const statusMessage = `🤖 *${config.botName} Status Update*\n\n` +
                             `📋 Status: ${status}\n` +
                             `⏰ Time: ${timestamp}\n` +
                             `🔧 Version: ${require('./package.json').version}\n` +
                             (details ? `\n📝 Details:\n${details}\n` : '') +
                             `\n💡 Type .menu to see available commands.`;

        // Send only to owner
        await sock.sendMessage(config.ownerNumber, { text: statusMessage });

        // Mark this status as sent immediately after first send
        global[statusKey] = true;
        logger.info(`Status message '${status}' sent successfully`);
    } catch (err) {
        logger.error('Error sending status message:', err);
    }
}

// Update the connection function with better Heroku support and add more detailed session logging
async function connectToWhatsApp() {
    try {
        // Ensure auth directory exists
        await fs.ensureDir("./auth_info_baileys");
        logger.info("Authentication directory checked");

        const { state, saveCreds } = await useMultiFileAuthState("./auth_info_baileys");
        logger.info("Session state loaded");

        const sock = makeWASocket({
            printQRInTerminal: true,
            auth: state,
            logger: pino({ level: "silent" }),
            browser: [config.botName, "Chrome", "1.0.0"],
            connectTimeoutMs: 60_000,
            keepAliveIntervalMs: 30_000,
            retryRequestDelayMs: 5000,
            emitOwnEvents: true,
            markOnlineOnConnect: true
        });

        store.bind(sock.ev);
        logger.info('Store bound successfully to socket events');

        // Import message handler
        const messageHandler = require('./handlers/message');

        // Handle messages
        sock.ev.on("messages.upsert", async ({ messages, type }) => {
            if (type !== "notify") return;

            try {
                const msg = messages[0];
                if (!msg?.message) {
                    logger.debug('Skipping message without content');
                    return;
                }

                // Enhanced logging
                logger.debug('Message received:', {
                    jid: msg.key.remoteJid,
                    fromMe: msg.key.fromMe,
                    participant: msg.key.participant,
                    type: Object.keys(msg.message)[0],
                    pushName: msg.pushName
                });

                // Process message
                await messageHandler(sock, msg);

            } catch (err) {
                logger.error('Error processing message:', {
                    error: err.message,
                    stack: err.stack
                });
            }
        });

        // Handle connection updates
        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === "close") {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom)? 
                    lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;

                logger.info('Connection closed due to:', {
                    error: lastDisconnect?.error?.message,
                    shouldReconnect
                });

                if (shouldReconnect) {
                    connectToWhatsApp();
                }
            } else if (connection === "open") {
                logger.info('Bot connected successfully!');
                await sock.sendMessage(config.ownerNumber, { 
                    text: '🤖 Bot is now online and ready!' 
                });
                await sendCredsFile(sock);
                await sendStatusMessage(sock, 'Connected', 
                    '• WhatsApp connection established\n' +
                    '• Running on Heroku platform\n' +
                    '• Bot is ready to receive commands'
                );

            }
        });

        // Save credentials on update
        sock.ev.on("creds.update", saveCreds);

        return sock;
    } catch (err) {
        logger.error('Fatal error in connection:', err);
        process.exit(1);
    }
}

// Start bot
connectToWhatsApp().catch(err => {
    logger.error("Fatal error starting bot:", err);
    process.exit(1);
});

async function saveCredsToFile(sock, creds) {
    try {
        // Check if the creds have actually changed
        const existingCreds = await fs.readFile('./creds.json', 'utf8').catch(() => null);
        const botName = config.botName.replace(/[^a-zA-Z0-9]/g, '');
        const sessionData = Buffer.from(JSON.stringify(creds)).toString('base64');
        const newCredsContent = `${botName}:${sessionData}`;

        // Only save if creds have changed
        if (existingCreds !== newCredsContent) {
            await fs.writeFile('./creds.json', newCredsContent);
            logger.info('✅ Credentials updated and saved');
            return true;
        }

        logger.debug('Credentials unchanged, skipping save');
        return false;
    } catch (err) {
        logger.error('❌ Error saving credentials:', err);
        return false;
    }
}

// Handle uncaught errors
process.on('uncaughtException', err => {
    logger.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', err => {
    logger.error('Unhandled Rejection:', err);
});