const config = require('../config');
const moment = require('moment-timezone');
const { getUptime } = require('../utils');
const logger = require('pino')();

const menuCommands = {
    menu: async (sock, msg) => {
        try {
            const pushName = msg.pushName || 'User';

            // Fancy header with bot name
            let menuText = `╭═══〘 ⚡ ${config.botName} ⚡ 〙═══⊷❍\n`;
            menuText += `┃ ╭──────────────\n`;
            menuText += `┃ │ 👋 Welcome, ${pushName}!\n`;
            menuText += `┃ │ 🕐 ${moment().format('HH:mm:ss')}\n`;
            menuText += `┃ │ 📅 ${moment().format('DD/MM/YYYY')}\n`;
            menuText += `┃ │ ⚡ Prefix: ${config.prefix}\n`;
            menuText += `┃ │ ⌛ Uptime: ${getUptime()}\n`;
            menuText += `┃ ╰──────────────\n┃\n`;

            // Organize commands by category
            const categories = {};
            Object.entries(config.commands).forEach(([cmd, info]) => {
                const category = info.category || 'Misc';
                if (!categories[category]) {
                    categories[category] = [];
                }
                categories[category].push({ name: cmd, ...info });
            });

            // Category emojis
            const categoryEmojis = {
                'Main': '🎯',
                'Group': '👥',
                'Economy': '💰',
                'Owner': '👑',
                'Misc': '🎲'
            };

            // Add commands by category
            Object.entries(categories).forEach(([category, cmds]) => {
                const emoji = categoryEmojis[category] || '📌';
                menuText += `┃ ╭─❏ ${emoji} ${category}\n`;
                cmds.forEach(cmd => {
                    menuText += `┃ │ ➪ ${config.prefix}${cmd.name}\n`;
                    menuText += `┃ │ ❋ ${cmd.description}\n`;
                });
                menuText += `┃ ╰──────────────\n┃\n`;
            });

            // Footer
            menuText += `╰═══════════════════⊷❍\n`;
            menuText += `\n乂 *${config.botName}* 乂\n`;
            menuText += `Powered by BlackSky Algorithms`;

            await sock.sendMessage(msg.key.remoteJid, { text: menuText });
            logger.info('Menu command executed successfully');

        } catch (error) {
            logger.error('Error in menu command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error displaying menu'
            });
        }
    }
};

module.exports = menuCommands;