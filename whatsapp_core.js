const venom = require('venom-bot');
const path = require('path');
const chalk = require('chalk');
const logger = require('pino')();
const commandHandler = require('./handlers/command_handler');

// Session path configuration
const SESSION_PATH = path.join(__dirname, 'sessions');

// Initialize the WhatsApp bot with improved settings
function startWhatsAppBot() {
  console.log(chalk.cyan('\nInitializing WhatsApp bot...\n'));

  return venom
    .create({
      session: 'flash-bot',
      multidevice: true,
      folderNameToken: SESSION_PATH,
      headless: 'new',
      useChrome: true,
      debug: true, // Enable debug logs
      logQR: true,
      disableWelcome: true,
      disableSpins: true,
      browserArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // <- This one helps with memory
        '--disable-extensions'
      ],
      puppeteerOptions: {
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ]
      }
    })
    .then((client) => {
      logger.info('WhatsApp bot initialized successfully');
      setupEventHandlers(client);
      return client;
    })
    .catch((error) => {
      logger.error('Error initializing WhatsApp bot:', error);
      process.exit(1);
    });
}

function setupEventHandlers(client) {
  // Message handler
  client.onMessage(async (message) => {
    try {
      if (message.isGroupMsg) return; // Skip group messages for now
      await commandHandler.handleMessage(client, message);
    } catch (error) {
      logger.error('Error processing message:', error);
    }
  });

  // State change handler
  client.onStateChange((state) => {
    logger.info('Connection state:', state);
    if (state === 'CONFLICT') {
      client.useHere(); // Use this device when there's a conflict
    }
    if (state === 'DISCONNECTED') {
      logger.warn('WhatsApp disconnected. Attempting to reconnect...');
      setTimeout(() => {
        startWhatsAppBot();
      }, 5000);
    }
  });

  // QR Code handler with improved logging
  client.onQR((qr) => {
    logger.info('New QR Code received. Length:', qr.length);
    console.log('\nScan this QR code to connect:');
    require('qrcode-terminal').generate(qr, { small: true });
  });

  // Connection success handler
  client.onConnected(() => {
    logger.info('WhatsApp connection established successfully!');
    console.log(chalk.green('\n✓ Successfully connected to WhatsApp\n'));
    console.log(chalk.cyan('• Bot Status: Online'));
    console.log(chalk.cyan('• Type !menu to see available commands\n'));
  });
  
    // Error handling
  client.onConnectionError((error) => {
    logger.error('Connection error:', error);
  });

  // Handle disconnection
  process.on('SIGINT', async () => {
    console.log(chalk.yellow('\nClosing WhatsApp connection...'));
    try {
      await client.close();
      process.exit(0);
    } catch (error) {
      logger.error('Error closing client:', error);
      process.exit(1);
    }
  });
}

// Start the bot
startWhatsAppBot().catch((err) => {
  logger.error('Fatal error:', err);
  process.exit(1);
});

module.exports = { startWhatsAppBot };