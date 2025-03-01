const express = require('express');
const logger = require('pino')();

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware for logging and parsing
app.use(express.json());

// Log each request
app.use((req, res, next) => {
    logger.info({
        method: req.method,
        path: req.path,
        headers: req.headers,
        ip: req.ip
    });
    next();
});

// Simple test endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Create server with detailed logging
const server = app.listen(PORT, '0.0.0.0', () => {
    const addr = server.address();
    logger.info('Server started successfully:', {
        address: addr.address,
        port: addr.port,
        family: addr.family,
        environment: {
            nodeEnv: process.env.NODE_ENV,
            replId: process.env.REPL_ID,
            replSlug: process.env.REPL_SLUG
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

// Set keepalive timeout
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
