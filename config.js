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

    // Session configuration
    session: sessionConfig,

    // Command configurations
    commands: {
        // Media Conversion Commands
        sticker: { description: 'Create sticker from image/video', category: 'Media' },
        tts: { description: 'Convert text to speech', category: 'Media' },
        translate: { description: 'Translate text', category: 'Media' },
        ytmp3: { description: 'Download YouTube audio as MP3', category: 'Media' },
        ytmp4: { description: 'Download YouTube video as MP4', category: 'Media' },

        // Information Commands
        weather: { description: 'Get weather info', category: 'Info' },
        calc: { description: 'Calculate expression', category: 'Info' },
        stats: { description: 'Show bot statistics', category: 'Info' },

        // System Commands
        ping: { description: 'Check bot response time', category: 'System' },
        uptime: { description: 'Show bot uptime', category: 'System' },
        report: { description: 'Report an issue', category: 'System' }
    }
};

// Add diagnostic logging for commands configuration
logger.info('Commands configuration loaded:', {
    totalCommands: Object.keys(config.commands).length,
    categories: [...new Set(Object.values(config.commands).map(cmd => cmd.category))],
    commandList: Object.keys(config.commands)
});

module.exports = config;