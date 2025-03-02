const logger = require('pino')();
const moment = require('moment-timezone');
const config = require('../config');
const handler = require('../handler');

const basicCommands = {
    menu: async (sock, msg) => {
        try {
            // Validate input parameters
            if (!sock || !msg || !msg.key || !msg.key.remoteJid) {
                throw new Error('Invalid message or socket parameters');
            }

            // Get registered commands with logging
            const registeredCommands = handler.getRegisteredCommands();
            logger.info('Retrieved registered commands:', {
                commands: registeredCommands,
                count: registeredCommands.length
            });

            // Basic header with bot info and user details
            let menuText = `*${config.botName} Command Menu*\n\n`;
            menuText += `👤 User: ${msg.pushName || 'User'}\n`;
            menuText += `⏰ Time: ${moment().format('HH:mm:ss')}\n`;
            menuText += `📅 Date: ${moment().format('DD/MM/YYYY')}\n\n`;

            // Group commands by category with validation
            const categories = {};
            Object.entries(config.commands).forEach(([cmd, info]) => {
                // Log each command processing
                logger.debug(`Processing command: ${cmd}`, {
                    category: info.category,
                    isRegistered: registeredCommands.includes(cmd)
                });

                // Only show commands that are actually implemented
                if (!registeredCommands.includes(cmd)) {
                    logger.warn(`Command ${cmd} in config but not implemented`);
                    return;
                }

                if (!categories[info.category]) {
                    categories[info.category] = [];
                }
                categories[info.category].push({
                    command: cmd,
                    description: info.description
                });
            });

            // Log categories found
            logger.info('Categories after grouping:', {
                categories: Object.keys(categories),
                commandCounts: Object.fromEntries(
                    Object.entries(categories).map(([cat, cmds]) => [cat, cmds.length])
                )
            });

            // Sort categories alphabetically
            const sortedCategories = Object.keys(categories).sort();

            // Add each category with its commands
            for (const category of sortedCategories) {
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

            // Log menu text before sending
            logger.info('Generated menu text:', {
                length: menuText.length,
                categories: sortedCategories.length,
                totalCommands: Object.values(categories).flat().length
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: menuText
            });

            logger.info('Menu sent successfully');

        } catch (error) {
            // Enhanced error logging
            logger.error('Error in menu command:', {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                },
                context: {
                    remoteJid: msg?.key?.remoteJid,
                    hasSocket: !!sock,
                    hasMessage: !!msg
                }
            });

            // Attempt to send error message if possible
            if (sock && msg?.key?.remoteJid) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Error generating menu. Please try again.'
                }).catch(err => {
                    logger.error('Failed to send error message:', err);
                });
            }
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