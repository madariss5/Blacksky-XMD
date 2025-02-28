const express = require('express');
const logger = require('pino')();
const whatsapp = require('./server/whatsapp');
const messageHandler = require('./handlers/message');

// Initialize express app
const app = express();
const PORT = 5000;

// Basic route
app.get('/', (req, res) => {
    res.send('WhatsApp Bot is running!');
});

// Enhanced health check endpoint with detailed status
app.get('/health', (req, res) => {
    try {
        res.json({
            status: 'healthy',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            whatsappConnected: whatsapp.isSocketConnected(),
            serverConnected: true,
            port: PORT,
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        logger.error('Health check error:', error);
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

// Separate server initialization for better error handling
async function startServer() {
    try {
        logger.info('Starting server initialization...');

        // Create HTTP server with proper error handling
        const server = app.listen(PORT, '0.0.0.0', async () => {
            logger.info(`Server successfully bound to port ${PORT}`);
            logger.info(`Server running on http://0.0.0.0:${PORT}`);

            try {
                logger.info('Initializing WhatsApp connection...');
                await whatsapp.initialize();
            } catch (error) {
                logger.error('Failed to initialize WhatsApp:', error);
                // Don't exit - let the HTTP server keep running
                logger.info('Server will continue running while attempting to reconnect WhatsApp...');
            }
        });

        // Enhanced error handling for the server
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                logger.error(`Port ${PORT} is already in use`);
                process.exit(1);
            } else {
                logger.error('Server error:', error);
            }
        });

        return server;
    } catch (error) {
        logger.error('Failed to start server:', error);
        throw error;
    }
}

// Start the server with improved error handling and recovery
async function run() {
    try {
        await startServer();
        logger.info('Server started successfully');
    } catch (error) {
        logger.error('Critical server error:', error);
        process.exit(1);
    }
}

// Start server
run();

// Global error handlers
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    logger.error('Unhandled Rejection:', error);
    // Log but don't exit - let error handlers deal with it
});