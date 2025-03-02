const logger = require('pino')();
const config = require('./config');

// Simple command storage
const commands = new Map();

// Simple command registration
function registerCommand(name, handler) {
    if (typeof handler === 'function') {
        commands.set(name, handler);
        logger.info(`Registered command: ${name}`);
    }
}

// Load basic commands
try {
    const basicCommands = require('./commands/basic');
    Object.entries(basicCommands).forEach(([name, handler]) => {
        registerCommand(name, handler);
    });
    logger.info('Basic commands loaded successfully');
} catch (error) {
    logger.error('Failed to load basic commands:', error);
}

// Message handler
async function messageHandler(sock, msg) {
    try {
        if (!sock || !msg?.message) return;

        // Get message content
        const messageType = Object.keys(msg.message)[0];
        let messageContent = '';

        switch (messageType) {
            case 'conversation':
                messageContent = msg.message.conversation;
                break;
            case 'extendedTextMessage':
                messageContent = msg.message.extendedTextMessage.text;
                break;
            default:
                return;
        }

        // Check for prefix
        const prefix = config.prefix || '.';
        if (!messageContent.startsWith(prefix)) return;

        // Parse command
        const args = messageContent.slice(prefix.length).trim().split(/\s+/);
        const command = args.shift()?.toLowerCase();

        // Execute command
        if (commands.has(command)) {
            logger.info(`Executing command: ${command}`);
            await commands.get(command)(sock, msg, args);
        } else {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `Command not found. Use ${prefix}menu to see available commands.`
            });
        }
    } catch (error) {
        logger.error('Error in message handler:', error);
        if (sock && msg?.key?.remoteJid) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error processing command'
            });
        }
    }
}

// Get registered commands
messageHandler.getCommands = () => Array.from(commands.keys());

module.exports = messageHandler;