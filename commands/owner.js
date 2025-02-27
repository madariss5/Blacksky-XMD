const config = require('../config');
const store = require('../database/store');
const os = require('os');

const ownerCommands = {
    broadcast: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        const message = args.join(' ');
        if (!message) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a message to broadcast!' });
        }
        const chats = store.get('chats') || [];
        for (const chat of chats) {
            try {
                await sock.sendMessage(chat, { text: message });
            } catch (error) {
                console.error(`Failed to send broadcast to ${chat}:`, error);
            }
        }
        await sock.sendMessage(msg.key.remoteJid, { text: `Broadcast sent to ${chats.length} chats` });
    },

    ban: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        const number = args[0]?.replace('@', '') + '@s.whatsapp.net';
        if (!number) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a number to ban!' });
        }
        const success = await store.banUser(number);
        if (success) {
            await sock.sendMessage(msg.key.remoteJid, { text: `Banned @${number.split('@')[0]}`, mentions: [number] });
        } else {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Number already banned!' });
        }
    },

    unban: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        const number = args[0]?.replace('@', '') + '@s.whatsapp.net';
        if (!number) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a number to unban!' });
        }
        const success = await store.unbanUser(number);
        if (success) {
            await sock.sendMessage(msg.key.remoteJid, { text: `Unbanned @${number.split('@')[0]}`, mentions: [number] });
        } else {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Number is not banned!' });
        }
    },

    banlist: async (sock, msg) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        const banned = store.getBannedUsers();
        const bannedGroups = store.getBannedGroups();
        let message = '*Banned Users*\n\n';
        if (banned.length > 0) {
            banned.forEach(number => {
                message += `• @${number.split('@')[0]}\n`;
            });
        } else {
            message += 'No banned users\n';
        }
        message += '\n*Banned Groups*\n\n';
        if (bannedGroups.length > 0) {
            bannedGroups.forEach(group => {
                message += `• ${group}\n`;
            });
        } else {
            message += 'No banned groups';
        }
        await sock.sendMessage(msg.key.remoteJid, { 
            text: message,
            mentions: banned
        });
    },

    bangroup: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        const groupId = args[0] || msg.key.remoteJid;
        if (!groupId.endsWith('@g.us')) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a valid group ID!' });
        }
        const success = await store.banGroup(groupId);
        if (success) {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Group banned successfully!' });
        } else {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Group is already banned!' });
        }
    },

    unbangroup: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        const groupId = args[0] || msg.key.remoteJid;
        if (!groupId.endsWith('@g.us')) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a valid group ID!' });
        }
        const success = await store.unbanGroup(groupId);
        if (success) {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Group unbanned successfully!' });
        } else {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Group is not banned!' });
        }
    },
    restart: async (sock, msg) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        await sock.sendMessage(msg.key.remoteJid, { text: 'Restarting bot...' });
        process.exit(0); 
    },

    setprefix: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        const newPrefix = args[0];
        if (!newPrefix) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a new prefix!' });
        }
        config.prefix = newPrefix;
        await sock.sendMessage(msg.key.remoteJid, { text: `Prefix updated to: ${newPrefix}` });
    },

    setbotname: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        const newName = args.join(' ');
        if (!newName) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a new name!' });
        }
        config.botName = newName;
        await sock.sendMessage(msg.key.remoteJid, { text: `Bot name updated to: ${newName}` });
    },

    stats: async (sock, msg) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        const stats = {
            users: Object.keys(store.get('users') || {}).length,
            groups: store.get('chats')?.filter(id => id.endsWith('@g.us')).length || 0,
            banned: store.getBannedUsers().length,
            bannedGroups: store.getBannedGroups().length
        };
        const statsText = `*Bot Statistics*\n\n` +
                         `• Total Users: ${stats.users}\n` +
                         `• Total Groups: ${stats.groups}\n` +
                         `• Banned Users: ${stats.banned}\n` +
                         `• Banned Groups: ${stats.bannedGroups}\n`;
        await sock.sendMessage(msg.key.remoteJid, { text: statsText });
    },

    clearcache: async (sock, msg) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        try {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Clearing cache...' });
            store.data = {};
            await store.saveStore();
            await sock.sendMessage(msg.key.remoteJid, { text: 'Cache cleared successfully!' });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Error clearing cache: ' + error.message });
        }
    },
    setbotbio: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        const bio = args.join(' ');
        await sock.updateProfileStatus(bio);
        await sock.sendMessage(msg.key.remoteJid, { text: 'Bot bio updated successfully!' });
    },

    setbotpp: async (sock, msg) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        if (!msg.message.imageMessage) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please send an image with this command!' });
        }
        const image = await sock.downloadMediaMessage(msg.message.imageMessage);
        await sock.updateProfilePicture(sock.user.id, image);
        await sock.sendMessage(msg.key.remoteJid, { text: 'Bot profile picture updated!' });
    },

    addmod: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        const number = args[0]?.replace('@', '') + '@s.whatsapp.net';
        await store.addModerator(number);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `Added @${number.split('@')[0]} as moderator`,
            mentions: [number]
        });
    },

    removemod: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        const number = args[0]?.replace('@', '') + '@s.whatsapp.net';
        await store.removeModerator(number);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `Removed @${number.split('@')[0]} from moderators`,
            mentions: [number]
        });
    },

    system: async (sock, msg) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }

        const uptime = process.uptime();
        const memory = process.memoryUsage();
        const system = {
            platform: os.platform(),
            arch: os.arch(),
            cpus: os.cpus().length,
            totalMem: (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
            freeMem: (os.freemem() / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
            uptime: Math.floor(uptime / 3600) + 'h ' + Math.floor((uptime % 3600) / 60) + 'm',
            heapUsed: (memory.heapUsed / (1024 * 1024)).toFixed(2) + ' MB',
            heapTotal: (memory.heapTotal / (1024 * 1024)).toFixed(2) + ' MB'
        };

        const systemInfo = `*System Information*\n\n` +
                          `• Platform: ${system.platform}\n` +
                          `• Architecture: ${system.arch}\n` +
                          `• CPUs: ${system.cpus}\n` +
                          `• Total Memory: ${system.totalMem}\n` +
                          `• Free Memory: ${system.freeMem}\n` +
                          `• Uptime: ${system.uptime}\n` +
                          `• Heap Used: ${system.heapUsed}\n` +
                          `• Heap Total: ${system.heapTotal}`;

        await sock.sendMessage(msg.key.remoteJid, { text: systemInfo });
    },

    maintenance: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }

        const mode = args[0]?.toLowerCase();
        if (!['on', 'off'].includes(mode)) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please specify on/off for maintenance mode!' });
        }

        store.setMaintenanceMode(mode === 'on');
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `Maintenance mode ${mode === 'on' ? 'enabled' : 'disabled'}`
        });
    },

    setmaxwarn: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }

        const maxWarns = parseInt(args[0]);
        if (isNaN(maxWarns) || maxWarns < 1) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a valid number of warnings!' });
        }

        store.setMaxWarnings(maxWarns);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `Maximum warnings set to ${maxWarns}`
        });
    },

    gcjoin: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }

        if (!args[0]) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a group link!' });
        }

        const [code] = args[0].split('whatsapp.com/')[1];
        try {
            await sock.groupAcceptInvite(code);
            await sock.sendMessage(msg.key.remoteJid, { text: 'Successfully joined the group!' });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Failed to join group: ' + error.message });
        }
    },

    block: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }

        const number = args[0]?.replace('@', '') + '@s.whatsapp.net';
        if (!number) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a number to block!' });
        }

        await sock.updateBlockStatus(number, "block");
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `Blocked @${number.split('@')[0]}`,
            mentions: [number]
        });
    },

    unblock: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }

        const number = args[0]?.replace('@', '') + '@s.whatsapp.net';
        if (!number) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a number to unblock!' });
        }

        await sock.updateBlockStatus(number, "unblock");
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `Unblocked @${number.split('@')[0]}`,
            mentions: [number]
        });
    },

    setbotmode: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }

        const mode = args[0]?.toLowerCase();
        if (!['public', 'private'].includes(mode)) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please specify public/private mode!' });
        }

        store.setBotMode(mode);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `Bot mode set to ${mode}`
        });
    }
};

module.exports = ownerCommands;