const logger = require('pino')();
const moment = require('moment-timezone');
const config = require('../config');

const basicCommands = {
    menu: async (sock, msg) => {
        try {
            // Format menu text to match the screenshot exactly
            let menuText = '🔧 Utility Commands\n\n';

            // Media Conversion section
            menuText += 'Media Conversion:\n';
            menuText += '!sticker - Create sticker from image/video\n';
            menuText += '!tts <text> - Convert text to speech\n';
            menuText += '!translate <lang> <text> - Translate text\n';
            menuText += '!ytmp3 <url> - Download YouTube audio as MP3\n';
            menuText += '!ytmp4 <url> - Download YouTube video as MP4\n\n';

            // Information section
            menuText += 'Information:\n';
            menuText += '!weather <city> - Get weather info\n';
            menuText += '!calc <expression> - Calculate expression\n';
            menuText += '!stats - Show bot statistics\n\n';

            // System section
            menuText += 'System:\n';
            menuText += '!ping - Check bot response time\n';
            menuText += '!uptime - Show bot uptime\n';
            menuText += '!report <issue> - Report an issue\n';

            await sock.sendMessage(msg.key.remoteJid, {
                text: menuText
            });

        } catch (error) {
            logger.error('Error in menu command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error generating menu'
            });
        }
    },

    help: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: 'Use !menu to see available commands'
                });
            }

            const command = args[0].toLowerCase();
            const cmdInfo = config.commands[command];

            if (!cmdInfo) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Command not found'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${command}*\n${cmdInfo.description || 'No description available'}`
            });
        } catch (error) {
            logger.error('Error in help command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing help'
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