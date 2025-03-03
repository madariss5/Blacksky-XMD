require('dotenv').config();
const { formatPhoneNumber } = require('./utils/phoneNumber');
const { getSessionData } = require('./utils/creds');
const logger = require('pino')();
const fs = require('fs'); 
const os = require('os');

// Platform-specific configurations
const platformConfig = {
    isHeroku: process.env.NODE_ENV === 'production' && process.env.DYNO,
    isDocker: fs.existsSync('/.dockerenv'),
    workers: process.env.WEB_CONCURRENCY || os.cpus().length,
    port: process.env.PORT || 5000,
    host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'
};

logger.info('Platform configuration:', platformConfig);

// Initialize session configuration with platform-specific defaults
const sessionTimeout = platformConfig.isHeroku ? 300000 : 600000; // 5 minutes for Heroku, 10 for local
const maxRetries = platformConfig.isHeroku ? 3 : 5; // Less retries on Heroku to avoid unnecessary dynos usage

const sessionConfig = {
    id: process.env.SESSION_ID || '{"noiseKey":{"private":{"type":"Buffer","data":"+MUxEBdzVN4dzqWVil1FknUo4lODIWZ7/3zS6gXM7Gg="},"public":{"type":"Buffer","data":"cWV3bTxFT6pImkZkXfMTQrs4JPo4xHNH7Hil2B07pA0="}},"pairingEphemeralKeyPair":{"private":{"type":"Buffer","data":"gC8SlnPRmuigjlkeMMZaprLOufDFdt7RmQeUJ83Lumw="},"public":{"type":"Buffer","data":"FwsTlvKQLGMV7Q3R9s0U+0ojWgo14DSJPfDqtejwPRA="}},"signedIdentityKey":{"private":{"type":"Buffer","data":"cMI2F45YDFMzWdzdE+VQ3IrWr9nH9Vw7vbh8kGKaQ2s="},"public":{"type":"Buffer","data":"qQvZEW928Tt4OY+ijEH1v0NfBUqII1ax1SMEfZUn3Qg="}},"signedPreKey":{"keyPair":{"private":{"type":"Buffer","data":"sJ1dFeQfFQcoen/HbscBoLn6E7+LUg4vA8U4N+Uxw24="},"public":{"type":"Buffer","data":"vAIoXKUsoHo2guTCjiwFPa+7TEFijAWh2GTIguWIvTo="}},"signature":{"type":"Buffer","data":"M86FfhCka0VDW8t8XUGNSTc0QEOkVy81RRv+yeds1Xf8mmrkvBI+0LgORto0AE4YeoJArPHYUeODg7deNVinCQ=="},"keyId":1},"registrationId":166,"advSecretKey":"hXIivOBI8pra8FfHrG0lynb9WhEO9Ny9qV28R958ccs=","processedHistoryMessages":[{"key":{"remoteJid":"4915561048015@s.whatsapp.net","fromMe":true,"id":"2FC625806A816112C3097B247C10D81A"},"messageTimestamp":1741016054},{"key":{"remoteJid":"4915561048015@s.whatsapp.net","fromMe":true,"id":"7E0A7DAC12932101A28B509FDE2D232D"},"messageTimestamp":1741016054},{"key":{"remoteJid":"4915561048015@s.whatsapp.net","fromMe":true,"id":"992468A39BFAE6FECF7576E0F489010C"},"messageTimestamp":1741016058},{"key":{"remoteJid":"4915561048015@s.whatsapp.net","fromMe":true,"id":"36280A2029496DF2859B94CE930D5FF5"},"messageTimestamp":1741016061},{"key":{"remoteJid":"4915561048015@s.whatsapp.net","fromMe":true,"id":"7614A886F6B5EF934C0758429A259C12"},"messageTimestamp":1741016064},{"key":{"remoteJid":"4915561048015@s.whatsapp.net","fromMe":true,"id":"6F5E0063CD0BC05CDFC68B4ACD3EFFA7"},"messageTimestamp":1741016067}],"nextPreKeyId":91,"firstUnuploadedPreKeyId":91,"accountSyncCounter":1,"accountSettings":{"unarchiveChats":false},"registered":false,"account":{"details":"CNjylLMCEPKXl74GGAEgACgA","accountSignatureKey":"YCtfB2jhfxkSy3mPl5ArQsQTWvYXDt78RQEoyoLVRhc=","accountSignature":"rQOYbLqF+Khm4+inFn9s2uxj5HKA3/FRMQ6/VnSA74L8CLx3VeMJ5gSEMejd6NlSMUbvN7avjH68eot6dHKmBQ==","deviceSignature":"D254cbNPL8MaCX5Eqp8JaaxqnRfmteG4f+FZFljmlV1iZCZDjH1sFKj7fj/tNtWYGNqBVnJtFK3l+hxUK1GzBA=="},"me":{"id":"4915561048015:61@s.whatsapp.net","lid":"87819666116735:61@lid","name":"Martin"},"signalIdentities":[{"identifier":{"name":"4915561048015:61@s.whatsapp.net","deviceId":0},"identifierKey":{"type":"Buffer","data":"BWArXwdo4X8ZEst5j5eQK0LEE1r2Fw7e/EUBKMqC1UYX"}}],"platform":"android","routingInfo":{"type":"Buffer","data":"CAUIAg=="},"lastAccountSyncTimestamp":1741028206,"lastPropHash":"1K4hH4","myAppStateKeyId":"AAAAAA/g"}', // Empty default to ensure users provide their own
    authDir: platformConfig.isHeroku ? '/app/auth_info' : './auth_info',
    authBaileysDir: platformConfig.isHeroku ? '/app/auth_info_baileys' : './auth_info_baileys',
    printQRInTerminal: true, // Always show QR code
    browser: ['𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻', 'Chrome', '112.0.5615.49'],
    defaultQueryTimeoutMs: parseInt(process.env.QUERY_TIMEOUT) || sessionTimeout,
    connectTimeoutMs: parseInt(process.env.CONNECT_TIMEOUT) || 60000,
    qrTimeout: parseInt(process.env.QR_TIMEOUT) || 40000,
    keepAliveIntervalMs: parseInt(process.env.KEEP_ALIVE_INTERVAL) || 10000,
    emitOwnEvents: true,
    markOnlineOnConnect: true,
    retryRequestDelayMs: parseInt(process.env.RETRY_DELAY) || 2000,
    maxRetries: maxRetries,
    logLevel: 'silent', // Suppress all logs except QR code
    generateHighQualityLinkPreview: !platformConfig.isHeroku
};

