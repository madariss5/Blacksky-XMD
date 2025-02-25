module.exports = {
    prefix: '!',  // Command prefix
    ownerNumber: process.env.OWNER_NUMBER,  // Owner number from environment variable
    ownerName: process.env.OWNER_NAME || 'Bot Owner',
    botName: 'Flash-MD',  // Updated bot name
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

        // Owner commands - First set (50)
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
        // Auto-generated owner commands will be added here
        ...Array.from({length: 89}, (_, i) => ({
            [`ownerCmd${i + 1}`]: {
                description: `Owner command ${i + 1}`
            }
        })).reduce((acc, curr) => ({...acc, ...curr}), {}),

        // Group commands - First set (50)
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
        // Auto-generated group commands will be added here
        ...Array.from({length: 88}, (_, i) => ({
            [`groupCmd${i + 1}`]: {
                description: `Group command ${i + 1}`
            }
        })).reduce((acc, curr) => ({...acc, ...curr}), {}),

        // User commands - First set (50)
        register: { description: 'Register your name and age' },
        me: { description: 'Show your profile info and stats' },
        level: { description: 'Show your current level' },
        profile: { description: 'View user profile with registration info' },
        status: { description: 'View your WhatsApp status' },
        owner: { description: 'View bot owner information' },
        // Auto-generated user commands will be added here
        ...Array.from({length: 96}, (_, i) => ({
            [`userCmd${i + 1}`]: {
                description: `User command ${i + 1}`
            }
        })).reduce((acc, curr) => ({...acc, ...curr}), {}),

        // Fun commands - First set (50)
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
        ship: { description: 'Check love compatibility between two users' },
        fight: { description: 'Start an anime-style fight with someone' },
        // Auto-generated fun commands will be added here
        ...Array.from({length: 87}, (_, i) => ({
            [`funCmd${i + 1}`]: {
                description: `Fun command ${i + 1}`
            }
        })).reduce((acc, curr) => ({...acc, ...curr}), {})
    }
};