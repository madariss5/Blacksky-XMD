module.exports = {
    prefix: '.',  // Command prefix
    ownerNumber: process.env.OWNER_NUMBER || '4915561048015@s.whatsapp.net',
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
        owner: { description: 'View bot creator info', category: 'Basic' },
        runtime: { description: 'Check bot uptime', category: 'Basic' },

        // Group Commands
        kick: { description: 'Kick member from group', category: 'Group' },
        add: { description: 'Add member to group', category: 'Group' },
        promote: { description: 'Promote member to admin', category: 'Group' },
        demote: { description: 'Demote admin to member', category: 'Group' },
        tagall: { description: 'Tag all group members', category: 'Group' },
        hidetag: { description: 'Tag all members secretly', category: 'Group' },

        // Media Commands
        sticker: { description: 'Create sticker from image/video', category: 'Media' },
        toimg: { description: 'Convert sticker to image', category: 'Media' },
        play: { description: 'Play YouTube audio', category: 'Media' },
        video: { description: 'Download YouTube video', category: 'Media' },

        // Downloader Commands
        ytmp3: { description: 'Download YouTube audio', category: 'Downloader' },
        ytmp4: { description: 'Download YouTube video', category: 'Downloader' },
        instagram: { description: 'Download Instagram media', category: 'Downloader' },
        tiktok: { description: 'Download TikTok video', category: 'Downloader' },

        // AI Commands
        ai: { description: 'Chat with AI', category: 'AI' },
        imagine: { description: 'Generate AI images', category: 'AI' },
        remini: { description: 'Enhance image quality', category: 'AI' },

        // Owner Commands
        broadcast: { description: 'Send message to all chats', category: 'Owner' },
        block: { description: 'Block a user', category: 'Owner' },
        unblock: { description: 'Unblock a user', category: 'Owner' },
        setbotpp: { description: 'Set bot profile picture', category: 'Owner' },
        restart: { description: 'Restart bot system', category: 'Owner' }
    }
};