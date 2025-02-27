const config = require('../config');
const store = require('../database/store');
const logger = require('pino')();

// Helper function to validate group context
async function validateGroupContext(sock, msg, requiresAdmin = true) {
    try {
        if (!msg.key.remoteJid.endsWith('@g.us')) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: 'This command can only be used in groups!' 
            });
            return null;
        }

        const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
        if (requiresAdmin) {
            const sender = msg.key.participant;
            const isAdmin = groupMetadata.participants.find(p => p.id === sender)?.admin;
            if (!isAdmin) {
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: 'Only admins can use this command!' 
                });
                return null;
            }
        }
        return groupMetadata;
    } catch (error) {
        logger.error('Error validating group context:', error);
        return null;
    }
}

const groupCommands = {
    kick: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            const user = args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            if (!user) {
                return await sock.sendMessage(msg.key.remoteJid, { 
                    text: 'Please mention a user to kick!' 
                });
            }

            await sock.groupParticipantsUpdate(msg.key.remoteJid, [user], "remove");
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `Kicked @${user.split('@')[0]}`, 
                mentions: [user] 
            });

            logger.info('User kicked from group:', {
                group: msg.key.remoteJid,
                kicked: user,
                by: msg.key.participant
            });
        } catch (error) {
            logger.error('Error in kick command:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: 'Failed to kick user: ' + error.message 
            });
        }
    },

    promote: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            const user = args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            if (!user) {
                return await sock.sendMessage(msg.key.remoteJid, { 
                    text: 'Please mention a user to promote!' 
                });
            }

            await sock.groupParticipantsUpdate(msg.key.remoteJid, [user], "promote");
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `Promoted @${user.split('@')[0]} to admin`, 
                mentions: [user] 
            });

            logger.info('User promoted in group:', {
                group: msg.key.remoteJid,
                promoted: user,
                by: msg.key.participant
            });
        } catch (error) {
            logger.error('Error in promote command:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: 'Failed to promote user: ' + error.message 
            });
        }
    },

    demote: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            const user = args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            if (!user) {
                return await sock.sendMessage(msg.key.remoteJid, { 
                    text: 'Please mention a user to demote!' 
                });
            }

            await sock.groupParticipantsUpdate(msg.key.remoteJid, [user], "demote");
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `Demoted @${user.split('@')[0]} from admin`, 
                mentions: [user] 
            });

            logger.info('User demoted in group:', {
                group: msg.key.remoteJid,
                demoted: user,
                by: msg.key.participant
            });
        } catch (error) {
            logger.error('Error in demote command:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: 'Failed to demote user: ' + error.message 
            });
        }
    },

    mute: async (sock, msg) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            await store.setGroupSetting(msg.key.remoteJid, 'muted', true);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: 'Group has been muted. Only admins can send messages.' 
            });

            logger.info('Group muted:', {
                group: msg.key.remoteJid,
                by: msg.key.participant
            });
        } catch (error) {
            logger.error('Error in mute command:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: 'Failed to mute group: ' + error.message 
            });
        }
    },

    unmute: async (sock, msg) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            await store.setGroupSetting(msg.key.remoteJid, 'muted', false);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: 'Group has been unmuted. Everyone can send messages now.' 
            });

            logger.info('Group unmuted:', {
                group: msg.key.remoteJid,
                by: msg.key.participant
            });
        } catch (error) {
            logger.error('Error in unmute command:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: 'Failed to unmute group: ' + error.message 
            });
        }
    },

    everyone: async (sock, msg) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, false);
            if (!groupMetadata) return;

            const participants = groupMetadata.participants.map(p => p.id);

            await sock.sendMessage(msg.key.remoteJid, {
                text: '👥 *Group Announcement*\n\nAttention everyone!',
                mentions: participants
            });

            logger.info('Everyone mentioned in group:', {
                group: msg.key.remoteJid,
                by: msg.key.participant,
                participantCount: participants.length
            });
        } catch (error) {
            logger.error('Error in everyone command:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: 'Failed to mention everyone: ' + error.message 
            });
        }
    },

    setwelcome: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            const welcomeMsg = args.join(' ');
            if (!welcomeMsg) {
                return await sock.sendMessage(msg.key.remoteJid, { 
                    text: 'Please provide a welcome message!' 
                });
            }

            await store.setGroupSetting(msg.key.remoteJid, 'welcomeMessage', welcomeMsg);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: 'Welcome message has been set!' 
            });

            logger.info('Welcome message set for group:', {
                group: msg.key.remoteJid,
                by: msg.key.participant,
                message: welcomeMsg
            });
        } catch (error) {
            logger.error('Error in setwelcome command:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: 'Failed to set welcome message: ' + error.message 
            });
        }
    },

    setbye: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            const byeMsg = args.join(' ');
            if (!byeMsg) {
                return await sock.sendMessage(msg.key.remoteJid, { 
                    text: 'Please provide a goodbye message!' 
                });
            }

            await store.setGroupSetting(msg.key.remoteJid, 'byeMessage', byeMsg);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: 'Goodbye message has been set!' 
            });

            logger.info('Goodbye message set for group:', {
                group: msg.key.remoteJid,
                by: msg.key.participant,
                message: byeMsg
            });
        } catch (error) {
            logger.error('Error in setbye command:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: 'Failed to set goodbye message: ' + error.message 
            });
        }
    },
    del: async (sock, msg) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            if (msg.message.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quotedMsg = msg.message.extendedTextMessage.contextInfo;
                await sock.sendMessage(msg.key.remoteJid, { delete: quotedMsg.stanzaId });
                logger.info('Message deleted:', {
                    group: msg.key.remoteJid,
                    deletedBy: msg.key.participant,
                    stanzaId: quotedMsg.stanzaId
                });
            } else {
                await sock.sendMessage(msg.key.remoteJid, { text: 'Please reply to a message to delete it!' });
            }
        } catch (error) {
            logger.error('Error in del command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: 'Failed to delete message: ' + error.message });
        }
    },
    antilink: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            const status = args[0]?.toLowerCase() === 'on' ? true : false;
            await store.setGroupSetting(msg.key.remoteJid, 'antilink', status);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `Antilink has been ${status ? 'enabled' : 'disabled'}`
            });
            logger.info('Antilink status changed:', {
                group: msg.key.remoteJid,
                status: status,
                changedBy: msg.key.participant
            });
        } catch (error) {
            logger.error('Error in antilink command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: 'Failed to change antilink status: ' + error.message });
        }
    },
    groupinfo: async (sock, msg) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, false);
            if (!groupMetadata) return;

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
            logger.info('Group info sent:', {
                group: msg.key.remoteJid,
                requestedBy: msg.key.participant
            });
        } catch (error) {
            logger.error('Error in groupinfo command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: 'Failed to send group info: ' + error.message });
        }
    },
    poll: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, false);
            if (!groupMetadata) return;

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
            logger.info('Poll created:', {
                group: msg.key.remoteJid,
                question: question,
                options: options,
                createdBy: msg.key.participant
            });
        } catch (error) {
            logger.error('Error in poll command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: 'Failed to create poll: ' + error.message });
        }
    },
    setrules: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            const rules = args.join(' ');
            await store.setGroupRules(msg.key.remoteJid, rules);
            await sock.sendMessage(msg.key.remoteJid, { text: 'Group rules have been updated!' });
            logger.info('Group rules updated:', {
                group: msg.key.remoteJid,
                rules: rules,
                updatedBy: msg.key.participant
            });
        } catch (error) {
            logger.error('Error in setrules command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: 'Failed to update group rules: ' + error.message });
        }
    },
    viewrules: async (sock, msg) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, false);
            if (!groupMetadata) return;

            const rules = await store.getGroupRules(msg.key.remoteJid);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: rules ? `*Group Rules*\n\n${rules}` : 'No rules set for this group.'
            });
            logger.info('Group rules viewed:', {
                group: msg.key.remoteJid,
                viewedBy: msg.key.participant
            });
        } catch (error) {
            logger.error('Error in viewrules command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: 'Failed to view group rules: ' + error.message });
        }
    },
    ...Array.from({ length: 48 }, (_, i) => ({
        [`groupCmd${i + 1}`]: async (sock, msg, args) => {
            try {
                const groupMetadata = await validateGroupContext(sock, msg, true);
                if (!groupMetadata) return;

                await sock.sendMessage(msg.key.remoteJid, { 
                    text: `Executing group command ${i + 1} with args: ${args.join(' ')}`
                });
                logger.info(`Group command ${i + 1} executed:`, {
                    group: msg.key.remoteJid,
                    executedBy: msg.key.participant,
                    args: args
                });
            } catch (error) {
                logger.error(`Error in groupCmd${i + 1} command:`, error);
                await sock.sendMessage(msg.key.remoteJid, { text: `Failed to execute group command ${i + 1}: ` + error.message });
            }
        }
    })).reduce((acc, curr) => ({ ...acc, ...curr }), {})
};

module.exports = groupCommands;