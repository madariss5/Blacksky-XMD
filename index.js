const express = require('express');
const cors = require('cors');
const logger = require('pino')();
const whatsapp = require('./server/whatsapp');
const messageHandler = require('./handlers/message');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(cors());
app.use(express.json());
app.set('trust proxy', 1);

// Log Replit environment details
logger.info('Replit environment:', {
    port: process.env.PORT,
    replSlug: process.env.REPL_SLUG,
    replId: process.env.REPL_ID,
    replOwner: process.env.REPL_OWNER,
    nodeEnv: process.env.NODE_ENV
});

// Request logging
app.use((req, res, next) => {
    logger.info({
        method: req.method,
        path: req.path,
        ip: req.ip,
        forwarded: req.headers['x-forwarded-for']
    });
    next();
});

// Basic route
app.get('/', (req, res) => {
    res.send('WhatsApp Bot is running!');
});

// Health check endpoint
app.get('/health', (req, res) => {
    try {
        const status = {
            status: 'healthy',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            whatsappConnected: whatsapp.isSocketConnected(),
            port: PORT
        };
        logger.info('Health check succeeded:', status);
        res.json(status);
    } catch (error) {
        logger.error('Health check failed:', error);
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// Create server instance separately for logging
const server = app.listen(PORT, '0.0.0.0', async () => {
    try {
        const address = server.address();
        logger.info('Server started with details:', {
            address: address.address,
            port: address.port,
            family: address.family
        });

        logger.info('Server listening on port', PORT);
        await whatsapp.initialize();
        logger.info('WhatsApp connection initialized');
    } catch (error) {
        logger.error('Startup error:', error);
    }
});

// Server error handling
server.on('error', (error) => {
    logger.error('Server error:', {
        code: error.code,
        message: error.message,
        stack: error.stack
    });
    if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
        process.exit(1);
    }
});

// Global error handling
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    logger.error('Unhandled Rejection:', error);
});