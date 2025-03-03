const logger = require('pino')();
const mediaCommands = require('./commands/media');
const dbStore = require('./database/store');

// Simple command registry
const commands = new Map();

/**
 * Register a command with the handler
 * @param {string} name - Command name
 * @param {function} handler - Command handler function
 */
function registerCommand(name, handler) {
    if (typeof handler === 'function') {
        commands.set(name, handler);
        logger.info(`Registered command: ${name}`);
    }
}

/**
 * Award XP for user activity
 * @param {string} jid - User JID
 * @param {string} activity - Type of activity
 */
async function awardActivityXP(jid, activity = 'message') {
    try {
        let xpAmount;
        switch (activity) {
            case 'command':
                xpAmount = 10; // More XP for using commands
                break;
            case 'media':
                xpAmount = 15; // Bonus XP for sharing media
                break;
            case 'message':
            default:
                xpAmount = 5; // Base XP for messages
        }

        const result = await dbStore.updateUserXP(jid, xpAmount);
        if (result.success && result.leveledUp) {
            // Notify user of level up
            return {
                levelUp: true,
                newLevel: result.currentLevel
            };
        }
        return { levelUp: false };
    } catch (error) {
        logger.error('Error awarding XP:', error);
        return { levelUp: false };
    }
}

/**
 * Handle incoming messages
 */
async function messageHandler(sock, msg) {
    try {
        if (!sock || !msg?.message) return;

        // Get message content
        const messageType = Object.keys(msg.message)[0];
        if (!['conversation', 'extendedTextMessage'].includes(messageType)) {
            // Award XP for media messages
            const sender = msg.key.participant || msg.key.remoteJid;
            await awardActivityXP(sender, 'media');
            return;
        }

        const messageContent = messageType === 'conversation' 
            ? msg.message.conversation 
            : msg.message.extendedTextMessage.text;

        // Award base XP for text messages
        const sender = msg.key.participant || msg.key.remoteJid;
        const activityResult = await awardActivityXP(sender, 'message');

        // Check for command prefix
        const prefix = '.';
        if (!messageContent.startsWith(prefix)) {
            // If user leveled up from regular message, notify them
            if (activityResult.levelUp) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `🎉 Congratulations @${sender.split('@')[0]}!\nYou've reached level ${activityResult.newLevel}!`,
                    mentions: [sender]
                });
            }
            return;
        }

        // Parse command
        const args = messageContent.slice(prefix.length).trim().split(/\s+/);
        const command = args.shift()?.toLowerCase();

        // Execute command if it exists
        if (commands.has(command)) {
            logger.info(`Executing command: ${command}`, { args });
            // Award XP for command usage
            await awardActivityXP(sender, 'command');
            await commands.get(command)(sock, msg, args);
        }

    } catch (error) {
        logger.error('Message handler error:', error);
    }
}

// Register media commands (which now include music commands)
Object.entries(mediaCommands).forEach(([name, handler]) => {
    registerCommand(name, handler);
    logger.info(`Registered media/music command: ${name}`);
});

// Expose command registration
messageHandler.register = registerCommand;
messageHandler.getCommands = () => Array.from(commands.keys());

module.exports = messageHandler;