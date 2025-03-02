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
        // AI Commands
        ai: { 
            description: 'Chat with AI using GPT-3.5', 
            category: 'AI',
            usage: '.ai <your message>'
        },
        gpt: { 
            description: 'Advanced chat with GPT-4', 
            category: 'AI',
            usage: '.gpt <your message>'
        },
        dalle: { 
            description: 'Generate images with DALL-E', 
            category: 'AI',
            usage: '.dalle <image description>'
        },

        // Basic Commands
        ping: { 
            description: 'Check bot response time', 
            category: 'Basic',
            usage: '.ping'
        },
        menu: { 
            description: 'Show command list', 
            category: 'Basic',
            usage: '.menu'
        },
        help: { 
            description: 'Get detailed command help', 
            category: 'Basic',
            usage: '.help <command>'
        },

        // Group Commands
        kick: { 
            description: 'Kick member from group', 
            category: 'Group',
            usage: '.kick @user'
        },
        add: { 
            description: 'Add member to group', 
            category: 'Group',
            usage: '.add number'
        },
        promote: { 
            description: 'Promote member to admin', 
            category: 'Group',
            usage: '.promote @user'
        },
        demote: { 
            description: 'Demote admin to member', 
            category: 'Group',
            usage: '.demote @user'
        },
        group: { 
            description: 'Group settings (open/close)', 
            category: 'Group',
            usage: '.group open/close'
        },
        linkgroup: { 
            description: 'Get group invite link', 
            category: 'Group',
            usage: '.linkgroup'
        },
        link: { 
            description: 'Get group invite link', 
            category: 'Group',
            usage: '.link'
        },
        revoke: { 
            description: 'Reset group invite link', 
            category: 'Group',
            usage: '.revoke'
        },
        everyone: { 
            description: 'Tag all members with message', 
            category: 'Group',
            usage: '.everyone [message]'
        },
        mute: { 
            description: 'Mute group chat', 
            category: 'Group',
            usage: '.mute'
        },
        unmute: { 
            description: 'Unmute group chat', 
            category: 'Group',
            usage: '.unmute'
        },
        hidetag: { 
            description: 'Tag all members silently', 
            category: 'Group',
            usage: '.hidetag [message]'
        },
        setwelcome: { 
            description: 'Set welcome message', 
            category: 'Group',
            usage: '.setwelcome <message>'
        },
        setgoodbye: { 
            description: 'Set goodbye message', 
            category: 'Group',
            usage: '.setgoodbye <message>'
        },
        antilink: { 
            description: 'Toggle anti-link protection', 
            category: 'Group',
            usage: '.antilink on/off'
        },
        antispam: { 
            description: 'Toggle anti-spam protection', 
            category: 'Group',
            usage: '.antispam on/off'
        },
        antitoxic: { 
            description: 'Toggle anti-toxic protection', 
            category: 'Group',
            usage: '.antitoxic on/off'
        },
        setname: { 
            description: 'Set group name', 
            category: 'Group',
            usage: '.setname <name>'
        },
        setdesc: { 
            description: 'Set group description', 
            category: 'Group',
            usage: '.setdesc <description>'
        },
        groupinfo: { 
            description: 'View group information', 
            category: 'Group',
            usage: '.groupinfo'
        },
        warn: { 
            description: 'Warn a group member', 
            category: 'Group',
            usage: '.warn @user [reason]'
        },
        delwarn: { 
            description: 'Remove a warning', 
            category: 'Group',
            usage: '.delwarn @user <warning_number>'
        },
        warnlist: { 
            description: 'View warnings', 
            category: 'Group',
            usage: '.warnlist @user'
        },
        del: { 
            description: 'Delete messages', 
            category: 'Group',
            usage: '.del [reply to message]'
        },
        poll: { 
            description: 'Create a poll', 
            category: 'Group',
            usage: '.poll "question" "option1" "option2"'
        },
        setrules: { 
            description: 'Set group rules', 
            category: 'Group',
            usage: '.setrules <rules>'
        },
        viewrules: { 
            description: 'View group rules', 
            category: 'Group',
            usage: '.viewrules'
        },
        join: { 
            description: 'Join group via link', 
            category: 'Group',
            usage: '.join <link>'
        },
        tagall: { 
            description: 'Tag all members', 
            category: 'Group',
            usage: '.tagall [message]'
        },
        setppgc: { 
            description: 'Set group profile picture', 
            category: 'Group',
            usage: '.setppgc [reply to image]'
        },
        listadmins: { 
            description: 'List group admins', 
            category: 'Group',
            usage: '.listadmins'
        },
        groupsettings: { 
            description: 'Manage group settings', 
            category: 'Group',
            usage: '.groupsettings <option>'
        },

        // User Commands
        profile: {
            description: 'View user profile',
            category: 'User',
            usage: '.profile [@user]'
        },
        me: {
            description: 'View your profile',
            category: 'User',
            usage: '.me'
        },
        register: {
            description: 'Register your profile',
            category: 'User',
            usage: '.register <name> <age>'
        },
        bio: {
            description: 'Set or view bio',
            category: 'User',
            usage: '.bio [text]'
        },
        level: {
            description: 'Check your level',
            category: 'User',
            usage: '.level'
        },

        // Media Commands
        sticker: { 
            description: 'Create sticker from media', 
            category: 'Media',
            usage: '.sticker [pack] [author]'
        },
        toimg: { 
            description: 'Convert sticker to image', 
            category: 'Media',
            usage: '.toimg'
        },
        meme: { 
            description: 'Get random memes', 
            category: 'Media',
            usage: '.meme'
        },
        tomp3: {
            description: 'Convert video to MP3',
            category: 'Media',
            usage: '.tomp3'
        },
        tovn: {
            description: 'Convert audio to voice note',
            category: 'Media',
            usage: '.tovn'
        },
        video: {
            description: 'Download video from URL',
            category: 'Media',
            usage: '.video <url>'
        },
        togif: {
            description: 'Convert sticker to GIF',
            category: 'Media',
            usage: '.togif'
        },
        tourl: {
            description: 'Upload media to get URL',
            category: 'Media',
            usage: '.tourl'
        },
        cropimg: {
            description: 'Crop an image',
            category: 'Media',
            usage: '.cropimg'
        },
        invert: {
            description: 'Invert image colors',
            category: 'Media',
            usage: '.invert'
        },
        grayscale: {
            description: 'Convert image to grayscale',
            category: 'Media',
            usage: '.grayscale'
        },
        pixelate: {
            description: 'Pixelate an image',
            category: 'Media',
            usage: '.pixelate'
        },
        rotate: {
            description: 'Rotate an image',
            category: 'Media',
            usage: '.rotate'
        },
        blur: {
            description: 'Blur an image',
            category: 'Media',
            usage: '.blur'
        },
        circle: {
            description: 'Make image circular',
            category: 'Media',
            usage: '.circle'
        },
        bass: {
            description: 'Enhance audio bass',
            category: 'Media',
            usage: '.bass'
        },
        nightcore: {
            description: 'Apply nightcore effect',
            category: 'Media',
            usage: '.nightcore'
        },
        slow: {
            description: 'Slow down audio',
            category: 'Media',
            usage: '.slow'
        },
        fast: {
            description: 'Speed up audio',
            category: 'Media',
            usage: '.fast'
        },
        reverse: {
            description: 'Reverse audio',
            category: 'Media',
            usage: '.reverse'
        },
        ytmp3: { 
            description: 'Download YouTube audio', 
            category: 'Media',
            usage: '.ytmp3 <url>'
        },
        ytmp4: { 
            description: 'Download YouTube video', 
            category: 'Media',
            usage: '.ytmp4 <url>'
        },

        // Game Commands
        numguess: {
            description: 'Play number guessing game',
            category: 'Game',
            usage: '.numguess <number>'
        },
        hangman: {
            description: 'Play hangman word game',
            category: 'Game',
            usage: '.hangman <letter>'
        },
        leaderboard: {
            description: 'View game leaderboard',
            category: 'Game',
            usage: '.leaderboard'
        },

        // Education Commands
        math: { 
            description: 'Solve math expressions', 
            category: 'Education',
            usage: '.math <expression>'
        },
        dictionary: { 
            description: 'Look up word definitions', 
            category: 'Education',
            usage: '.dictionary <word>'
        },
        wiki: { 
            description: 'Search Wikipedia', 
            category: 'Education',
            usage: '.wiki <search term>'
        },
        translate: { 
            description: 'Translate text to another language', 
            category: 'Education',
            usage: '.translate <lang> <text>'
        },

        // Owner Commands
        broadcast: { 
            description: 'Broadcast message to all users', 
            category: 'Owner',
            usage: '.broadcast <message>'
        },
        block: { 
            description: 'Block user', 
            category: 'Owner',
            usage: '.block @user'
        },
        unblock: { 
            description: 'Unblock user', 
            category: 'Owner',
            usage: '.unblock @user'
        },
        join: { 
            description: 'Join a group via invite link', 
            category: 'Owner',
            usage: '.join <link>'
        },
        leave: { 
            description: 'Leave a group', 
            category: 'Owner',
            usage: '.leave'
        },
        restart: { 
            description: 'Restart the bot', 
            category: 'Owner',
            usage: '.restart'
        },

        // Economy Commands
        balance: {
            description: 'Check your balance',
            category: 'Economy',
            usage: '.balance'
        },
        daily: {
            description: 'Claim daily rewards',
            category: 'Economy',
            usage: '.daily'
        },
        weekly: {
            description: 'Claim weekly rewards',
            category: 'Economy',
            usage: '.weekly'
        },
        monthly: {
            description: 'Claim monthly rewards',
            category: 'Economy',
            usage: '.monthly'
        },
        work: {
            description: 'Work to earn coins',
            category: 'Economy',
            usage: '.work'
        },
        mine: {
            description: 'Mine for valuable minerals',
            category: 'Economy',
            usage: '.mine'
        },
        fish: {
            description: 'Go fishing for coins',
            category: 'Economy',
            usage: '.fish'
        },
        hunt: {
            description: 'Hunt for rewards',
            category: 'Economy',
            usage: '.hunt'
        },
        bank: {
            description: 'View bank account',
            category: 'Economy',
            usage: '.bank'
        },
        deposit: {
            description: 'Deposit money in bank',
            category: 'Economy',
            usage: '.deposit <amount>'
        },
        withdraw: {
            description: 'Withdraw money from bank',
            category: 'Economy',
            usage: '.withdraw <amount>'
        },
        shop: {
            description: 'View item shop',
            category: 'Economy',
            usage: '.shop'
        },
        buy: {
            description: 'Buy items from shop',
            category: 'Economy',
            usage: '.buy <item_id>'
        },
        sell: {
            description: 'Sell items from inventory',
            category: 'Economy',
            usage: '.sell <item_id> [quantity]'
        },
        inventory: {
            description: 'Check your inventory',
            category: 'Economy',
            usage: '.inventory'
        },
        gamble: {
            description: 'Gamble your coins',
            category: 'Economy',
            usage: '.gamble <amount>'
        },
        flip: {
            description: 'Flip a coin to win/lose',
            category: 'Economy',
            usage: '.flip heads/tails <amount>'
        },
        transfer: {
            description: 'Transfer coins to others',
            category: 'Economy',
            usage: '.transfer @user <amount>'
        },
        rob: {
            description: 'Rob another user',
            category: 'Economy',
            usage: '.rob @user'
        }
    }
};

module.exports = config;