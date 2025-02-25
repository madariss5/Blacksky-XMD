const config = require('../config');
const store = require('../database/store');

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
    },

    demote: async (sock, msg, args) => {
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
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please mention a user to demote!' });
        }

        try {
            await sock.groupParticipantsUpdate(msg.key.remoteJid, [user], "demote");
            await sock.sendMessage(msg.key.remoteJid, { text: `Demoted @${user.split('@')[0]} from admin`, mentions: [user] });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Failed to demote user!' });
        }
    },

    mute: async (sock, msg) => {
        if (!msg.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'This command can only be used in groups!' });
        }

        const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
        const isAdmin = groupMetadata.participants.find(p => p.id === msg.key.participant)?.admin;

        if (!isAdmin) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only admins can use this command!' });
        }

        await store.setGroupSetting(msg.key.remoteJid, 'muted', true);
        await sock.sendMessage(msg.key.remoteJid, { text: 'Group has been muted. Only admins can send messages.' });
    },

    unmute: async (sock, msg) => {
        if (!msg.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'This command can only be used in groups!' });
        }

        const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
        const isAdmin = groupMetadata.participants.find(p => p.id === msg.key.participant)?.admin;

        if (!isAdmin) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only admins can use this command!' });
        }

        await store.setGroupSetting(msg.key.remoteJid, 'muted', false);
        await sock.sendMessage(msg.key.remoteJid, { text: 'Group has been unmuted. Everyone can send messages now.' });
    },

    everyone: async (sock, msg) => {
        if (!msg.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'This command can only be used in groups!' });
        }

        const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
        const participants = groupMetadata.participants.map(p => p.id);

        await sock.sendMessage(msg.key.remoteJid, {
            text: '👥 *Group Announcement*\n\nAttention everyone!',
            mentions: participants
        });
    },

    setwelcome: async (sock, msg, args) => {
        if (!msg.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'This command can only be used in groups!' });
        }

        const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
        const isAdmin = groupMetadata.participants.find(p => p.id === msg.key.participant)?.admin;

        if (!isAdmin) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only admins can use this command!' });
        }

        const welcomeMsg = args.join(' ');
        if (!welcomeMsg) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a welcome message!' });
        }

        await store.setGroupSetting(msg.key.remoteJid, 'welcomeMessage', welcomeMsg);
        await sock.sendMessage(msg.key.remoteJid, { text: 'Welcome message has been set!' });
    },

    setbye: async (sock, msg, args) => {
        if (!msg.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'This command can only be used in groups!' });
        }

        const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
        const isAdmin = groupMetadata.participants.find(p => p.id === msg.key.participant)?.admin;

        if (!isAdmin) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only admins can use this command!' });
        }

        const byeMsg = args.join(' ');
        if (!byeMsg) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a goodbye message!' });
        }

        await store.setGroupSetting(msg.key.remoteJid, 'byeMessage', byeMsg);
        await sock.sendMessage(msg.key.remoteJid, { text: 'Goodbye message has been set!' });
    },

    del: async (sock, msg) => {
        if (!msg.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'This command can only be used in groups!' });
        }

        const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
        const isAdmin = groupMetadata.participants.find(p => p.id === msg.key.participant)?.admin;

        if (!isAdmin) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only admins can use this command!' });
        }

        if (msg.message.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quotedMsg = msg.message.extendedTextMessage.contextInfo;
            await sock.sendMessage(msg.key.remoteJid, { delete: quotedMsg.stanzaId });
        } else {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Please reply to a message to delete it!' });
        }
    }
};

module.exports = groupCommands;