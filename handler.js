const logger = require('pino')();
const mediaCommands = require('./commands/media');
const aiCommands = require('./commands/ai');
const basicCommands = require('./commands/basic');
const userCommands = require('./commands/user');
const dbStore = require('./database/store');

// Simple command registry
const commands = new Map();

/**
 * Register a command with the handler
 * @param {string} name - Command name
 * @param {function} handler - Command handler function
 */
function registerCommand(name, handler) {
    if (commands.has(name)) {
        logger.warn(`Duplicate command registration: ${name}`);
        return;
    }
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
 * Check and handle AFK mentions
 * @param {object} sock - Socket connection
 * @param {object} msg - Message object
 * @param {string} content - Message content
 * @param {string} sender - Sender JID
 */
async function handleAFKMentions(sock, msg, content, sender) {
    try {
        // Check message mentions
        const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        for (const mentionedJid of mentions) {
            const afkInfo = await dbStore.isUserAFK(mentionedJid);
            if (afkInfo?.status) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `@${mentionedJid.split('@')[0]} is currently AFK${afkInfo.reason ? `\nReason: ${afkInfo.reason}` : ''}`,
                    mentions: [mentionedJid]
                });
            }
        }

        // Check if sender is AFK
        const senderAFK = await dbStore.isUserAFK(sender);
        if (senderAFK?.status) {
            const afkDuration = await dbStore.removeUserAFK(sender);
            if (afkDuration) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `Welcome back @${sender.split('@')[0]}!\nYou were AFK for ${formatDuration(afkDuration)}`,
                    mentions: [sender]
                });
            }
        }
    } catch (error) {
        logger.error('Error handling AFK mentions:', error);
    }
}

/**
 * Handle incoming messages
 */
async function messageHandler(sock, msg) {
    try {
        if (!sock || !msg?.message) return;

        // Get message content and sender
        const messageType = Object.keys(msg.message)[0];
        const sender = msg.key.participant || msg.key.remoteJid;

        // Update user stats
        const statsUpdate = {
            messageCount: 1,
            lastActive: Date.now()
        };

        if (!['conversation', 'extendedTextMessage'].includes(messageType)) {
            // Media message
            statsUpdate.mediaCount = 1;
            await dbStore.updateUserStats(sender, statsUpdate);
            await awardActivityXP(sender, 'media');
            return;
        }

        const messageContent = messageType === 'conversation'
            ? msg.message.conversation
            : msg.message.extendedTextMessage.text;

        // Handle AFK mentions
        await handleAFKMentions(sock, msg, messageContent, sender);

        // Update basic message stats
        await dbStore.updateUserStats(sender, statsUpdate);

        // Award base XP for text messages
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

            // Update command usage stats
            await dbStore.updateUserStats(sender, {
                commandsUsed: 1,
                lastActive: Date.now()
            });

            // Award XP for command usage
            await awardActivityXP(sender, 'command');
            await commands.get(command)(sock, msg, args);
        }

    } catch (error) {
        logger.error('Message handler error:', error);
    }
}

// Register all command modules
[
    { module: mediaCommands, type: 'Media' },
    { module: aiCommands, type: 'AI' },
    { module: basicCommands, type: 'Basic' },
    { module: userCommands, type: 'User' }
].forEach(({ module, type }) => {
    Object.entries(module).forEach(([name, handler]) => {
        registerCommand(name, handler);
        logger.info(`Registered ${type} command: ${name}`);
    });
});

// Expose command registration
messageHandler.register = registerCommand;
messageHandler.getCommands = () => Array.from(commands.keys());

module.exports = messageHandler;