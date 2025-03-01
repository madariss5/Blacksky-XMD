const http = require('http');
const logger = require('pino')();
const express = require('express');

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
        timestamp: new Date().toISOString()
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

// Try to start server on port 5000
logger.info(`Attempting to start server on port ${PORT}...`);

server.listen(PORT, '0.0.0.0', () => {
    const addr = server.address();
    logger.info('Server started successfully:', {
        address: addr.address,
        port: addr.port,
        family: addr.family,
        pid: process.pid
    });
});

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
    process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled rejection:', {
        error: err.message,
        stack: err.stack
    });
    process.exit(1);
});

module.exports = server;