const rawOwnerNumber = process.env.OWNER_NUMBER;
const formattedOwnerNumber = formatPhoneNumber(rawOwnerNumber);

if (!formattedOwnerNumber) {
    logger.error('Invalid OWNER_NUMBER format in environment variables');
    process.exit(1);
}

logger.info('Owner number formatted successfully:', formattedOwnerNumber);


const config = {
    prefix: process.env.PREFIX || '.',
    ownerNumber: formattedOwnerNumber,
    ownerName: process.env.OWNER_NAME,
    botName: process.env.BOT_NAME,
    botNumber: '',
    session: sessionConfig,
    commands: {
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
        runtime: {
            description: 'Check bot uptime',
            category: 'Basic',
            usage: '.runtime'
        },
        creator: {
            description: 'Show bot creator info',
            category: 'Basic',
            usage: '.creator'
        },
        botinfo: {
            description: 'Show detailed bot information',
            category: 'Basic',
            usage: '.botinfo'
        },
        serverinfo: {
            description: 'Show server information',
            category: 'Basic',
            usage: '.serverinfo'
        },
        speed: {
            description: 'Perform a speed test',
            category: 'Basic',
            usage: '.speed'
        },
        report: {
            description: 'Report a bug or issue',
            category: 'Basic',
            usage: '.report <message>'
        },
        request: {
            description: 'Request a feature',
            category: 'Basic',
            usage: '.request <feature>'
        },
        status: {
            description: 'Check bot status and stats',
            category: 'Basic',
            usage: '.status'
        },
        changelog: {
            description: 'View recent bot changes',
            category: 'Basic',
            usage: '.changelog'
        },
        currency: {
            description: 'Convert currency',
            category: 'Basic',
            usage: '.currency <amount> <from> <to>'
        },
        calculate: {
            description: 'Calculate mathematical expression',
            category: 'Basic',
            usage: '.calculate <expression>'
        },
        time: {
            description: 'Show time in different timezone',
            category: 'Basic',
            usage: '.time <timezone>'
        },
        weather: {
            description: 'Get weather information',
            category: 'Basic',
            usage: '.weather <location>'
        },
        translate: {
            description: 'Translate text',
            category: 'Basic',
            usage: '.translate <lang> <text>'
        },
        covid: {
            description: 'Get COVID-19 statistics',
            category: 'Basic',
            usage: '.covid <country>'
        },
        wiki: {
            description: 'Search Wikipedia',
            category: 'Basic',
            usage: '.wiki <query>'
        },
        urban: {
            description: 'Search Urban Dictionary',
            category: 'Basic',
            usage: '.urban <word>'
        },
        movie: {
            description: 'Get movie information',
            category: 'Basic',
            usage: '.movie <title>'
        },
        crypto: {
            description: 'Get cryptocurrency prices',
            category: 'Basic',
            usage: '.crypto <coin>'
        },
        news: {
            description: 'Get latest news',
            category: 'Basic',
            usage: '.news [category]'
        },
        quote: {
            description: 'Get random quote',
            category: 'Basic',
            usage: '.quote'
        },
        fact: {
            description: 'Get random fact',
            category: 'Basic',
            usage: '.fact'
        },
        github: {
            description: 'Get GitHub user/repo info',
            category: 'Basic',
            usage: '.github <username/repo>'
        },
        npm: {
            description: 'Search NPM packages',
            category: 'Basic',
            usage: '.npm <package>'
        },
        lyrics: {
            description: 'Find song lyrics',
            category: 'Basic',
            usage: '.lyrics <song>'
        },
        dictionary: {
            description: 'Look up word definition',
            category: 'Basic',
            usage: '.dictionary <word>'
        },
        reminder: {
            description: 'Set a reminder',
            category: 'Basic',
            usage: '.reminder <time> <message>'
        },
        poll: {
            description: 'Create a poll',
            category: 'Basic',
            usage: '.poll <question> | <option1> | <option2>'
        },
        shorturl: {
            description: 'Shorten a URL',
            category: 'Basic',
            usage: '.shorturl <url>'
        },
        qr: {
            description: 'Generate QR code',
            category: 'Basic',
            usage: '.qr <text/url>'
        },
        base64: {
            description: 'Encode/decode base64',
            category: 'Basic',
            usage: '.base64 <encode/decode> <text>'
        },
        binary: {
            description: 'Convert text to/from binary',
            category: 'Basic',
            usage: '.binary <encode/decode> <text>'
        },
        morse: {
            description: 'Convert text to/from morse code',
            category: 'Basic',
            usage: '.morse <encode/decode> <text>'
        },
        hex: {
            description: 'Convert text to/from hexadecimal',
            category: 'Basic',
            usage: '.hex <encode/decode> <text>'
        },
        unit: {
            description: 'Convert units',
            category: 'Basic',
            usage: '.unit <value> <from> <to>'
        },
        timezone: {
            description: 'Convert between timezones',
            category: 'Basic',
            usage: '.timezone <time> <from> <to>'
        },
        worldclock: {
            description: 'Show time in multiple cities',
            category: 'Basic',
            usage: '.worldclock'
        },
        calendar: {
            description: 'Show calendar',
            category: 'Basic',
            usage: '.calendar [month] [year]'
        },
        countdown: {
            description: 'Start a countdown timer',
            category: 'Basic',
            usage: '.countdown <minutes>'
        },
        stopwatch: {
            description: 'Start/stop a stopwatch',
            category: 'Basic',
            usage: '.stopwatch <start/stop>'
        },
        random: {
            description: 'Generate random number',
            category: 'Basic',
            usage: '.random <min> <max>'
        },
        color: {
            description: 'Get color information',
            category: 'Basic',
            usage: '.color <hex/rgb>'
        },
        email: {
            description: 'Validate email address',
            category: 'Basic',
            usage: '.email <address>'
        },
        password: {
            description: 'Generate secure password',
            category: 'Basic',
            usage: '.password [length]'
        },
        uuid: {
            description: 'Generate UUID',
            category: 'Basic',
            usage: '.uuid'
        },
        // AI Commands
        ai: { 
            description: 'Chat with AI using GPT-3.5', 
            category: 'AI',
            usage: '.ai <your message>'
        },
        gpt: { 
            description: 'Advanced chat with GPT-4 (with conversation history)', 
            category: 'AI',
            usage: '.gpt <your message>'
        },
        dalle: { 
            description: 'Generate images with DALL-E', 
            category: 'AI',
            usage: '.dalle <image description>'
        },
        dalleEdit: {
            description: 'Edit an AI-generated image',
            category: 'AI',
            usage: 'Reply to an image with .dalle-edit <instructions>'
        },
        clearChat: {
            description: 'Clear AI conversation history',
            category: 'AI',
            usage: '.clearchat'
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
        grouplb: {
            description: 'View group XP leaderboard',
            category: 'Group',
            usage: '.grouplb'
        },
        // User Commands
        profile: {
            description: 'View user profile',
            category: 'User',
            usage: '.profile [@user]'
        },
        afk: {
            description: 'Set your AFK status',
            category: 'User',
            usage: '.afk [reason]'
        },
        stats: {
            description: 'View your usage statistics',
            category: 'User',
            usage: '.stats'
        },
        about: {
            description: 'View detailed information about yourself',
            category: 'User',
            usage: '.about'
        },
        register: {
            description: 'Register your profile',
            category: 'User',
            usage: '.register <name> <age>'
        },
        nickname: {
            description: 'Set your nickname',
            category: 'User',
            usage: '.nickname <name>'
        },
        bio: {
            description: 'Set your bio',
            category: 'User',
            usage: '.bio <text>'
        },
        status: {
            description: 'Set your status message',
            category: 'User',
            usage: '.status <message>'
        },
        language: {
            description: 'Set your preferred language',
            category: 'User',
            usage: '.language <code>'
        },
        timezone: {
            description: 'Set your timezone',
            category: 'User',
            usage: '.timezone <timezone>'
        },
        birthday: {
            description: 'Set your birthday',
            category: 'User',
            usage: '.birthday <date>'
        },
        gender: {
            description: 'Set your gender',
            category: 'User',
            usage: '.gender <gender>'
        },
        location: {
            description: 'Set your location',
            category: 'User',
            usage: '.location <place>'
        },
        privacy: {
            description: 'Manage privacy settings',
            category: 'User',
            usage: '.privacy <setting> <value>'
        },
        block: {
            description: 'Block a user',
            category: 'User',
            usage: '.block @user'
        },
        unblock: {
            description: 'Unblock a user',
            category: 'User',
            usage: '.unblock @user'
        },
        blocklist: {
            description: 'View blocked users',
            category: 'User',
            usage: '.blocklist'
        },
        mute: {
            description: 'Mute notifications from a user',
            category: 'User',
            usage: '.mute @user'
        },
        unmute: {
            description: 'Unmute notifications from a user',
            category: 'User',
            usage: '.unmute @user'
        },
        mutelist: {
            description: 'View muted users',
            category: 'User',
            usage: '.mutelist'
        },
        level: {
            description: 'Check your current level and XP',
            category: 'User',
            usage: '.level'
        },
        rank: {
            description: 'View your ranking',
            category: 'User',
            usage: '.rank'
        },
        leaderboard: {
            description: 'View global XP leaderboard',
            category: 'User',
            usage: '.leaderboard'
        },
        daily: {
            description: 'Claim daily rewards',
            category: 'User',
            usage: '.daily'
        },
        inventory: {
            description: 'View your inventory',
            category: 'User',
            usage: '.inventory'
        },
        shop: {
            description: 'View available items in shop',
            category: 'User',
            usage: '.shop'
        },
        buy: {
            description: 'Buy items from shop',
            category: 'User',
            usage: '.buy <item>'
        },
        sell: {
            description: 'Sell items from inventory',
            category: 'User',
            usage: '.sell <item>'
        },
        gift: {
            description: 'Gift items to other users',
            category: 'User',
            usage: '.gift @user <item>'
        },
        transfer: {
            description: 'Transfer coins to other users',
            category: 'User',
            usage: '.transfer @user <amount>'
        },
        achievements: {
            description: 'View your achievements',
            category: 'User',
            usage: '.achievements'
        },
        quests: {
            description: 'View available quests',
            category: 'User',
            usage: '.quests'
        },
        claim: {
            description: 'Claim quest rewards',
            category: 'User',
            usage: '.claim <quest_id>'
        },
        report: {
            description: 'Report a user',
            category: 'User',
            usage: '.report @user <reason>'
        },
        feedback: {
            description: 'Send feedback about the bot',
            category: 'User',
            usage: '.feedback <message>'
        },
        help: {
            description: 'Get help with user commands',
            category: 'User',
            usage: '.help user'
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
        banlist: {
            description: 'View list of banned users',
            category: 'Owner',
            usage: '.banlist'
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
        eval: {
            description: 'Evaluate JavaScript code',
            category: 'Owner',
            usage: '.eval <code>'
        },
        getStatus: {
            description: 'Get bot status and statistics',
            category: 'Owner',
            usage: '.status'
        },
        clearcache: {
            description: 'Clear bot cache files',
            category: 'Owner',
            usage: '.clearcache'
        },
        shutdown: {
            description: 'Shut down the bot',
            category: 'Owner',
            usage: '.shutdown'
        },
        setowner: {
            description: 'Set new bot owner',
            category: 'Owner',
            usage: '.setowner <number>'
        },
        maintenance: {
            description: 'Toggle maintenance mode',
            category: 'Owner',
            usage: '.maintenance on/off'
        },
        settings: {
            description: 'View bot settings',
            category: 'Owner',
            usage: '.settings'
        },
        backup: {
            description: 'Create bot backup',
            category: 'Owner',
            usage: '.backup'
        },
        update: {
            description: 'Update bot from repository',
            category: 'Owner',
            usage: '.update'
        },
        config: {
            description: 'View/edit bot configuration',
            category: 'Owner',
            usage: '.config [set <key> <value>]'
        },
        setprefix: {
            description: 'Change bot command prefix',
            category: 'Owner',
            usage: '.setprefix <new_prefix>'
        },
        setname: {
            description: 'Change bot display name',
            category: 'Owner',
            usage: '.setname <new_name>'
        },
        setbio: {
            description: 'Change bot bio/status',
            category: 'Owner',
            usage: '.setbio <new_bio>'
        },
        setppbot: {
            description: 'Change bot profile picture',
            category: 'Owner',
            usage: '.setppbot [reply to image]'
        },
        ban: {
            description: 'Ban user from using bot',
            category: 'Owner',
            usage: '.ban @user'
        },
        unban: {
            description: 'Unban user from using bot',
            category: 'Owner',
            usage: '.unban @user'
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
        transfer: {
            description: 'Transfer coins to others',
            category: 'Economy',
            usage: '.transfer @user <amount>'
        },
        // Fun Commands
        magic8ball: {
            description: 'Ask the Magic 8 Ball',
            category: 'Fun',
            usage: '.magic8ball <question>'
        },
        joke: {
            description: 'Get a random joke',
            category: 'Fun',
            usage: '.joke'
        },
        quote: {
            description: 'Get an inspirational quote',
            category: 'Fun',
            usage: '.quote'
        },
        dare: {
            description: 'Get a dare challenge',
            category: 'Fun',
            usage: '.dare'
        },
        truth: {
            description: 'Get a truth question',
            category: 'Fun',
            usage: '.truth'
        },
        ship: {
            description: 'Calculate love compatibility',
            category: 'Fun',
            usage: '.ship @user1 @user2'
        },
        roast: {
            description: 'Get a funny roast',
            category: 'Fun',
            usage: '.roast'
        },
        compliment: {
            description: 'Get a nice compliment',
            category: 'Fun',
            usage: '.compliment'
        },
        pickup: {
            description: 'Get a pickup line',
            category: 'Fun',
            usage: '.pickup'
        },
        fact: {
            description: 'Get an interesting fact',
            category: 'Fun',
            usage: '.fact'
        },
        darkjoke: {
            description: 'Get a dark humor joke',
            category: 'Fun',
            usage: '.darkjoke'
        },
        // Anime Commands
        manga: { 
            description: 'Search manga information', 
            category: 'Anime',
            usage: '.manga <name>'
        },
        character: { 
            description: 'Search anime character info', 
            category: 'Anime',
            usage: '.character <name>'
        },
        schedule: { 
            description: 'Show anime broadcast schedule', 
            category: 'Anime',
            usage: '.schedule [day]'
        },
        airing: { 
            description: 'Show currently airing anime', 
            category: 'Anime',
            usage: '.airing'
        },
        upcoming: { 
            description: 'Show upcoming anime', 
            category: 'Anime',
            usage: '.upcoming'
        },
        recommended: { 
            description: 'Get anime recommendations', 
            category: 'Anime',
            usage: '.recommended'
        },
        genre: { 
            description: 'Browse anime by genre', 
            category: 'Anime',
            usage: '.genre [id]'
        },
        studio: { 
            description: 'Search anime by studio', 
            category: 'Anime',
            usage: '.studio <name>'
        },
        seasonal: { 
            description: 'View seasonal anime', 
            category: 'Anime',
            usage: '.seasonal [year] [season]'
        },
        top: { 
            description: 'View top anime/manga', 
            category: 'Anime',
            usage: '.top <anime/manga>'
        },
        trending: { 
            description: 'Show trending anime/manga', 
            category: 'Anime',
            usage: '.trending <anime/manga>'
        },
        anime: { 
            description: 'Search anime information', 
            category: 'Anime',
            usage: '.anime <name>'
        },
        waifu: { 
            description: 'Get random waifu image', 
            category: 'Anime',
            usage: '.waifu'
        },
        neko: { 
            description: 'Get random neko image', 
            category: 'Anime',
            usage: '.neko'
        },
        hentai: { 
            description: 'NSFW content (NSFW chats only)', 
            category: 'Anime',
            usage: '.hentai'
        },
        couplepp: { 
            description: 'Get couple profile pictures', 
            category: 'Anime',
            usage: '.couplepp'
        },
        wallpaper: { 
            description: 'Get anime wallpapers', 
            category: 'Anime',
            usage: '.wallpaper'
        },
        cosplay: { 
            description: 'Get anime cosplay images', 
            category: 'Anime',
            usage: '.cosplay'
        },
        fanart: { 
            description: 'Get anime fanart', 
            category: 'Anime',
            usage: '.fanart'
        },
        // Reaction Commands
        slap: {
            description: 'Slap another user',
            category: 'Reactions',
            usage: '.slap @user'
        },
        hug: {
            description: 'Hug another user',
            category: 'Reactions',
            usage: '.hug @user'
        },
        pat: {
            description: 'Pat another user',
            category: 'Reactions',
            usage: '.pat @user'
        },
        kiss: {
            description: 'Kiss another user',
            category: 'Reactions',
            usage: '.kiss @user'
        },
        punch: {
            description: 'Punch another user',
            category: 'Reactions',
            usage: '.punch @user'
        },
        kill: {
            description: 'Eliminate another user',
            category: 'Reactions',
            usage: '.kill @user'
        },
        wasted: {
            description: 'Mark someone as wasted',
            category: 'Reactions',
            usage: '.wasted@user'
        },
        poke: {
            description: 'Poke another user',
            category: 'Reactions',
            usage: '.poke @user'
        },
        cuddle: {
            description: 'Cuddle with another user',
            category: 'Reactions',
            usage: '.cuddle @user'
        },
        boop: {
            description: 'Boop another user',
            category: 'Reactions',
            usage: '.boop @user'
        },
        bonk: {
            description: 'Bonk another user',
            category: 'Reactions',
            usage: '.bonk @user'
        },
        rip: {
            description: 'Pay respects',
            category: 'Reactions',
            usage: '.rip @user'
        },
        wave: {
            description: 'Wave at someone',
            category: 'Reactions',
            usage: '.wave @user'
        },
        yeet: {
            description: 'Yeet someone',
            category: 'Reactions',
            usage: '.yeet @user'
        },
        smile: {
            description: 'Show a smile',
            category: 'Reactions',
            usage: '.smile'
        },
        dance: {
            description: 'Dance',
            category: 'Reactions',
            usage: '.dance'
        },
        highfive: {
            description: 'High five another user',
            category: 'Reactions',
            usage: '.highfive @user'
        },
        thumbsup: {
            description: 'Give a thumbs up',
            category: 'Reactions',
            usage: '.thumbsup'
        },
        thumbsdown: {
            description: 'Give a thumbs down',
            category: 'Reactions',
            usage: '.thumbsdown'
        },
        // NSFW Commands
        nsfwcheck: {
            description: 'Check NSFW access status',
            category: 'NSFW',            usage: '.nsfwcheck'
        },
        setnsfw: {
            description: 'Enable/disable NSFW in group (admin only)',
            category: 'NSFW',
            usage: '.setnsfw on/off'
        },
        nsfwstatus: {
            description: 'View NSFW settings',
            category: 'NSFW',
            usage: '.nsfwstatus'
        },
        trap: {
            description: 'Get trap NSFW content',
            category: 'NSFW',
            usage: '.trap'
        },
        blowjob: {
            description: 'Get blowjob NSFW content',
            category: 'NSFW',
            usage: '.blowjob'
        },
        ass: {
            description: 'Get ass NSFW content',
            category: 'NSFW',
            usage: '.ass'
        },
        milf: {
            description: 'Get milf NSFW content',
            category: 'NSFW',
            usage: '.milf'
        },
        oral: {
            description: 'Get oral NSFW content',
            category: 'NSFW',
            usage: '.oral'
        },
        paizuri: {
            description: 'Get paizuri NSFW content',
            category: 'NSFW',
            usage: '.paizzuri'
        },
        ecchi: {
            description: 'Get ecchi content',
            category: 'NSFW',
            usage: '.ecchi'
        },
        ero: {
            description: 'Get ero content',
            category: 'NSFW',
            usage: '.ero'
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
        play: { 
            description: 'Play music or audio from YouTube', 
            category: 'Media',
            usage: '.play <song name/URL>'
        },
        stop: { 
            description: 'Stop current music playback', 
            category: 'Media',
            usage: '.stop'
        },
        skip: { 
            description: 'Skip current song', 
            category: 'Media',
            usage: '.skip'
        },
        queue: { 
            description: 'View musicqueue', 
            category: 'Media',
            usage: '.queue'
        },
        pause: { 
            description: 'Pause music playback', 
            category: 'Media',
            usage: '.pause'
        },
        resume: { 
            description: 'Resume music playback', 
            category: 'Media',
            usage: '.resume'
        },
        lyrics: { 
            description: 'Show lyrics of current song', 
            category: 'Media',
            usage: '.lyrics'
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
        wordgame: {
            description: 'Play word guessing game',
            category: 'Game',
            usage: '.wordgame'
        },
        guess: {
            description: 'Make a guess in word game',
            category: 'Game',
            usage: '.guess <word>'
        },
        trivia: {
            description: 'Play trivia quiz',
            category: 'Game',
            usage: '.trivia'
        },
        answer: {
            description: 'Answer trivia question',
            category: 'Game',
            usage: '.answer <number>'
        },
        rps: {
            description: 'Play Rock Paper Scissors',
            category: 'Game',
            usage: '.rps <rock/paper/scissors>'
        },
        roll: {
            description: 'Roll a dice',
            category: 'Game',
            usage: '.roll [max number]'
        },
        coinflip: {
            description: 'Flip a coin',
            category: 'Game',
            usage: '.coinflip'
        },
        would: {
            description: 'Play Would You Rather game',
            category: 'Game',
            usage: '.would'
        },
        never: {
            description: 'Play Never Have I Ever game',
            category: 'Game',
            usage: '.never'
        },
        riddle: {
            description: 'Play riddle game',
            category: 'Game',
            usage: '.riddle'
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
        }
    }
};

// Log deployment configuration
logger.info('Bot configuration initialized:', {
    environment: platformConfig.isHeroku ? 'Heroku' : (platformConfig.isDocker ? 'Docker' : 'Local'),
    prefix: config.prefix,
    botName: config.botName,
    sessionId: config.session.id,
    authDir: config.session.authDir,
    logLevel: config.session.logLevel,
    workers: platformConfig.workers,
    port: platformConfig.port,
    host: platformConfig.host
});

module.exports = config;
