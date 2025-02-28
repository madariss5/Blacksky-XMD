const config = require('../config');
const logger = require('pino')();

// Initialize command modules with better error handling
const commandModules = {};
try {
    commandModules.basic = require('../commands/basic');        // Basic commands
    commandModules.media = require('../commands/media');        // Media & sticker commands
    commandModules.fun = require('../commands/fun');           // Fun & reaction commands
    commandModules.game = require('../commands/game');         // Game commands
    commandModules.downloader = require('../commands/downloader'); // Downloader commands
    commandModules.music = require('../commands/music');       // Music commands
    commandModules.ai = require('../commands/ai');            // AI commands
    commandModules.group = require('../commands/group');       // Group management
    commandModules.owner = require('../commands/owner');       // Owner commands
    commandModules.utility = require('../commands/utility');   // Utility commands
    commandModules.anime = require('../commands/anime');       // Anime commands
    commandModules.nsfw = require('../commands/nsfw');        // NSFW commands
} catch (error) {
    logger.error('Error loading command modules:', error.message, error.stack);
}

async function executeCommand(sock, msg, command, args, moduleName) {
    try {
        logger.debug('Executing command:', {
            command,
            module: moduleName,
            args,
            chat: msg.key.remoteJid,
            messageId: msg.key.id
        });

        // Validate module and command existence
        if (!commandModules[moduleName]) {
            logger.warn(`Module ${moduleName} not found`, { moduleName });
            return false;
        }

        if (!commandModules[moduleName][command]) {
            logger.warn(`Command ${command} not found in module ${moduleName}`, { 
                command, 
                moduleName,
                availableCommands: Object.keys(commandModules[moduleName])
            });
            return false;
        }

        // Execute command with enhanced error handling
        await commandModules[moduleName][command](sock, msg, args);

        logger.info(`Command ${command} executed successfully`, {
            messageId: msg.key.id,
            participant: msg.key.participant
        });
        return true;

    } catch (error) {
        logger.error(`Error executing command ${command}:`, {
            error: error.message,
            stack: error.stack,
            messageId: msg.key.id
        });
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ Error executing ${command}: ${error.message}`
            });
        } catch (sendError) {
            logger.error('Failed to send error message:', sendError);
        }
        return false;
    }
}

async function messageHandler(sock, msg) {
    try {
        // Enhanced message validation with logging
        if (!msg?.message || !msg.key?.remoteJid) {
            logger.debug('Invalid message structure:', {
                hasMessage: !!msg?.message,
                hasRemoteJid: !!msg.key?.remoteJid,
                messageId: msg.key?.id
            });
            return;
        }

        // Get message content with enhanced validation
        const messageType = Object.keys(msg.message)[0];
        let text = '';

        logger.debug('Processing message:', {
            type: messageType,
            from: msg.key.remoteJid,
            participant: msg.key.participant,
            messageId: msg.key.id,
            hasCaption: messageType === 'imageMessage' || messageType === 'videoMessage'
        });

        if (messageType === 'conversation') {
            text = msg.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
            text = msg.message.extendedTextMessage.text;
        } else if (messageType === 'imageMessage' || messageType === 'videoMessage') {
            text = msg.message[messageType].caption || '';
        } else {
            logger.debug('Unsupported message type:', {
                type: messageType,
                messageId: msg.key.id
            });
            return;
        }

        // Check for commands with improved validation
        if (text.startsWith(config.prefix)) {
            const [rawCommand, ...args] = text.slice(config.prefix.length).trim().split(/\s+/);
            if (!rawCommand) {
                logger.debug('Empty command received', {
                    messageId: msg.key.id
                });
                return;
            }

            const command = rawCommand.toLowerCase();

            logger.info('Command received:', {
                command,
                args,
                from: msg.key.remoteJid,
                type: messageType,
                messageId: msg.key.id
            });

            let commandExecuted = false;

            // Try NSFW commands first if command exists in NSFW module
            if (commandModules.nsfw && command in commandModules.nsfw) {
                logger.debug('Attempting to execute NSFW command:', { command });
                commandExecuted = await executeCommand(sock, msg, command, args, 'nsfw');
                if (commandExecuted) return;
            }

            // Try each module for the command
            for (const [moduleName, module] of Object.entries(commandModules)) {
                if (moduleName !== 'nsfw' && module && command in module) {
                    commandExecuted = await executeCommand(sock, msg, command, args, moduleName);
                    if (commandExecuted) break;
                }
            }

            // Command not found
            if (!commandExecuted) {
                logger.warn('Command not found:', {
                    command,
                    messageId: msg.key.id
                });
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `Command "${command}" not found. Use ${config.prefix}help to see available commands.`
                });
            }
        }
    } catch (error) {
        logger.error('Message handler error:', {
            error: error.message,
            stack: error.stack,
            messageId: msg.key?.id
        });
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