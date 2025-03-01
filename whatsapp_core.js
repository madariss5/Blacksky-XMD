const venom = require('venom-bot');
const path = require('path');
const chalk = require('chalk');
const logger = require('pino')();
const commandHandler = require('./handlers/command_handler');

// Session path
const SESSION_PATH = path.join(__dirname, 'sessions');

console.log(chalk.cyan('\nStarting WhatsApp bot...\n'));
console.log(chalk.cyan('┌─────────────────────────────────────┐'));
console.log(chalk.cyan('│          Venom-Bot Connection       │'));
console.log(chalk.cyan('└─────────────────────────────────────┘\n'));

console.log(chalk.yellow('Please follow these steps:'));
console.log(chalk.white('1. Open WhatsApp on your phone'));
console.log(chalk.white('2. Go to Settings > Linked Devices'));
console.log(chalk.white('3. Tap on "Link a Device"'));
console.log(chalk.white('4. Make sure your app is up to date'));
console.log(chalk.white('5. Scan the QR code when it appears\n'));

// Create Venom-Bot Client
venom
  .create({
    session: 'flash-bot',
    multidevice: true,
    folderNameToken: SESSION_PATH,
    headless: 'new', // Use new headless mode
    useChrome: true,
    debug: false,
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
  .then((client) => start(client))
  .catch((error) => {
    logger.error('Error creating client:', error);
    process.exit(1);
  });

function start(client) {
  console.log(chalk.green('\n✓ Successfully connected to WhatsApp\n'));
  console.log(chalk.cyan('• Bot Status: Online'));
  console.log(chalk.cyan('• Type !menu to see available commands\n'));

  // Message handler
  client.onMessage(async (message) => {
    try {
      if (message.isGroupMsg) return; // Skip group messages for now

      // Process commands through existing handler
      await commandHandler.handleMessage(client, message);
    } catch (error) {
      logger.error('Error processing message:', error);
    }
  });

  // Handle client events
  client.onStateChange((state) => {
    logger.info('State changed:', state);
    if (state === 'DISCONNECTED') {
      console.log(chalk.red('\n× Connection lost. Please restart the application.\n'));
    }
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