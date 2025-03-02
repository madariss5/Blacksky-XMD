const { formatPhoneNumber } = require('./utils/phoneNumber');
const logger = require('pino')();

// Add diagnostic logging for config initialization
logger.info('Starting config initialization...');

// Validate and format owner number during startup
const rawOwnerNumber = process.env.OWNER_NUMBER || '4915561048015';
const ownerToken = process.env.OWNER_TOKEN;

const formattedOwnerNumber = formatPhoneNumber(rawOwnerNumber);
logger.info('Startup: Formatted owner number:', formattedOwnerNumber);

if (!formattedOwnerNumber) {
    console.error('Invalid OWNER_NUMBER format in environment variables');
    process.exit(1);
}

// Session configuration
const sessionConfig = {
    id: process.env.SESSION_ID || 'blacksky-md',
    authDir: process.env.AUTH_DIR || './auth_info',
    printQRInTerminal: true,
    browser: ['𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻', 'Chrome', '112.0.5615.49'],
    defaultQueryTimeoutMs: parseInt(process.env.QUERY_TIMEOUT) || 60000,
    connectTimeoutMs: parseInt(process.env.CONNECT_TIMEOUT) || 60000,
    qrTimeout: parseInt(process.env.QR_TIMEOUT) || 40000,
    keepAliveIntervalMs: parseInt(process.env.KEEP_ALIVE_INTERVAL) || 10000,
    emitOwnEvents: true,
    markOnlineOnConnect: true,
    retryRequestDelayMs: parseInt(process.env.RETRY_DELAY) || 2000,
    logLevel: process.env.LOG_LEVEL || 'silent'
};

const config = {
    // Basic configuration
    prefix: process.env.PREFIX || '.',
    ownerNumber: formattedOwnerNumber,
    ownerName: process.env.OWNER_NAME || 'BLACKSKY',
    botName: process.env.BOT_NAME || '𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻',
    botNumber: '',
    menuImage: process.env.MENU_IMAGE || 'https://raw.githubusercontent.com/your-repo/assets/main/f9.jpg',

    // Session configuration
    session: sessionConfig,

    // Command configurations
    commands: {
        // Basic Commands
        menu: { description: 'Show all available commands', category: 'Basic' },
        help: { description: 'Get help with commands', category: 'Basic' },
        ping: { description: 'Check bot response time', category: 'Basic' },

        // Game Commands
        numguess: { description: 'Play number guessing game', category: 'Game' },
        hangman: { description: 'Play hangman game', category: 'Game' },
        leaderboard: { description: 'View game leaderboard', category: 'Game' },

        // Media Commands
        sticker: { description: 'Create sticker from image/video', category: 'Media' },
        toimg: { description: 'Convert sticker to image', category: 'Media' },
        meme: { description: 'Create or get random memes', category: 'Media' },
        ytmp3: { description: 'Download YouTube audio', category: 'Media' },
        ytmp4: { description: 'Download YouTube video', category: 'Media' },

        // Group Commands
        welcome: { description: 'Toggle welcome messages', category: 'Group' },
        goodbye: { description: 'Toggle goodbye messages', category: 'Group' },
        invitelink: { description: 'Get group invite link', category: 'Group' },

        // Education Commands
        math: { description: 'Solve math expressions', category: 'Education' },
        dictionary: { description: 'Look up word definitions', category: 'Education' },
        wiki: { description: 'Search Wikipedia', category: 'Education' },
        translate: { description: 'Translate text', category: 'Education' },

        // Economy Commands
        balance: { description: 'Check your balance', category: 'Economy' },
        daily: { description: 'Claim daily rewards', category: 'Economy' },
        work: { description: 'Work to earn coins', category: 'Economy' },
        mine: { description: 'Mine for coins', category: 'Economy' },
        bank: { description: 'View bank balance', category: 'Economy' },
        deposit: { description: 'Deposit coins to bank', category: 'Economy' },
        withdraw: { description: 'Withdraw coins from bank', category: 'Economy' },
        transfer: { description: 'Transfer coins to others', category: 'Economy' },
        shop: { description: 'View item shop', category: 'Economy' },
        buy: { description: 'Buy items from shop', category: 'Economy' },
        sell: { description: 'Sell items from inventory', category: 'Economy' },
        inventory: { description: 'View your inventory', category: 'Economy' },

        // AI Commands
        ai: { description: 'Chat with AI assistant', category: 'AI' },
        gpt: { description: 'Chat with GPT model', category: 'AI' },
        dalle: { description: 'Generate images with DALL-E', category: 'AI' }
    }
};

// Add diagnostic logging for commands configuration
logger.info('Commands configuration loaded:', {
    totalCommands: Object.keys(config.commands).length,
    categories: [...new Set(Object.values(config.commands).map(cmd => cmd.category))],
    commandList: Object.keys(config.commands)
});

module.exports = config;