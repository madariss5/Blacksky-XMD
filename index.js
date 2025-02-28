require('dotenv').config();
const express = require('express');
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    makeInMemoryStore, 
    DisconnectReason,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const config = require("./config");
const fs = require("fs-extra");
const path = require("path");

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced logging configuration
const logger = pino({
    level: "debug",
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
        }
    }
});

// Initialize store with better error handling
const store = makeInMemoryStore({ logger });
try {
    store.readFromFile('./baileys_store.json');
} catch (error) {
    logger.warn('Could not read store file:', error.message);
    logger.info('Creating new store file');
}

// Save store more frequently and handle errors
setInterval(() => {
    try {
        store.writeToFile('./baileys_store.json');
    } catch (error) {
        logger.error('Failed to write store:', error.message);
    }
}, 10000);

// Improved environment variable handling
process.env.OWNER_NAME = process.env.OWNER_NAME || 'BLACKSKY';
process.env.OWNER_NUMBER = process.env.OWNER_NUMBER || '254710772666';

// Enhanced environment validation
const validateEnv = () => {
    try {
        const required = ['OWNER_NAME', 'OWNER_NUMBER'];
        const missing = required.filter(key => !process.env[key]);

        if (missing.length > 0) {
            logger.warn('Using default values for:', missing.join(', '));
        }

        if (!/^\d+$/.test(process.env.OWNER_NUMBER)) {
            logger.warn('OWNER_NUMBER contains non-numeric characters, cleaning...');
            process.env.OWNER_NUMBER = process.env.OWNER_NUMBER.replace(/[^0-9]/g, '');
        }

        return true;
    } catch (error) {
        logger.error('Error validating environment:', error);
        return false;
    }
};

// Load and validate environment
if (!validateEnv()) {
    logger.warn('Using default configuration due to validation issues');
}

// Update config with validated environment variables
config.ownerName = process.env.OWNER_NAME;
config.ownerNumber = process.env.OWNER_NUMBER + '@s.whatsapp.net';
config.botName = process.env.BOT_NAME || '𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻';

// Express server with better error handling
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

startServer();

// Keep-alive mechanism
const keepAlive = () => {
    logger.info('Keep-alive ping');
    setTimeout(keepAlive, 1000 * 60 * 10);
};

keepAlive();

// Improved WhatsApp connection function
async function connectToWhatsApp() {
    try {
        // Ensure auth directory exists with proper permissions
        const authDir = "./auth_info_baileys";
        await fs.ensureDir(authDir);
        logger.info("Authentication directory checked");

        // Get latest version of Baileys
        const { version } = await fetchLatestBaileysVersion();
        logger.info(`Using Baileys version ${version}`);

        // Load auth state with better error handling
        const { state, saveCreds } = await useMultiFileAuthState(authDir);
        logger.info("Session state loaded");

        // Create socket with enhanced configuration
        const sock = makeWASocket({
            version,
            printQRInTerminal: true,
            auth: state,
            logger: pino({ level: "silent" }),
            browser: [config.botName, "Safari", "1.0.0"],
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 15000,
            retryRequestDelayMs: 2000,
            qrTimeout: 40000,
            defaultQueryTimeoutMs: 60000,
            emitOwnEvents: true,
            markOnlineOnConnect: true,
            syncFullHistory: false
        });

        store.bind(sock.ev);
        logger.info('Store bound to socket events');

        // Handle connection updates with improved error handling
        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                logger.info('New QR code generated');
            }

            if (connection === "close") {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom) ? 
                    lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;

                logger.info('Connection closed due to:', {
                    error: lastDisconnect?.error?.message || 'Unknown error',
                    statusCode: lastDisconnect?.error?.output?.statusCode,
                    shouldReconnect
                });

                if (shouldReconnect) {
                    logger.info('Reconnecting...');
                    setTimeout(connectToWhatsApp, 3000);
                } else {
                    logger.error('Connection closed permanently');
                    // Clear auth if logged out
                    try {
                        await fs.remove(authDir);
                        logger.info('Auth files cleared');
                    } catch (err) {
                        logger.error('Failed to clear auth files:', err);
                    }
                }
            } else if (connection === "open") {
                logger.info('Connected successfully!');
                const botJid = sock.user.id;
                logger.info('Bot number:', botJid);

                try {
                    await sock.sendMessage(config.ownerNumber, { 
                        text: '🤖 Bot is now online and ready!' 
                    });
                } catch (err) {
                    logger.error('Failed to send ready message:', err);
                }
            }
        });

        // Save credentials with error handling
        sock.ev.on("creds.update", async () => {
            try {
                await saveCreds();
            } catch (err) {
                logger.error('Failed to save credentials:', err);
            }
        });

        return sock;
    } catch (err) {
        logger.error('Fatal error in connection:', err);
        // Attempt reconnection after delay
        setTimeout(connectToWhatsApp, 5000);
    }
}

// Start bot with reconnection handling
(async () => {
    while (true) {
        try {
            await connectToWhatsApp();
            break;
        } catch (err) {
            logger.error('Failed to start bot:', err);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
})();

// Handle uncaught errors
process.on('uncaughtException', err => {
    logger.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', err => {
    logger.error('Unhandled Rejection:', err);
});

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

const formatPhoneNumber = (number) => {
    if (!number) return null;
    return number.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
};

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