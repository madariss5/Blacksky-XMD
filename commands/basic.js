const config = require('../config');
const logger = require('pino')();

const basicCommands = {
    help: async (sock, msg, args) => {
        try {
            logger.info('Help command received:', { args });
            const text = args.length === 0 
                ? `Available commands:\n${config.prefix}menu - Show all commands\n${config.prefix}help <command> - Show command help\n${config.prefix}ping - Check bot response`
                : `Help for ${args[0]} will be available soon.`;

            await sock.sendMessage(msg.key.remoteJid, { text });
        } catch (error) {
            logger.error('Error in help command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error: ' + error.message
            });
        }
    },

    ping: async (sock, msg) => {
        try {
            logger.info('Ping command received');
            const start = Date.now();
            await sock.sendMessage(msg.key.remoteJid, { text: 'Testing response...' });
            const latency = Date.now() - start;
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🏓 Pong!\nResponse time: ${latency}ms`
            });
        } catch (error) {
            logger.error('Error in ping command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error: ' + error.message
            });
        }
    },

    menu: async (sock, msg) => {
        try {
            logger.info('Menu command received');
            const text = `*Bot Commands*\n\n` +
                        `📌 Basic\n${config.prefix}help - Show help\n${config.prefix}ping - Check response\n\n` +
                        `🎵 Music\n${config.prefix}play - Play a song\n${config.prefix}stop - Stop playback\n\n` +
                        `🤖 AI\n${config.prefix}gpt - Chat with GPT\n${config.prefix}imagine - Generate image`;

            await sock.sendMessage(msg.key.remoteJid, { text });
        } catch (error) {
            logger.error('Error in menu command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error: ' + error.message
            });
        }
    }
};

module.exports = basicCommands;