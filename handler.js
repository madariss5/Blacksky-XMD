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
const logger = require('./utils/logger');

const commandModules = {
    reactions: reactionsCommands,
    owner: ownerCommands,
    group: groupCommands,
    nsfw: nsfwCommands,
    music: musicCommands,
    ai: aiCommands,
    basic: basicCommands,
    user: userCommands,
    downloader: downloaderCommands,
    economy: economyCommands,
    utility: utilityCommands,
    fun: funCommands,
    social: socialCommands
};

async function executeCommand(moduleName, command, hans, m, args) {
    const module = commandModules[moduleName];
    if (!module) {
        logger.warn(`Command module ${moduleName} not found`);
        return false;
    }

    const cmdFunc = module[command];
    if (typeof cmdFunc !== 'function') {
        logger.warn(`Command ${command} not found in module ${moduleName}`);
        return false;
    }

    try {
        logger.info(`Executing command: ${command}`, {
            module: moduleName,
            args: args,
            chat: m.chat,
            sender: m.sender
        });

        await cmdFunc(hans, m, args);
        return true;
    } catch (error) {
        logger.error(`Error executing command: ${command}`, {
            module: moduleName,
            error: error.message,
            stack: error.stack,
            chat: m.chat,
            sender: m.sender
        });

        const errorMessage = `❌ Error executing ${command}: ${error.message}`;
        await hans.sendMessage(m.key.remoteJid, { text: errorMessage });
        return false;
    }
}

module.exports = async (hans, m, chatUpdate, store) => {
    try {
        // Basic validation
        if (!m || !m.body) {
            logger.debug('Invalid message received', { messageObject: m });
            return;
        }

        const prefix = '.';
        if (!m.body.startsWith(prefix)) {
            logger.debug('Message does not start with prefix', { body: m.body });
            return;
        }

        // Parse command and arguments
        const [rawCommand, ...args] = m.body.slice(prefix.length).trim().split(/\s+/);
        if (!rawCommand) {
            logger.debug('No command provided');
            return;
        }

        const command = rawCommand.toLowerCase();
        logger.info('Processing command', { 
            command, 
            args,
            chat: m.chat,
            sender: m.sender
        });

        // Try executing command in each module
        for (const [moduleName, module] of Object.entries(commandModules)) {
            if (module && command in module) {
                const success = await executeCommand(moduleName, command, hans, m, args);
                if (success) {
                    logger.info(`Command ${command} executed successfully`, {
                        module: moduleName,
                        chat: m.chat,
                        sender: m.sender
                    });
                    return;
                }
            }
        }

        // Command not found
        logger.warn('Command not found', { command });
        await hans.sendMessage(m.key.remoteJid, {
            text: `Command *${command}* not found. Type ${prefix}menu to see available commands.`
        });

    } catch (err) {
        logger.error('Fatal error in command handler', {
            error: err.message,
            stack: err.stack,
            command: m?.body,
            chat: m?.chat,
            sender: m?.sender
        });

        try {
            await hans.sendMessage(m?.key?.remoteJid, { 
                text: '❌ An unexpected error occurred while processing your command.' 
            });
        } catch (sendError) {
            logger.error('Failed to send error message', {
                error: sendError.message,
                stack: sendError.stack
            });
        }
    }
};