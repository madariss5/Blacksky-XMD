const config = require('./config');
const logger = require('./utils/logger');
const basicCommands = require('./commands/basic');
const userCommands = require('./commands/user');

module.exports = async (sock, msg, { messages, type }, store) => {
    try {
        // Log the incoming message structure
        logger.debug('Handler received message:', {
            msg: JSON.stringify(msg, null, 2)
        });

        // Extract message content with fallbacks
        const messageContent = (
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            msg.message?.imageMessage?.caption ||
            msg.message?.videoMessage?.caption ||
            ''
        ).trim();

        // Check for prefix and command
        const prefix = config.prefix || '.';
        if (!messageContent.startsWith(prefix)) {
            logger.debug('Message does not start with prefix:', messageContent);
            return;
        }

        // Parse command and arguments
        const args = messageContent.slice(prefix.length).trim().split(/\s+/);
        const command = args.shift()?.toLowerCase();

        if (!command) {
            logger.debug('No command found in message');
            return;
        }

        logger.info('Processing command:', {
            command,
            args,
            from: msg.key.remoteJid
        });

        // Try to execute the command
        if (basicCommands[command]) {
            logger.info('Executing basic command:', command);
            await basicCommands[command](sock, msg, args);
            return;
        }

        if (userCommands[command]) {
            logger.info('Executing user command:', command);
            await userCommands[command](sock, msg, args);
            return;
        }

        // Command not found
        logger.info('Command not found:', command);
        await sock.sendMessage(msg.key.remoteJid, {
            text: `❌ Command *${command}* not found. Use ${prefix}help to see available commands.`
        });

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