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

        // Group commands
        kick: {
            description: 'Kick a user from group (Admin only)'
        },
        promote: {
            description: 'Promote a user to admin (Admin only)'
        },

        // User commands
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
        }
    }
};