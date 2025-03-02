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

// isOwner function update
const isOwner = (sender) => {
    try {
        if (!sender) {
            logger.error('Invalid sender: null or undefined');
            return false;
        }

        // Clean up sender JID - handle both direct messages and group messages
        const senderNumber = formatPhoneNumber(sender);
        const ownerNumber = config.ownerNumber;

        // Enhanced logging for debugging owner verification
        logger.info('Owner verification details:', {
            rawSender: sender,
            cleanedSender: senderNumber,
            ownerNumber: ownerNumber,
            match: senderNumber === ownerNumber,
            messageType: sender.includes('@g.us') ? 'group' : 'private'
        });

        // Check if sender matches owner number
        const isOwnerNumber = senderNumber === ownerNumber;

        return isOwnerNumber;
    } catch (error) {
        logger.error('Error in isOwner check:', error);
        return false;
    }
};

// Safely execute command with error handling
async function executeCommand(moduleName, command, hans, m, args) {
    try {
        const module = commandModules[moduleName];
        if (!module) {
            logger.warn(`Command module ${moduleName} not found`);
            return null;
        }

        // For owner commands, verify ownership
        if (moduleName === 'owner') {
            const senderId = m.key.participant || m.key.remoteJid;
            if (!isOwner(senderId)) {
                logger.warn(`Non-owner tried to use owner command: ${command}`, {
                    sender: senderId,
                    command: command
                });
                await hans.sendMessage(m.key.remoteJid, { 
                    text: '❌ This command is only for the bot owner!' 
                });
                return false;
            }
        }

        const cmdFunc = module[command];
        if (typeof cmdFunc !== 'function') {
            logger.warn(`Command ${command} not found in module ${moduleName}`);
            return false;
        }

        logger.info(`Executing command: ${command}`, {
            module: moduleName,
            args: args,
            chat: m.key.remoteJid,
            sender: m.key.participant || m.key.remoteJid
        });

        await cmdFunc(hans, m, args);
        return true;
    } catch (error) {
        logger.error(`Error executing command: ${command}`, {
            module: moduleName,
            error: error.message,
            stack: error.stack,
            chat: m.key.remoteJid,
            sender: m.key.participant || m.key.remoteJid
        });

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

module.exports = async (hans, m, chatUpdate, store) => {
    try {
        if (!m || !m.key) {
            logger.debug('Invalid message received', { messageObject: m });
            return;
        }

        // Log full message structure for debugging
        logger.info('Message structure:', {
            key: JSON.stringify(m.key),
            type: m.type,
            messageTimestamp: m.messageTimestamp
        });

        const prefix = '.';
        if (!m.body?.startsWith(prefix)) {
            logger.debug('Message does not start with prefix', { body: m.body });
            return;
        }

        // Extract command and args
        const [rawCommand, ...args] = m.body.slice(prefix.length).trim().split(/\s+/);
        if (!rawCommand) {
            logger.debug('No command provided');
            return;
        }

        const command = rawCommand.toLowerCase();
        const senderId = m.key.participant || m.key.remoteJid;

        logger.info('Processing command', { 
            command, 
            args,
            chat: m.key.remoteJid,
            sender: senderId,
            isOwner: isOwner(senderId)
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
                        chat: m.key.remoteJid,
                        sender: senderId
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
        logger.error('Fatal error in command handler', err);
        await hans.sendMessage(m?.key?.remoteJid, { 
            text: '❌ An error occurred while processing your command.' 
        }).catch(console.error);
    }
};