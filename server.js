const http = require('http');
const logger = require('pino')();
const express = require('express');
const whatsapp = require('./server/whatsapp');

// Initialize express app
const app = express();

// Basic middleware
app.use(express.json());

// Create HTTP server with express
const server = http.createServer(app);

// Basic route
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'WhatsApp Bot Server',
        timestamp: new Date().toISOString(),
        whatsapp_status: whatsapp.isSocketConnected() ? 'connected' : 'disconnected'
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        whatsapp: whatsapp.isSocketConnected() ? 'connected' : 'disconnected',
        uptime: process.uptime()
    });
});

// Log server configuration
const PORT = process.env.PORT || 5000;
logger.info('Server configuration:', {
    port: PORT,
    env: process.env.NODE_ENV,
    platform: process.platform,
    nodeVersion: process.version,
    pid: process.pid
});

// Initialize WhatsApp connection
whatsapp.initialize().catch(err => {
    logger.error('Failed to initialize WhatsApp:', err);
    process.exit(1);
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
    const addr = server.address();
    logger.info('Server started successfully:', {
        address: addr.address,
        port: addr.port,
        family: addr.family,
        pid: process.pid
    });
});

// Error handling for server
server.on('error', (err) => {
    logger.error('Server error occurred:', {
        error: err.message,
        code: err.code,
        port: PORT
    });

    if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
        process.exit(1);
    }
});

// Handle process termination
process.on('SIGTERM', () => {
    logger.info('Received SIGTERM signal');
    server.close(() => {
        logger.info('Server shutdown complete');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', {
        error: err.message,
        stack: err.stack
    });
    if (!err.message.includes('EADDRINUSE')) {
        process.exit(1);
    }
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled rejection:', {
        error: err.message,
        stack: err.stack
    });
    if (!err.message.includes('EADDRINUSE')) {
        process.exit(1);
    }
});

module.exports = server;