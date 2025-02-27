const config = require('../config');

// These commands are public and accessible to everyone in both private messages and groups
const commands = {
    menu: async (sock, msg) => {
        const menuHeader = `╭━━━❰ *${config.botName}* ❱━━━⊷❍
┃ ⌯ Creator: @${config.ownerNumber.split('@')[0]}
┃ ⌯ Prefix: ${config.prefix}
┃ ⌯ Version: 2.0.0
╰━━━━━━━━━━━━⊷❍\n\n`;

        // Define command categories with emojis
        const categories = {
            '🎭 Fun Commands': [
                { cmd: 'slap', desc: 'Slap someone with anime gif' },
                { cmd: 'hug', desc: 'Give someone a warm hug' },
                { cmd: 'pat', desc: 'Pat someone gently' },
                { cmd: 'dance', desc: 'Show off dance moves' },
                { cmd: 'kill', desc: 'Dramatically eliminate someone' },
                { cmd: 'highfive', desc: 'Give a high-five' },
                { cmd: 'facepalm', desc: 'Express disappointment' },
                { cmd: 'poke', desc: 'Poke someone playfully' },
                { cmd: 'cuddle', desc: 'Cuddle with someone' },
                { cmd: 'yeet', desc: 'Yeet someone to space' },
                { cmd: 'boop', desc: 'Boop someone\'s nose' },
                { cmd: 'bonk', desc: 'Bonk someone' },
                { cmd: 'joke', desc: 'Get a random joke' },
                { cmd: 'meme', desc: 'Get anime memes' },
                { cmd: 'quote', desc: 'Get inspiring quotes' },
                { cmd: 'fact', desc: 'Learn random facts' }
            ],
            '🎮 Game Commands': [
                { cmd: 'coinflip', desc: 'Flip a coin' },
                { cmd: 'wordgame', desc: 'Play word guessing game' },
                { cmd: 'trivia', desc: 'Play trivia quiz' },
                { cmd: 'magic8ball', desc: 'Ask the magic 8 ball' },
                { cmd: 'truth', desc: 'Get truth questions' },
                { cmd: 'dare', desc: 'Get dare challenges' }
            ],
            '👑 Owner Commands': [
                { cmd: 'broadcast', desc: 'Send message to all chats' },
                { cmd: 'ban', desc: 'Ban a user' },
                { cmd: 'unban', desc: 'Unban a user' },
                { cmd: 'banlist', desc: 'View banned users' },
                { cmd: 'maintenance', desc: 'Toggle maintenance mode' },
                { cmd: 'setbotname', desc: 'Change bot name' },
                { cmd: 'setbotbio', desc: 'Change bot bio' },
                { cmd: 'block', desc: 'Block a user' },
                { cmd: 'unblock', desc: 'Unblock a user' },
                { cmd: 'system', desc: 'View system stats' }
            ],
            '⚡ Basic Commands': [
                { cmd: 'menu', desc: 'Show this menu' },
                { cmd: 'ping', desc: 'Check bot response' },
                { cmd: 'info', desc: 'Get bot information' }
            ]
        };

        let menuText = menuHeader;

        // Build menu with categories and commands
        for (const [category, commandList] of Object.entries(categories)) {
            menuText += `╭━━━❰ ${category} ❱━━━⊷❍\n`;
            for (const {cmd, desc} of commandList) {
                menuText += `┃ ⌯ ${config.prefix}${cmd}\n┃   ${desc}\n`;
            }
            menuText += `╰━━━━━━━━━━━━⊷❍\n\n`;
        }

        // Add usage footer
        menuText += `╭━━━❰ *Usage Info* ❱━━━⊷❍
┃ ⌯ Type ${config.prefix}help <command> for details
┃ ⌯ Use @ to mention users in commands
┃ ⌯ All commands start with: ${config.prefix}
╰━━━━━━━━━━━━⊷❍`;

        try {
            // Attempt to send with menu image
            const menuImage = { url: 'https://i.imgur.com/XSGqPzc.png' }; // Anime style menu banner
            await sock.sendMessage(msg.key.remoteJid, {
                image: menuImage,
                caption: menuText,
                mentions: [config.ownerNumber]
            });
        } catch (error) {
            // Fallback to text-only menu if image fails
            console.error('Failed to send menu with image:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: menuText,
                mentions: [config.ownerNumber]
            });
        }
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
        const info = `╭━━━❰ *${config.botName}* ❱━━━⊷❍
┃ 👑 Creator: @${config.ownerNumber.split('@')[0]}
┃ ⌯ Bot Name: ${config.botName}
┃ ⌯ Prefix: ${config.prefix}
┃ ⌯ Status: Active
┃ ⌯ Library: @whiskeysockets/baileys
┃ ⌯ Platform: Multi-Device
┃ ⌯ Language: Node.js
┃ ⌯ Database: JSON Store
╰━━━━━━━━━━━━⊷❍`;

        await sock.sendMessage(msg.key.remoteJid, { 
            text: info,
            mentions: [config.ownerNumber]
        });
    }
};

module.exports = commands;