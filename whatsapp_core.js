const venom = require('venom-bot');
const path = require('path');
const chalk = require('chalk');
const logger = require('pino')();
const commandHandler = require('./handlers/command_handler');
const fs = require('fs-extra');

// Session path configuration
const SESSION_PATH = path.join(__dirname, 'sessions');
const MAX_RETRIES = 3;
let retryCount = 0;
let isShuttingDown = false;

// Initialize the WhatsApp bot with improved settings
async function startWhatsAppBot() {
  try {
    console.log(chalk.cyan('\nInitializing WhatsApp bot...\n'));
    logger.info('Starting WhatsApp initialization, attempt:', retryCount + 1);

    // Ensure session directory exists
    await fs.ensureDir(SESSION_PATH);

    const client = await venom.create({
      session: 'flash-bot',
      multidevice: true,
      folderNameToken: SESSION_PATH,
      headless: true, // Changed to true for better stability
      useChrome: true,
      debug: false, // Disable debug logs to reduce noise
      logQR: true,
      disableWelcome: true,
      disableSpins: true,
      catchQR: (qrcode) => {
        logger.info('New QR Code received');
        // Display QR in terminal
        require('qrcode-terminal').generate(qrcode, { small: true });
      },
      statusFind: (status) => {
        logger.info('Status Find:', status);
      },
      browserArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-extensions'
      ],
      puppeteerOptions: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ]
      },
      autoClose: 60000,
      createPathFileToken: true,
      waitForLogin: true
    });

    setupEventHandlers(client);
    retryCount = 0; // Reset retry count on successful connection
    return client;

  } catch (error) {
    logger.error('Error during WhatsApp initialization:', {
      error: error.message,
      stack: error.stack,
      attempt: retryCount + 1
    });

    if (retryCount < MAX_RETRIES && !isShuttingDown) {
      retryCount++;
      const delay = retryCount * 5000; // Increasing delay between retries
      logger.info(`Retrying in ${delay/1000} seconds... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return startWhatsAppBot();
    } else {
      logger.error('Max retries reached or shutdown in progress. Exiting...');
      process.exit(1);
    }
  }
}

function setupEventHandlers(client) {
  // Message handler with improved error handling
  client.onMessage(async (message) => {
    try {
      if (message.isGroupMsg) return; // Skip group messages
      await commandHandler.handleMessage(client, message);
    } catch (error) {
      logger.error('Error processing message:', {
        error: error.message,
        messageId: message.id,
        chatId: message.chatId
      });
    }
  });

  // State change handler with retry logic
  client.onStateChange((state) => {
    logger.info('Connection state changed:', state);

    if (state === 'CONFLICT') {
      client.useHere();
    }

    if (state === 'DISCONNECTED' && !isShuttingDown) {
      logger.warn('WhatsApp disconnected. Attempting to reconnect...');
      setTimeout(() => {
        if (!isShuttingDown) {
          retryCount = 0; // Reset retry count for new connection attempt
          startWhatsAppBot();
        }
      }, 5000);
    }

    if (state === 'CONNECTED') {
      logger.info('Successfully connected to WhatsApp');
      retryCount = 0;
    }
  });

  // Connection success handler
  client.onConnected(() => {
    logger.info('WhatsApp connection established successfully!');
    console.log(chalk.green('\n✓ Successfully connected to WhatsApp\n'));
    console.log(chalk.cyan('• Bot Status: Online'));
    console.log(chalk.cyan('• Type !menu to see available commands\n'));
  });

  // Error handling with detailed logging
  client.onConnectionError((error) => {
    logger.error('Connection error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });

  // Handle graceful shutdown
  const shutdown = async (signal) => {
    try {
      isShuttingDown = true;
      logger.info(`Received ${signal}. Closing WhatsApp connection...`);
      console.log(chalk.yellow('\nClosing WhatsApp connection...'));

      // Cleanup session if needed
      if (signal === 'SIGTERM') {
        await fs.remove(SESSION_PATH);
        logger.info('Cleaned up session directory');
      }

      await client.close();
      logger.info('WhatsApp connection closed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', {
      error: error.message,
      stack: error.stack
    });
    if (!isShuttingDown) {
      shutdown('UNCAUGHT_EXCEPTION');
    }
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection:', {
      reason: reason,
      promise: promise
    });
    if (!isShuttingDown) {
      shutdown('UNHANDLED_REJECTION');
    }
  });
}

// Start the bot with error handling
logger.info('Starting WhatsApp bot service');
startWhatsAppBot().catch((err) => {
  logger.error('Fatal error during startup:', {
    error: err.message,
    stack: err.stack
  });
  process.exit(1);
});

module.exports = { startWhatsAppBot };