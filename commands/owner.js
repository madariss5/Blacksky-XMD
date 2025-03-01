const config = require('../config');
const store = require('../database/store');
const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const logger = require('pino')();
const tempDir = os.tmpdir();
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

// Custom commands storage
let customCommands = new Map();

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
        let successCount = 0;
        for (const chat of chats) {
            try {
                await sock.sendMessage(chat, { text: message });
                successCount++;
            } catch (error) {
                logger.error(`Failed to send broadcast to ${chat}:`, error);
            }
        }
        await sock.sendMessage(msg.key.remoteJid, { text: `Broadcast sent to ${successCount}/${chats.length} chats` });
    },

    setname: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        const name = args.join(' ');
        if (!name) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a name!' });
        }
        try {
            await sock.updateProfileName(name);
            await sock.sendMessage(msg.key.remoteJid, { text: `Name updated to: ${name}` });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to update name: ' + error.message });
        }
    },

    setbotname: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        const name = args.join(' ');
        if (!name) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a name!' });
        }
        try {
            config.botName = name;
            await sock.sendMessage(msg.key.remoteJid, { text: `Bot name updated to: ${name}` });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to update bot name: ' + error.message });
        }
    },

    setbotbio: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        const bio = args.join(' ');
        if (!bio) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a bio!' });
        }
        try {
            await sock.updateProfileStatus(bio);
            await sock.sendMessage(msg.key.remoteJid, { text: `Bot bio updated to: ${bio}` });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to update bio: ' + error.message });
        }
    },

    setbotpp: async (sock, msg) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        if (!msg.message.imageMessage) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please send an image with this command!' });
        }
        try {
            const media = await downloadMediaMessage(msg, 'buffer', {}, { logger });
            await sock.updateProfilePicture(sock.user.id, media);
            await sock.sendMessage(msg.key.remoteJid, { text: 'Bot profile picture updated!' });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to update profile picture: ' + error.message });
        }
    },

    clearcache: async (sock, msg) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        try {
            const tempFiles = await fs.readdir(tempDir);
            for (const file of tempFiles) {
                if (file.startsWith('wa-')) {
                    await fs.remove(path.join(tempDir, file));
                }
            }
            store.data = {};
            await store.saveStore();
            await sock.sendMessage(msg.key.remoteJid, { text: '✅ Cache cleared successfully!' });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to clear cache: ' + error.message });
        }
    },

    restart: async (sock, msg) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        try {
            await sock.sendMessage(msg.key.remoteJid, { text: '🔄 Restarting bot...' });
            process.exit(0);
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to restart: ' + error.message });
        }
    },

    update: async (sock, msg) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        try {
            await sock.sendMessage(msg.key.remoteJid, { text: '🔄 Checking for updates...' });
            await sock.sendMessage(msg.key.remoteJid, {
                text: 'ℹ️ No updates available. You are using the latest version.'
            });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to check updates: ' + error.message });
        }
    },

    eval: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        if (!args.length) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide code to evaluate!' });
        }
        try {
            const code = args.join(' ');
            const result = eval(code);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `📝 *Eval Result:*\n\n${result}`
            });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Eval failed: ' + error.message });
        }
    },

    setprefix: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        if (!args[0]) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a new prefix!' });
        }
        try {
            config.prefix = args[0];
            await sock.sendMessage(msg.key.remoteJid, { text: `✅ Prefix updated to: ${args[0]}` });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to update prefix: ' + error.message });
        }
    },

    backup: async (sock, msg) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        try {
            const data = {
                store: store.data,
                config: config
            };
            const backupPath = path.join(tempDir, 'backup.json');
            await fs.writeJSON(backupPath, data, { spaces: 2 });
            await sock.sendMessage(msg.key.remoteJid, {
                document: { url: backupPath },
                mimetype: 'application/json',
                fileName: `backup_${new Date().toISOString()}.json`
            });
            await fs.remove(backupPath);
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to create backup: ' + error.message });
        }
    },

    restore: async (sock, msg) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        if (!msg.message.documentMessage) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Please send a backup file with this command!'
            });
        }
        try {
            const buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger });
            const data = JSON.parse(buffer.toString());
            if (data.store) store.data = data.store;
            if (data.config) Object.assign(config, data.config);
            await store.saveStore();
            await sock.sendMessage(msg.key.remoteJid, { text: '✅ Backup restored successfully!' });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to restore backup: ' + error.message });
        }
    },

    addmod: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        const number = args[0]?.replace('@', '') + '@s.whatsapp.net';
        if (!number) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a number to add as moderator!' });
        }
        try {
            await store.addModerator(number);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `Added @${number.split('@')[0]} as moderator`,
                mentions: [number]
            });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to add moderator: ' + error.message });
        }
    },

    removemod: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        const number = args[0]?.replace('@', '') + '@s.whatsapp.net';
        if (!number) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a number to remove from moderators!' });
        }
        try {
            await store.removeModerator(number);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `Removed @${number.split('@')[0]} from moderators`,
                mentions: [number]
            });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to remove moderator: ' + error.message });
        }
    },

    system: async (sock, msg) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        try {
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
                heapTotal: (memory.heapTotal / (1024 * 1024)).toFixed(2) + ' MB',
                nodeVersion: process.version,
                v8Version: process.versions.v8
            };
            const systemInfo = `💻 *System Information*\n\n` +
                               `• Platform: ${system.platform}\n` +
                               `• Architecture: ${system.arch}\n` +
                               `• CPUs: ${system.cpus}\n` +
                               `• Total Memory: ${system.totalMem}\n` +
                               `• Free Memory: ${system.freeMem}\n` +
                               `• Uptime: ${system.uptime}\n` +
                               `• Heap Used: ${system.heapUsed}\n` +
                               `• Heap Total: ${system.heapTotal}\n` +
                               `• Node.js: ${system.nodeVersion}\n` +
                               `• V8: ${system.v8Version}`;
            await sock.sendMessage(msg.key.remoteJid, { text: systemInfo });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to get system info: ' + error.message });
        }
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
    },
    qrmaker: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        await sock.sendMessage(msg.key.remoteJid, {
            text: '⚠️ QR code generation is temporarily unavailable. This feature will be enabled in a future update.'
        });
    },

    qrreader: async (sock, msg) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        await sock.sendMessage(msg.key.remoteJid, {
            text: '⚠️ QR code reading is temporarily unavailable. This feature will be enabled in a future update.'
        });
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

        try {
            const stats = {
                users: Object.keys(store.get('users') || {}).length,
                groups: store.get('chats')?.filter(id => id.endsWith('@g.us')).length || 0,
                banned: store.getBannedUsers().length,
                bannedGroups: store.getBannedGroups().length,
                system: {
                    platform: os.platform(),
                    arch: os.arch(),
                    cpus: os.cpus().length,
                    totalMem: (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
                    freeMem: (os.freemem() / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
                    uptime: Math.floor(os.uptime() / 3600) + 'h ' + Math.floor((os.uptime() % 3600) / 60) + 'm',
                    botUptime: Math.floor(process.uptime() / 3600) + 'h ' + Math.floor((process.uptime() % 3600) / 60) + 'm'
                }
            };

            const statsText = `📊 *Bot Statistics*\n\n` +
                              `👥 Users: ${stats.users}\n` +
                              `👥 Groups: ${stats.groups}\n` +
                              `🚫 Banned Users: ${stats.banned}\n` +
                              `🚫 Banned Groups: ${stats.bannedGroups}\n\n` +
                              `💻 *System Information*\n\n` +
                              `• Platform: ${stats.system.platform}\n` +
                              `• Architecture: ${stats.system.arch}\n` +
                              `• CPUs: ${stats.system.cpus}\n` +
                              `• Total Memory: ${stats.system.totalMem}\n` +
                              `• Free Memory: ${stats.system.freeMem}\n` +
                              `• System Uptime: ${stats.system.uptime}\n` +
                              `• Bot Uptime: ${stats.system.botUptime}`;

            await sock.sendMessage(msg.key.remoteJid, { text: statsText });
        } catch (error) {
            logger.error('Error in stats command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to get stats: ' + error.message
            });
        }
    },

    maintenance: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        const mode = args[0]?.toLowerCase();
        if (!['on', 'off'].includes(mode)) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please specify on/off for maintenance mode!' });
        }
        try {
            store.setMaintenanceMode(mode === 'on');
            await sock.sendMessage(msg.key.remoteJid, {
                text: `Maintenance mode ${mode === 'on' ? 'enabled' : 'disabled'}`
            });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to set maintenance mode: ' + error.message });
        }
    },

    setmaxwarn: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        const maxWarns = parseInt(args[0]);
        if (isNaN(maxWarns) || maxWarns < 1) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a valid number of warnings!' });
        }
        try {
            store.setMaxWarnings(maxWarns);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `Maximum warnings set to ${maxWarns}`
            });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to set max warnings: ' + error.message });
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


    leave: async (sock, msg) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        if (!msg.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'This command can only be used in groups!' });
        }
        try {
            await sock.groupLeave(msg.key.remoteJid);
            await sock.sendMessage(msg.key.remoteJid, { text: '👋 Goodbye! Bot is leaving the group.' });
        } catch (error) {
            logger.error('Error in leave command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to leave group: ' + error.message });
        }
    },

    clearall: async (sock, msg) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        try {
            const chats = await store.get('chats') || [];
            for (const chat of chats) {
                await sock.chatModify({ clear: true }, chat);
            }
            await sock.sendMessage(msg.key.remoteJid, { text: '✅ Successfully cleared all chats!' });
        } catch (error) {
            logger.error('Error in clearall command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to clear chats: ' + error.message });
        }
    },

    setstatus: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        const status = args.join(' ');
        if (!status) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a status!' });
        }
        try {
            await sock.updateProfileStatus(status);
            await sock.sendMessage(msg.key.remoteJid, { text: `✅ Status updated to: ${status}` });
        } catch (error) {
            logger.error('Error in setstatus command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to update status: ' + error.message });
        }
    },

    addpremium: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        const number = args[0]?.replace('@', '') + '@s.whatsapp.net';
        if (!number) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a number to add as premium!' });
        }
        try {
            await store.addPremiumUser(number);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ Added @${number.split('@')[0]} to premium users`,
                mentions: [number]
            });
        } catch (error) {
            logger.error('Error in addpremium command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to add premium user: ' + error.message });
        }
    },

    delpremium: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        const number = args[0]?.replace('@', '') + '@s.whatsapp.net';
        if (!number) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a number to remove from premium!' });
        }
        try {
            await store.removePremiumUser(number);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ Removed @${number.split('@')[0]} from premium users`,
                mentions: [number]
            });
        } catch (error) {
            logger.error('Error in delpremium command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to remove premium user: ' + error.message });
        }
    },

    listpremium: async (sock, msg) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        try {
            const premiumUsers = await store.getPremiumUsers();
            if (!premiumUsers.length) {
                return await sock.sendMessage(msg.key.remoteJid, { text: 'No premium users found!' });
            }
            let text = '*Premium Users List*\n\n';
            premiumUsers.forEach((user, i) => {
                text += `${i + 1}. @${user.split('@')[0]}\n`;
            });
            await sock.sendMessage(msg.key.remoteJid, {
                text,
                mentions: premiumUsers
            });
        } catch (error) {
            logger.error('Error in listpremium command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to get premium users: ' + error.message });
        }
    },

    addcmd: async (sock, msg, args) => {
        if (msg.key.remoteJid !==config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        if (args.length < 2) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: 'Please provide command name and response!\nUsage: .addcmd <command> <response>'
            });
        }
        try {
            const cmdName = args[0].toLowerCase();
            const cmdResponse = args.slice(1).join(' ');
            customCommands.set(cmdName, cmdResponse);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ Added custom command: ${cmdName}`
            });
        } catch (error) {
            logger.error('Error in addcmd command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to add command: ' + error.message });
        }
    },

    delcmd: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        if (!args[0]) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a command name to delete!' });
        }
        try {
            const cmdName = args[0].toLowerCase();
            if (customCommands.has(cmdName)) {
                customCommands.delete(cmdName);
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `✅ Removed custom command: ${cmdName}`
                });
            } else {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Command ${cmdName} not found!`
                });
            }
        } catch (error) {
            logger.error('Error in delcmd command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to delete command: ' + error.message });
        }
    },

    listcmd: async (sock, msg) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        try {
            if (customCommands.size === 0) {
                return await sock.sendMessage(msg.key.remoteJid, { text: 'No custom commands found!' });
            }
            let text = '*Custom Commands List*\n\n';
            [...customCommands.entries()].forEach(([cmd, response], i) => {
                text += `${i + 1}. ${cmd} → ${response}\n`;
            });
            await sock.sendMessage(msg.key.remoteJid, { text });
        } catch (error) {
            logger.error('Error in listcmd command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to list commands: ' + error.message });
        }
    },

    bc: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        const message = args.join(' ');
        if (!message) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a message to broadcast!' });
        }
        try {
            const chats = await store.get('chats') || [];
            let successCount = 0;
            const total = chats.length;

            await sock.sendMessage(msg.key.remoteJid, {
                text: `📢 Starting broadcast to ${total} chats...`
            });

            for (const chat of chats) {
                try {
                    await sock.sendMessage(chat, {
                        text: `*📢 Broadcast Message*\n\n${message}`
                    });
                    successCount++;

                    // Progress update every 10 chats
                    if (successCount % 10 === 0) {
                        await sock.sendMessage(msg.key.remoteJid, {
                            text: `Progress: ${successCount}/${total} chats`
                        });
                    }
                } catch (error) {
                    logger.error(`Failed to send broadcast to ${chat}:`, error);
                }
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ Broadcast completed!\nSuccessfully sent to ${successCount}/${total} chats`
            });
        } catch (error) {
            logger.error('Error in bc command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to send broadcast: ' + error.message });
        }
    },

    getcase: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        if (!args[0]) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a command name!' });
        }
        try {
            const cmdName = args[0].toLowerCase();
            const cmdFunction = ownerCommands[cmdName];

            if (!cmdFunction) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Command '${cmdName}' not found!`
                });
            }

            const cmdSource = cmdFunction.toString()
                .split('\n')
                .slice(1, -1) // Remove function wrapper
                .join('\n')
                .trim();

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*Source Code for '${cmdName}'*\n\`\`\`javascript\n${cmdSource}\n\`\`\``
            });
        } catch (error) {
            logger.error('Error in getcase command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to get command source: ' + error.message });
        }
    },
    getfile: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        if (!args[0]) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a file path!' });
        }
        try {
            const filePath = args[0];
            if (!fs.existsSync(filePath)) {
                return await sock.sendMessage(msg.key.remoteJid, { text: '❌ File not found!' });
            }
            const content = await fs.readFile(filePath, 'utf8');
            await sock.sendMessage(msg.key.remoteJid, {
                text: `📄 *File Content*\n\n${content}`
            });
        } catch (error) {
            logger.error('Error in getfile command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Error reading file: ' + error.message });
        }
    },

    savefile: async (sock, msg, args) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        if (args.length < 2) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: 'Please provide file path and content!\nUsage: .savefile <path> <content>'
            });
        }
        try {
            const filePath = args[0];
            const content = args.slice(1).join(' ');
            await fs.writeFile(filePath, content, 'utf8');
            await sock.sendMessage(msg.key.remoteJid, { text: '✅ File saved successfully!' });
        } catch (error) {
            logger.error('Error in savefile command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Error saving file: ' + error.message });
        }
    },

    shutdown: async (sock, msg) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }
        try {
            await sock.sendMessage(msg.key.remoteJid, { text: '🔄 Shutting down bot...' });
            process.exit(0);
        } catch (error) {
            logger.error('Error in shutdown command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to shutdown: ' + error.message });
        }
    }
};

module.exports = ownerCommands;