const logger = require('pino')();
const config = require('../config');
const { getUptime } = require('../utils');

const basicCommands = {
    menu: async (sock, msg) => {
        try {
            const menuText = `🔧 *Utility Commands*\n\n` +
                           `Media Conversion:\n` +
                           `!sticker - Create sticker from image/video\n` +
                           `!tts <text> - Convert text to speech\n` +
                           `!translate <lang> <text> - Translate text\n` +
                           `!ytmp3 <url> - Download YouTube audio as MP3\n` +
                           `!ytmp4 <url> - Download YouTube video as MP4\n\n` +

                           `Information:\n` +
                           `!weather <city> - Get weather info\n` +
                           `!calc <expression> - Calculate expression\n` +
                           `!stats - Show bot statistics\n\n` +

                           `System:\n` +
                           `!ping - Check bot response time\n` +
                           `!uptime - Show bot uptime\n` +
                           `!report <issue> - Report an issue\n`;

            await sock.sendMessage(msg.key.remoteJid, { text: menuText });
            logger.info('Menu command executed successfully');

        } catch (error) {
            logger.error('Error in menu command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error displaying menu'
            });
        }
    },

    stats: async (sock, msg) => {
        try {
            const stats = `📊 *Bot Statistics*\n\n` +
                         `• Status: Online\n` +
                         `• Uptime: ${getUptime()}\n` +
                         `• Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\n` +
                         `• Platform: ${process.platform}\n` +
                         `• Node.js: ${process.version}`;

            await sock.sendMessage(msg.key.remoteJid, { text: stats });
            logger.info('Stats command executed successfully');

        } catch (error) {
            logger.error('Error in stats command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error displaying statistics'
            });
        }
    },

    ping: async (sock, msg) => {
        try {
            const start = Date.now();
            await sock.sendMessage(msg.key.remoteJid, { text: 'Testing ping...' });
            const end = Date.now();

            const response = `🏓 *Ping Statistics*\n\n` +
                           `• Response Time: ${end - start}ms\n` +
                           `• Bot Status: Active\n` +
                           `• Uptime: ${getUptime()}`;

            await sock.sendMessage(msg.key.remoteJid, { text: response });
            logger.info('Ping command executed successfully');

        } catch (error) {
            logger.error('Error in ping command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error checking ping'
            });
        }
    },

    uptime: async (sock, msg) => {
        try {
            const uptimeText = `⏱️ *Bot Uptime*\n\n` +
                             `• Running Time: ${getUptime()}`;

            await sock.sendMessage(msg.key.remoteJid, { text: uptimeText });
            logger.info('Uptime command executed successfully');

        } catch (error) {
            logger.error('Error in uptime command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error checking uptime'
            });
        }
    },

    report: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide an issue to report!\nUsage: !report <issue>'
                });
            }

            const issue = args.join(' ');
            logger.info('New issue reported:', issue);

            await sock.sendMessage(msg.key.remoteJid, {
                text: '✅ Thank you for reporting the issue. The bot owner will look into it.'
            });

        } catch (error) {
            logger.error('Error in report command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error submitting report'
            });
        }
    }
};

module.exports = basicCommands;