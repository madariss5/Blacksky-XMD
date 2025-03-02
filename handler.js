const config = require('./config');
const logger = require('./utils/logger');

// Import all command modules
const basicCommands = require('./commands/basic');
const utilityCommands = require('./commands/utility');
const userCommands = require('./commands/user');
const ownerCommands = require('./commands/owner');
const groupCommands = require('./commands/group');
const mediaCommands = require('./commands/media');
const funCommands = require('./commands/fun');
const aiCommands = require('./commands/ai');
const searchCommands = require('./commands/search');
const educationCommands = require('./commands/education');

// Combine all command modules
const allCommands = {
    ...basicCommands,
    ...utilityCommands,
    ...userCommands,
    ...ownerCommands,
    ...groupCommands,
    ...mediaCommands,
    ...funCommands,
    ...aiCommands,
    ...searchCommands,
    ...educationCommands
};

// Export allCommands so it can be used by basic.js
module.exports = {
    allCommands,
    handler: async (sock, msg, { messages }, store) => {
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
                return;
            }
            const args = messageContent.slice(prefix.length).trim().split(/\s+/);
            const command = args.shift()?.toLowerCase();

            logger.info(`Executing command: ${command} with args:`, args);

            // Execute command from combined commands
            if (allCommands[command]) {
                await allCommands[command](sock, msg, args);
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
    }
};