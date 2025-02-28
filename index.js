const express = require('express');
const logger = require('pino')();

// Initialize express app
const app = express();
const PORT = 4000;

// Basic route
app.get('/', (req, res) => {
    res.send('WhatsApp Bot is running!');
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime()
    });
});

// Start server
try {
    app.listen(PORT, '0.0.0.0', () => {
        logger.info(`Server running on http://0.0.0.0:${PORT}`);
    });
} catch (error) {
    logger.error('Server startup error:', error);
    process.exit(1);
}

// Error handling
process.on('uncaughtException', error => {
    logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', error => {
    logger.error('Unhandled Rejection:', error);
});