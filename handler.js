const basicCommands = require('./commands/basic');
const userCommands = require('./commands/user');
const reactionsCommands = require('./commands/reactions');
const ownerCommands = require('./commands/owner');
const economyCommands = require('./commands/economy');
const utilityCommands = require('./commands/utility');
const funCommands = require('./commands/fun');
const aiCommands = require('./commands/ai');
const downloaderCommands = require('./commands/downloader');
const socialCommands = require('./commands/social');
const musicCommands = require('./commands/music');
const groupCommands = require('./commands/group');
const nsfwCommands = require('./commands/nsfw');
const logger = require('./utils/logger');
const config = require('./config');
const { formatPhoneNumber } = require('./utils/phoneNumber');

// Check if the sender is an owner
const isOwner = (sender) => {
    try {
        // Clean up sender JID - handle both direct messages and group messages
        const senderNumber = sender.split(':')[0].split('@')[0];
        const ownerNumber = config.ownerNumber;

        // Log the comparison for debugging
        logger.info('Comparing owner numbers:', {
            rawSender: sender, // Added raw sender
            cleanedSender: senderNumber, // Added cleaned sender
            ownerNumber: ownerNumber, // Added owner number explicitly
            match: senderNumber === ownerNumber
        });

        return senderNumber === ownerNumber;
    } catch (error) {
        logger.error('Error in isOwner check:', error);
        return false;
    }
};

const commandModules = {
    reactions: reactionsCommands,
    owner: ownerCommands,
    group: groupCommands,
    nsfw: nsfwCommands,
    music: musicCommands,
    ai: aiCommands,
    basic: basicCommands,
    user: userCommands,
    downloader: downloaderCommands,
    economy: economyCommands,
    utility: utilityCommands,
    fun: funCommands,
    social: socialCommands
};

// Safely execute command with error handling
async function executeCommand(moduleName, command, hans, m, args) {
    try {
        const module = commandModules[moduleName];
        if (!module) {
            logger.warn(`Command module ${moduleName} not found`);
            return false;
        }

        // For owner commands, verify ownership
        if (moduleName === 'owner' && !isOwner(m.sender)) {
            logger.warn(`Non-owner tried to use owner command: ${command}`, {
                sender: m.sender,
                command: command
            });
            await hans.sendMessage(m.key.remoteJid, { 
                text: '❌ This command is only for the bot owner!' 
            });
            return false;
        }

        const cmdFunc = module[command];
        if (typeof cmdFunc !== 'function') {
            logger.warn(`Command ${command} not found in module ${moduleName}`);
            return false;
        }

        logger.info(`Executing command: ${command}`, {
            module: moduleName,
            args: args,
            chat: m.chat,
            sender: m.sender
        });

        await cmdFunc(hans, m, args);
        return true;
    } catch (error) {
        logger.error(`Error executing command: ${command}`, {
            module: moduleName,
            error: error.message,
            stack: error.stack,
            chat: m.chat,
            sender: m.sender
        });

        // Send a user-friendly error message
        try {
            await hans.sendMessage(m.key.remoteJid, { 
                text: `❌ Sorry, there was an error executing the command. Please try again later.` 
            });
        } catch (sendError) {
            logger.error('Failed to send error message', {
                error: sendError.message
            });
        }
        return false;
    }
}

module.exports = async (hans, m, chatUpdate, store) => {
    try {
        // Basic validation and message type checking
        if (!m || !m.body) {
            logger.debug('Invalid message received', { messageObject: m });
            return;
        }

        const prefix = '.';
        if (!m.body.startsWith(prefix)) {
            logger.debug('Message does not start with prefix', { body: m.body });
            return;
        }

        // Extract and validate command
        const [rawCommand, ...args] = m.body.slice(prefix.length).trim().split(/\s+/);
        if (!rawCommand) {
            logger.debug('No command provided');
            return;
        }

        const command = rawCommand.toLowerCase();
        logger.info('Processing command', { 
            command, 
            args,
            chat: m.chat,
            sender: m.sender,
            isOwner: isOwner(m.sender)
        });

        // Try to execute command in each module
        let commandExecuted = false;
        for (const [moduleName, module] of Object.entries(commandModules)) {
            if (module && typeof module[command] === 'function') {
                const success = await executeCommand(moduleName, command, hans, m, args);
                if (success) {
                    commandExecuted = true;
                    logger.info(`Command ${command} executed successfully`, {
                        module: moduleName,
                        chat: m.chat,
                        sender: m.sender
                    });
                    break;
                }
            }
        }

        // Command not found
        if (!commandExecuted) {
            logger.warn('Command not found', { command });
            await hans.sendMessage(m.key.remoteJid, {
                text: `Command *${command}* not found. Type ${prefix}menu to see available commands.`
            });
        }

    } catch (err) {
        // Handle system-level errors gracefully
        logger.error('Fatal error in command handler', {
            error: err.message,
            stack: err.stack,
            command: m?.body,
            chat: m?.chat,
            sender: m?.sender
        });

        try {
            await hans.sendMessage(m?.key?.remoteJid, { 
                text: '❌ Sorry, the command could not be processed at this time. Please try again later.' 
            });
        } catch (sendError) {
            logger.error('Failed to send error message', {
                error: sendError.message,
                stack: sendError.stack
            });
        }
    }
};