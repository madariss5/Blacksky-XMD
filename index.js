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

// Enhanced health check endpoint
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
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

// Start server with improved error handling and auto-restart
async function startServer() {
    try {
        logger.info('Starting server initialization...');

        return new Promise((resolve, reject) => {
            const server = app.listen(PORT, '0.0.0.0', async () => {
                logger.info(`Server successfully bound to port ${PORT}`);
                logger.info(`Server running on http://0.0.0.0:${PORT}`);

                try {
                    logger.info('Initializing WhatsApp connection...');
                    const sock = await whatsapp.initialize();

                    // Setup message handling with improved error handling
                    sock.ev.on('messages.upsert', async ({ messages, type }) => {
                        if (type !== 'notify') return;
                        try {
                            const msg = messages[0];
                            if (!msg?.message) {
                                logger.debug('Ignoring empty message');
                                return;
                            }

                            // Add more detailed logging
                            logger.info('Received message:', {
                                from: msg.key.remoteJid,
                                type: Object.keys(msg.message)[0],
                                messageContent: msg.message?.conversation || 
                                             msg.message?.extendedTextMessage?.text || 
                                             'No text content',
                                participant: msg.key.participant,
                                pushName: msg.pushName
                            });

                            await messageHandler(sock, msg);
                        } catch (error) {
                            logger.error('Message handling error:', error);
                            // Try to send error message back to user
                            try {
                                await sock.sendMessage(msg.key.remoteJid, {
                                    text: '❌ Error processing your message. Please try again.'
                                });
                            } catch (sendError) {
                                logger.error('Failed to send error message:', sendError);
                            }
                        }
                    });

                    resolve(server);
                } catch (error) {
                    logger.error('Failed to start WhatsApp bot:', error);
                    // Don't reject here, let the server keep running
                    logger.info('Server will continue running while attempting to reconnect WhatsApp...');
                    // Attempt to restart WhatsApp initialization after delay
                    setTimeout(() => {
                        logger.info('Attempting to restart WhatsApp initialization...');
                        whatsapp.initialize().catch(err => {
                            logger.error('Failed to restart WhatsApp:', err);
                        });
                    }, 5000);
                    resolve(server); // Resolve anyway to keep server running
                }
            });

            server.on('error', (error) => {
                logger.error('Server error:', error);
                reject(error);
            });
        });
    } catch (error) {
        logger.error('Server startup error:', error);
        throw error;
    }
}

// Start the server
async function run() {
    try {
        await startServer();
        logger.info('Server started successfully');
    } catch (error) {
        logger.error('Failed to start server:', error);
        // Attempt to restart server after delay
        setTimeout(() => {
            logger.info('Attempting to restart server...');
            run().catch(err => {
                logger.error('Failed to restart server:', err);
                process.exit(1);
            });
        }, 5000);
    }
}

run();

// Error handling
process.on('uncaughtException', error => {
    logger.error('Uncaught Exception:', error);
    // Attempt graceful restart
    setTimeout(() => {
        logger.info('Attempting to restart after uncaught exception...');
        run().catch(err => {
            logger.error('Failed to restart after uncaught exception:', err);
            process.exit(1);
        });
    }, 5000);
});

process.on('unhandledRejection', error => {
    logger.error('Unhandled Rejection:', error);
    // Continue running but log the error
});