const config = require('../config');

const commands = {
    menu: async (sock, msg, args) => {
        const sections = {
            owner: '👑 *Owner Commands*',
            group: '👥 *Group Commands*',
            user: '👤 *User Commands*',
            fun: '🎮 *Fun Commands*'
        };

        let menuText = `*Welcome to ${config.botName}*\n`;
        menuText += '╔══════════════════╗\n';
        menuText += '║   Command Menu    ║\n';
        menuText += '╚══════════════════╝\n\n';

        // Get page number from args or default to 1
        const page = parseInt(args[0]) || 1;
        const itemsPerPage = 20;

        for (const [category, title] of Object.entries(sections)) {
            const categoryCommands = Object.entries(config.commands)
                .filter(([_, info]) => info.description.toLowerCase().includes(category));

            // Calculate pages
            const totalPages = Math.ceil(categoryCommands.length / itemsPerPage);
            const start = (page - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const pageCommands = categoryCommands.slice(start, end);

            menuText += `${title}\n`;
            menuText += '┌──────────────\n';
            pageCommands.forEach(([cmd, info]) => {
                menuText += `│ • ${config.prefix}${cmd}\n`;
                menuText += `│   ${info.description}\n`;
            });
            menuText += '└──────────────\n\n';

            if (totalPages > 1) {
                menuText += `Page ${page}/${totalPages}\n`;
                menuText += `Use ${config.prefix}menu <page> to view more commands\n\n`;
            }
        }

        menuText += `\n*Bot Session:* ${sock.authState.creds.me?.id || 'Not available'}\n`;
        menuText += `*Made with ❤️ by ${config.botName}*`;

        // Send menu with Fast & Furious themed image
        await sock.sendMessage(msg.key.remoteJid, {
            image: { url: config.menuImage },
            caption: menuText
        });
    },

    help: async (sock, msg) => {
        let helpText = '*Available Commands*\n\n';
        helpText += '📝 *Basic Commands*\n';
        helpText += `• ${config.prefix}menu [page] - Show command menu\n`;
        helpText += `• ${config.prefix}help - Show this help message\n`;
        helpText += `• ${config.prefix}ping - Check bot response\n\n`;

        helpText += '👤 *User Commands*\n';
        helpText += `• ${config.prefix}register <name> <age> - Register your profile\n`;
        helpText += `• ${config.prefix}profile - View your or someone's profile\n`;
        helpText += `• ${config.prefix}me - View your stats and session ID\n`;
        helpText += `• ${config.prefix}level - View your current level\n\n`;

        helpText += '👥 *Group Management*\n';
        helpText += `• ${config.prefix}kick @user - Kick user (Admin)\n`;
        helpText += `• ${config.prefix}promote @user - Promote to admin\n`;
        helpText += `• ${config.prefix}demote @user - Demote from admin\n`;
        helpText += `• ${config.prefix}everyone - Tag all members\n\n`;

        helpText += '👑 *Owner Commands*\n';
        helpText += `• ${config.prefix}broadcast - Send message to all chats\n`;
        helpText += `• ${config.prefix}ban/unban - Manage user bans\n`;
        helpText += `• ${config.prefix}bangroup/unbangroup - Manage group bans\n`;
        helpText += `• ${config.prefix}setprefix - Change bot prefix\n`;
        helpText += `• ${config.prefix}setbotname - Change bot name\n\n`;

        helpText += `\nUse ${config.prefix}menu to see all commands (${Object.keys(config.commands).length} total)`;

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