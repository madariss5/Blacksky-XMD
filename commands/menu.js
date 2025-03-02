const config = require('../config');
const { getUptime } = require('../utils');
const logger = require('pino')();
const moment = require('moment-timezone');

const menuCommands = {
    menu: async (sock, msg) => {
        try {
            const pushName = msg.pushName || 'User';

            let menuText = `╭━━━『 ${config.botName} 』━━━⊷\n`;
            menuText += `┃ ⛥┏━━━━━━━━━━━━\n`;
            menuText += `┃ ⛥┃ User: ${pushName}\n`;
            menuText += `┃ ⛥┃ Bot: ${config.botName}\n`;
            menuText += `┃ ⛥┃ Prefix: ${config.prefix}\n`;
            menuText += `┃ ⛥┃ Runtime: ${getUptime()}\n`;
            menuText += `┃ ⛥┃ Time: ${moment().format('HH:mm:ss')}\n`;
            menuText += `┃ ⛥┃ Date: ${moment().format('DD/MM/YYYY')}\n`;
            menuText += `┃ ⛥┗━━━━━━━━━━━━\n`;
            menuText += `╰━━━━━━━━━━━━━━━⊷\n\n`;

            // Main Commands
            menuText += `╭━━━『 Main 』\n`;
            menuText += `┃ ⬡ ${config.prefix}ping\n`;
            menuText += `┃ ⬡ ${config.prefix}runtime\n`;
            menuText += `┃ ⬡ ${config.prefix}owner\n`;
            menuText += `╰━━━━━━━━━━⊷\n\n`;

            // Group Commands
            menuText += `╭━━━『 Group 』\n`;
            menuText += `┃ ⬡ ${config.prefix}kick\n`;
            menuText += `┃ ⬡ ${config.prefix}add\n`;
            menuText += `┃ ⬡ ${config.prefix}promote\n`;
            menuText += `┃ ⬡ ${config.prefix}demote\n`;
            menuText += `┃ ⬡ ${config.prefix}setname\n`;
            menuText += `┃ ⬡ ${config.prefix}hidetag\n`;
            menuText += `┃ ⬡ ${config.prefix}grouplink\n`;
            menuText += `╰━━━━━━━━━━⊷\n\n`;

            // Economy Commands
            menuText += `╭━━━『 Economy 』\n`;
            menuText += `┃ ⬡ ${config.prefix}balance\n`;
            menuText += `┃ ⬡ ${config.prefix}daily\n`;
            menuText += `┃ ⬡ ${config.prefix}work\n`;
            menuText += `┃ ⬡ ${config.prefix}rob\n`;
            menuText += `┃ ⬡ ${config.prefix}transfer\n`;
            menuText += `┃ ⬡ ${config.prefix}shop\n`;
            menuText += `┃ ⬡ ${config.prefix}inventory\n`;
            menuText += `╰━━━━━━━━━━⊷\n\n`;

            // Fun Commands
            menuText += `╭━━━『 Reactions 』\n`;
            menuText += `┃ ⬡ ${config.prefix}slap\n`;
            menuText += `┃ ⬡ ${config.prefix}hug\n`;
            menuText += `┃ ⬡ ${config.prefix}pat\n`;
            menuText += `┃ ⬡ ${config.prefix}kiss\n`;
            menuText += `┃ ⬡ ${config.prefix}punch\n`;
            menuText += `┃ ⬡ ${config.prefix}kill\n`;
            menuText += `╰━━━━━━━━━━⊷\n\n`;

            // Footer
            menuText += `╭━━━『 Note 』\n`;
            menuText += `┃ Usage: ${config.prefix}help <command>\n`;
            menuText += `┃ Example: ${config.prefix}help ping\n`;
            menuText += `╰━━━━━━━━━━⊷`;

            await sock.sendMessage(msg.key.remoteJid, {
                text: menuText
            });

            logger.info('Menu command executed successfully');

        } catch (error) {
            logger.error('Error in menu command:', error);
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