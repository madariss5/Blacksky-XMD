const config = require('../config');
const store = require('../database/store');
const logger = require('pino')();

const groupCommands = {
    kick: async (sock, msg, args) => {
        try {
            // Check if it's a group
            if (!msg.key.remoteJid.endsWith('@g.us')) {
                return await sock.sendMessage(msg.key.remoteJid, { text: 'This command can only be used in groups!' });
            }

            // Get group metadata
            const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
            const sender = msg.key.participant || msg.participant;
            const isAdmin = groupMetadata.participants.find(p => p.id === sender)?.admin;

            logger.info('Group command executed:', {
                command: 'kick',
                group: msg.key.remoteJid,
                sender: sender,
                isAdmin: isAdmin
            });

            if (!isAdmin) {
                return await sock.sendMessage(msg.key.remoteJid, { text: 'Only admins can use this command!' });
            }

            const user = args[0]?.replace('@', '') + '@s.whatsapp.net';
            if (!user) {
                return await sock.sendMessage(msg.key.remoteJid, { text: 'Please mention a user to kick!' });
            }

            await sock.groupParticipantsUpdate(msg.key.remoteJid, [user], "remove");
            await sock.sendMessage(msg.key.remoteJid, { text: `Kicked @${user.split('@')[0]}`, mentions: [user] });
        } catch (error) {
            logger.error('Error in kick command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: 'Failed to kick user: ' + error.message });
        }
    },

    promote: async (sock, msg, args) => {
        try {
            if (!msg.key.remoteJid.endsWith('@g.us')) {
                return await sock.sendMessage(msg.key.remoteJid, { text: 'This command can only be used in groups!' });
            }

            const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
            const sender = msg.key.participant || msg.participant;
            const isAdmin = groupMetadata.participants.find(p => p.id === sender)?.admin;

            if (!isAdmin) {
                return await sock.sendMessage(msg.key.remoteJid, { text: 'Only admins can use this command!' });
            }

            const user = args[0]?.replace('@', '') + '@s.whatsapp.net';
            if (!user) {
                return await sock.sendMessage(msg.key.remoteJid, { text: 'Please mention a user to promote!' });
            }

            await sock.groupParticipantsUpdate(msg.key.remoteJid, [user], "promote");
            await sock.sendMessage(msg.key.remoteJid, { text: `Promoted @${user.split('@')[0]} to admin`, mentions: [user] });
        } catch (error) {
            logger.error('Error in promote command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: 'Failed to promote user: ' + error.message });
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
    },
    antilink: async (sock, msg, args) => {
        if (!msg.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'This command can only be used in groups!' });
        }

        const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
        const isAdmin = groupMetadata.participants.find(p => p.id === msg.key.participant)?.admin;

        if (!isAdmin) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only admins can use this command!' });
        }

        const status = args[0]?.toLowerCase() === 'on' ? true : false;
        await store.setGroupSetting(msg.key.remoteJid, 'antilink', status);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `Antilink has been ${status ? 'enabled' : 'disabled'}`
        });
    },
    groupinfo: async (sock, msg) => {
        if (!msg.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'This command can only be used in groups!' });
        }

        const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
        const admins = groupMetadata.participants
            .filter(p => p.admin)
            .map(p => p.id);

        let info = `*Group Information*\n\n`;
        info += `• Name: ${groupMetadata.subject}\n`;
        info += `• Description: ${groupMetadata.desc || 'No description'}\n`;
        info += `• Members: ${groupMetadata.participants.length}\n`;
        info += `• Admins: ${admins.length}\n`;
        info += `• Created: ${new Date(groupMetadata.creation * 1000).toLocaleDateString()}\n`;

        try {
            const ppUrl = await sock.profilePictureUrl(msg.key.remoteJid, 'image');
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: ppUrl },
                caption: info,
                mentions: admins
            });
        } catch {
            await sock.sendMessage(msg.key.remoteJid, {
                text: info,
                mentions: admins
            });
        }
    },
    poll: async (sock, msg, args) => {
        if (!msg.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'This command can only be used in groups!' });
        }

        const [question, ...options] = args;
        if (!question || options.length < 2) {
            return await sock.sendMessage(msg.key.remoteJid, { 
                text: 'Please provide a question and at least 2 options!\nFormat: !poll "Question" "Option1" "Option2"' 
            });
        }

        await sock.sendMessage(msg.key.remoteJid, {
            poll: {
                name: question,
                values: options,
                selectableCount: 1
            }
        });
    },
    setrules: async (sock, msg, args) => {
        if (!msg.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'This command can only be used in groups!' });
        }

        const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
        const isAdmin = groupMetadata.participants.find(p => p.id === msg.key.participant)?.admin;

        if (!isAdmin) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Only admins can use this command!' });
        }

        const rules = args.join(' ');
        await store.setGroupRules(msg.key.remoteJid, rules);
        await sock.sendMessage(msg.key.remoteJid, { text: 'Group rules have been updated!' });
    },
    viewrules: async (sock, msg) => {
        if (!msg.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'This command can only be used in groups!' });
        }

        const rules = await store.getGroupRules(msg.key.remoteJid);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: rules ? `*Group Rules*\n\n${rules}` : 'No rules set for this group.'
        });
    },
    ...Array.from({ length: 48 }, (_, i) => ({
        [`groupCmd${i + 1}`]: async (sock, msg, args) => {
            if (!msg.key.remoteJid.endsWith('@g.us')) {
                return await sock.sendMessage(msg.key.remoteJid, { text: 'This command can only be used in groups!' });
            }

            const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
            const isAdmin = groupMetadata.participants.find(p => p.id === msg.key.participant)?.admin;

            if (!isAdmin) {
                return await sock.sendMessage(msg.key.remoteJid, { text: 'Only admins can use this command!' });
            }

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `Executing group command ${i + 1} with args: ${args.join(' ')}`
            });
        }
    })).reduce((acc, curr) => ({ ...acc, ...curr }), {})
};

module.exports = groupCommands;