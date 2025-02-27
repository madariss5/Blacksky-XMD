const config = require('../config');

const commands = {
    menu: async (sock, msg) => {
        let menuText = `*${config.botName}*\n\n`;
        menuText += '╭═══〘 *COMMAND LIST* 〙═══⊷❍\n';
        menuText += `├ *Owner*: @${config.ownerNumber.split('@')[0]}\n`;
        menuText += `├ *Prefix*: ${config.prefix}\n`;
        menuText += '╰═══════════════⊷❍\n\n';

        // Define command categories with emojis
        const categories = {
            '⚡ Basic Commands': [
                {cmd: 'menu', desc: 'Display this menu'},
                {cmd: 'ping', desc: 'Check bot response time'},
                {cmd: 'info', desc: 'Show bot information'}
            ]
        };

        // Display basic commands only for initial testing
        for (const [category, commandList] of Object.entries(categories)) {
            menuText += `\n*${category}*\n`;
            for (const {cmd, desc} of commandList) {
                menuText += `⭔ ${config.prefix}${cmd} - ${desc}\n`;
            }
        }

        await sock.sendMessage(msg.key.remoteJid, {
            text: menuText,
            mentions: [config.ownerNumber]
        });
    },

    ping: async (sock, msg) => {
        const start = Date.now();
        await sock.sendMessage(msg.key.remoteJid, { text: '📡 Testing ping...' });
        const end = Date.now();
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `🚀 Response speed: ${end - start}ms` 
        });
    },

    info: async (sock, msg) => {
        const info = `*${config.botName} - Info*\n\n` +
                    `👑 *Owner:* @${config.ownerNumber.split('@')[0]}\n` +
                    `⭐ *Bot Name:* ${config.botName}\n` +
                    `⚡ *Prefix:* ${config.prefix}\n` +
                    `📡 *Status:* Active\n` +
                    `🔧 *Library:* Baileys\n` +
                    `📱 *Platform:* Multi-Device\n`;

        await sock.sendMessage(msg.key.remoteJid, { 
            text: info,
            mentions: [config.ownerNumber]
        });
    }
};

module.exports = commands;