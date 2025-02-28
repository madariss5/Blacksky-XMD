const config = require('../config');
const logger = require('pino')();

const basicCommands = {
    help: async (sock, msg, args) => {
        try {
            logger.debug('Help command execution started', { args });

            const text = `*Available Commands*\n\n` +
                        `1️⃣ *Basic Commands*\n` +
                        `• ${config.prefix}help - Show this help message\n` +
                        `• ${config.prefix}ping - Check bot response\n` +
                        `• ${config.prefix}menu - Show full menu\n\n` +
                        `Type ${config.prefix}help <command> for detailed help`;

            logger.debug('Sending help message');
            await sock.sendMessage(msg.key.remoteJid, { text });
            logger.info('Help command completed successfully');
        } catch (error) {
            logger.error('Error in help command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error: ' + error.message
            });
        }
    },

    ping: async (sock, msg) => {
        try {
            logger.debug('Ping command execution started');

            const start = Date.now();
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '🔄 Testing bot response...' 
            });
            const latency = Date.now() - start;

            logger.debug('Sending ping response', { latency });
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🏓 Pong!\nResponse time: ${latency}ms`
            });
            logger.info('Ping command completed successfully');
        } catch (error) {
            logger.error('Error in ping command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error: ' + error.message
            });
        }
    },

    menu: async (sock, msg) => {
        try {
            logger.debug('Menu command execution started');

            const text = `*${config.botName} Menu*\n\n` +
                        `📌 *Basic Commands*\n` +
                        `• ${config.prefix}help - Get help\n` +
                        `• ${config.prefix}ping - Check bot\n` +
                        `• ${config.prefix}menu - Show this menu\n\n` +
                        `⚙️ *Other Commands*\n` +
                        `Use ${config.prefix}help for more commands`;

            logger.debug('Sending menu message');
            await sock.sendMessage(msg.key.remoteJid, { text });
            logger.info('Menu command completed successfully');
        } catch (error) {
            logger.error('Error in menu command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error: ' + error.message
            });
        }
    }
};

module.exports = basicCommands;