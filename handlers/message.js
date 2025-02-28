const config = require('../config');
const logger = require('pino')();

// Core command modules for basic functionality
const commandModules = {
    basic: require('../commands/basic'),
    owner: require('../commands/owner')
};

async function executeCommand(sock, msg, command, args, moduleName) {
    try {
        // Enhanced debug logging
        logger.debug('Command execution details:', {
            command,
            module: moduleName,
            args: args,
            chat: msg.key.remoteJid,
            messageType: Object.keys(msg.message)[0],
            timestamp: new Date().toISOString()
        });

        if (!msg.key?.remoteJid) {
            logger.warn('Invalid message: Missing remoteJid');
            return false;
        }

        // Set participant for both group and private chats
        msg.key.participant = msg.key.remoteJid.endsWith('@g.us') 
            ? msg.key.participant 
            : msg.key.remoteJid;

        // Verify command exists
        if (!commandModules[moduleName]?.[command]) {
            logger.warn(`Command not found: ${command} in module ${moduleName}`);
            return false;
        }

        // Execute command with try-catch
        try {
            await commandModules[moduleName][command](sock, msg, args);
            logger.info('Command executed successfully:', {
                command,
                module: moduleName,
                timestamp: new Date().toISOString()
            });
            return true;
        } catch (cmdError) {
            logger.error('Command execution failed:', cmdError);
            throw cmdError;
        }

    } catch (error) {
        logger.error('Command execution error:', {
            command,
            module: moduleName,
            error: error.message,
            stack: error.stack
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

        // Log incoming message with detailed information
        logger.debug('Message received:', {
            chat: msg.key.remoteJid,
            isGroup: msg.key.remoteJid.endsWith('@g.us'),
            participant: msg.key.participant,
            messageType: Object.keys(msg.message)[0],
            fromMe: msg.key.fromMe,
            timestamp: new Date().toISOString()
        });

        // Get message content with better type handling
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

        logger.debug('Extracted message content:', {
            content: textContent,
            startsWithPrefix: textContent.startsWith(config.prefix)
        });

        // Process commands with prefix check
        if (textContent.startsWith(config.prefix)) {
            const [command, ...args] = textContent.slice(config.prefix.length).trim().split(/\s+/);
            const lowercaseCommand = command.toLowerCase();

            logger.info('Command detected:', {
                command: lowercaseCommand,
                args: args,
                originalText: textContent
            });

            // Try basic commands first
            if (lowercaseCommand in commandModules.basic) {
                await executeCommand(sock, msg, lowercaseCommand, args, 'basic');
                return;
            }

            // Then try owner commands
            if (lowercaseCommand in commandModules.owner) {
                await executeCommand(sock, msg, lowercaseCommand, args, 'owner');
                return;
            }

            // Command not found
            logger.warn(`Command not found: ${lowercaseCommand}`);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `Command *${command}* not found. Use ${config.prefix}help to see available commands.`
            });
        }
    } catch (error) {
        logger.error('Message handler error:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = messageHandler;