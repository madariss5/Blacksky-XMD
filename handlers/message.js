const config = require('../config');
const logger = require('pino')();
const fs = require('fs-extra');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

// Load all command modules
const commandModules = {
    basic: require('../commands/basic'),
    owner: require('../commands/owner'),
    downloader: require('../commands/downloader'),
    music: require('../commands/music'),
    fun: require('../commands/fun'),
    economy: require('../commands/economy'),
    group: require('../commands/group'),
    nsfw: require('../commands/nsfw'),
    game: require('../commands/game'),
    anime: require('../commands/anime'),
    ai: require('../commands/ai'),
    media: require('../commands/media')
};

async function executeCommand(sock, msg, command, args, moduleName) {
    try {
        logger.debug('Executing command:', {
            command,
            module: moduleName,
            args,
            chat: msg.key.remoteJid,
            messageId: msg.key.id
        });

        if (!commandModules[moduleName]?.[command]) {
            logger.warn(`Command ${command} not found in module ${moduleName}`);
            return false;
        }

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
        // Enhanced message validation with logging
        if (!msg?.message || !msg.key?.remoteJid) {
            logger.debug('Invalid message structure:', {
                hasMessage: !!msg?.message,
                hasRemoteJid: !!msg.key?.remoteJid,
                messageId: msg.key?.id
            });
            return;
        }

        // Get message content with enhanced logging
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

        // Check for commands with improved logging
        if (text.startsWith('.')) {
            const [rawCommand, ...args] = text.slice(1).trim().split(/\s+/);
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

            // Check each module for the command
            for (const [moduleName, module] of Object.entries(commandModules)) {
                if (command in module) {
                    await executeCommand(sock, msg, command, args, moduleName);
                    return;
                }
            }

            // Command not found
            logger.warn('Command not found:', {
                command,
                messageId: msg.key.id
            });
            await sock.sendMessage(msg.key.remoteJid, {
                text: `Command "${command}" not found. Use .help to see available commands.`
            });
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