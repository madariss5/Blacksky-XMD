const config = require('../config');
const basicCommands = require('../commands/basic');
const ownerCommands = require('../commands/owner');
const groupCommands = require('../commands/group');
const userCommands = require('../commands/user');
const funCommands = require('../commands/fun');
const animeCommands = require('../commands/anime');
const musicCommands = require('../commands/music');
const store = require('../database/store');
const logger = require('../utils/logger');

// Command modules mapping
const commandModules = {
    basic: basicCommands,
    owner: ownerCommands,
    group: groupCommands,
    user: userCommands,
    fun: funCommands,
    anime: animeCommands,
    music: musicCommands
};

async function executeCommand(sock, msg, command, args, moduleName) {
    try {
        logger.info(`Executing command: ${command} from module: ${moduleName}`, {
            user: msg.key.participant,
            chat: msg.key.remoteJid,
            args: args
        });

        // Validate message and participant
        if (!msg.key?.remoteJid || (!msg.key?.participant && !msg.key.remoteJid.endsWith('@s.whatsapp.net'))) {
            logger.warn('Invalid message format or missing participant');
            return false;
        }

        // For private chats, set participant as remoteJid
        if (!msg.key.participant && msg.key.remoteJid.endsWith('@s.whatsapp.net')) {
            msg.key.participant = msg.key.remoteJid;
        }

        // Check if command exists in module
        if (!commandModules[moduleName]?.[command]) {
            logger.warn(`Command ${command} not found in module ${moduleName}`);
            return false;
        }

        // Execute command with enhanced error handling
        try {
            await commandModules[moduleName][command](sock, msg, args);
            logger.info(`Command ${command} executed successfully`, {
                user: msg.key.participant,
                chat: msg.key.remoteJid
            });

            // Award XP for command usage if available
            try {
                const xpResult = await store.addXP(msg.key.participant, store.XP_REWARDS.command);
                if (xpResult?.levelUp) {
                    await sock.sendMessage(msg.key.remoteJid, { 
                        text: `🎉 Congratulations @${msg.key.participant.split('@')[0]}!\nYou've reached level ${xpResult.newLevel}!`,
                        mentions: [msg.key.participant]
                    });
                }
            } catch (xpError) {
                logger.error('Error handling XP reward:', xpError);
                // Don't fail the command if XP handling fails
            }

            return true;
        } catch (cmdError) {
            logger.error(`Error executing command ${command}:`, cmdError);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: 'An error occurred while executing the command. Please try again.' 
            });
            return false;
        }
    } catch (error) {
        logger.error(`Fatal error in command execution:`, error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: 'A critical error occurred. Please try again later.' 
        });
        return false;
    }
}

async function messageHandler(sock, msg) {
    try {
        if (!msg.message || !msg.key?.remoteJid) {
            logger.debug('Skipping invalid message');
            return;
        }

        const messageType = Object.keys(msg.message)[0];
        const messageContent = msg.message[messageType];

        logger.info('Message received:', {
            type: messageType,
            remoteJid: msg.key.remoteJid,
            participant: msg.key.participant,
            pushName: msg.pushName
        });

        // Handle XP for messages
        try {
            if (msg.key.participant) {
                await store.addXP(msg.key.participant, store.XP_REWARDS.message);
            }
        } catch (xpError) {
            logger.error('Error handling message XP:', xpError);
        }

        // Extract text content from different message types
        let textContent = '';
        switch (messageType) {
            case 'conversation':
                textContent = messageContent;
                break;
            case 'extendedTextMessage':
                textContent = messageContent.text;
                break;
            case 'imageMessage':
            case 'videoMessage':
                textContent = messageContent.caption || '';
                break;
            default:
                logger.debug(`Unhandled message type: ${messageType}`);
                return;
        }

        // Handle commands
        if (textContent.startsWith(config.prefix)) {
            const [command, ...args] = textContent.slice(config.prefix.length).trim().split(/\s+/);
            logger.info(`Command received: ${command}, Arguments:`, args);

            // Set participant for group messages
            if (msg.key.remoteJid.endsWith('@g.us') && !msg.key.participant) {
                msg.key.participant = msg.key.remoteJid;
            }

            // Find and execute command
            let commandExecuted = false;
            for (const [moduleName, module] of Object.entries(commandModules)) {
                if (command.toLowerCase() in module) {
                    commandExecuted = await executeCommand(sock, msg, command.toLowerCase(), args, moduleName);
                    break;
                }
            }

            // Command not found
            if (!commandExecuted) {
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: `Command *${command}* not found. Use ${config.prefix}menu to see available commands.`
                });
            }
        }
    } catch (error) {
        logger.error('Error in message handler:', error);
    }
}

module.exports = messageHandler;