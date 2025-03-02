const config = require('./config');
const logger = require('./utils/logger');

// Import all command modules
const basicCommands = require('./commands/basic');
const aiCommands = require('./commands/ai');
const mediaCommands = require('./commands/media');
const groupCommands = require('./commands/group');
const ownerCommands = require('./commands/owner');
const utilityCommands = require('./commands/utility');
const educationCommands = require('./commands/education');

// Debug logging for module imports
logger.info('Starting command registration...');

// Combine all command modules with error checking
const allCommands = {};

function registerCommands(commands, moduleName) {
    if (!commands || typeof commands !== 'object') {
        logger.error(`Invalid module: ${moduleName}`);
        return;
    }

    Object.entries(commands).forEach(([cmdName, cmdFunction]) => {
        if (typeof cmdFunction === 'function') {
            allCommands[cmdName] = cmdFunction;
            logger.info(`Registered command: ${cmdName} from ${moduleName}`);
        } else {
            logger.warn(`Invalid command: ${cmdName} in ${moduleName}`);
        }
    });
}

// Register commands from all modules
const modules = {
    'Basic': basicCommands,
    'AI': aiCommands,
    'Media': mediaCommands,
    'Group': groupCommands,
    'Owner': ownerCommands,
    'Utility': utilityCommands,
    'Education': educationCommands
};

Object.entries(modules).forEach(([name, commands]) => {
    try {
        registerCommands(commands, name);
    } catch (error) {
        logger.error(`Error registering ${name} commands:`, error);
    }
});

// Log total registered commands
logger.info('Total registered commands:', Object.keys(allCommands).length);
logger.info('Available commands:', Object.keys(allCommands));

async function messageHandler(sock, msg, { messages }, store) {
    try {
        // Get message content
        const messageType = Object.keys(msg.message)[0];
        let messageContent = '';

        // Extract message based on type
        switch (messageType) {
            case 'conversation':
                messageContent = msg.message.conversation;
                break;
            case 'extendedTextMessage':
                messageContent = msg.message.extendedTextMessage.text;
                break;
            case 'imageMessage':
                messageContent = msg.message.imageMessage.caption;
                break;
            case 'videoMessage':
                messageContent = msg.message.videoMessage.caption;
                break;
            default:
                return; // Unsupported message type
        }

        // Parse command
        const prefix = config.prefix || '.';
        if (!messageContent.startsWith(prefix)) {
            return;
        }
        const args = messageContent.slice(prefix.length).trim().split(/\s+/);
        const command = args.shift()?.toLowerCase();

        // Execute command if it exists
        if (allCommands[command]) {
            logger.info(`Executing command: ${command}`);
            await allCommands[command](sock, msg, args);
            return;
        }

        // Command not found
        logger.info(`Command not found: ${command}`);
        await sock.sendMessage(msg.key.remoteJid, {
            text: `❌ Command *${command}* not found.\nType ${prefix}menu to see available commands.`
        });

    } catch (error) {
        logger.error('Error in message handler:', error);
        await sock.sendMessage(msg.key.remoteJid, {
            text: '❌ Error processing command. Please try again.'
        }).catch(err => logger.error('Error sending error message:', err));
    }
}

module.exports = messageHandler;