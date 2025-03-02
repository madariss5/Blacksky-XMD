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

// Simple owner verification based on phone number
const isOwner = (sender) => {
    try {
        if (!sender) {
            logger.error('Invalid sender: null or undefined');
            return false;
        }

        // Format sender's number consistently
        const senderNumber = formatPhoneNumber(sender);
        const ownerNumber = config.ownerNumber;

        // Log verification attempt
        logger.info('Owner verification:', {
            rawSender: sender,
            formattedSender: senderNumber,
            ownerNumber: ownerNumber,
            isMatch: senderNumber === ownerNumber
        });

        return senderNumber === ownerNumber;
    } catch (error) {
        logger.error('Error in owner verification:', error);
        return false;
    }
};

// Execute command with improved error handling
async function executeCommand(moduleName, command, hans, m, args) {
    try {
        const module = commandModules[moduleName];
        if (!module) {
            logger.warn(`Module ${moduleName} not found`);
            return null;
        }

        // Check owner status for owner commands
        if (moduleName === 'owner') {
            const senderId = m.key.participant || m.key.remoteJid;

            // Enhanced logging for debugging owner commands
            logger.info('Owner command attempt:', {
                command,
                messageKey: JSON.stringify(m.key),
                participant: m.key.participant,
                remoteJid: m.key.remoteJid,
                selectedSenderId: senderId,
                isFromGroup: m.key.remoteJid?.includes('@g.us')
            });

            if (!isOwner(senderId)) {
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

        // Log command execution attempt
        logger.info(`Executing command in module ${moduleName}:`, {
            command,
            args,
            module: moduleName
        });

        await cmdFunc(hans, m, args);
        return true;
    } catch (error) {
        logger.error(`Error executing command: ${command}`, error);
        await hans.sendMessage(m.key.remoteJid, { 
            text: '❌ An error occurred while processing your command.' 
        }).catch(console.error);
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
            logger.debug('Invalid message object');
            return;
        }

        // Enhanced message structure logging
        logger.info('Message structure:', {
            messageKey: JSON.stringify(m.key),
            messageType: m.type,
            fromGroup: m.key.remoteJid?.includes('@g.us'),
            fromPrivate: m.key.remoteJid?.includes('@s.whatsapp.net'),
            participant: m.key.participant,
            remoteJid: m.key.remoteJid,
            fromMe: m.key.fromMe,
            timestamp: m.messageTimestamp
        });

        const prefix = '.';
        if (!m.body?.startsWith(prefix)) {
            return;
        }

        // Parse command and args
        const [rawCommand, ...args] = m.body.slice(prefix.length).trim().split(/\s+/);
        if (!rawCommand) {
            return;
        }

        const command = rawCommand.toLowerCase();
        const senderId = m.key.participant || m.key.remoteJid;

        // Log command processing with enhanced details
        logger.info('Processing command', { 
            command, 
            args,
            chat: m.key.remoteJid,
            sender: senderId,
            isFromGroup: m.key.remoteJid?.includes('@g.us'),
            rawParticipant: m.key.participant,
            rawRemoteJid: m.key.remoteJid,
            isOwner: isOwner(senderId)
        });

        // Execute command
        let commandExecuted = false;
        for (const [moduleName, module] of Object.entries(commandModules)) {
            if (module && typeof module[command] === 'function') {
                const success = await executeCommand(moduleName, command, hans, m, args);
                if (success) {
                    commandExecuted = true;
                    break;
                }
            }
        }

        // Handle command not found
        if (!commandExecuted) {
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