const config = require('../config');
const logger = require('pino')();

const basicCommands = {
    help: async (sock, msg) => {
        try {
            logger.debug('Executing help command');
            const text = `*${config.botName}*\n\n` +
                        `📌 *Basic Commands*:\n` +
                        `• ${config.prefix}help - Show this help message\n` +
                        `• ${config.prefix}ping - Check bot response\n` +
                        `• ${config.prefix}menu - Show all commands\n\n` +
                        `Type ${config.prefix}menu to see the full command list!`;

            await sock.sendMessage(msg.key.remoteJid, { text });
            logger.info('Help command executed successfully');
        } catch (error) {
            logger.error('Help command failed:', error);
            throw error;
        }
    },

    ping: async (sock, msg) => {
        try {
            logger.debug('Executing ping command');
            const start = Date.now();

            await sock.sendMessage(msg.key.remoteJid, { 
                text: 'Testing bot response...' 
            });

            const latency = Date.now() - start;
            await sock.sendMessage(msg.key.remoteJid, {
                text: `Bot Status:\n• Response Time: ${latency}ms\n• Connection: Active`
            });

            logger.info('Ping command executed successfully');
        } catch (error) {
            logger.error('Ping command failed:', error);
            throw error;
        }
    },

    menu: async (sock, msg) => {
        try {
            logger.debug('Executing menu command');

            // Group commands by category
            const categories = {};
            Object.entries(config.commands).forEach(([cmd, info]) => {
                if (!categories[info.category]) {
                    categories[info.category] = [];
                }
                categories[info.category].push(`• ${config.prefix}${cmd} - ${info.description}`);
            });

            // Build menu text with all categories
            let text = `*${config.botName} Commands*\n\n`;

            // Basic commands first
            if (categories['Basic']) {
                text += `📌 *Basic Commands*\n${categories['Basic'].join('\n')}\n\n`;
            }

            // Then other categories
            const categoryIcons = {
                'Media': '🎨',
                'Downloader': '📥',
                'Music': '🎵',
                'AI': '🤖',
                'Group': '👥',
                'Fun': '🎮',
                'Game': '🎲',
                'Economy': '💰',
                'Anime': '🎌',
                'Utility': '🛠️',
                'Owner': '👑',
                'NSFW': '🔞',
                'Debug': '🐛'
            };

            // Add other categories
            Object.entries(categories).forEach(([category, commands]) => {
                if (category !== 'Basic' && commands.length > 0) {
                    const icon = categoryIcons[category] || '📌';
                    text += `${icon} *${category} Commands*\n${commands.join('\n')}\n\n`;
                }
            });

            text += `Use ${config.prefix}help <command> for detailed info!`;

            await sock.sendMessage(msg.key.remoteJid, { text });
            logger.info('Menu command executed successfully');
        } catch (error) {
            logger.error('Menu command failed:', error);
            throw error;
        }
    }
};

module.exports = basicCommands;