const logger = require('pino')();
const moment = require('moment-timezone');
const config = require('../config');

const basicCommands = {
    menu: async (sock, msg) => {
        try {
            // Header
            let menuText = `╔══《 ${config.botName} MENU 》══╗\n`;
            menuText += `║ 👤 User: ${msg.pushName || 'User'}\n`;
            menuText += `║ ⏰ Time: ${moment().format('HH:mm:ss')}\n`;
            menuText += `║ 📅 Date: ${moment().format('DD/MM/YYYY')}\n`;
            menuText += `╚════════════════════╝\n\n`;

            // Simple category emojis
            const categoryEmojis = {
                'Basic': '📌',
                'AI': '🤖',
                'Media': '📸',
                'Group': '👥',
                'Owner': '👑',
                'Utility': '⚙️'
            };

            // Group commands by category
            const categories = {};
            Object.entries(config.commands).forEach(([cmd, info]) => {
                if (!categories[info.category]) {
                    categories[info.category] = [];
                }
                categories[info.category].push({
                    command: cmd,
                    description: info.description
                });
            });

            // Display commands by category
            Object.entries(categories).forEach(([category, commands]) => {
                const emoji = categoryEmojis[category] || '📌';
                menuText += `┏━━━《 ${emoji} ${category} 》━━━┓\n`;
                commands.forEach(({command, description}) => {
                    menuText += `┃ ⌬ ${config.prefix}${command}\n`;
                    menuText += `┃ └─ ${description}\n`;
                });
                menuText += `┗━━━━━━━━━━━━━━━┛\n\n`;
            });

            // Footer
            menuText += `╔════════════════════╗\n`;
            menuText += `║ Type ${config.prefix}help <command> ║\n`;
            menuText += `║    for detailed info     ║\n`;
            menuText += `╚════════════════════╝`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: config.menuImage },
                caption: menuText
            });

        } catch (error) {
            logger.error('Error in menu command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error generating menu.'
            });
        }
    },

    help: async (sock, msg) => {
        try {
            const text = `*${config.botName} Help*\n\n` +
                        `To see all commands, type: ${config.prefix}menu\n\n` +
                        `Basic Commands:\n` +
                        `• ${config.prefix}help - Show this help message\n` +
                        `• ${config.prefix}menu - Show command menu`;

            await sock.sendMessage(msg.key.remoteJid, { text });
        } catch (error) {
            logger.error('Help command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing help.'
            });
        }
    }
};

module.exports = basicCommands;