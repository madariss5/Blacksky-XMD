const config = require('../config');

const groupCommands = {
    kick: async (sock, msg, args) => {
        // Check if it's a group
        if (!msg.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'This command can only be used in groups!' });
        }

        // Get group metadata
        const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
        const isAdmin = groupMetadata.participants.find(p => p.id === msg.key.participant)?.admin;
        
        if (!isAdmin) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only admins can use this command!' });
        }

        const user = args[0]?.replace('@', '') + '@s.whatsapp.net';
        if (!user) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please mention a user to kick!' });
        }

        try {
            await sock.groupParticipantsUpdate(msg.key.remoteJid, [user], "remove");
            await sock.sendMessage(msg.key.remoteJid, { text: `Kicked @${user.split('@')[0]}`, mentions: [user] });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Failed to kick user!' });
        }
    },

    promote: async (sock, msg, args) => {
        if (!msg.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'This command can only be used in groups!' });
        }

        const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
        const isAdmin = groupMetadata.participants.find(p => p.id === msg.key.participant)?.admin;
        
        if (!isAdmin) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only admins can use this command!' });
        }

        const user = args[0]?.replace('@', '') + '@s.whatsapp.net';
        if (!user) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please mention a user to promote!' });
        }

        try {
            await sock.groupParticipantsUpdate(msg.key.remoteJid, [user], "promote");
            await sock.sendMessage(msg.key.remoteJid, { text: `Promoted @${user.split('@')[0]} to admin`, mentions: [user] });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Failed to promote user!' });
        }
    }
};

module.exports = groupCommands;
