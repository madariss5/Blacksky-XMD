const config = require('../config');
const store = require('../database/store');

const ownerCommands = {
    broadcast: async (sock, msg, args) => {
        // Check if sender is owner
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }

        const message = args.join(' ');
        if (!message) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a message to broadcast!' });
        }

        // Get all chats from store
        const chats = store.get('chats') || [];

        // Send message to all chats
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

        const banned = store.get('banned') || [];
        if (!banned.includes(number)) {
            banned.push(number);
            await store.set('banned', banned);
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

        const banned = store.get('banned') || [];
        const index = banned.indexOf(number);
        if (index > -1) {
            banned.splice(index, 1);
            await store.set('banned', banned);
            await sock.sendMessage(msg.key.remoteJid, { text: `Unbanned @${number.split('@')[0]}`, mentions: [number] });
        } else {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Number is not banned!' });
        }
    },

    banlist: async (sock, msg) => {
        if (msg.key.remoteJid !== config.ownerNumber) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only owner can use this command!' });
        }

        const banned = store.get('banned') || [];
        const bannedGroups = store.get('bannedGroups') || [];

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

        const bannedGroups = store.get('bannedGroups') || [];
        if (!bannedGroups.includes(groupId)) {
            bannedGroups.push(groupId);
            await store.set('bannedGroups', bannedGroups);
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

        const bannedGroups = store.get('bannedGroups') || [];
        const index = bannedGroups.indexOf(groupId);
        if (index > -1) {
            bannedGroups.splice(index, 1);
            await store.set('bannedGroups', bannedGroups);
            await sock.sendMessage(msg.key.remoteJid, { text: 'Group unbanned successfully!' });
        } else {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Group is not banned!' });
        }
    }
};

module.exports = ownerCommands;