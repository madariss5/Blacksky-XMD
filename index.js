const express = require('express');
const logger = require('pino')();
const whatsapp = require('./server/whatsapp');
const messageHandler = require('./handlers/message');

// Initialize express app
const app = express();
const PORT = 5000;  // Using port 5000 which is mapped to 80 in .replit

// Basic route
app.get('/', (req, res) => {
    res.send('WhatsApp Bot is running!');
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        whatsappConnected: whatsapp.isSocketConnected()
    });
});

// Start server
try {
    app.listen(PORT, '0.0.0.0', async () => {
        logger.info(`Server running on http://0.0.0.0:${PORT}`);
        try {
            const sock = await whatsapp.initialize();

            // Setup message handling
            sock.ev.on('messages.upsert', async ({ messages, type }) => {
                if (type !== 'notify') return;
                try {
                    const msg = messages[0];
                    if (!msg?.message) return;
                    logger.info('Processing new message:', {
                        from: msg.key.remoteJid,
                        type: Object.keys(msg.message)[0]
                    });
                    await messageHandler(sock, msg);
                } catch (error) {
                    logger.error('Message handling error:', error);
                }
            });

        } catch (error) {
            logger.error('Failed to start WhatsApp bot:', error);
        }
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