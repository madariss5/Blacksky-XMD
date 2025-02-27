const config = require('../config');

const commands = {
    menu: async (sock, msg) => {
        let menuText = '╭═══〘 *' + config.botName + '* 〙═══⊷❍\n';
        menuText += `┃ *Owner:* @${config.ownerNumber.split('@')[0]}\n`;
        menuText += `┃ *Prefix:* ${config.prefix}\n`;
        menuText += '╰═══════════════⊷❍\n\n';

        // Define command categories with emojis
        const categories = {
            '⚡ Basic Commands': [
                {cmd: 'menu', desc: 'Display this menu', usage: '!menu'},
                {cmd: 'ping', desc: 'Check bot response time', usage: '!ping'},
                {cmd: 'info', desc: 'Show bot information', usage: '!info'}
            ],
            '👑 Owner Commands': [
                {cmd: 'broadcast', desc: 'Send message to all chats', usage: '!broadcast <message>'},
                {cmd: 'ban', desc: 'Ban a user from using bot', usage: '!ban @user'},
                {cmd: 'unban', desc: 'Unban a user', usage: '!unban @user'},
                {cmd: 'banlist', desc: 'Show banned users & groups', usage: '!banlist'},
                {cmd: 'bangroup', desc: 'Ban a group', usage: '!bangroup'},
                {cmd: 'unbangroup', desc: 'Unban a group', usage: '!unbangroup'},
                {cmd: 'restart', desc: 'Restart the bot', usage: '!restart'},
                {cmd: 'setprefix', desc: 'Change command prefix', usage: '!setprefix <new_prefix>'},
                {cmd: 'setbotname', desc: 'Change bot name', usage: '!setbotname <new_name>'},
                {cmd: 'stats', desc: 'View bot statistics', usage: '!stats'},
                {cmd: 'clearcache', desc: 'Clear bot cache', usage: '!clearcache'}
            ],
            '👥 Group Commands': [
                {cmd: 'kick', desc: 'Kick a member', usage: '!kick @user'},
                {cmd: 'promote', desc: 'Promote to admin', usage: '!promote @user'},
                {cmd: 'demote', desc: 'Demote from admin', usage: '!demote @user'},
                {cmd: 'mute', desc: 'Mute group chat', usage: '!mute'},
                {cmd: 'unmute', desc: 'Unmute group chat', usage: '!unmute'},
                {cmd: 'everyone', desc: 'Tag all members', usage: '!everyone [message]'},
                {cmd: 'setwelcome', desc: 'Set welcome message', usage: '!setwelcome <message>'},
                {cmd: 'setbye', desc: 'Set goodbye message', usage: '!setbye <message>'},
                {cmd: 'del', desc: 'Delete bot message', usage: '!del <reply_to_message>'},
                {cmd: 'antilink', desc: 'Toggle anti-link', usage: '!antilink on/off'},
                {cmd: 'groupinfo', desc: 'Show group info', usage: '!groupinfo'},
                {cmd: 'poll', desc: 'Create a poll', usage: '!poll "question" "option1" "option2"'}
            ],
            '👤 User Commands': [
                {cmd: 'register', desc: 'Register user profile', usage: '!register <name> <age>'},
                {cmd: 'profile', desc: 'View user profile', usage: '!profile [@user]'},
                {cmd: 'me', desc: 'View your info', usage: '!me'},
                {cmd: 'level', desc: 'Check your level', usage: '!level'},
                {cmd: 'status', desc: 'View your status', usage: '!status'},
                {cmd: 'owner', desc: 'View bot owner', usage: '!owner'}
            ],
            '🎮 Fun Commands': [
                {cmd: 'coinflip', desc: 'Flip a coin', usage: '!coinflip'},
                {cmd: 'dice', desc: 'Roll a dice', usage: '!dice'},
                {cmd: 'quote', desc: 'Get random quote', usage: '!quote'},
                {cmd: 'slap', desc: 'Slap someone', usage: '!slap @user'},
                {cmd: 'hug', desc: 'Hug someone', usage: '!hug @user'},
                {cmd: 'cuddle', desc: 'Cuddle someone', usage: '!cuddle @user'},
                {cmd: 'kiss', desc: 'Kiss someone', usage: '!kiss @user'},
                {cmd: 'kill', desc: 'Kill someone', usage: '!kill @user'},
                {cmd: 'dance', desc: 'Show dance animation', usage: '!dance'},
                {cmd: 'insult', desc: 'Insult someone', usage: '!insult @user'},
                {cmd: 'meme', desc: 'Get random meme', usage: '!meme'},
                {cmd: 'ship', desc: 'Ship two users', usage: '!ship @user1 @user2'},
                {cmd: 'fight', desc: 'Start a fight', usage: '!fight @user'}
            ]
        };

        // Display commands by category with fancy formatting
        for (const [category, commandList] of Object.entries(categories)) {
            menuText += `╭═══〘 ${category} 〙═══⊷❍\n`;
            for (const {cmd, desc, usage} of commandList) {
                menuText += `┃ • ${config.prefix}${cmd}\n`;
                menuText += `┃   ${desc}\n`;
                menuText += `┃   Usage: ${usage}\n`;
            }
            menuText += `╰═══════════════⊷❍\n\n`;
        }

        // Add footer
        menuText += '╭═══〘 *Note* 〙═══⊷❍\n';
        menuText += '┃ • Replace <> with your input\n';
        menuText += '┃ • Optional parameters in []\n';
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