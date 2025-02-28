require('dotenv').config();
const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, makeInMemoryStore, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const config = require("./config");
const fs = require("fs-extra");
const path = require("path");

// Initialize express app for Heroku
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize logger
const logger = pino({
    level: process.env.LOG_LEVEL || "info",
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
        }
    }
});

// Start express server
app.get('/', (req, res) => {
    res.send('Bot is running!');
});

app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server is running on port ${PORT}`);
});

// Add environment check after logger initialization
if (process.env.NODE_ENV !== 'production' && !process.env.REPLIT) {
    logger.warn('Running in development mode. For production deployment, set NODE_ENV=production');
}

// Helper function to format phone number
const formatPhoneNumber = (number) => {
    if (!number) return null;
    const cleanNumber = number.replace(/\D/g, '');
    return `${cleanNumber}@s.whatsapp.net`;
};

// Add environment variable validation with better error handling
const validateEnv = () => {
    const required = ['OWNER_NAME', 'OWNER_NUMBER'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        logger.error('Missing required environment variables:', missing.join(', '));
        logger.error('Please set these variables in your Heroku config vars');
        process.exit(1);
    }

    if (!/^\d+$/.test(process.env.OWNER_NUMBER)) {
        logger.error('OWNER_NUMBER must contain only numbers (country code + number)');
        logger.error('Example: 1234567890 (no special characters)');
        process.exit(1);
    }

    logger.info('Environment variables validated successfully');
    return true;
};

// Load and validate environment variables
validateEnv();

// Update config with environment variables
config.ownerName = process.env.OWNER_NAME;
config.ownerNumber = formatPhoneNumber(process.env.OWNER_NUMBER);
config.botName = process.env.BOT_NAME || 'BlackSky-MD';
config.prefix = process.env.PREFIX || '!';

// Update store initialization with proper error handling
const store = makeInMemoryStore({ 
    logger: pino({ level: "debug" }) 
});

// Initialize store data
store.data = {
    users: {},
    chats: [],
    settings: {
        maintenance: false,
        maxWarnings: 3,
        botMode: 'public'
    }
};


// Load command modules with error handling
const commandModules = {};
try {
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const moduleName = path.parse(file).name;
        try {
            const module = require(path.join(commandsPath, file));
            commandModules[moduleName] = module;
            logger.info(`Loaded command module: ${moduleName}`);
        } catch (err) {
            logger.error(`Failed to load command module ${file}:`, err);
        }
    }

    if (Object.keys(commandModules).length === 0) {
        throw new Error('No command modules were loaded successfully');
    }
} catch (err) {
    logger.error('Fatal error loading command modules:', err);
    process.exit(1);
}

// Keep-alive mechanism for Heroku
const keepAlive = () => {
    logger.info('Keep-alive ping');
    setTimeout(keepAlive, 1000 * 60 * 10); // Ping every 10 minutes
};

// Start keep-alive for Heroku
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
                             `\n💡 Type ${config.prefix}menu to see available commands.`;

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
        logger.info("Session state loaded:", {
            registered: state.creds.registered,
            platform: process.env.NODE_ENV,
            sessionPath: "./auth_info_baileys"
        });

        // Create socket connection with Heroku-optimized settings
        const sock = makeWASocket({
            printQRInTerminal: true,
            auth: state,
            logger: pino({ level: process.env.SOCKET_LOG_LEVEL || "silent" }),
            browser: [config.botName, "Safari", "1.0.0"],
            connectTimeoutMs: 60_000,
            keepAliveIntervalMs: 30_000,
            retryRequestDelayMs: 5000,
            shouldIgnoreJid: jid => jid.endsWith('@notify')
        });

        // Bind store to socket events
        store.bind(sock.ev);
        logger.info('Store bound successfully to socket events');

        // Import message handler
        const messageHandler = require('./handlers/message');

        // Handle messages with better error handling
        sock.ev.on("messages.upsert", async ({ messages, type }) => {
            if (type !== "notify") return;

            try {
                const msg = messages[0];
                if (!msg?.message) {
                    logger.debug('Skipping message without content');
                    return;
                }

                // Debug log incoming message
                logger.info('Received message:', {
                    jid: msg.key.remoteJid,
                    fromMe: msg.key.fromMe,
                    participant: msg.key.participant,
                    type: Object.keys(msg.message)[0]
                });

                // Process message through handler
                await messageHandler(sock, msg);

            } catch (err) {
                logger.error('Error processing message:', err);
            }
        });

        // Enhanced connection handling for Heroku
        sock.ev.on("connection.update", async (update) => {
            try {
                const { connection, lastDisconnect, qr } = update;

                if(qr) {
                    logger.info('QR Code available for scanning');
                }

                if(connection === "close") {
                    let error = lastDisconnect?.error;
                    let statusCode = error?.output?.statusCode;
                    let shouldReconnect = true;

                    // Handle specific disconnect reasons
                    if (statusCode === DisconnectReason.loggedOut) {
                        shouldReconnect = false;
                        logger.error('Session logged out, cleaning up...');
                        await fs.remove("./auth_info_baileys");
                        process.exit(1);
                    } else if (statusCode === DisconnectReason.badSession) {
                        logger.error('Bad session, removing auth files...');
                        await fs.remove("./auth_info_baileys");
                        shouldReconnect = true;
                    } else if (statusCode === DisconnectReason.connectionClosed) {
                        logger.info('Connection closed, reconnecting...');
                        shouldReconnect = true;
                    } else if (statusCode === DisconnectReason.connectionLost) {
                        logger.info('Connection lost, reconnecting...');
                        shouldReconnect = true;
                    } else if (statusCode === DisconnectReason.connectionReplaced) {
                        logger.warn('Connection replaced, shutting down...');
                        shouldReconnect = false;
                    } else if (statusCode === DisconnectReason.timedOut) {
                        logger.info('Connection timeout, reconnecting...');
                        shouldReconnect = true;
                    } else {
                        logger.warn('Unknown disconnect reason:', error?.message);
                        shouldReconnect = true;
                    }

                    if(shouldReconnect) {
                        logger.info('Attempting to reconnect...');
                        setTimeout(() => connectToWhatsApp(), 5000);
                    } else {
                        logger.error('Connection closed permanently');
                        process.exit(1);
                    }
                } else if(connection === "open") {
                    logger.info('Bot connected successfully!');

                    // Only send status message once
                    await sendStatusMessage(sock, 'Connected', 
                        '• WhatsApp connection established\n' +
                        '• Running on Heroku platform\n' +
                        '• Bot is ready to receive commands'
                    );

                    // Only attempt to send creds if we haven't before
                    await sendCredsFile(sock);
                }
            } catch (err) {
                logger.error('Error in connection update handler:', err);
            }
        });

        // Save credentials whenever updated
        sock.ev.on("creds.update", async (creds) => {
            try {
                await saveCreds(creds);
                await saveCredsToFile(sock, creds);
            } catch (err) {
                logger.error('Error saving credentials:', err);
            }
        });


        return sock;
    } catch (err) {
        logger.error('Fatal error in connection:', err);
        process.exit(1);
    }
}

// Start the bot with error handling
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