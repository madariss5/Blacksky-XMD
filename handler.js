const basicCommands = require('./commands/basic');
const userCommands = require('./commands/user');
const reactionsCommands = require('./commands/reactions');
const ownerCommands = require('./commands/owner');
const funCommands = require('./commands/fun');
const logger = require('./utils/logger');
const config = require('./config');

const commandModules = {
    basic: basicCommands,
    user: userCommands,
    reactions: reactionsCommands,
    owner: ownerCommands.commands,
    fun: funCommands
};

module.exports = async (sock, msg, { messages, type }, store) => {
    try {
        // Enhanced logging for message debugging
        logger.info('Received message:', {
            body: msg.body,
            type: msg.type,
            from: msg.key.remoteJid,
            participant: msg.key.participant
        });

        if (!msg.body) {
            logger.debug('Message body is empty, skipping processing');
            return;
        }

        // Check for prefix
        const prefix = config.prefix || '.';
        if (!msg.body.startsWith(prefix)) {
            logger.debug('Message does not start with prefix, skipping');
            return;
        }

        // Parse command with improved error handling
        const args = msg.body.slice(prefix.length).trim().split(/\s+/);
        const command = args.shift()?.toLowerCase();

        if (!command) {
            logger.debug('No command found in message');
            return;
        }

        // Log command processing
        logger.info('Processing command:', {
            command,
            args,
            chat: msg.key.remoteJid,
            sender: msg.key.participant || msg.key.remoteJid
        });

        // Execute command if found
        let commandFound = false;
        for (const [module, commands] of Object.entries(commandModules)) {
            if (commands[command]) {
                logger.info(`Executing command from ${module} module:`, command);
                await commands[command](sock, msg, args);
                commandFound = true;
                break;
            }
        }

        // Command not found response
        if (!commandFound) {
            logger.info('Command not found:', command);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `Command *${command}* not found. Use ${prefix}menu to see available commands.`
            });
        }

    } catch (err) {
        logger.error('Error in command handler:', err);
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error executing command. Please try again.'
            });
        } catch (sendError) {
            logger.error('Error sending error message:', sendError);
        }
    }
};