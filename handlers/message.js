const config = require('../config');
const basicCommands = require('../commands/basic');
const ownerCommands = require('../commands/owner');
const groupCommands = require('../commands/group');
const userCommands = require('../commands/user');
const funCommands = require('../commands/fun');
const store = require('../database/store');
const logger = require('../utils/logger');

// Assuming commandModules is defined elsewhere and contains command modules
const commandModules = {
    basic: basicCommands,
    owner: ownerCommands,
    group: groupCommands,
    user: userCommands,
    fun: funCommands
};


async function executeCommand(sock, msg, command, args, moduleName) {
    try {
        await commandModules[moduleName][command](sock, msg, args);
        logger.info(`Command ${command} executed successfully by ${msg.key.participant} in ${msg.key.remoteJid}`);

        // Award XP for command usage
        const xpResult = await store.addXP(msg.key.participant, store.XP_REWARDS.command);
        if (xpResult.levelUp) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🎉 Congratulations @${msg.key.participant.split('@')[0]}!\nYou've reached level ${xpResult.newLevel}!`,
                mentions: [msg.key.participant]
            });
        }
    } catch (error) {
        logger.error(`Error executing command ${command}:`, error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: 'An error occurred while executing the command.' 
        });
    }
}

// Update message handler to include XP rewards
async function messageHandler(sock, msg) {
    try {
        // Ignore if not a message
        if (!msg.message) return;

        // Get the message content
        const messageType = Object.keys(msg.message)[0];
        const messageContent = msg.message[messageType];

        // Debug log for group messages
        if (msg.key.remoteJid.endsWith('@g.us')) {
            logger.info('Group Message Debug:', {
                messageType,
                remoteJid: msg.key.remoteJid,
                participant: msg.key.participant,
                pushName: msg.pushName
            });
        }

        // Award XP for sending messages
        if (msg.key.participant) {
            await store.addXP(msg.key.participant, store.XP_REWARDS.message);
        }

        // Handle commands
        if (messageType === 'conversation' || messageType === 'extendedTextMessage') {
            const text = messageType === 'conversation' ? 
                msg.message.conversation : 
                msg.message.extendedTextMessage.text;

            // Get the sender ID correctly for both private and group messages
            const senderId = msg.key.remoteJid.endsWith('@g.us') ? 
                (msg.key.participant?.split('@')[0] + '@s.whatsapp.net') : 
                msg.key.remoteJid;

            // Check if message starts with prefix
            if (!text.startsWith(config.prefix)) return;

            // Extract command and arguments
            const [command, ...args] = text.slice(config.prefix.length).trim().split(' ');

            // Find command module
            for (const [moduleName, module] of Object.entries(commandModules)) {
                if (command in module) {
                    await executeCommand(sock, msg, command, args, moduleName);
                    return;
                }
            }

            // Command not found
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `Command *${command}* not found. Use ${config.prefix}menu to see available commands.`
            });
        }
    } catch (error) {
        logger.error('Error in message handler:', error);
    }
}

module.exports = messageHandler;