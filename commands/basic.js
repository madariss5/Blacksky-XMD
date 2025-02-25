const config = require('../config');

const commands = {
    help: async (sock, msg) => {
        let helpText = '*Available Commands*\n\n';
        Object.entries(config.commands).forEach(([cmd, info]) => {
            helpText += `*${config.prefix}${cmd}*: ${info.description}\n`;
        });
        
        await sock.sendMessage(msg.key.remoteJid, { text: helpText });
    },

    ping: async (sock, msg) => {
        const start = Date.now();
        await sock.sendMessage(msg.key.remoteJid, { text: 'Pong!' });
        const end = Date.now();
        await sock.sendMessage(msg.key.remoteJid, { text: `Response time: ${end - start}ms` });
    },

    info: async (sock, msg) => {
        const info = `*${config.botName}*\n\n` +
                    `• Owner: @${config.ownerNumber.split('@')[0]}\n` +
                    `• Prefix: ${config.prefix}\n` +
                    `• Status: Active\n`;
        
        await sock.sendMessage(msg.key.remoteJid, { 
            text: info,
            mentions: [config.ownerNumber]
        });
    }
};

module.exports = commands;
