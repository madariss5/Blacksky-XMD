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
        logger.info(`Executing command: ${command} from module: ${moduleName}`);

        // Check if command exists in module
        if (!commandModules[moduleName][command]) {
            logger.warn(`Command ${command} not found in module ${moduleName}`);
            return false;
        }

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
        return true;
    } catch (error) {
        logger.error(`Error executing command ${command}:`, error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: 'An error occurred while executing the command.' 
        });
        return false;
    }
}

async function messageHandler(sock, msg) {
    try {
        if (!msg.message) return;

        const messageType = Object.keys(msg.message)[0];
        const messageContent = msg.message[messageType];

        logger.info('Message received:', {
            type: messageType,
            remoteJid: msg.key.remoteJid,
            participant: msg.key.participant,
            pushName: msg.pushName
        });

        // Award XP for sending messages
        if (msg.key.participant) {
            await store.addXP(msg.key.participant, store.XP_REWARDS.message);
        }

        // Handle commands
        if (messageType === 'conversation' || messageType === 'extendedTextMessage') {
            const text = messageType === 'conversation' ? 
                msg.message.conversation : 
                msg.message.extendedTextMessage.text;

            // Get the sender ID
            const senderId = msg.key.remoteJid.endsWith('@g.us') ? 
                (msg.key.participant?.split('@')[0] + '@s.whatsapp.net') : 
                msg.key.remoteJid;

            // Check if message starts with prefix
            if (!text.startsWith(config.prefix)) return;

            // Extract command and arguments
            const [command, ...args] = text.slice(config.prefix.length).trim().split(' ');
            logger.info(`Command received: ${command}, Arguments:`, args);

            // Find and execute command
            let commandExecuted = false;
            for (const [moduleName, module] of Object.entries(commandModules)) {
                if (command in module) {
                    commandExecuted = await executeCommand(sock, msg, command, args, moduleName);
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