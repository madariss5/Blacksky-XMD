const express = require('express');
const cors = require('cors');
const logger = require('pino')();
const { default: makeWASocket, useMultiFileAuthState, Browsers, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const path = require('path');
const SessionManager = require('./utils/session');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;
const sessionManager = new SessionManager(path.join(__dirname, 'sessions'));

// Basic middleware
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

// Request logging
app.use((req, res, next) => {
    logger.info({
        method: req.method,
        path: req.path,
        ip: req.ip,
        headers: req.headers
    });
    next();
});

// Initialize WhatsApp connection
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: Browsers.ubuntu('Chrome'),
        logger
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)? 
                lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut : true;

            logger.info('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);

            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            logger.info('WhatsApp connection opened');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    return sock;
}

// Start WhatsApp connection
connectToWhatsApp()
    .then(() => logger.info('WhatsApp initialization started'))
    .catch(err => logger.error('WhatsApp initialization failed:', err));

// Basic route
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

// Create server with proper binding and logging
const server = app.listen(PORT, '0.0.0.0', () => {
    const address = server.address();
    logger.info('Server started with details:', {
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

// Server error handling
server.on('error', (error) => {
    logger.error('Server error:', error);
    if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
        process.exit(1);
    }
});

// Set keepalive timeout
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