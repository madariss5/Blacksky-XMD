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
    music: require('../commands/music')
};

async function executeCommand(sock, msg, command, args, moduleName) {
    try {
        // Enhanced logging for debugging
        logger.info('Command execution attempt:', {
            command,
            module: moduleName,
            chat: msg.key.remoteJid,
            isGroup: msg.key.remoteJid.endsWith('@g.us'),
            participant: msg.key.participant || msg.key.remoteJid
        });

        // Validate message context
        if (!msg.key?.remoteJid) {
            logger.warn('Invalid message: Missing remoteJid');
            return false;
        }

        // Handle group participant identification
        if (msg.key.remoteJid.endsWith('@g.us')) {
            if (!msg.key.participant) {
                logger.warn('Group message missing participant ID');
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: 'Error: Could not identify message sender' 
                });
                return false;
            }
        } else {
            // For private chats, participant is the remoteJid
            msg.key.participant = msg.key.remoteJid;
        }

        // Verify command exists
        if (!commandModules[moduleName]?.[command]) {
            logger.warn(`Command not found: ${command} in module ${moduleName}`);
            return false;
        }

        // Execute command with enhanced error handling
        try {
            await commandModules[moduleName][command](sock, msg, args);
            logger.info('Command executed successfully:', {
                command,
                module: moduleName,
                participant: msg.key.participant
            });

            // Handle XP rewards
            try {
                const xpResult = await store.addXP(msg.key.participant, store.XP_REWARDS?.command || 10);
                if (xpResult?.levelUp) {
                    await sock.sendMessage(msg.key.remoteJid, {
                        text: `🎉 Congratulations @${msg.key.participant.split('@')[0]}!\nYou've reached level ${xpResult.newLevel}!`,
                        mentions: [msg.key.participant]
                    });
                }
            } catch (xpError) {
                logger.error('XP reward error:', xpError);
            }

            return true;
        } catch (cmdError) {
            logger.error('Command execution failed:', {
                command,
                error: cmdError.message,
                stack: cmdError.stack
            });
            await sock.sendMessage(msg.key.remoteJid, {
                text: `Error executing command: ${cmdError.message}`
            });
            return false;
        }
    } catch (error) {
        logger.error('Fatal command execution error:', {
            error: error.message,
            stack: error.stack
        });
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
            chat: msg.key.remoteJid,
            isGroup: msg.key.remoteJid.endsWith('@g.us'),
            participant: msg.key.participant || msg.key.remoteJid
        });

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
            const lowercaseCommand = command.toLowerCase();

            logger.info('Command detected:', {
                command: lowercaseCommand,
                args,
                chat: msg.key.remoteJid
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
        logger.error('Message handler error:', {
            error: error.message,
            stack: error.stack
        });
    }
}

module.exports = messageHandler;