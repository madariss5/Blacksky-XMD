const logger = require('pino')();
const moment = require('moment-timezone');
const config = require('../config');
const { getUptime } = require('../utils');

const basicCommands = {
    menu: async (sock, msg) => {
        try {
            const pushName = msg.pushName || 'User';
            const userId = msg.key.participant || msg.key.remoteJid;

            let menuText = `🔧 *Utility Commands*\n\n`;

            // Media Conversion
            menuText += `Media Conversion:\n`;
            menuText += `!sticker - Create sticker from image/video\n`;
            menuText += `!tts <text> - Convert text to speech\n`;
            menuText += `!translate <lang> <text> - Translate text\n`;
            menuText += `!ytmp3 <url> - Download YouTube audio as MP3\n`;
            menuText += `!ytmp4 <url> - Download YouTube video as MP4\n\n`;

            // Information
            menuText += `Information:\n`;
            menuText += `!weather <city> - Get weather info\n`;
            menuText += `!calc <expression> - Calculate expression\n`;
            menuText += `!stats - Show bot statistics\n\n`;

            // System
            menuText += `System:\n`;
            menuText += `!ping - Check bot response time\n`;
            menuText += `!uptime - Show bot uptime\n`;
            menuText += `!report <issue> - Report an issue\n\n`;

            menuText += `Statistics:\n`;
            menuText += `• Status: Online\n`;
            menuText += `• Uptime: ${getUptime()}\n`;
            menuText += `• Memory: ${process.memoryUsage().heapUsed / 1024 / 1024} MB\n`;
            menuText += `• Platform: ${process.platform}\n`;
            menuText += `• Node.js: ${process.version}\n`;

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
            await sock.sendMessage(msg.key.remoteJid, { text: 'Testing ping...' });
            const end = Date.now();

            const response = `Pong!\n• Response time: ${end - start}ms\n• Uptime: ${getUptime()}`;

            await sock.sendMessage(msg.key.remoteJid, {
                text: response
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