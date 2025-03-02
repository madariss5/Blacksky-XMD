const logger = require('pino')();
const moment = require('moment-timezone');
const config = require('../config');

const basicCommands = {
    menu: async (sock, msg) => {
        try {
            logger.info('Starting menu generation...');

            // Basic header with bot info and time
            let menuText = `*${config.botName || 'BLACKSKY-MD'} BOT*\n`;
            menuText += `─`.repeat(15) + `\n\n`;
            menuText += `👤 User: ${msg.pushName || 'User'}\n`;
            menuText += `⏰ Time: ${moment().format('HH:mm:ss')}\n`;
            menuText += `📅 Date: ${moment().format('DD/MM/YYYY')}\n\n`;

            // Organize commands by category
            const categories = {
                '🎯 Basic': [],
                '🎮 Games': [],
                '🤖 AI': [],
                '📚 Education': [],
                '💰 Economy': [],
                '🎵 Media': [],
                '👥 Group': []
            };

            // Get all registered commands from the config
            Object.entries(config.commands).forEach(([cmd, info]) => {
                const categoryEmoji = {
                    'Basic': '🎯',
                    'Game': '🎮',
                    'AI': '🤖',
                    'Education': '📚',
                    'Economy': '💰',
                    'Media': '🎵',
                    'Group': '👥'
                };

                const categoryKey = `${categoryEmoji[info.category] || '📦'} ${info.category}`;
                if (!categories[categoryKey]) {
                    categories[categoryKey] = [];
                }

                categories[categoryKey].push({
                    command: cmd,
                    description: info.description || 'No description available'
                });
            });

            // Build menu text with categories
            Object.entries(categories).forEach(([category, commands]) => {
                if (commands.length > 0) {
                    menuText += `${category}\n`;
                    commands.forEach(cmd => {
                        menuText += `• ${config.prefix}${cmd.command} - ${cmd.description}\n`;
                    });
                    menuText += '\n';
                }
            });

            menuText += `\n📝 Send ${config.prefix}help <command> for detailed info`;

            logger.info('Menu text generated successfully');

            // Send the menu
            await sock.sendMessage(msg.key.remoteJid, {
                text: menuText
            });

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
                           `To get help for a specific command:\n` +
                           `${config.prefix}help <command>\n\n` +
                           `Example: ${config.prefix}help sticker\n\n` +
                           `For all commands:\n` +
                           `${config.prefix}menu`;

                return await sock.sendMessage(msg.key.remoteJid, { text });
            }

            const command = args[0].toLowerCase();
            const cmdInfo = config.commands[command];

            if (!cmdInfo) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Command "${command}" not found.`
                });
            }

            const helpText = `*Command: ${config.prefix}${command}*\n\n` +
                           `Category: ${cmdInfo.category}\n` +
                           `Description: ${cmdInfo.description}\n` +
                           `Usage: ${cmdInfo.usage || config.prefix + command}\n` +
                           (cmdInfo.example ? `Example: ${cmdInfo.example}\n` : '') +
                           (cmdInfo.cooldown ? `Cooldown: ${cmdInfo.cooldown}s\n` : '');

            await sock.sendMessage(msg.key.remoteJid, { text: helpText });
        } catch (error) {
            logger.error('Help command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing help.'
            });
        }
    },

    ping: async (sock, msg) => {
        try {
            const start = Date.now();
            await sock.sendMessage(msg.key.remoteJid, { text: 'Pinging...' });
            const end = Date.now();

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🏓 Pong!\nResponse time: ${end - start}ms`
            });
        } catch (error) {
            logger.error('Error in ping command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error checking ping'
            });
        }
    }
};

module.exports = basicCommands;