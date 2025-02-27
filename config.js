module.exports = {
    prefix: '!',  // Command prefix
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

        // Media & Sticker Commands
        sticker: { description: 'Create sticker from image/video', category: 'Media' },
        toimg: { description: 'Convert sticker to image', category: 'Media' },
        tomp3: { description: 'Convert video to audio', category: 'Media' },
        tovn: { description: 'Convert audio to voice note', category: 'Media' },
        emojimix: { description: 'Mix two emojis into one sticker', category: 'Media' },

        // Image Effect Commands
        blur: { description: 'Add blur effect to image', category: 'Media' },
        circle: { description: 'Make image circular', category: 'Media' },
        jail: { description: 'Add jail bars effect', category: 'Media' },
        triggered: { description: 'Create triggered effect', category: 'Media' },
        wasted: { description: 'Add GTA wasted effect', category: 'Media' },
        rip: { description: 'Create RIP memorial effect', category: 'Media' },

        // Fun & Reaction Commands
        slap: { description: 'Slap someone with anime gif', category: 'Fun' },
        hug: { description: 'Give someone a warm hug', category: 'Fun' },
        pat: { description: 'Pat someone gently', category: 'Fun' },
        punch: { description: 'Playfully punch someone', category: 'Fun' },
        kiss: { description: 'Send a virtual kiss', category: 'Fun' },
        bonk: { description: 'Bonk someone on the head', category: 'Fun' },
        highfive: { description: 'Give a high five', category: 'Fun' },

        // Downloader Commands
        ytmp3: { description: 'Download YouTube audio (High Quality)', category: 'Downloader' },
        ytmp4: { description: 'Download YouTube video (HD)', category: 'Downloader' },
        play: { description: 'Search and play YouTube audio', category: 'Music' },
        video: { description: 'Search and play YouTube video', category: 'Downloader' },
        tiktok: { description: 'Download TikTok video without watermark', category: 'Downloader' },
        instagram: { description: 'Download Instagram posts/reels', category: 'Downloader' },
        facebook: { description: 'Download Facebook videos', category: 'Downloader' },
        twitter: { description: 'Download Twitter videos/images', category: 'Downloader' },
        spotify: { description: 'Download Spotify tracks/albums', category: 'Music' },

        // Music Commands
        playlist: { description: 'Manage music playlists', category: 'Music' },
        queue: { description: 'View current music queue', category: 'Music' },
        lyrics: { description: 'Find song lyrics', category: 'Music' },
        skip: { description: 'Skip current playing track', category: 'Music' },
        stop: { description: 'Stop music playback', category: 'Music' },

        // AI & Generation Commands
        gpt: { description: 'Chat with GPT AI', category: 'AI' },
        dalle: { description: 'Generate images with DALL-E', category: 'AI' },
        imagine: { description: 'AI image generation', category: 'AI' },
        remini: { description: 'Enhance image quality with AI', category: 'AI' },
        colorize: { description: 'Colorize B&W images', category: 'AI' },
        upscale: { description: 'Upscale image resolution', category: 'AI' },
        anime2d: { description: 'Convert photo to anime style', category: 'AI' },
        txt2img: { description: 'Convert text to image', category: 'AI' },
        translate: { description: 'Translate text between languages', category: 'AI' },

        // Group Management
        kick: { description: 'Kick member from group', category: 'Group' },
        add: { description: 'Add member to group', category: 'Group' },
        promote: { description: 'Promote member to admin', category: 'Group' },
        demote: { description: 'Demote admin to member', category: 'Group' },
        mute: { description: 'Mute group chat', category: 'Group' },
        unmute: { description: 'Unmute group chat', category: 'Group' },
        link: { description: 'Get group invite link', category: 'Group' },
        tagall: { description: 'Mention all group members', category: 'Group' },
        setname: { description: 'Set group name', category: 'Group' },
        setdesc: { description: 'Set group description', category: 'Group' },
        setwelcome: { description: 'Set welcome message', category: 'Group' },
        setgoodbye: { description: 'Set goodbye message', category: 'Group' },
        antilink: { description: 'Toggle anti-link protection', category: 'Group' },

        // Owner Commands
        broadcast: { description: 'Send message to all chats', category: 'Owner' },
        join: { description: 'Join a group via link', category: 'Owner' },
        leave: { description: 'Leave a group', category: 'Owner' },
        block: { description: 'Block a user', category: 'Owner' },
        unblock: { description: 'Unblock a user', category: 'Owner' },
        ban: { description: 'Ban user from using bot', category: 'Owner' },
        unban: { description: 'Unban user from bot', category: 'Owner' },
        setbotpp: { description: 'Set bot profile picture', category: 'Owner' },
        restart: { description: 'Restart bot system', category: 'Owner' },

        // Utility Commands
        profile: { description: 'View user profile', category: 'Utility' },
        stats: { description: 'View bot statistics', category: 'Utility' },
        report: { description: 'Report an issue to owner', category: 'Utility' },
        donate: { description: 'View donation information', category: 'Utility' },
        runtime: { description: 'Check bot uptime', category: 'Utility' },
        speed: { description: 'Test bot response speed', category: 'Utility' },

        // Economy Commands
        balance: { description: 'Check wallet balance', category: 'Economy' },
        daily: { description: 'Claim daily rewards', category: 'Economy' },
        weekly: { description: 'Claim weekly rewards', category: 'Economy' },
        transfer: { description: 'Transfer money to users', category: 'Economy' },
        shop: { description: 'View item shop', category: 'Economy' },
        buy: { description: 'Buy items from shop', category: 'Economy' },
        inventory: { description: 'View your inventory', category: 'Economy' },
        work: { description: 'Work to earn money', category: 'Economy' },
        rob: { description: 'Rob other users (risky)', category: 'Economy' },
        gamble: { description: 'Gamble your money', category: 'Economy' },

        // NSFW Commands
        nsfwcheck: { description: 'Check NSFW settings', category: 'NSFW' },
        setnsfw: { description: 'Toggle NSFW in group', category: 'NSFW' }
    }
};