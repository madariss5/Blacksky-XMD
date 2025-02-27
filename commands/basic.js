const config = require('../config');

const commands = {
    menu: async (sock, msg) => {
        let menuText = '╭═══〘 *' + config.botName + '* 〙═══⊷❍\n';
        menuText += `┃ *Owner:* @${config.ownerNumber.split('@')[0]}\n`;
        menuText += `┃ *Prefix:* ${config.prefix}\n`;
        menuText += '╰═══════════════⊷❍\n\n';

        // Define command categories with emojis and get descriptions from config
        const categories = {
            '⚡ Basic Commands': [
                {cmd: 'menu', desc: config.commands.menu.description, usage: '!menu'},
                {cmd: 'ping', desc: config.commands.ping.description, usage: '!ping'},
                {cmd: 'info', desc: config.commands.info.description, usage: '!info'}
            ],
            '👑 Owner Commands': [
                {cmd: 'broadcast', desc: config.commands.broadcast.description, usage: '!broadcast <message>'},
                {cmd: 'ban', desc: config.commands.ban.description, usage: '!ban @user'},
                {cmd: 'unban', desc: config.commands.unban.description, usage: '!unban @user'},
                {cmd: 'banlist', desc: config.commands.banlist.description, usage: '!banlist'},
                {cmd: 'bangroup', desc: config.commands.bangroup.description, usage: '!bangroup'},
                {cmd: 'unbangroup', desc: config.commands.unbangroup.description, usage: '!unbangroup'},
                {cmd: 'restart', desc: config.commands.restart.description, usage: '!restart'},
                {cmd: 'setprefix', desc: config.commands.setprefix.description, usage: '!setprefix <new_prefix>'},
                {cmd: 'setbotname', desc: config.commands.setbotname.description, usage: '!setbotname <new_name>'},
                {cmd: 'stats', desc: config.commands.stats.description, usage: '!stats'},
                {cmd: 'clearcache', desc: config.commands.clearcache.description, usage: '!clearcache'}
            ],
            '👥 Group Commands': [
                {cmd: 'kick', desc: config.commands.kick.description, usage: '!kick @user'},
                {cmd: 'promote', desc: config.commands.promote.description, usage: '!promote @user'},
                {cmd: 'demote', desc: config.commands.demote.description, usage: '!demote @user'},
                {cmd: 'mute', desc: config.commands.mute.description, usage: '!mute'},
                {cmd: 'unmute', desc: config.commands.unmute.description, usage: '!unmute'},
                {cmd: 'everyone', desc: config.commands.everyone.description, usage: '!everyone [message]'},
                {cmd: 'setwelcome', desc: config.commands.setwelcome.description, usage: '!setwelcome <message>'},
                {cmd: 'setbye', desc: config.commands.setbye.description, usage: '!setbye <message>'},
                {cmd: 'del', desc: config.commands.del.description, usage: '!del <reply_to_message>'},
                {cmd: 'antilink', desc: config.commands.antilink.description, usage: '!antilink on/off'},
                {cmd: 'groupinfo', desc: config.commands.groupinfo.description, usage: '!groupinfo'},
                {cmd: 'poll', desc: config.commands.poll.description, usage: '!poll "question" "option1" "option2"'}
            ],
            '👤 User Commands': [
                {cmd: 'register', desc: config.commands.register.description, usage: '!register <name> <age>'},
                {cmd: 'profile', desc: config.commands.profile.description, usage: '!profile [@user]'},
                {cmd: 'me', desc: config.commands.me.description, usage: '!me'},
                {cmd: 'level', desc: config.commands.level.description, usage: '!level'},
                {cmd: 'status', desc: config.commands.status.description, usage: '!status'},
                {cmd: 'owner', desc: config.commands.owner.description, usage: '!owner'}
            ],
            '🎮 Fun Commands': [
                {cmd: 'coinflip', desc: config.commands.coinflip.description, usage: '!coinflip'},
                {cmd: 'dice', desc: config.commands.dice.description, usage: '!dice'},
                {cmd: 'quote', desc: config.commands.quote.description, usage: '!quote'},
                {cmd: 'slap', desc: config.commands.slap.description, usage: '!slap @user'},
                {cmd: 'hug', desc: config.commands.hug.description, usage: '!hug @user'},
                {cmd: 'cuddle', desc: config.commands.cuddle.description, usage: '!cuddle @user'},
                {cmd: 'kiss', desc: config.commands.kiss.description, usage: '!kiss @user'},
                {cmd: 'kill', desc: config.commands.kill.description, usage: '!kill @user'},
                {cmd: 'dance', desc: config.commands.dance.description, usage: '!dance'},
                {cmd: 'insult', desc: config.commands.insult.description, usage: '!insult @user'},
                {cmd: 'meme', desc: config.commands.meme.description, usage: '!meme'},
                {cmd: 'fight', desc: config.commands.fight.description, usage: '!fight @user'}
            ]
        };

        // Add auto-generated commands with meaningful descriptions
        const addAutoGeneratedCommands = (category, prefix, start, count) => {
            for (let i = start; i <= count; i++) {
                const cmdKey = `${prefix}${i}`;
                if (config.commands[cmdKey]) {
                    categories[category].push({
                        cmd: cmdKey,
                        desc: config.commands[cmdKey].description,
                        usage: `!${cmdKey}`
                    });
                }
            }
        };

        // Add auto-generated commands for each category
        addAutoGeneratedCommands('⚡ Basic Commands', 'basicCmd', 4, 50);
        addAutoGeneratedCommands('👑 Owner Commands', 'ownerCmd', 12, 50);
        addAutoGeneratedCommands('👥 Group Commands', 'groupCmd', 13, 50);
        addAutoGeneratedCommands('👤 User Commands', 'userCmd', 7, 50);
        addAutoGeneratedCommands('🎮 Fun Commands', 'funCmd', 16, 50);

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