const config = require('./config');
const logger = require('./utils/logger');
const fs = require('fs-extra');
const path = require('path');

// Clear require cache for config to ensure fresh load
delete require.cache[require.resolve('./config')];
const freshConfig = require('./config');

// Track successful imports and command sources
const loadedModules = new Map();
const commandSources = new Map();
const allCommands = {};

function loadCommandModule(name, path) {
    try {
        logger.info(`Loading command module: ${name} from ${path}`);
        if (!fs.existsSync(path)) {
            logger.error(`Module file not found: ${path}`);
            loadedModules.set(name, false);
            return {};
        }

        delete require.cache[require.resolve(path)];
        const module = require(path);
        const commands = Object.keys(module);

        // Check for duplicates before registering
        commands.forEach(cmd => {
            if (commandSources.has(cmd)) {
                logger.warn(`Skipping duplicate command: ${cmd} in ${name}. Already registered in ${commandSources.get(cmd)}`);
            } else {
                commandSources.set(cmd, name);
                allCommands[cmd] = module[cmd];
                logger.info(`Registered command: ${cmd} from ${name}`);
            }
        });

        loadedModules.set(name, true);
        return module;
    } catch (error) {
        logger.error(`Failed to load ${name} module:`, error);
        loadedModules.set(name, false);
        return {};
    }
}

// Load all command modules
const modules = {
    Basic: loadCommandModule('Basic', './commands/basic.js'),
    AI: loadCommandModule('AI', './commands/ai.js'),
    Media: loadCommandModule('Media', './commands/media.js'),
    Group: loadCommandModule('Group', './commands/group.js'),
    Owner: loadCommandModule('Owner', './commands/owner.js'),
    Education: loadCommandModule('Education', './commands/education.js'),
    Economy: loadCommandModule('Economy', './commands/economy.js'),
    Game: loadCommandModule('Game', './commands/game.js'),
    Utility: loadCommandModule('Utility', './commands/utility.js')
};

// Log command registration statistics
logger.info('Command registration statistics:', {
    totalCommands: Object.keys(allCommands).length,
    registeredCommands: Object.keys(allCommands),
    moduleStatus: Object.fromEntries(loadedModules),
    commandSources: Object.fromEntries(commandSources)
});


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
            registeredCategories: Object.keys(modules)
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

// Expose registered commands for menu
messageHandler.getRegisteredCommands = () => Object.keys(allCommands);

module.exports = messageHandler;