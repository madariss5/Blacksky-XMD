const { formatPhoneNumber } = require('./utils/phoneNumber');

// Validate and format owner number during startup
const rawOwnerNumber = process.env.OWNER_NUMBER || '4915561048015';
const ownerToken = process.env.OWNER_TOKEN;

console.log('Startup: Raw OWNER_NUMBER from env:', rawOwnerNumber);

const formattedOwnerNumber = formatPhoneNumber(rawOwnerNumber);
console.log('Startup: Formatted owner number:', formattedOwnerNumber);

if (!formattedOwnerNumber) {
    console.error('Invalid OWNER_NUMBER format in environment variables');
    process.exit(1);
}

// Session configuration
const sessionConfig = {
    // Session identification
    id: process.env.SESSION_ID || 'blacksky-md',

    // Auth directory
    authDir: process.env.AUTH_DIR || './auth_info',

    // Connection settings
    printQRInTerminal: true,
    browser: ['𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻', 'Chrome', '112.0.5615.49'],

    // Timeouts and intervals
    defaultQueryTimeoutMs: parseInt(process.env.QUERY_TIMEOUT) || 60000,
    connectTimeoutMs: parseInt(process.env.CONNECT_TIMEOUT) || 60000,
    qrTimeout: parseInt(process.env.QR_TIMEOUT) || 40000,
    keepAliveIntervalMs: parseInt(process.env.KEEP_ALIVE_INTERVAL) || 10000,

    // Behavior configuration
    emitOwnEvents: true,
    markOnlineOnConnect: true,
    retryRequestDelayMs: parseInt(process.env.RETRY_DELAY) || 2000,

    // Logging configuration
    logLevel: process.env.LOG_LEVEL || 'silent',

    // Backup settings
    backupInterval: parseInt(process.env.BACKUP_INTERVAL) || 24 * 60 * 60 * 1000, // 24 hours
    maxBackupFiles: parseInt(process.env.MAX_BACKUPS) || 7,
    backupDir: process.env.BACKUP_DIR || './session_backups'
};

module.exports = {
    // Basic configuration
    prefix: process.env.PREFIX || '.',
    ownerNumber: formattedOwnerNumber,
    ownerName: process.env.OWNER_NAME || 'BLACKSKY',
    botName: process.env.BOT_NAME || '𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻',
    botNumber: '', // Will be set after connection
    menuImage: process.env.MENU_IMAGE || 'https://raw.githubusercontent.com/your-repo/assets/main/f9.jpg',

    // Session configuration
    session: sessionConfig,

    commands: {
        // Basic Commands
        menu: { description: 'Show all available commands', category: 'Basic' },
        help: { description: 'Get help with commands', category: 'Basic' },
        ping: { description: 'Check bot response time', category: 'Basic' },

        // AI Commands
        ai: { description: 'Chat with AI assistant (GPT-3.5)', category: 'AI' },
        gpt: { description: 'Advanced chat with GPT-4', category: 'AI' },
        dalle: { description: 'Generate images with DALL-E', category: 'AI' },

        // Game Commands
        numguess: { description: 'Play number guessing game', category: 'Game' },
        hangman: { description: 'Play hangman game', category: 'Game' },

        // Media Commands
        sticker: { description: 'Create sticker from image/video', category: 'Media' },
        toimg: { description: 'Convert sticker to image', category: 'Media' },
        meme: { description: 'Create or get random memes', category: 'Media' },

        // Group Commands
        welcome: { description: 'Toggle welcome messages', category: 'Group' },
        goodbye: { description: 'Toggle goodbye messages', category: 'Group' },
        invitelink: { description: 'Get group invite link', category: 'Group' },

        // Education Commands
        math: { description: 'Solve math expressions', category: 'Education' },
        wiki: { description: 'Search Wikipedia', category: 'Education' },
        translate: { description: 'Translate text', category: 'Education' },

        // Economy Commands
        bank: { description: 'Check bank balance', category: 'Economy' },
        flip: { description: 'Flip a coin to earn/lose money', category: 'Economy' },
        withdraw: { description: 'Withdraw money from bank', category: 'Economy' },

        // Utility Commands
        ytmp3: { description: 'Download YouTube audio', category: 'Utility' },
        ytmp4: { description: 'Download YouTube video', category: 'Utility' }
    }
};