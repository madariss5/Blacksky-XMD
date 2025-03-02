const { formatPhoneNumber } = require('./utils/phoneNumber');
const logger = require('pino')();

logger.info('Starting config initialization...');

const rawOwnerNumber = process.env.OWNER_NUMBER || '4915561048015';
const ownerToken = process.env.OWNER_TOKEN;

const formattedOwnerNumber = formatPhoneNumber(rawOwnerNumber);
logger.info('Startup: Formatted owner number:', formattedOwnerNumber);

if (!formattedOwnerNumber) {
    console.error('Invalid OWNER_NUMBER format in environment variables');
    process.exit(1);
}

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
    prefix: process.env.PREFIX || '.',
    ownerNumber: formattedOwnerNumber,
    ownerName: process.env.OWNER_NAME || 'BLACKSKY',
    botName: process.env.BOT_NAME || '𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻',
    botNumber: '',
    session: sessionConfig,

    commands: {
        // Main Commands
        menu: { description: 'Show all available commands', category: 'Main' },
        help: { description: 'Get help with commands', category: 'Main' },
        ping: { description: 'Check bot response time', category: 'Main' },
        owner: { description: 'Get bot owner contact', category: 'Main' },

        // Downloader Commands
        ytmp3: { description: 'Download YouTube audio', category: 'Downloader' },
        ytmp4: { description: 'Download YouTube video', category: 'Downloader' },
        facebook: { description: 'Download Facebook video', category: 'Downloader' },
        mediafire: { description: 'Download MediaFire files', category: 'Downloader' },

        // Group Commands
        kick: { description: 'Kick member from group', category: 'Group' },
        add: { description: 'Add member to group', category: 'Group' },
        promote: { description: 'Promote member to admin', category: 'Group' },
        demote: { description: 'Demote admin to member', category: 'Group' },
        setname: { description: 'Change group name', category: 'Group' },
        setdesc: { description: 'Change group description', category: 'Group' },
        setppgc: { description: 'Change group icon', category: 'Group' },
        tagall: { description: 'Tag all group members', category: 'Group' },
        hidetag: { description: 'Tag all without mentions', category: 'Group' },
        group: { description: 'Group settings', category: 'Group' },
        linkgroup: { description: 'Get group invite link', category: 'Group' },

        // Economy Commands
        balance: { description: 'Check your balance', category: 'Economy' },
        daily: { description: 'Claim daily rewards', category: 'Economy' },
        work: { description: 'Work to earn coins', category: 'Economy' },
        rob: { description: 'Rob other users', category: 'Economy' },
        transfer: { description: 'Transfer coins to others', category: 'Economy' },
        shop: { description: 'View available items', category: 'Economy' },
        inventory: { description: 'Check your inventory', category: 'Economy' },

        // Fun Commands
        quote: { description: 'Get random quotes', category: 'Fun' },
        meme: { description: 'Get random memes', category: 'Fun' },
        joke: { description: 'Get random jokes', category: 'Fun' },
        truth: { description: 'Get truth questions', category: 'Fun' },
        dare: { description: 'Get dare challenges', category: 'Fun' },
        fact: { description: 'Get random facts', category: 'Fun' },

        // Media Commands
        sticker: { description: 'Create sticker', category: 'Media' },
        toimg: { description: 'Convert sticker to image', category: 'Media' },
        tovideo: { description: 'Convert to video', category: 'Media' },
        toaudio: { description: 'Convert to audio', category: 'Media' },
        tomp3: { description: 'Convert to MP3', category: 'Media' },
        togif: { description: 'Convert to GIF', category: 'Media' },

        // Owner Commands
        broadcast: { description: 'Broadcast message to all chats', category: 'Owner' },
        block: { description: 'Block user', category: 'Owner' },
        unblock: { description: 'Unblock user', category: 'Owner' },
        join: { description: 'Join a group', category: 'Owner' },
        leave: { description: 'Leave a group', category: 'Owner' },
        restart: { description: 'Restart the bot', category: 'Owner' }
    }
};

module.exports = config;