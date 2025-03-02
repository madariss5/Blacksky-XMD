const config = require('./config');
const logger = require('./utils/logger');

// Import command modules
const basicCommands = require('./commands/basic');
const userCommands = require('./commands/user');

module.exports = async (sock, msg, { messages, type }, store) => {
    try {
        // Debug log for incoming message
        logger.debug('Raw message:', JSON.stringify(msg, null, 2));

        // Get message content
        const messageContent = msg.message?.conversation || 
                             msg.message?.extendedTextMessage?.text || 
                             msg.message?.imageMessage?.caption || 
                             msg.message?.videoMessage?.caption || '';

        logger.info('Processing message:', {
            content: messageContent,
            from: msg.key.remoteJid,
            participant: msg.key.participant
        });

        // Check for prefix and command
        const prefix = config.prefix || '.';
        if (!messageContent.startsWith(prefix)) {
            logger.debug('Message does not start with prefix:', messageContent);
            return;
        }

        // Extract command and arguments
        const args = messageContent.slice(prefix.length).trim().split(/\s+/);
        const command = args.shift()?.toLowerCase();

        if (!command) {
            logger.debug('No command found in message');
            return;
        }

        logger.info('Executing command:', {
            command,
            args,
            from: msg.key.remoteJid
        });

        // Try basic commands first
        if (basicCommands[command]) {
            await basicCommands[command](sock, msg, args);
            return;
        }

        // Try user commands next
        if (userCommands[command]) {
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