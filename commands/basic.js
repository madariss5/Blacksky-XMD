const logger = require('pino')();
const moment = require('moment-timezone');
const config = require('../config');

const basicCommands = {
    menu: async (sock, msg) => {
        try {
            logger.info('Starting menu generation...');

            // Basic header with bot info and user details
            let menuText = `*${config.botName} Command Menu*\n\n`;
            menuText += `👤 User: ${msg.pushName || 'User'}\n`;
            menuText += `⏰ Time: ${moment().format('HH:mm:ss')}\n`;
            menuText += `📅 Date: ${moment().format('DD/MM/YYYY')}\n\n`;

            // Group commands by category
            const categories = {};
            for (const [cmd, info] of Object.entries(config.commands)) {
                if (!categories[info.category]) {
                    categories[info.category] = [];
                }
                categories[info.category].push({
                    command: cmd,
                    description: info.description
                });
            }

            // Sort categories alphabetically
            const sortedCategories = Object.keys(categories).sort();

            // Add each category with its commands
            for (const category of sortedCategories) {
                // Add category header with emoji
                const emoji = getCategoryEmoji(category);
                menuText += `${emoji} *${category}*\n`;

                // Sort commands within category
                categories[category].sort((a, b) => a.command.localeCompare(b.command));

                // Add commands
                for (const cmd of categories[category]) {
                    menuText += `➤ ${config.prefix}${cmd.command} - ${cmd.description}\n`;
                }
                menuText += '\n';
            }

            // Footer
            menuText += `\n📝 Use ${config.prefix}help [command] for detailed info about a command`;

            await sock.sendMessage(msg.key.remoteJid, {
                text: menuText
            });

            logger.info('Menu generated and sent successfully');

        } catch (error) {
            logger.error('Error in menu command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error generating menu. Please try again.'
            });
        }
    },

    help: async (sock, msg, args) => {
        try {
            if (!args.length) {
                const text = `*Command Help*\n\n` +
                    `• Use ${config.prefix}menu to see all commands\n` +
                    `• Use ${config.prefix}help [command] for specific help\n\n` +
                    `Example: ${config.prefix}help sticker`;

                return await sock.sendMessage(msg.key.remoteJid, { text });
            }

            const command = args[0].toLowerCase();
            const cmdInfo = config.commands[command];

            if (!cmdInfo) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Command "${command}" not found.\nUse ${config.prefix}menu to see available commands.`
                });
            }

            const text = `*Command: ${command}*\n\n` +
                        `Category: ${cmdInfo.category}\n` +
                        `Description: ${cmdInfo.description}\n` +
                        `Usage: ${config.prefix}${command}`;

            await sock.sendMessage(msg.key.remoteJid, { text });

        } catch (error) {
            logger.error('Help command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing help.'
            });
        }
    }
};

// Helper function to get emoji for each category
function getCategoryEmoji(category) {
    const emojis = {
        'Basic': '📌',
        'AI': '🤖',
        'Game': '🎮',
        'Media': '📷',
        'Group': '👥',
        'Education': '📚',
        'Economy': '💰',
        'Utility': '🛠️'
    };
    return emojis[category] || '📋';
}

module.exports = basicCommands;