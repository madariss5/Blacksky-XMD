const config = require('../config');
const { getUptime } = require('../utils');
const moment = require('moment-timezone');

const menuCommands = {
    menu: async (sock, msg) => {
        try {
            const pushName = msg.pushName || 'User';
            const now = moment();

            // Header with fancy styling
            let menuText = `╔══❬ 𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻 ❭══╗\n\n`;
            menuText += `┏━━『 User Info 』\n`;
            menuText += `┃ ⚡ Name: ${pushName}\n`;
            menuText += `┃ 🎭 Status: ${msg.key.fromMe ? 'Bot' : 'User'}\n`;
            menuText += `┃ ⏰ Time: ${now.format('HH:mm:ss')}\n`;
            menuText += `┃ 📅 Date: ${now.format('DD/MM/YYYY')}\n`;
            menuText += `┗━━━━━━━━━━━━━\n\n`;

            // Bot Info
            menuText += `┏━━『 Bot Info 』\n`;
            menuText += `┃ 🤖 Bot Name: ${config.botName}\n`;
            menuText += `┃ 👑 Owner: ${config.ownerName}\n`;
            menuText += `┃ ⚙️ Prefix: ${config.prefix}\n`;
            menuText += `┃ ⌚ Runtime: ${getUptime()}\n`;
            menuText += `┗━━━━━━━━━━━━━\n\n`;

            // Command List by Category
            const categories = {};
            Object.entries(config.commands).forEach(([cmd, info]) => {
                if (!categories[info.category]) {
                    categories[info.category] = [];
                }
                categories[info.category].push(cmd);
            });

            // Category Icons
            const categoryIcons = {
                'Main': '🎯',
                'Group': '👥',
                'Economy': '💰',
                'Owner': '👑'
            };

            // Display Commands by Category
            Object.entries(categories).forEach(([category, commands]) => {
                const icon = categoryIcons[category] || '📌';
                menuText += `┏━━『 ${icon} ${category} 』\n`;
                commands.forEach(cmd => {
                    const cmdInfo = config.commands[cmd];
                    menuText += `┃ ❐ ${config.prefix}${cmd}\n`;
                    menuText += `┃ └ ${cmdInfo.description}\n`;
                });
                menuText += `┗━━━━━━━━━━━━━\n\n`;
            });

            // Footer
            menuText += `╚══❬ BLACKSKY-MD ❭══╝\n`;
            menuText += `Made with ❤️ by ${config.ownerName}`;

            await sock.sendMessage(msg.key.remoteJid, {
                text: menuText
            });

        } catch (error) {
            console.error('Error in menu command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error displaying menu'
            });
        }
    },

    help: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `To see command details, use: ${config.prefix}help <command>\nExample: ${config.prefix}help ping`
                });
            }

            const command = args[0].toLowerCase();
            const cmdInfo = config.commands[command];

            if (!cmdInfo) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Command not found'
                });
            }

            const helpText = `╭━━━『 Command Info 』━━━⊷\n` +
                           `┃ Name: ${command}\n` +
                           `┃ Category: ${cmdInfo.category}\n` +
                           `┃ Description: ${cmdInfo.description}\n` +
                           `┃ Usage: ${config.prefix}${command}\n` +
                           `╰━━━━━━━━━━━━━━━⊷`;

            await sock.sendMessage(msg.key.remoteJid, { text: helpText });

        } catch (error) {
            logger.error('Error in help command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error displaying help'
            });
        }
    }
};

module.exports = menuCommands;