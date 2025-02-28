module.exports = {
    prefix: '.',  // Command prefix
    ownerNumber: process.env.OWNER_NUMBER || '4915561048015@s.whatsapp.net',  // Default owner number
    ownerName: process.env.OWNER_NAME || 'BLACKSKY',
    botName: '𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻',
    botNumber: '', // Will be set after connection
    menuImage: 'https://raw.githubusercontent.com/your-repo/assets/main/f9.jpg',
    commands: {
        // Basic Commands
        menu: { description: 'Show main menu with all commands', category: 'Basic' },
        help: { description: 'Get detailed help for specific commands', category: 'Basic' },
        ping: { description: 'Check bot response time and status', category: 'Basic' },
        info: { description: 'View bot information and stats', category: 'Basic' },
        runtime: { description: 'Check bot uptime', category: 'Basic' },
        speed: { description: 'Test bot response speed', category: 'Basic' },

        // Media & Sticker Commands
        sticker: { description: 'Create sticker from image/video', category: 'Media' },
        stickermeme: { description: 'Create meme sticker', category: 'Media' },
        toimg: { description: 'Convert sticker to image', category: 'Media' },
        tomp3: { description: 'Convert video to audio', category: 'Media' },
        tovn: { description: 'Convert audio to voice note', category: 'Media' },
        emojimix: { description: 'Mix two emojis into one sticker', category: 'Media' },
        quotely: { description: 'Create quote sticker', category: 'Media' },
        tts: { description: 'Convert text to speech', category: 'Media' },

        // Image Effect Commands
        blur: { description: 'Add blur effect to image', category: 'Media' },
        circle: { description: 'Make image circular', category: 'Media' },
        jail: { description: 'Add jail bars effect', category: 'Media' },
        triggered: { description: 'Create triggered effect', category: 'Media' },
        wasted: { description: 'Add GTA wasted effect', category: 'Media' },
        rip: { description: 'Create RIP memorial effect', category: 'Media' },
        trash: { description: 'Create trash effect', category: 'Media' },
        rainbow: { description: 'Create rainbow effect', category: 'Media' },
        invert: { description: 'Create invert effect', category: 'Media' },
        pixelate: { description: 'Create pixel effect', category: 'Media' },
        sepia: { description: 'Create sepia effect', category: 'Media' },
        wanted: { description: 'Create wanted poster', category: 'Media' },

        // Fun & Reaction Commands
        slap: { description: 'Slap someone with anime gif', category: 'Fun' },
        hug: { description: 'Give someone a warm hug', category: 'Fun' },
        pat: { description: 'Pat someone gently', category: 'Fun' },
        punch: { description: 'Playfully punch someone', category: 'Fun' },
        kiss: { description: 'Send a virtual kiss', category: 'Fun' },
        bonk: { description: 'Bonk someone on the head', category: 'Fun' },
        highfive: { description: 'Give a high five', category: 'Fun' },
        dance: { description: 'Show off your dance moves', category: 'Fun' },
        yeet: { description: 'Yeet someone into space', category: 'Fun' },
        cuddle: { description: 'Cuddle with someone sweetly', category: 'Fun' },
        wave: { description: 'Wave at someone', category: 'Fun' },
        poke: { description: 'Poke someone playfully', category: 'Fun' },
        wink: { description: 'Wink at someone', category: 'Fun' },
        facepalm: { description: 'Express your disappointment', category: 'Fun' },

        // Game Commands
        truth: { description: 'Get a random truth question', category: 'Game' },
        dare: { description: 'Get a random dare challenge', category: 'Game' },
        coinflip: { description: 'Flip a coin', category: 'Game' },
        dice: { description: 'Roll a dice', category: 'Game' },
        slots: { description: 'Play slot machine', category: 'Game' },
        blackjack: { description: 'Play blackjack', category: 'Game' },
        roulette: { description: 'Play roulette', category: 'Game' },
        wordgame: { description: 'Play word guessing game', category: 'Game' },
        trivia: { description: 'Play trivia game', category: 'Game' },

        // Downloader Commands
        ytmp3: { description: 'Download YouTube audio (High Quality)', category: 'Downloader' },
        ytmp4: { description: 'Download YouTube video (HD)', category: 'Downloader' },
        play: { description: 'Search and play YouTube audio', category: 'Music' },
        video: { description: 'Search and play YouTube video', category: 'Downloader' },
        tiktok: { description: 'Download TikTok video without watermark', category: 'Downloader' },
        instagram: { description: 'Download Instagram posts/reels', category: 'Downloader' },
        facebook: { description: 'Download Facebook videos', category: 'Downloader' },
        twitter: { description: 'Download Twitter videos/images', category: 'Downloader' },
        pinterest: { description: 'Download Pinterest media', category: 'Downloader' },
        mediafire: { description: 'Download MediaFire files', category: 'Downloader' },
        gdrive: { description: 'Download Google Drive files', category: 'Downloader' },
        mega: { description: 'Download MEGA files', category: 'Downloader' },
        apk: { description: 'Download Android apps', category: 'Downloader' },

        // Music Commands
        playlist: { description: 'Manage music playlists', category: 'Music' },
        queue: { description: 'View current music queue', category: 'Music' },
        lyrics: { description: 'Find song lyrics', category: 'Music' },
        skip: { description: 'Skip current playing track', category: 'Music' },
        stop: { description: 'Stop music playback', category: 'Music' },
        spotify: { description: 'Download Spotify tracks/albums', category: 'Music' },
        soundcloud: { description: 'Download SoundCloud tracks', category: 'Music' },
        pause: { description: 'Pause current playback', category: 'Music' },
        resume: { description: 'Resume paused playback', category: 'Music' },


        // AI & Generation Commands
        gpt: { description: 'Chat with GPT AI', category: 'AI' },
        gpt4: { description: 'Chat with GPT-4 AI', category: 'AI' },
        dalle: { description: 'Generate images with DALL-E', category: 'AI' },
        imagine: { description: 'AI image generation', category: 'AI' },
        remini: { description: 'Enhance image quality with AI', category: 'AI' },
        colorize: { description: 'Colorize B&W images', category: 'AI' },
        upscale: { description: 'Upscale image resolution', category: 'AI' },
        anime2d: { description: 'Convert photo to anime style', category: 'AI' },
        txt2img: { description: 'Convert text to image', category: 'AI' },
        img2txt: { description: 'Extract text from image', category: 'AI' },
        translate: { description: 'Translate text between languages', category: 'AI' },
        lisa: { description: 'Chat with Lisa AI', category: 'AI' },
        rias: { description: 'Chat with Rias AI', category: 'AI' },
        toxxic: { description: 'Chat with Toxxic AI', category: 'AI' },

        // Group Management
        kick: { description: 'Kick member from group', category: 'Group' },
        add: { description: 'Add member to group', category: 'Group' },
        promote: { description: 'Promote member to admin', category: 'Group' },
        demote: { description: 'Demote admin to member', category: 'Group' },
        mute: { description: 'Mute group chat', category: 'Group' },
        unmute: { description: 'Unmute group chat', category: 'Group' },
        link: { description: 'Get group invite link', category: 'Group' },
        revoke: { description: 'Revoke group invite link', category: 'Group' },
        tagall: { description: 'Mention all group members', category: 'Group' },
        hidetag: { description: 'Tag all members secretly', category: 'Group' },
        setname: { description: 'Set group name', category: 'Group' },
        setdesc: { description: 'Set group description', category: 'Group' },
        setwelcome: { description: 'Set welcome message', category: 'Group' },
        setgoodbye: { description: 'Set goodbye message', category: 'Group' },
        antilink: { description: 'Toggle anti-link protection', category: 'Group' },
        antispam: { description: 'Toggle anti-spam protection', category: 'Group' },
        antitoxic: { description: 'Toggle anti-toxic protection', category: 'Group' },
        groupinfo: { description: 'View group information', category: 'Group' },
        warn: { description: 'Give warning to a member (3 warns = kick)', category: 'Group' },
        delwarn: { description: 'Remove a warning from a member', category: 'Group' },
        warnlist: { description: 'View member\'s warning list', category: 'Group' },
        del: { description: 'Delete a message (admin only)', category: 'Group' },

        // Owner Commands
        broadcast: { description: 'Send message to all chats', category: 'Owner' },
        bc: { description: 'Broadcast to all groups', category: 'Owner' },
        bcgc: { description: 'Broadcast to specific groups', category: 'Owner' },
        join: { description: 'Join a group via link', category: 'Owner' },
        leave: { description: 'Leave a group', category: 'Owner' },
        block: { description: 'Block a user', category: 'Owner' },
        unblock: { description: 'Unblock a user', category: 'Owner' },
        ban: { description: 'Ban user from using bot', category: 'Owner' },
        unban: { description: 'Unban user from bot', category: 'Owner' },
        setbotpp: { description: 'Set bot profile picture', category: 'Owner' },
        setbotbio: { description: 'Set bot bio', category: 'Owner' },
        setbotname: { description: 'Set bot name', category: 'Owner' },
        restart: { description: 'Restart bot system', category: 'Owner' },

        // Utility Commands
        profile: { description: 'View user profile', category: 'Utility' },
        me: { description: 'View your profile', category: 'Utility' },
        stats: { description: 'View bot statistics', category: 'Utility' },
        report: { description: 'Report an issue to owner', category: 'Utility' },
        donate: { description: 'View donation information', category: 'Utility' },
        qrmaker: { description: 'Create QR codes', category: 'Utility' },
        qrreader: { description: 'Read QR codes', category: 'Utility' },

        // Economy Commands
        balance: { description: 'Check wallet balance', category: 'Economy' },
        daily: { description: 'Claim daily rewards', category: 'Economy' },
        weekly: { description: 'Claim weekly rewards', category: 'Economy' },
        monthly: { description: 'Claim monthly rewards', category: 'Economy' },
        transfer: { description: 'Transfer money to users', category: 'Economy' },
        shop: { description: 'View item shop', category: 'Economy' },
        buy: { description: 'Buy items from shop', category: 'Economy' },
        sell: { description: 'Sell items for money', category: 'Economy' },
        inventory: { description: 'View your inventory', category: 'Economy' },
        work: { description: 'Work to earn money', category: 'Economy' },
        rob: { description: 'Rob other users (risky)', category: 'Economy' },
        gamble: { description: 'Gamble your money', category: 'Economy' },
        heist: { description: 'Organize bank heist', category: 'Economy' },
        mine: { description: 'Mine for resources', category: 'Economy' },
        fish: { description: 'Go fishing', category: 'Economy' },
        hunt: { description: 'Go hunting', category: 'Economy' },

        // Anime Commands
        waifu: { description: 'Get random waifu image', category: 'Anime' },
        neko: { description: 'Get random neko image', category: 'Anime' },
        anime: { description: 'Search anime information', category: 'Anime' },
        manga: { description: 'Search manga information', category: 'Anime' },
        character: { description: 'Search anime character', category: 'Anime' },
        couplepp: { description: 'Get matching couple pfp', category: 'Anime' },

        // NSFW Commands
        nsfwcheck: { description: 'Check NSFW settings', category: 'NSFW' },
        setnsfw: { description: 'Toggle NSFW in group', category: 'NSFW' },

        // Debug Commands
        bugandro: { description: 'Report Android bugs', category: 'Debug' },
        bugios: { description: 'Report iOS bugs', category: 'Debug' }
    }
};