const logger = require('pino')();
const moment = require('moment-timezone');
const config = require('./config');

const basicCommands = {
    ping: async (sock, msg) => {
        try {
            const start = Date.now();
            await sock.sendMessage(msg.key.remoteJid, { text: 'Testing ping...' });
            const end = Date.now();

            const pingText = `🏓 *Ping Statistics*\n\n` +
                           `• Response Time: ${end - start}ms\n` +
                           `• Bot Status: Active`;

            await sock.sendMessage(msg.key.remoteJid, { text: pingText });
            logger.info('Ping command executed successfully');

        } catch (error) {
            logger.error('Error in ping command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error checking ping'
            });
        }
    }
};

module.exports = basicCommands;