const config = require('../config');

const commands = {
    menu: async (sock, msg, args) => {
        // Get page number from args or default to 1
        const page = parseInt(args[0]) || 1;
        const itemsPerPage = 20;

        let menuText = `*${config.botName}*\n\n`;
        menuText += '╭═══〘 *MENU* 〙═══⊷❍\n';
        menuText += `├ *Owner*: @${config.ownerNumber.split('@')[0]}\n`;
        menuText += `├ *Prefix*: ${config.prefix}\n`;
        menuText += '╰═══════════════⊷❍\n\n';

        // Define command categories
        const categories = {
            '⚡ Basic Commands': ['menu', 'help', 'ping', 'info'],
            '👑 Owner Commands': ['broadcast', 'ban', 'unban', 'banlist', 'bangroup', 'unbangroup', 'restart', 'setprefix', 'setbotname', 'stats', 'clearcache'],
            '👥 Group Commands': ['kick', 'promote', 'demote', 'mute', 'unmute', 'everyone', 'setwelcome', 'setbye', 'del', 'antilink', 'groupinfo', 'poll'],
            '👤 User Commands': ['register', 'me', 'level', 'profile', 'status', 'owner'],
            '🎮 Fun Commands': ['coinflip', 'dice', 'quote', 'slap', 'hug', 'cuddle', 'kiss', 'kill', 'dance', 'insult', 'meme', 'ship', 'fight']
        };

        // Calculate total pages across all categories
        const totalCommands = Object.values(categories).reduce((sum, cmds) => sum + cmds.length, 0);
        const totalPages = Math.ceil(totalCommands / itemsPerPage);

        // Validate page number
        if (page < 1 || page > totalPages) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ Invalid page number. Please use a number between 1 and ${totalPages}.`
            });
        }

        // Display commands for current page
        let commandsDisplayed = 0;
        for (const [category, commandList] of Object.entries(categories)) {
            if (commandsDisplayed >= itemsPerPage * (page - 1) && 
                commandsDisplayed < itemsPerPage * page) {
                menuText += `\n*${category}*\n`;
                for (const cmd of commandList) {
                    if (commandsDisplayed >= itemsPerPage * (page - 1) && 
                        commandsDisplayed < itemsPerPage * page) {
                        menuText += `⭔ ${config.prefix}${cmd}\n`;
                    }
                    commandsDisplayed++;
                }
            } else {
                commandsDisplayed += commandList.length;
            }
        }

        if (totalPages > 1) {
            menuText += `\n📖 Page *${page}* of *${totalPages}*\n`;
            menuText += `💡 Use *${config.prefix}menu <page>* to view other pages\n`;
        }

        await sock.sendMessage(msg.key.remoteJid, {
            text: menuText,
            mentions: [config.ownerNumber]
        });
    },

    help: async (sock, msg) => {
        let helpText = `*${config.botName} - Help*\n\n`;
        helpText += '╭═══〘 *COMMANDS* 〙═══⊷❍\n\n';

        helpText += '*⚡ Basic Commands*\n';
        helpText += `⭔ ${config.prefix}menu [page] - Show command menu\n`;
        helpText += `⭔ ${config.prefix}help - Show this help message\n`;
        helpText += `⭔ ${config.prefix}ping - Check bot response\n\n`;

        helpText += '*👤 User Commands*\n';
        helpText += `⭔ ${config.prefix}register <name> <age> - Register your profile\n`;
        helpText += `⭔ ${config.prefix}profile [@user] - View profile\n`;
        helpText += `⭔ ${config.prefix}me - View your stats\n`;
        helpText += `⭔ ${config.prefix}level - View your level\n\n`;

        helpText += '*👥 Group Management*\n';
        helpText += `⭔ ${config.prefix}kick @user - Kick user (Admin)\n`;
        helpText += `⭔ ${config.prefix}promote @user - Promote to admin\n`;
        helpText += `⭔ ${config.prefix}demote @user - Demote from admin\n`;
        helpText += `⭔ ${config.prefix}everyone - Tag all members\n\n`;

        helpText += '*👑 Owner Commands*\n';
        helpText += `⭔ ${config.prefix}broadcast - Send to all chats\n`;
        helpText += `⭔ ${config.prefix}ban/unban - Manage user bans\n`;
        helpText += `⭔ ${config.prefix}setprefix - Change bot prefix\n\n`;

        helpText += '╰═══════════════⊷❍\n';
        helpText += `\n💡 Use *${config.prefix}menu* to see all commands`;

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