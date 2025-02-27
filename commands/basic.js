const config = require('../config');

const commands = {
    menu: async (sock, msg) => {
        let menuText = '╭═══〘 *' + config.botName + '* 〙═══⊷❍\n';
        menuText += `┃ *Owner:* @${config.ownerNumber.split('@')[0]}\n`;
        menuText += `┃ *Prefix:* ${config.prefix}\n`;
        menuText += '╰═══════════════⊷❍\n\n';

        // Define command categories with emojis
        const categories = {
            '⚡ Basic Commands': ['menu', 'help', 'ping', 'info'],
            '👑 Owner Commands': [
                'broadcast', 'ban', 'unban', 'banlist', 'bangroup', 'unbangroup',
                'restart', 'setprefix', 'setbotname', 'stats', 'clearcache',
                'setautoreply', 'setwelcome', 'setgoodbye', 'addcommand', 'delcommand',
                'setlanguage', 'backup', 'restore'
            ],
            '👥 Group Commands': [
                'kick', 'promote', 'demote', 'mute', 'unmute', 'everyone',
                'setwelcome', 'setbye', 'del', 'antilink', 'groupinfo', 'poll',
                'schedule', 'announce', 'roles', 'rules', 'contest', 'activity',
                'challenge', 'vote', 'game'
            ],
            '👤 User Commands': [
                'register', 'me', 'level', 'profile', 'status', 'owner',
                'theme', 'reminder', 'bio', 'achievements', 'presence', 'friends',
                'share', 'notify', 'notes'
            ],
            '🎮 Fun Commands': [
                'coinflip', 'dice', 'quote', 'slap', 'hug', 'cuddle', 'kiss',
                'kill', 'dance', 'insult', 'meme', 'fight', 'wordgame', 'emojiart',
                'story', 'trivia', 'mememaker', 'numbergame', 'jokes', 'funpoll', 'guess'
            ],
            '🔞 NSFW Commands': [
                'togglensfw', 'verifyage', 'nsfwart', 'nsfwstory', 'nsfwmedia'
            ]
        };

        // Display commands by category
        for (const [category, commandList] of Object.entries(categories)) {
            menuText += `╭═══〘 ${category} 〙═══⊷❍\n`;
            for (const cmd of commandList) {
                menuText += `┃ • ${config.prefix}${cmd}\n`;
            }
            menuText += `╰═══════════════⊷❍\n\n`;
        }

        // Add footer
        menuText += '╭═══〘 *Note* 〙═══⊷❍\n';
        menuText += '┃ • Replace <> with your input\n';
        menuText += '┃ • Optional parameters in []\n';
        menuText += '┃ • 🔞 commands require age verification\n';
        menuText += '╰═══════════════⊷❍\n';

        // Try to send with menu image
        try {
            const menuImage = { url: config.menuImage };
            await sock.sendMessage(msg.key.remoteJid, {
                image: menuImage,
                caption: menuText,
                mentions: [config.ownerNumber]
            });
        } catch (error) {
            // Fallback to text-only menu
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
        const info = `╭═══〘 *${config.botName}* 〙═══⊷❍\n` +
                    `┃ 👑 *Owner:* @${config.ownerNumber.split('@')[0]}\n` +
                    `┃ ⭐ *Bot Name:* ${config.botName}\n` +
                    `┃ ⚡ *Prefix:* ${config.prefix}\n` +
                    `┃ 📡 *Status:* Active\n` +
                    `┃ 🔧 *Library:* Baileys\n` +
                    `┃ 📱 *Platform:* Multi-Device\n` +
                    `╰═══════════════⊷❍`;

        await sock.sendMessage(msg.key.remoteJid, { 
            text: info,
            mentions: [config.ownerNumber]
        });
    }
};

module.exports = commands;