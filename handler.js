const config = require('./config');
const logger = require('./utils/logger');
const basicCommands = require('./commands/basic');
const userCommands = require('./commands/user');

module.exports = async (sock, msg, { messages }, store) => {
    try {
        // Get message content
        const messageType = Object.keys(msg.message)[0];
        let messageContent = '';

        // Extract message based on type
        switch (messageType) {
            case 'conversation':
                messageContent = msg.message.conversation;
                break;
            case 'extendedTextMessage':
                messageContent = msg.message.extendedTextMessage.text;
                break;
            case 'imageMessage':
                messageContent = msg.message.imageMessage.caption;
                break;
            case 'videoMessage':
                messageContent = msg.message.videoMessage.caption;
                break;
            default:
                return; // Unsupported message type
        }

        // Parse command
        const prefix = config.prefix || '.';
        if (!messageContent.startsWith(prefix)) {
            logger.debug('Message does not start with prefix:', messageContent);
            return;
        }
        const args = messageContent.slice(prefix.length).trim().split(/\s+/);
        const command = args.shift()?.toLowerCase();

        // Debug log
        logger.info('Command details:', {
            command,
            args,
            from: msg.key.remoteJid
        });

        // Execute command
        if (basicCommands[command]) {
            await basicCommands[command](sock, msg, args);
            return;
        }

        if (userCommands[command]) {
            await userCommands[command](sock, msg, args);
            return;
        }

        // Command not found
        await sock.sendMessage(msg.key.remoteJid, {
            text: `❌ Command *${command}* not found.\nType ${prefix}help to see available commands.`
        });

    } catch (error) {
        logger.error('Error in command handler:', error);
        await sock.sendMessage(msg.key.remoteJid, {
            text: '❌ Error processing command. Please try again.'
        }).catch(err => logger.error('Error sending error message:', err));
    }
};