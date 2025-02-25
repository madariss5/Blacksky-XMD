module.exports = {
    prefix: '!',  // Command prefix
    ownerNumber: '1234567890@s.whatsapp.net',  // Replace with your number
    botName: 'WhatsApp Bot',
    commands: {
        // Basic commands
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
        broadcast: {
            description: 'Send message to all chats (Owner only)'
        },
        ban: {
            description: 'Ban a user from using the bot (Owner only)'
        },
        unban: {
            description: 'Unban a user (Owner only)'
        },
        banlist: {
            description: 'Show list of banned users and groups (Owner only)'
        },
        bangroup: {
            description: 'Ban a group from using the bot (Owner only)'
        },
        unbangroup: {
            description: 'Unban a group (Owner only)'
        },

        // Group commands
        kick: {
            description: 'Kick a user from group (Admin only)'
        },
        promote: {
            description: 'Promote a user to admin (Admin only)'
        },
        demote: {
            description: 'Demote a user from admin (Admin only)'
        },
        mute: {
            description: 'Mute group (only admins can write)'
        },
        unmute: {
            description: 'Unmute group (everyone can write)'
        },
        everyone: {
            description: 'Tag everyone in the group'
        },
        setwelcome: {
            description: 'Set welcome message for group'
        },
        setbye: {
            description: 'Set goodbye message for group'
        },
        del: {
            description: 'Delete a message (Admin only)'
        },

        // User commands
        me: {
            description: 'Show your profile info and stats'
        },
        level: {
            description: 'Show your current level'
        },
        profile: {
            description: 'View user profile'
        },
        status: {
            description: 'View your WhatsApp status'
        },

        // Fun commands
        coinflip: {
            description: 'Flip a coin'
        },
        dice: {
            description: 'Roll a dice'
        },
        quote: {
            description: 'Get a random quote'
        },
        slap: {
            description: 'Slap someone with anime sticker'
        },
        hug: {
            description: 'Hug someone with anime sticker'
        },
        cuddle: {
            description: 'Cuddle someone with anime sticker'
        },
        kiss: {
            description: 'Kiss someone with anime sticker'
        },
        kill: {
            description: 'Kill someone with anime sticker'
        },
        dance: {
            description: 'Show a dancing anime sticker'
        },
        insult: {
            description: 'Insult someone with a funny message'
        }
    }
};