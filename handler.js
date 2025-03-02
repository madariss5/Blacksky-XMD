const config = require('./config');
const logger = require('./utils/logger');

// Import all command modules
const aiCommands = require('./commands/ai');
const animeCommands = require('./commands/anime');
const basicCommands = require('./commands/basic');
const downloaderCommands = require('./commands/downloader');
const economyCommands = require('./commands/economy');
const educationCommands = require('./commands/education');
const funCommands = require('./commands/fun');
const gameCommands = require('./commands/game');
const groupCommands = require('./commands/group');
const mediaCommands = require('./commands/media');
const musicCommands = require('./commands/music');
const nsfwCommands = require('./commands/nsfw');
const ownerCommands = require('./commands/owner');
const reactionsCommands = require('./commands/reactions');
const searchCommands = require('./commands/search');
const socialCommands = require('./commands/social');
const toolCommands = require('./commands/tool');
const userCommands = require('./commands/user');
const utilityCommands = require('./commands/utility');

// Debug logging for module imports
logger.info('Importing command modules...');

// Debug each module's commands
const commandModules = {
    AI: aiCommands,
    Anime: animeCommands,
    Basic: basicCommands,
    Downloader: downloaderCommands,
    Economy: economyCommands,
    Education: educationCommands,
    Fun: funCommands,
    Game: gameCommands,
    Group: groupCommands,
    Media: mediaCommands,
    Music: musicCommands,
    NSFW: nsfwCommands,
    Owner: ownerCommands,
    Reactions: reactionsCommands,
    Search: searchCommands,
    Social: socialCommands,
    Tool: toolCommands,
    User: userCommands,
    Utility: utilityCommands
};

// Log each module's commands
Object.entries(commandModules).forEach(([category, commands]) => {
    logger.info(`${category} commands:`, Object.keys(commands || {}));
});

// Initialize allCommands as an empty object
const allCommands = {};

// Merge commands with detailed logging
Object.entries(commandModules).forEach(([category, commands]) => {
    if (commands && typeof commands === 'object') {
        Object.entries(commands).forEach(([cmdName, cmdFunction]) => {
            if (typeof cmdFunction === 'function') {
                allCommands[cmdName] = cmdFunction;
                logger.info(`Registered command: ${cmdName} from ${category}`);
            } else {
                logger.warn(`Invalid command: ${cmdName} in ${category}`);
            }
        });
    } else {
        logger.warn(`Empty or invalid module: ${category}`);
    }
});

// Debug logging for available commands
logger.info('Total available commands:', Object.keys(allCommands).length);
logger.info('Available commands:', Object.keys(allCommands));

async function messageHandler(sock, msg, { messages }, store) {
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

        logger.info(`Received command: ${command} with args:`, args);

        // Execute command from combined commands
        if (allCommands[command]) {
            logger.info(`Executing command: ${command}`);
            await allCommands[command](sock, msg, args);
            return;
        }

        // Command not found
        logger.info(`Command not found: ${command}`);
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

module.exports = messageHandler;
module.exports.allCommands = allCommands;