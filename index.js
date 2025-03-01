const express = require('express');
const cors = require('cors');
const logger = require('pino')();
const { default: makeWASocket, useMultiFileAuthState, Browsers, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const path = require('path');
const SessionManager = require('./utils/session');
const utilityCommands = require('./commands/utility');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;
const sessionManager = new SessionManager(path.join(__dirname, 'sessions'));

// Basic middleware setup
app.use(cors({
    origin: [
        'https://*.replit.dev',
        'https://*.replit.app',
        'https://*.repl.co'
    ],
    credentials: true
}));
app.use(express.json());
app.set('trust proxy', true);

// Request logging middleware
app.use((req, res, next) => {
    logger.info('Incoming request:', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        headers: req.headers
    });
    next();
});

// Basic ping endpoint
app.get('/ping', (req, res) => {
    logger.info('Ping request received');
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// Initialize WhatsApp connection
async function connectToWhatsApp() {
    try {
        logger.info('Starting WhatsApp connection initialization...');

        // Initialize session manager
        await sessionManager.initialize();
        logger.info('Session manager initialized');

        // Initialize session state
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
        logger.info('Auth state loaded successfully');

        // Create WhatsApp socket connection
        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false, // We'll handle QR code display ourselves
            browser: Browsers.ubuntu('Chrome'),
            logger,
            connectTimeoutMs: 60000, // Increase timeout to 60 seconds
            markOnlineOnConnect: true // Mark the bot as online when connected
        });

        // Handle incoming messages
        sock.ev.on('messages.upsert', async ({ messages }) => {
            try {
                for (const message of messages) {
                    if (message.key.fromMe) continue; // Skip messages sent by the bot

                    const text = message.message?.conversation || 
                                message.message?.extendedTextMessage?.text || '';

                    // Log incoming message for debugging
                    logger.info('Received message:', {
                        from: message.key.remoteJid,
                        text: text,
                        messageType: message.message ? Object.keys(message.message)[0] : 'unknown'
                    });

                    // Check if message starts with command prefix
                    if (text.startsWith('!')) {
                        const [command, ...args] = text.slice(1).split(' ');
                        logger.info('Command received:', { command, args });

                        // Handle utility commands
                        if (command in utilityCommands) {
                            try {
                                await utilityCommands[command](sock, message, args);
                            } catch (error) {
                                logger.error('Error executing command:', error);
                                await sock.sendMessage(message.key.remoteJid, {
                                    text: '❌ Error executing command: ' + error.message
                                });
                            }
                        } else {
                            // Unknown command handler
                            await sock.sendMessage(message.key.remoteJid, {
                                text: '❌ Unknown command. Use !menu to see available commands.'
                            });
                        }
                    }
                }
            } catch (error) {
                logger.error('Error processing message:', error);
            }
        });

        // Connection update handling
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            logger.info('Connection update received:', { 
                connection, 
                disconnectReason: lastDisconnect?.error?.output?.statusCode,
                hasQR: !!qr,
                fullUpdate: update // Log the full update object for debugging
            });

            if (qr) {
                // Display QR code in the terminal
                qrcode.generate(qr, { small: true });
                logger.info('New QR code generated. Please scan with WhatsApp.');
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom)? 
                    lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut : true;

                logger.info('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);

                if (shouldReconnect) {
                    connectToWhatsApp();
                }
            } else if (connection === 'open') {
                logger.info('WhatsApp connection opened successfully');

                // Send startup message
                const startupMessage = '🤖 *WhatsApp Bot is Online!*\n\n' +
                                     'Send !menu to see available commands\n\n' +
                                     'Quick commands:\n' +
                                     '!stats - Show bot statistics\n' +
                                     '!help - Show help menu\n' +
                                     '!report <issue> - Report an issue';

                // If OWNER_NUMBER is set, send startup notification
                if (process.env.OWNER_NUMBER) {
                    try {
                        await sock.sendMessage(`${process.env.OWNER_NUMBER}@s.whatsapp.net`, {
                            text: startupMessage
                        });
                        logger.info('Startup message sent to owner');
                    } catch (error) {
                        logger.error('Failed to send startup message:', error);
                    }
                }
            }
        });

        // Credentials update handling
        sock.ev.on('creds.update', saveCreds);
        logger.info('Credentials update handler registered');

        return sock;
    } catch (error) {
        logger.error('Error in WhatsApp connection setup:', error);
        throw error;
    }
}

// Start WhatsApp connection
connectToWhatsApp()
    .then(() => logger.info('WhatsApp initialization started'))
    .catch(err => {
        logger.error('WhatsApp initialization failed:', err);
        process.exit(1); // Exit if WhatsApp initialization fails
    });

// Basic routes
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'WhatsApp Bot',
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    try {
        const status = {
            status: 'healthy',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            port: PORT
        };
        logger.info('Health check succeeded:', status);
        res.json(status);
    } catch (error) {
        logger.error('Health check failed:', error);
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// Create server with explicit error handling
const server = app.listen(PORT, '0.0.0.0', () => {
    const address = server.address();
    logger.info('Server started successfully:', {
        address: address.address,
        port: address.port,
        family: address.family,
        environment: {
            port: process.env.PORT,
            replSlug: process.env.REPL_SLUG,
            replId: process.env.REPL_ID,
            replOwner: process.env.REPL_OWNER,
            nodeEnv: process.env.NODE_ENV
        }
    });
});

// Error handling
server.on('error', (error) => {
    logger.error('Server error:', error);
    if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
        process.exit(1);
    }
});

// Keepalive configuration
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Global error handling
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    logger.error('Unhandled Rejection:', error);
});