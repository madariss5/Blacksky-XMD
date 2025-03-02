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

module.exports = {
    prefix: '.',  // Command prefix
    ownerNumber: formattedOwnerNumber,
    ownerName: process.env.OWNER_NAME || 'BLACKSKY',
    botName: '𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻',
    botNumber: '', // Will be set after connection
    menuImage: 'https://raw.githubusercontent.com/your-repo/assets/main/f9.jpg',
    // Session Configuration
    session: {
        // Session identification
        id: "blacksky-md",

        // Authentication settings
        authDir: './auth_info_baileys',
        printQRInTerminal: true,

        // Browser identification
        browser: ['𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻', 'Chrome', '112.0.5615.49'],

        // Connection timeouts
        defaultQueryTimeoutMs: 60000,
        connectTimeoutMs: 60000,
        qrTimeout: 40000,
        keepAliveIntervalMs: 10000,

        // Connection behavior
        emitOwnEvents: true,
        markOnlineOnConnect: true,
        retryRequestDelayMs: 2000,

        // Logging
        logLevel: 'silent',

        // Backup settings
        backupInterval: 24 * 60 * 60 * 1000, // 24 hours
        maxBackupFiles: 7,
        backupDir: './session_backups'
    },

    commands: {
        // AI Commands (Updated)
        ai: { description: 'Chat with AI assistant (GPT-3.5)', category: 'AI' },
        gpt: { description: 'Advanced chat with GPT-4', category: 'AI' },
        imagine: { description: 'Generate images with Stable Diffusion', category: 'AI' },
        dalle: { description: 'Generate images with DALL-E 3', category: 'AI' },
        remini: { description: 'Enhance image quality', category: 'AI' },
        blackbox: { description: 'AI code generation and explanation', category: 'AI' },
        img2txt: { description: 'Analyze and describe images', category: 'AI' },
        tts: { description: 'Convert text to speech', category: 'AI' },
        cleargpt: { description: 'Clear GPT chat history', category: 'AI' },

        // Media Commands (Extended)
        sticker: { description: 'Create sticker from image/video', category: 'Media' },
        toimg: { description: 'Convert sticker to image', category: 'Media' },
        tomp3: { description: 'Convert video to audio', category: 'Media' },
        tovn: { description: 'Convert audio to voice note', category: 'Media' },
        togif: { description: 'Convert video sticker to gif', category: 'Media' },
        tourl: { description: 'Upload media to url', category: 'Media' },
        play: { description: 'Play audio from YouTube', category: 'Media' },
        song: { description: 'Download and play songs', category: 'Media' },
        video: { description: 'Download and play videos', category: 'Media' },
        playlist: { description: 'Create and play playlists', category: 'Media' },
        cropimg: { description: 'Crop image to square', category: 'Media' },
        invert: { description: 'Invert image colors', category: 'Media' },
        grayscale: { description: 'Convert image to grayscale', category: 'Media' },
        pixelate: { description: 'Pixelate an image', category: 'Media' },
        rotate: { description: 'Rotate image by specified degrees', category: 'Media' },
        blur: { description: 'Apply blur effect to image', category: 'Media' },
        circle: { description: 'Make image circular', category: 'Media' },
        // New Media Commands
        bass: { description: 'Enhance bass in audio', category: 'Media' },
        nightcore: { description: 'Apply nightcore effect to audio', category: 'Media' },
        slow: { description: 'Slow down audio', category: 'Media' },
        fast: { description: 'Speed up audio', category: 'Media' },
        reverse: { description: 'Reverse audio/video', category: 'Media' },
        movie: { description: 'Search movie information', category: 'Media' },
        spotify: { description: 'Download Spotify tracks', category: 'Media' },
        instagram: { description: 'Download Instagram content', category: 'Media' },
        facebook: { description: 'Download Facebook videos', category: 'Media' },
        tiktok: { description: 'Download TikTok videos', category: 'Media' },
        twitter: { description: 'Download Twitter videos', category: 'Media' },
        pinterest: { description: 'Download Pinterest media', category: 'Media' },
        mediafire: { description: 'Download MediaFire files', category: 'Media' },
        imgur: { description: 'Upload image to Imgur', category: 'Media' },
        removebg: { description: 'Remove image background', category: 'Media' },
        watermark: { description: 'Add watermark to image', category: 'Media' },
        meme: { description: 'Generate custom meme', category: 'Media' },
        qrcode: { description: 'Generate QR code', category: 'Media' },
        ocr: { description: 'Extract text from image', category: 'Media' },

        // Game Commands (Extended)
        rpg: { description: 'View RPG game status', category: 'Game' },
        quest: { description: 'Start a new RPG quest', category: 'Game' },
        battle: { description: 'Battle another player', category: 'Game' },
        tictactoe: { description: 'Play TicTacToe', category: 'Game' },
        chess: { description: 'Play chess', category: 'Game' },
        suit: { description: 'Play Rock Paper Scissors', category: 'Game' },
        // New Game Commands
        adventure: { description: 'Start an adventure', category: 'Game' },
        mining: { description: 'Mine for resources', category: 'Game' },
        fishing: { description: 'Go fishing for items', category: 'Game' },
        gambling: { description: 'Gamble your coins', category: 'Game' },
        slots: { description: 'Play slot machine', category: 'Game' },
        lottery: { description: 'Buy lottery tickets', category: 'Game' },
        blackjack: { description: 'Play blackjack', category: 'Game' },
        poker: { description: 'Play poker', category: 'Game' },
        roulette: { description: 'Play roulette', category: 'Game' },
        hangman: { description: 'Play hangman', category: 'Game' },
        wordle: { description: 'Play Wordle game', category: 'Game' },
        akinator: { description: 'Play Akinator', category: 'Game' },
        typing: { description: 'Typing speed game', category: 'Game' },
        mathquiz: { description: 'Math quiz game', category: 'Game' },
        trivial: { description: 'Trivia quiz game', category: 'Game' },

        // Tools Commands (Extended)
        calc: { description: 'Calculator', category: 'Tools' },
        translate: { description: 'Translate text', category: 'Tools' },
        weather: { description: 'Check weather info', category: 'Tools' },
        dictionary: { description: 'Look up word definitions', category: 'Tools' },
        // New Tools Commands
        covid: { description: 'Get COVID-19 statistics', category: 'Tools' },
        currency: { description: 'Currency converter', category: 'Tools' },
        ip: { description: 'IP address lookup', category: 'Tools' },
        whois: { description: 'Domain information lookup', category: 'Tools' },
        github: { description: 'GitHub user/repo info', category: 'Tools' },
        wikipedia: { description: 'Search Wikipedia', category: 'Tools' },
        urban: { description: 'Urban Dictionary lookup', category: 'Tools' },
        lyrics: { description: 'Find song lyrics', category: 'Tools' },
        crypto: { description: 'Cryptocurrency prices', category: 'Tools' },
        stocks: { description: 'Stock market info', category: 'Tools' },
        news: { description: 'Get latest news', category: 'Tools' },
        timezone: { description: 'Check time zones', category: 'Tools' },
        reminder: { description: 'Set reminders', category: 'Tools' },
        poll: { description: 'Create polls', category: 'Tools' },
        schedule: { description: 'Schedule messages', category: 'Tools' },

        // Fun Commands (Extended)
        truth: { description: 'Get a truth question', category: 'Fun' },
        dare: { description: 'Get a dare challenge', category: 'Fun' },
        // New Fun Commands
        ship: { description: 'Ship two users', category: 'Fun' },
        roast: { description: 'Roast someone', category: 'Fun' },
        compliment: { description: 'Compliment someone', category: 'Fun' },
        pickup: { description: 'Get pickup lines', category: 'Fun' },
        joke: { description: 'Get random jokes', category: 'Fun' },
        riddle: { description: 'Get riddles', category: 'Fun' },
        fact: { description: 'Random interesting facts', category: 'Fun' },
        would: { description: 'Would you rather', category: 'Fun' },
        never: { description: 'Never have I ever', category: 'Fun' },
        quote: { description: 'Random quotes', category: 'Fun' },
        darkjoke: { description: 'Dark humor jokes', category: 'Fun' },
        roastme: { description: 'Get roasted by bot', category: 'Fun' },
        wholesome: { description: 'Wholesome messages', category: 'Fun' },
        fortune: { description: 'Get fortune cookie', category: 'Fun' },
        horoscope: { description: 'Daily horoscope', category: 'Fun' },

        // Group Commands (Extended)
        kick: { description: 'Kick member from group', category: 'Group' },
        add: { description: 'Add member to group', category: 'Group' },
        promote: { description: 'Promote member to admin', category: 'Group' },
        demote: { description: 'Demote admin to member', category: 'Group' },
        // New Group Commands
        warn: { description: 'Warn a member', category: 'Group' },
        unwarn: { description: 'Remove warning from member', category: 'Group' },
        warnings: { description: 'Check member warnings', category: 'Group' },
        antilink: { description: 'Toggle anti-link', category: 'Group' },
        antispam: { description: 'Toggle anti-spam', category: 'Group' },
        antiraid: { description: 'Toggle anti-raid', category: 'Group' },
        welcome: { description: 'Toggle welcome messages', category: 'Group' },
        goodbye: { description: 'Toggle goodbye messages', category: 'Group' },
        setwelcome: { description: 'Set welcome message', category: 'Group' },
        setgoodbye: { description: 'Set goodbye message', category: 'Group' },
        grouplock: { description: 'Lock group chat', category: 'Group' },
        groupunlock: { description: 'Unlock group chat', category: 'Group' },
        groupsettings: { description: 'Group settings menu', category: 'Group' },
        groupinfo: { description: 'Get group information', category: 'Group' },
        grouplink: { description: 'Get group invite link', category: 'Group' },

        // Reaction Commands (Extended)
        slap: { description: 'Slap someone', category: 'Reactions' },
        hug: { description: 'Hug someone', category: 'Reactions' },
        pat: { description: 'Pat someone', category: 'Reactions' },
        // New Reaction Commands
        bite: { description: 'Bite someone', category: 'Reactions' },
        blush: { description: 'Show that you are blushing', category: 'Reactions' },
        cry: { description: 'Show that you are crying', category: 'Reactions' },
        dance: { description: 'Show dancing', category: 'Reactions' },
        laugh: { description: 'Show laughing', category: 'Reactions' },
        poke: { description: 'Poke someone', category: 'Reactions' },
        smile: { description: 'Show smiling', category: 'Reactions' },
        stare: { description: 'Stare at someone', category: 'Reactions' },
        wave: { description: 'Wave at someone', category: 'Reactions' },
        wink: { description: 'Wink at someone', category: 'Reactions' },
        yeet: { description: 'Yeet someone', category: 'Reactions' },
        thumbsup: { description: 'Give thumbs up', category: 'Reactions' },
        thumbsdown: { description: 'Give thumbs down', category: 'Reactions' },
        highfive: { description: 'High five someone', category: 'Reactions' },

        // NSFW Commands
        nsfwcheck: { description: 'Check NSFW status', category: 'NSFW' },
        setnsfw: { description: 'Enable/disable NSFW in group', category: 'NSFW' },
        waifu: { description: 'Get NSFW waifu image', category: 'NSFW' },
        neko: { description: 'Get NSFW neko image', category: 'NSFW' },
        trap: { description: 'Get NSFW trap image', category: 'NSFW' },
        blowjob: { description: 'Get NSFW image', category: 'NSFW' },
        ass: { description: 'Get NSFW ass image', category: 'NSFW' },
        hentai: { description: 'Get NSFW hentai image', category: 'NSFW' },
        milf: { description: 'Get NSFW milf image', category: 'NSFW' },
        oral: { description: 'Get NSFW oral image', category: 'NSFW' },
        paizuri: { description: 'Get NSFW paizuri image', category: 'NSFW' },
        ecchi: { description: 'Get NSFW ecchi image', category: 'NSFW' },
        ero: { description: 'Get NSFW ero image', category: 'NSFW' },

        // Owner Commands
        broadcast: { description: 'Send message to all chats', category: 'Owner' },
        block: { description: 'Block a user', category: 'Owner' },
        unblock: { description: 'Unblock a user', category: 'Owner' },
        setbotpp: { description: 'Set bot profile picture', category: 'Owner' },
        setbotbio: { description: 'Set bot bio', category: 'Owner' },
        eval: { description: 'Evaluate JavaScript code', category: 'Owner' },
        restart: { description: 'Restart bot system', category: 'Owner' },
        shutdown: { description: 'Shutdown bot system', category: 'Owner' },
        join: { description: 'Join a group via invite link', category: 'Owner' },
        leave: { description: 'Leave a group', category: 'Owner' },
        clearall: { description: 'Clear all chats', category: 'Owner' },
        update: { description: 'Update bot from source', category: 'Owner' },
        setprefix: { description: 'Change bot prefix', category: 'Owner' },
        setstatus: { description: 'Set WhatsApp status', category: 'Owner' },
        setname: { description: 'Change bot display name', category: 'Owner' },
        ban: { description: 'Ban user from using bot', category: 'Owner' },
        unban: { description: 'Unban user from using bot', category: 'Owner' },
        addpremium: { description: 'Add user to premium list', category: 'Owner' },
        delpremium: { description: 'Remove user from premium list', category: 'Owner' },
        listpremium: { description: 'Show list of premium users', category: 'Owner' },
        listban: { description: 'Show list of banned users', category: 'Owner' },
        bc: { description: 'Broadcast message to specific groups', category: 'Owner' },
        bcgc: { description: 'Broadcast message to all groups', category: 'Owner' },
        bcpc: { description: 'Broadcast message to private chats', category: 'Owner' },
        getcase: { description: 'Get command source code', category: 'Owner' },
        addcmd: { description: 'Add custom command', category: 'Owner' },
        delcmd: { description: 'Delete custom command', category: 'Owner' },
        listcmd: { description: 'List all custom commands', category: 'Owner' },
        maintenance: { description: 'Toggle maintenance mode', category: 'Owner' },
        backup: { description: 'Backup bot data', category: 'Owner' },
        restore: { description: 'Restore bot data', category: 'Owner' },
        resetuser: { description: 'Reset user data', category: 'Owner' },
        setlimit: { description: 'Set user command limits', category: 'Owner' },
        addmod: { description: 'Add bot moderator', category: 'Owner' },
        delmod: { description: 'Remove bot moderator', category: 'Owner' },
        listmod: { description: 'List all moderators', category: 'Owner' },
        setmenu: { description: 'Customize menu appearance', category: 'Owner' },
        setthumb: { description: 'Set bot thumbnail', category: 'Owner' },
        setwelcome: { description: 'Set default welcome message', category: 'Owner' },
        setgoodbye: { description: 'Set default goodbye message', category: 'Owner' },
        setantilink: { description: 'Configure antilink settings', category: 'Owner' },
        setantispam: { description: 'Configure antispam settings', category: 'Owner' },
        debugmode: { description: 'Toggle debug logging', category: 'Owner' },
        cleartmp: { description: 'Clear temporary files', category: 'Owner' },
        setapi: { description: 'Set API keys', category: 'Owner' },
        system: { description: 'View system statistics', category: 'Owner' },
        premium: { description: 'Manage premium features', category: 'Owner' }
    }
};