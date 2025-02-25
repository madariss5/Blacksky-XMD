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
            await sock.sendMessage(msg.key.remoteJid, { text: `Banned ${number}` });
        } else {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Number already banned!' });
        }
    }
};

module.exports = ownerCommands;
