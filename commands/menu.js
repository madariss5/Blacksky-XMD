const config = require('../config');
const moment = require('moment-timezone');
const { getUptime } = require('../utils');
const logger = require('pino')();

const menuCommands = {
    menu: async (sock, msg) => {
        try {
            const pushName = msg.pushName || 'User';

            // Modern Xeon-style header
            let menuText = `╭─❏ 『 𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻 』 ❏\n`;
            menuText += `│\n`;
            menuText += `│ ⦿ User: ${pushName}\n`;
            menuText += `│ ⦿ Time: ${moment().format('HH:mm:ss')}\n`;
            menuText += `│ ⦿ Day: ${moment().format('dddd')}\n`;
            menuText += `│ ⦿ Date: ${moment().format('DD/MM/YYYY')}\n`;
            menuText += `│ ⦿ Runtime: ${getUptime()}\n`;
            menuText += `│\n`;
            menuText += `╰────────────⦿\n\n`;

            // Get commands by category
            const categories = {};
            Object.entries(config.commands).forEach(([cmd, info]) => {
                const category = info.category || 'Misc';
                if (!categories[category]) {
                    categories[category] = [];
                }
                categories[category].push({ name: cmd, ...info });
            });

            // Category icons (Xeon-style)
            const categoryIcons = {
                'Main': '🎯',
                'Group': '👥',
                'Economy': '💰',
                'Fun': '🎮',
                'Media': '📽️',
                'Owner': '👑',
                'Misc': '🎲'
            };

            // List commands by category
            Object.entries(categories).forEach(([category, cmds]) => {
                const icon = categoryIcons[category] || '📌';
                menuText += `╭─❏ ${icon} *${category}* ❏\n`;
                cmds.forEach(cmd => {
                    menuText += `│ ⦿ ${config.prefix}${cmd.name}\n`;
                    if (cmd.description) {
                        menuText += `│ └─ ${cmd.description}\n`;
                    }
                });
                menuText += `╰────────────⦿\n\n`;
            });

            // Modern footer
            menuText += `╭─❏ 『 Info 』 ❏\n`;
            menuText += `│ To get detailed info:\n`;
            menuText += `│ ${config.prefix}help <command>\n`;
            menuText += `╰────────────⦿\n\n`;
            menuText += `乂 *${config.botName}* 乂\n`;
            menuText += `Powered by BlackSky Algorithms ⚡`;

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