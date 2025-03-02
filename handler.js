const config = require('./config');
const logger = require('./utils/logger');

// Clear require cache for config to ensure fresh load
delete require.cache[require.resolve('./config')];
const freshConfig = require('./config');

// Import all command modules with logging
logger.info('Starting command registration...');

// Track successful imports
const loadedModules = new Map();

function loadCommandModule(name, path) {
    try {
        logger.info(`Loading command module: ${name} from ${path}`);
        // Clear require cache for the module
        delete require.cache[require.resolve(path)];
        const module = require(path);
        const commands = Object.keys(module);
        logger.info(`Successfully loaded ${name} module with commands:`, commands);
        loadedModules.set(name, true);
        return module;
    } catch (error) {
        logger.error(`Failed to load ${name} module:`, error);
        loadedModules.set(name, false);
        return {};
    }
}

const basicCommands = loadCommandModule('Basic', './commands/basic');
const aiCommands = loadCommandModule('AI', './commands/ai');
const mediaCommands = loadCommandModule('Media', './commands/media');
const groupCommands = loadCommandModule('Group', './commands/group');
const ownerCommands = loadCommandModule('Owner', './commands/owner');
const utilityCommands = loadCommandModule('Utility', './commands/utility');
const educationCommands = loadCommandModule('Education', './commands/education');
const economyCommands = loadCommandModule('Economy', './commands/economy');
const gameCommands = loadCommandModule('Game', './commands/game');

// Debug logging for module imports
logger.info('Module load status:', Object.fromEntries(loadedModules));

// Combine all command modules with error checking
const allCommands = {};

function registerCommands(commands, moduleName) {
    if (!commands || typeof commands !== 'object') {
        logger.error(`Invalid module: ${moduleName}`);
        return;
    }

    Object.entries(commands).forEach(([cmdName, cmdFunction]) => {
        if (typeof cmdFunction === 'function') {
            if (allCommands[cmdName]) {
                logger.warn(`Duplicate command found: ${cmdName} in ${moduleName}`);
            }
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
    'Education': educationCommands,
    'Economy': economyCommands,
    'Game': gameCommands
};

// Count commands per category for logging
const categoryStats = {};

Object.entries(modules).forEach(([name, commands]) => {
    try {
        registerCommands(commands, name);
        categoryStats[name] = Object.keys(commands || {}).length;
        logger.info(`Registered ${categoryStats[name]} commands from ${name} module`);
    } catch (error) {
        logger.error(`Error registering ${name} commands:`, error);
        categoryStats[name] = 0;
    }
});

// Log detailed registration statistics
logger.info('Command registration statistics:', categoryStats);
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

        // Parse command with detailed logging
        const prefix = config.prefix || '.';
        if (!messageContent.startsWith(prefix)) {
            return;
        }

        const args = messageContent.slice(prefix.length).trim().split(/\s+/);
        const command = args.shift()?.toLowerCase();

        logger.info('Processing command:', {
            command,
            args,
            availableCommands: Object.keys(allCommands),
            registeredCategories: Object.keys(categoryStats)
        });

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