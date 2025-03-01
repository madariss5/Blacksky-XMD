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
const nsfwCommands = require('./commands/nsfw'); // Added NSFW commands
const logger = require('pino')({ level: 'info' });

module.exports = async (hans, m, chatUpdate, store) => {
    try {
        const prefix = '.';
        const isCmd = m.body?.startsWith(prefix);

        // Enhanced logging for command processing
        logger.info('Received message:', {
            body: m.body,
            from: m.sender,
            isGroup: m.isGroup,
            type: m.mtype,
            isCommand: isCmd,
            timestamp: new Date().toISOString()
        });

        // If no body or not a command, return
        if (!m.body || !isCmd) return;

        const command = m.body.slice(prefix.length).trim().split(' ')[0].toLowerCase();
        const args = m.body.trim().split(/ +/).slice(1);

        logger.info('Processing command:', { 
            command, 
            args,
            sender: m.sender,
            chat: m.chat
        });

        // Try each command module in order
        let commandExecuted = false;

        // Group Commands - Process first for admin actions
        if (Object.prototype.hasOwnProperty.call(groupCommands, command)) {
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
                await hans.sendMessage(m.key.remoteJid, { 
                    text: `❌ Error executing group command: ${error.message}` 
                });
            }
        }
        // NSFW Commands - Add with age verification
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
                await hans.sendMessage(m.key.remoteJid, { 
                    text: `❌ Error executing NSFW command: ${error.message}` 
                });
            }
        }
        else if (musicCommands[command]) {
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
                await hans.sendMessage(m.key.remoteJid, { 
                    text: `❌ Error executing music command: ${error.message}` 
                });
            }
        }
        else if (aiCommands[command]) {
            try {
                logger.info('Executing AI command:', { command });
                await aiCommands[command](hans, m, args);
                commandExecuted = true;
                logger.info('AI command executed successfully:', { command });
            } catch (error) {
                logger.error('Error executing AI command:', {
                    command,
                    error: error.message,
                    stack: error.stack,
                    args
                });
                await hans.sendMessage(m.key.remoteJid, { 
                    text: `❌ Error executing command: ${error.message}` 
                });
            }
        }
        else if (basicCommands[command]) {
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
                await hans.sendMessage(m.key.remoteJid, { 
                    text: `❌ Error executing command: ${error.message}` 
                });
            }
        }
        else if (userCommands[command]) {
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
                await hans.sendMessage(m.key.remoteJid, { 
                    text: `❌ Error executing command: ${error.message}` 
                });
            }
        }
        else if (downloaderCommands[command]) {
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
                await hans.sendMessage(m.key.remoteJid, { 
                    text: `❌ Error executing command: ${error.message}` 
                });
            }
        }
        else if (economyCommands[command]) {
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
                await hans.sendMessage(m.key.remoteJid, { 
                    text: `❌ Error executing command: ${error.message}` 
                });
            }
        }
        else if (utilityCommands[command]) {
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
                await hans.sendMessage(m.key.remoteJid, { 
                    text: `❌ Error executing command: ${error.message}` 
                });
            }
        }
        else if (funCommands[command]) {
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
                await hans.sendMessage(m.key.remoteJid, { 
                    text: `❌ Error executing command: ${error.message}` 
                });
            }
        }
        else if (socialCommands[command]) {
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
                await hans.sendMessage(m.key.remoteJid, { 
                    text: `❌ Error executing command: ${error.message}` 
                });
            }
        }
        else if (reactionsCommands[command]) {
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
                await hans.sendMessage(m.key.remoteJid, { 
                    text: `❌ Error executing command: ${error.message}` 
                });
            }
        }
        else if (ownerCommands[command]) {
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
                await hans.sendMessage(m.key.remoteJid, { 
                    text: `❌ Error executing command: ${error.message}` 
                });
            }
        }

        // Command not found
        if (!commandExecuted) {
            logger.warn('Command not found:', { command });
            await hans.sendMessage(m.key.remoteJid, {
                text: `Command *${command}* not found. Type ${prefix}menu to see available commands.`
            });
        }

    } catch (err) {
        logger.error("Error in command handler:", {
            error: err.message,
            stack: err.stack,
            command: m.body
        });
        try {
            await hans.sendMessage(m.key.remoteJid, { 
                text: "❌ An error occurred while processing your command." 
            });
        } catch (sendError) {
            logger.error("Failed to send error message:", {
                error: sendError.message,
                stack: sendError.stack
            });
        }
    }
};