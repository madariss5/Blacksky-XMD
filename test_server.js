const express = require('express');
const logger = require('pino')();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Log all environment variables related to Replit
logger.info('Starting server with environment:', {
    port: process.env.PORT,
    replSlug: process.env.REPL_SLUG,
    replId: process.env.REPL_ID,
    replOwner: process.env.REPL_OWNER,
    nodeEnv: process.env.NODE_ENV,
    platform: process.platform,
    nodeVersion: process.version
});

// Basic middleware
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

// Create server with explicit error handling
const server = app.listen(PORT, '0.0.0.0', () => {
    const address = server.address();
    logger.info('Server started successfully:', {
        address: address.address,
        port: address.port,
        family: address.family
    });
});

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
