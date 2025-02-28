const config = require('../config');
const logger = require('pino')();
const store = require('../database/store');

// Command modules mapping
const commandModules = {
    basic: require('../commands/basic'),
    owner: require('../commands/owner'),
    group: require('../commands/group'),
    user: require('../commands/user'),
    fun: require('../commands/fun'),
    anime: require('../commands/anime'),
    music: require('../commands/music'),
    ai: require('../commands/ai'),
    downloader: require('../commands/downloader'),
    economy: require('../commands/economy')
};

async function executeCommand(sock, msg, command, args, moduleName) {
    try {
        // Enhanced logging
        logger.info('Executing command:', {
            command,
            module: moduleName,
            args: args,
            chat: msg.key.remoteJid
        });

        if (!msg.key?.remoteJid) {
            logger.warn('Invalid message: Missing remoteJid');
            return false;
        }

        // Set participant for both group and private chats
        msg.key.participant = msg.key.remoteJid.endsWith('@g.us') 
            ? msg.key.participant 
            : msg.key.remoteJid;

        // Check if command exists
        if (!commandModules[moduleName]?.[command]) {
            logger.warn(`Command not found: ${command} in module ${moduleName}`);
            return false;
        }

        // Execute command
        await commandModules[moduleName][command](sock, msg, args);
        logger.info('Command executed successfully:', {
            command,
            module: moduleName
        });

        return true;
    } catch (error) {
        logger.error('Command execution error:', {
            command,
            module: moduleName,
            error: error.message
        });
        await sock.sendMessage(msg.key.remoteJid, {
            text: `Error executing command: ${error.message}`
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

        // Log incoming message
        logger.info('Message received:', {
            chat: msg.key.remoteJid,
            isGroup: msg.key.remoteJid.endsWith('@g.us'),
            participant: msg.key.participant
        });

        // Get message content
        const messageType = Object.keys(msg.message)[0];
        let textContent = '';

        switch (messageType) {
            case 'conversation':
                textContent = msg.message.conversation;
                break;
            case 'extendedTextMessage':
                textContent = msg.message.extendedTextMessage.text;
                break;
            case 'imageMessage':
            case 'videoMessage':
                textContent = msg.message[messageType].caption || '';
                break;
            default:
                logger.debug(`Unhandled message type: ${messageType}`);
                return;
        }

        // Process commands
        if (textContent.startsWith(config.prefix)) {
            const [command, ...args] = textContent.slice(config.prefix.length).trim().split(/\s+/);
            const lowercaseCommand = command.toLowerCase();

            logger.info('Command detected:', {
                command: lowercaseCommand,
                args: args
            });

            // Find and execute command
            let commandExecuted = false;
            for (const [moduleName, module] of Object.entries(commandModules)) {
                if (lowercaseCommand in module) {
                    commandExecuted = await executeCommand(sock, msg, lowercaseCommand, args, moduleName);
                    break;
                }
            }

            if (!commandExecuted) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `Command *${command}* not found. Use ${config.prefix}menu to see available commands.`
                });
            }
        }
    } catch (error) {
        logger.error('Message handler error:', error);
    }
}

module.exports = messageHandler;