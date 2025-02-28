const config = require('../config');
const logger = require('pino')();

// Load all command modules
const commandModules = {
    basic: require('../commands/basic'),
    owner: require('../commands/owner'),
    downloader: require('../commands/downloader'),
    music: require('../commands/music'),
    fun: require('../commands/fun'),
    economy: require('../commands/economy')
};

async function executeCommand(sock, msg, command, args, moduleName) {
    try {
        logger.debug('Executing command:', {
            command,
            module: moduleName,
            args,
            chat: msg.key.remoteJid
        });

        if (!commandModules[moduleName]?.[command]) {
            logger.warn(`Command ${command} not found in module ${moduleName}`);
            return false;
        }

        await commandModules[moduleName][command](sock, msg, args);
        logger.info(`Command ${command} executed successfully`);
        return true;

    } catch (error) {
        logger.error(`Error executing command ${command}:`, error);
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `Error: ${error.message}`
            });
        } catch (sendError) {
            logger.error('Failed to send error message:', sendError);
        }
        return false;
    }
}

async function messageHandler(sock, msg) {
    try {
        // Validate message
        if (!msg?.message || !msg.key?.remoteJid) {
            logger.debug('Invalid message structure');
            return;
        }

        // Get message content
        const messageType = Object.keys(msg.message)[0];
        let text = '';

        if (messageType === 'conversation') {
            text = msg.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
            text = msg.message.extendedTextMessage.text;
        } else if (messageType === 'imageMessage' || messageType === 'videoMessage') {
            text = msg.message[messageType].caption || '';
        } else {
            logger.debug('Unsupported message type:', messageType);
            return;
        }

        // Check for commands
        if (text.startsWith(config.prefix)) {
            const [rawCommand, ...args] = text.slice(config.prefix.length).trim().split(/\s+/);
            if (!rawCommand) {
                logger.debug('Empty command received');
                return;
            }

            const command = rawCommand.toLowerCase();

            logger.info('Command received:', {
                command,
                args,
                from: msg.key.remoteJid,
                type: messageType
            });

            // Check each module for the command
            for (const [moduleName, module] of Object.entries(commandModules)) {
                if (command in module) {
                    await executeCommand(sock, msg, command, args, moduleName);
                    return;
                }
            }

            // Command not found
            logger.warn('Command not found:', command);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `Command "${command}" not found. Use ${config.prefix}help to see available commands.`
            });
        }
    } catch (error) {
        logger.error('Message handler error:', error);
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: 'An error occurred while processing your message.'
            });
        } catch (sendError) {
            logger.error('Failed to send error message:', sendError);
        }
    }
}

module.exports = messageHandler;