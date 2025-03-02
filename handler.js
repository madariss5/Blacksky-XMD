const config = require('./config');
const logger = require('./utils/logger');
const fs = require('fs-extra');
const path = require('path');

// Clear require cache for config to ensure fresh load
delete require.cache[require.resolve('./config')];
const freshConfig = require('./config');

// Track successful imports
const loadedModules = new Map();

function loadCommandModule(name, path) {
    try {
        logger.info(`Loading command module: ${name} from ${path}`);
        // Check if file exists
        if (!fs.existsSync(path)) {
            logger.error(`Module file not found: ${path}`);
            loadedModules.set(name, false);
            return {};
        }
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

const modules = {
    Basic: loadCommandModule('Basic', './commands/basic.js'),
    AI: loadCommandModule('AI', './commands/ai.js'),
    Media: loadCommandModule('Media', './commands/media.js'),
    Group: loadCommandModule('Group', './commands/group.js'),
    Owner: loadCommandModule('Owner', './commands/owner.js'),
    Utility: loadCommandModule('Utility', './commands/utility.js'),
    Education: loadCommandModule('Education', './commands/education.js'),
    Economy: loadCommandModule('Economy', './commands/economy.js'),
    Game: loadCommandModule('Game', './commands/game.js')
};

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

// Compare registered commands with config
const configuredCommands = Object.keys(freshConfig.commands);
const registeredCommands = Object.keys(allCommands);
logger.info('Command comparison:', {
    configured: configuredCommands.length,
    registered: registeredCommands.length,
    missingFromConfig: registeredCommands.filter(cmd => !configuredCommands.includes(cmd)),
    missingImplementations: configuredCommands.filter(cmd => !registeredCommands.includes(cmd))
});

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
        const prefix = freshConfig.prefix || '.';
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