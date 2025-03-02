const logger = require('pino')();
const { getUptime } = require('../utils');

const basicCommands = {
    ping: async (sock, msg) => {
        try {
            const start = Date.now();
            await sock.sendMessage(msg.key.remoteJid, { text: 'Testing ping...' });
            const end = Date.now();

            const pingText = `🏓 *Ping Statistics*\n\n` +
                           `• Response Time: ${end - start}ms\n` +
                           `• Bot Status: Active\n` +
                           `• Uptime: ${getUptime()}`;

            await sock.sendMessage(msg.key.remoteJid, { text: pingText });
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
    }
};

module.exports = basicCommands;