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
            ],
            '👑 Owner Commands': [
                {cmd: 'broadcast', desc: 'Send message to all chats'},
                {cmd: 'ban', desc: 'Ban a user from using bot'},
                {cmd: 'unban', desc: 'Unban a user'},
                {cmd: 'banlist', desc: 'Show banned users & groups'},
                {cmd: 'bangroup', desc: 'Ban a group'},
                {cmd: 'unbangroup', desc: 'Unban a group'},
                {cmd: 'restart', desc: 'Restart the bot'},
                {cmd: 'setprefix', desc: 'Change command prefix'},
                {cmd: 'setbotname', desc: 'Change bot name'},
                {cmd: 'stats', desc: 'View bot statistics'},
                {cmd: 'clearcache', desc: 'Clear bot cache'}
            ],
            '👥 Group Commands': [
                {cmd: 'kick', desc: 'Kick a member'},
                {cmd: 'promote', desc: 'Promote to admin'},
                {cmd: 'demote', desc: 'Demote from admin'},
                {cmd: 'mute', desc: 'Mute group chat'},
                {cmd: 'unmute', desc: 'Unmute group chat'},
                {cmd: 'everyone', desc: 'Tag all members'},
                {cmd: 'setwelcome', desc: 'Set welcome message'},
                {cmd: 'setbye', desc: 'Set goodbye message'},
                {cmd: 'del', desc: 'Delete bot message'},
                {cmd: 'antilink', desc: 'Toggle anti-link'},
                {cmd: 'groupinfo', desc: 'Show group info'},
                {cmd: 'poll', desc: 'Create a poll'}
            ],
            '👤 User Commands': [
                {cmd: 'register', desc: 'Register user profile'},
                {cmd: 'profile', desc: 'View user profile'},
                {cmd: 'me', desc: 'View your info'},
                {cmd: 'level', desc: 'Check your level'},
                {cmd: 'status', desc: 'View your status'},
                {cmd: 'owner', desc: 'View bot owner'}
            ],
            '🎮 Fun Commands': [
                {cmd: 'coinflip', desc: 'Flip a coin'},
                {cmd: 'dice', desc: 'Roll a dice'},
                {cmd: 'quote', desc: 'Get random quote'},
                {cmd: 'slap', desc: 'Slap someone'},
                {cmd: 'hug', desc: 'Hug someone'},
                {cmd: 'cuddle', desc: 'Cuddle someone'},
                {cmd: 'kiss', desc: 'Kiss someone'},
                {cmd: 'kill', desc: 'Kill someone'},
                {cmd: 'dance', desc: 'Show dance animation'},
                {cmd: 'insult', desc: 'Insult someone'},
                {cmd: 'meme', desc: 'Get random meme'},
                {cmd: 'ship', desc: 'Ship two users'},
                {cmd: 'fight', desc: 'Start a fight'}
            ]
        };

        // Display all commands by category
        for (const [category, commandList] of Object.entries(categories)) {
            menuText += `\n*${category}*\n`;
            for (const {cmd, desc} of commandList) {
                menuText += `⭔ ${config.prefix}${cmd} - ${desc}\n`;
            }
        }

        // Try to send with anime image
        try {
            const menuImage = {
                url: 'https://raw.githubusercontent.com/WhatsAppBot/assets/main/menu-banner.jpg'
            };

            await sock.sendMessage(msg.key.remoteJid, {
                image: menuImage,
                caption: menuText,
                mentions: [config.ownerNumber]
            });
        } catch (error) {
            // Fallback to text-only menu with styled header
            menuText = `*${config.botName}*\n` +
                    '╔══════════════════╗\n' +
                    '║    𝕄𝔼ℕ𝕌 𝕃𝕀𝕊𝕋    ║\n' +
                    '╚══════════════════╝\n\n' + 
                    menuText;

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