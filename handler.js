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
const logger = require('pino')({ level: 'info' });

module.exports = async (hans, m, chatUpdate, store) => {
    try {
        // Basic validation of message object
        if (!m || typeof m !== 'object') {
            logger.error('Invalid message object received:', { m });
            return;
        }

        // Safely access message properties
        const body = m.body || '';
        const sender = m.sender || '';
        const remoteJid = m.key?.remoteJid;

        const prefix = '.';
        const isCmd = body.startsWith(prefix);

        // Enhanced logging for command processing
        logger.info('Received message:', {
            body,
            sender,
            remoteJid,
            isGroup: m.isGroup,
            type: m.mtype,
            isCommand: isCmd,
            timestamp: new Date().toISOString()
        });

        // If no body or not a command, return early
        if (!body || !isCmd) {
            logger.debug('Skipping non-command message');
            return;
        }

        // Parse command and arguments safely
        const command = body.slice(prefix.length).trim().split(' ')[0].toLowerCase();
        const args = body.trim().split(/ +/).slice(1);

        logger.info('Processing command:', { 
            command, 
            args,
            sender,
            remoteJid
        });

        // Try each command module in order
        let commandExecuted = false;

        // Owner Commands - Process first for security
        if (Object.prototype.hasOwnProperty.call(ownerCommands, command)) {
            try {
                logger.info('Executing owner command:', { command });
                await ownerCommands[command](hans, m, args);
                commandExecuted = true;
                logger.info('Owner command executed successfully:', { command });
            } catch (error) {
                logger.error('Error executing owner command:', {
                    command,
                    error: error.message,
                    stack: error.stack
                });
                await hans.sendMessage(remoteJid, { 
                    text: `❌ Error executing owner command: ${error.message}` 
                });
            }
        }
        // Group Commands
        else if (Object.prototype.hasOwnProperty.call(groupCommands, command)) {
            try {
                logger.info('Executing group command:', { command });
                await groupCommands[command](hans, m, args);
                commandExecuted = true;
                logger.info('Group command executed successfully:', { command });
            } catch (error) {
                logger.error('Error executing group command:', {
                    command,
                    error: error.message,
                    stack: error.stack
                });
                await hans.sendMessage(remoteJid, { 
                    text: `❌ Error executing group command: ${error.message}` 
                });
            }
        }
        // NSFW Commands
        else if (Object.prototype.hasOwnProperty.call(nsfwCommands, command)) {
            try {
                logger.info('Executing NSFW command:', { command });
                await nsfwCommands[command](hans, m, args);
                commandExecuted = true;
                logger.info('NSFW command executed successfully:', { command });
            } catch (error) {
                logger.error('Error executing NSFW command:', {
                    command,
                    error: error.message,
                    stack: error.stack
                });
                await hans.sendMessage(remoteJid, { 
                    text: `❌ Error executing NSFW command: ${error.message}` 
                });
            }
        }
        // Music Commands
        else if (Object.prototype.hasOwnProperty.call(musicCommands, command)) {
            try {
                logger.info('Executing music command:', { command });
                await musicCommands[command](hans, m, args);
                commandExecuted = true;
                logger.info('Music command executed successfully:', { command });
            } catch (error) {
                logger.error('Error executing music command:', {
                    command,
                    error: error.message,
                    stack: error.stack
                });
                await hans.sendMessage(remoteJid, { 
                    text: `❌ Error executing music command: ${error.message}` 
                });
            }
        }
        // AI Commands
        else if (Object.prototype.hasOwnProperty.call(aiCommands, command)) {
            try {
                logger.info('Executing AI command:', { command });
                await aiCommands[command](hans, m, args);
                commandExecuted = true;
                logger.info('AI command executed successfully:', { command });
            } catch (error) {
                logger.error('Error executing AI command:', {
                    command,
                    error: error.message,
                    stack: error.stack
                });
                await hans.sendMessage(remoteJid, { 
                    text: `❌ Error executing AI command: ${error.message}` 
                });
            }
        }
        // Basic Commands
        else if (Object.prototype.hasOwnProperty.call(basicCommands, command)) {
            try {
                logger.info('Executing basic command:', { command });
                await basicCommands[command](hans, m, args);
                commandExecuted = true;
                logger.info('Basic command executed successfully:', { command });
            } catch (error) {
                logger.error('Error executing basic command:', {
                    command,
                    error: error.message,
                    stack: error.stack
                });
                await hans.sendMessage(remoteJid, { 
                    text: `❌ Error executing basic command: ${error.message}` 
                });
            }
        }
        // Process other command types similarly...
        else if (Object.prototype.hasOwnProperty.call(userCommands, command)) {
            try {
                logger.info('Executing user command:', { command });
                await userCommands[command](hans, m, args);
                commandExecuted = true;
                logger.info('User command executed successfully:', { command });
            } catch (error) {
                logger.error('Error executing user command:', {
                    command,
                    error: error.message,
                    stack: error.stack
                });
                await hans.sendMessage(remoteJid, { 
                    text: `❌ Error executing user command: ${error.message}` 
                });
            }
        } else if (Object.prototype.hasOwnProperty.call(downloaderCommands, command)) {
            try {
                logger.info('Executing downloader command:', { command });
                await downloaderCommands[command](hans, m, args);
                commandExecuted = true;
                logger.info('Downloader command executed successfully:', { command });
            } catch (error) {
                logger.error('Error executing downloader command:', {
                    command,
                    error: error.message,
                    stack: error.stack
                });
                await hans.sendMessage(remoteJid, {
                    text: `❌ Error executing downloader command: ${error.message}`
                });
            }
        } else if (Object.prototype.hasOwnProperty.call(economyCommands, command)) {
            try {
                logger.info('Executing economy command:', { command });
                await economyCommands[command](hans, m, args);
                commandExecuted = true;
                logger.info('Economy command executed successfully:', { command });
            } catch (error) {
                logger.error('Error executing economy command:', {
                    command,
                    error: error.message,
                    stack: error.stack
                });
                await hans.sendMessage(remoteJid, {
                    text: `❌ Error executing economy command: ${error.message}`
                });
            }
        } else if (Object.prototype.hasOwnProperty.call(utilityCommands, command)) {
            try {
                logger.info('Executing utility command:', { command });
                await utilityCommands[command](hans, m, args);
                commandExecuted = true;
                logger.info('Utility command executed successfully:', { command });
            } catch (error) {
                logger.error('Error executing utility command:', {
                    command,
                    error: error.message,
                    stack: error.stack
                });
                await hans.sendMessage(remoteJid, {
                    text: `❌ Error executing utility command: ${error.message}`
                });
            }
        } else if (Object.prototype.hasOwnProperty.call(funCommands, command)) {
            try {
                logger.info('Executing fun command:', { command });
                await funCommands[command](hans, m, args);
                commandExecuted = true;
                logger.info('Fun command executed successfully:', { command });
            } catch (error) {
                logger.error('Error executing fun command:', {
                    command,
                    error: error.message,
                    stack: error.stack
                });
                await hans.sendMessage(remoteJid, {
                    text: `❌ Error executing fun command: ${error.message}`
                });
            }
        } else if (Object.prototype.hasOwnProperty.call(socialCommands, command)) {
            try {
                logger.info('Executing social command:', { command });
                await socialCommands[command](hans, m, args);
                commandExecuted = true;
                logger.info('Social command executed successfully:', { command });
            } catch (error) {
                logger.error('Error executing social command:', {
                    command,
                    error: error.message,
                    stack: error.stack
                });
                await hans.sendMessage(remoteJid, {
                    text: `❌ Error executing social command: ${error.message}`
                });
            }
        } else if (Object.prototype.hasOwnProperty.call(reactionsCommands, command)) {
            try {
                logger.info('Executing reaction command:', { command });
                await reactionsCommands[command](hans, m, args);
                commandExecuted = true;
                logger.info('Reaction command executed successfully:', { command });
            } catch (error) {
                logger.error('Error executing reaction command:', {
                    command,
                    error: error.message,
                    stack: error.stack
                });
                await hans.sendMessage(remoteJid, {
                    text: `❌ Error executing reaction command: ${error.message}`
                });
            }
        }

        // Command not found
        if (!commandExecuted) {
            logger.warn('Command not found:', { command });
            await hans.sendMessage(remoteJid, {
                text: `Command *${command}* not found. Type ${prefix}menu to see available commands.`
            });
        }

    } catch (err) {
        logger.error('Error in command handler:', {
            error: err.message,
            stack: err.stack,
            command: m?.body,
            messageObject: JSON.stringify(m, null, 2)
        });
        try {
            await hans.sendMessage(m?.key?.remoteJid, { 
                text: '❌ An error occurred while processing your command.' 
            });
        } catch (sendError) {
            logger.error('Failed to send error message:', {
                error: sendError.message,
                stack: sendError.stack
            });
        }
    }
};