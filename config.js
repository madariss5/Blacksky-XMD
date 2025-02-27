module.exports = {
    prefix: '!',  // Command prefix
    ownerNumber: process.env.OWNER_NUMBER || '1234567890@s.whatsapp.net',  // Default owner number
    ownerName: process.env.OWNER_NAME || 'Bot Owner',
    botName: '𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻',
    menuImage: 'https://raw.githubusercontent.com/your-repo/assets/main/f9.jpg',
    commands: {
        // Basic commands
        menu: {
            description: 'Show bot menu with all commands'
        },
        help: {
            description: 'Shows available commands'
        },
        ping: {
            description: 'Check bot response'
        },
        info: {
            description: 'Get bot information'
        },

        // Owner commands
        broadcast: { description: 'Send message to all chats (Owner only)' },
        ban: { description: 'Ban a user from using the bot (Owner only)' },
        unban: { description: 'Unban a user (Owner only)' },
        banlist: { description: 'Show list of banned users and groups (Owner only)' },
        bangroup: { description: 'Ban a group from using the bot (Owner only)' },
        unbangroup: { description: 'Unban a group (Owner only)' },
        restart: { description: 'Restart the bot (Owner only)' },
        setprefix: { description: 'Change bot command prefix (Owner only)' },
        setbotname: { description: 'Change bot name (Owner only)' },
        stats: { description: 'View bot statistics (Owner only)' },
        clearcache: { description: 'Clear bot cache (Owner only)' },

        // Extended owner commands with proper names
        setautoreply: { description: '⚙️ Configure automatic message responses' },
        setwelcome: { description: '⚙️ Set group welcome message template' },
        setgoodbye: { description: '⚙️ Set group goodbye message template' },
        addcommand: { description: '⚙️ Add new custom command' },
        delcommand: { description: '⚙️ Remove custom command' },
        setlanguage: { description: '⚙️ Change bot language' },
        backup: { description: '⚙️ Create bot data backup' },
        restore: { description: '⚙️ Restore from backup' },

        // Group commands
        kick: { description: 'Kick a user from group (Admin only)' },
        promote: { description: 'Promote a user to admin (Admin only)' },
        demote: { description: 'Demote a user from admin (Admin only)' },
        mute: { description: 'Mute group (only admins can write)' },
        unmute: { description: 'Unmute group (everyone can write)' },
        everyone: { description: 'Tag everyone in the group' },
        setwelcome: { description: 'Set welcome message for group' },
        setbye: { description: 'Set goodbye message for group' },
        del: { description: 'Delete a message (Admin only)' },
        antilink: { description: 'Enable/disable anti-link protection' },
        groupinfo: { description: 'Show group information' },
        poll: { description: 'Create a poll in the group' },

        // Extended group commands with proper names
        schedule: { description: '👥 Schedule group events' },
        announce: { description: '👥 Create group announcements' },
        roles: { description: '👥 Manage group roles' },
        rules: { description: '👥 Set and view group rules' },
        contest: { description: '👥 Create group contests' },
        activity: { description: '👥 Manage group activities' },
        challenge: { description: '👥 Set group challenges' },
        vote: { description: '👥 Create group polls' },
        game: { description: '👥 Organize group games' },

        // User commands
        register: { description: 'Register your name and age' },
        me: { description: 'Show your profile info and stats' },
        level: { description: 'Show your current level' },
        profile: { description: 'View user profile with registration info' },
        status: { description: 'View your WhatsApp status' },
        owner: { description: 'View bot owner information' },

        // Extended user commands with proper names
        theme: { description: '👤 Customize profile themes' },
        reminder: { description: '👤 Set personal reminders' },
        bio: { description: '👤 Create custom bio' },
        achievements: { description: '👤 Track achievements' },
        presence: { description: '👤 Set activity status' },
        friends: { description: '👤 Create friend lists' },
        share: { description: '👤 Share contact cards' },
        notify: { description: '👤 Set notification preferences' },
        notes: { description: '👤 Create personal notes' },

        // Fun commands
        coinflip: { description: 'Flip a coin' },
        dice: { description: 'Roll a dice' },
        quote: { description: 'Get a random quote' },
        slap: { description: 'Slap someone with anime sticker' },
        hug: { description: 'Hug someone with anime sticker' },
        cuddle: { description: 'Cuddle someone with anime sticker' },
        kiss: { description: 'Kiss someone with anime sticker' },
        kill: { description: 'Kill someone with anime sticker' },
        dance: { description: 'Show a dancing anime sticker' },
        insult: { description: 'Insult someone with a funny message' },
        meme: { description: 'Get a random meme' },
        fight: { description: 'Start an anime-style fight with someone' },

        // Extended fun commands with proper names
        wordgame: { description: '🎮 Play word games' },
        emojiart: { description: '🎮 Create emoji art' },
        story: { description: '🎮 Generate funny stories' },
        trivia: { description: '🎮 Play trivia games' },
        mememaker: { description: '🎮 Create meme templates' },
        numbergame: { description: '🎮 Play number games' },
        jokes: { description: '🎮 Share funny quotes' },
        funpoll: { description: '🎮 Create funny polls' },
        guess: { description: '🎮 Play guessing games' },

        // NSFW commands
        togglensfw: { description: '🔞 Toggle NSFW in current group', nsfw: true },
        verifyage: { description: '🔞 Verify your age for NSFW content', nsfw: true },

        // Extended NSFW commands
        nsfwart: { description: '🔞 View age-restricted artwork', nsfw: true },
        nsfwstory: { description: '🔞 Access mature stories', nsfw: true },
        nsfwmedia: { description: '🔞 Browse adult content', nsfw: true }
    }
};