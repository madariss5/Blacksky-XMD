const logger = require('pino')();
const mediaCommands = require('./commands/media');

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
 * Handle incoming messages
 */
async function messageHandler(sock, msg) {
    try {
        if (!sock || !msg?.message) return;

        // Get message content
        const messageType = Object.keys(msg.message)[0];
        if (!['conversation', 'extendedTextMessage'].includes(messageType)) {
            return;
        }

        const messageContent = messageType === 'conversation' 
            ? msg.message.conversation 
            : msg.message.extendedTextMessage.text;

        // Check for command prefix
        const prefix = '.';
        if (!messageContent.startsWith(prefix)) return;

        // Parse command
        const args = messageContent.slice(prefix.length).trim().split(/\s+/);
        const command = args.shift()?.toLowerCase();

        // Execute command if it exists
        if (commands.has(command)) {
            logger.info(`Executing command: ${command}`, { args });
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