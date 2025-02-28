const config = require('../config');
const store = require('../database/store');
const logger = require('pino')();
const path = require('path');

// Helper function to validate group context and permissions
async function validateGroupContext(sock, msg, requiresAdmin = true) {
    try {
        logger.info('Validating group context:', {
            messageId: msg?.key?.id,
            remoteJid: msg?.key?.remoteJid,
            requiresAdmin
        });

        if (!msg?.key?.remoteJid) {
            logger.error('Invalid message format - missing remoteJid');
            return null;
        }

        // Verify it's a group chat
        if (!msg.key.remoteJid.endsWith('@g.us')) {
            logger.info('Command used outside group chat:', msg.key.remoteJid);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ This command can only be used in groups!' 
            });
            return null;
        }

        // Get group metadata with error handling
        let groupMetadata;
        try {
            groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
            logger.info('Group metadata fetched successfully:', {
                groupName: groupMetadata.subject,
                participantCount: groupMetadata.participants.length
            });
        } catch (error) {
            logger.error('Failed to fetch group metadata:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Failed to fetch group information. Please try again.' 
            });
            return null;
        }

        // Verify admin status if required
        if (requiresAdmin) {
            if (!msg.key.participant) {
                logger.error('Missing participant ID in group message');
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: '❌ Error: Could not identify sender' 
                });
                return null;
            }

            const participant = groupMetadata.participants.find(p => p.id === msg.key.participant);
            if (!participant) {
                logger.error('Participant not found in group:', {
                    participantId: msg.key.participant,
                    groupId: msg.key.remoteJid
                });
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: '❌ Error: You are not a member of this group' 
                });
                return null;
            }

            const isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';
            logger.info('Admin status check:', {
                participantId: msg.key.participant,
                isAdmin: isAdmin
            });

            if (!isAdmin) {
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: '❌ Only group admins can use this command!' 
                });
                return null;
            }
        }

        return groupMetadata;
    } catch (error) {
        logger.error('Group context validation error:', error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: '❌ Error checking group permissions: ' + error.message 
        });
        return null;
    }
}

// Helper function to safely update group participants
async function safeGroupParticipantUpdate(sock, groupId, participants, action) {
    try {
        await sock.groupParticipantsUpdate(groupId, participants, action);
        return true;
    } catch (error) {
        logger.error(`Failed to ${action} participants:`, error);
        return false;
    }
}

const groupCommands = {
    kick: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            if (!args[0]) {
                return await sock.sendMessage(msg.key.remoteJid, { 
                    text: `❌ Please mention a user to kick!\nUsage: .kick @user` 
                });
            }

            const targetUser = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            const targetParticipant = groupMetadata.participants.find(p => p.id === targetUser);

            if (!targetParticipant) {
                return await sock.sendMessage(msg.key.remoteJid, { 
                    text: '❌ User is not in this group!' 
                });
            }

            if (targetParticipant.admin) {
                return await sock.sendMessage(msg.key.remoteJid, { 
                    text: '❌ Cannot kick an admin!' 
                });
            }

            const success = await safeGroupParticipantUpdate(sock, msg.key.remoteJid, [targetUser], "remove");
            if (success) {
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: `✅ Kicked @${targetUser.split('@')[0]}`, 
                    mentions: [targetUser] 
                });
            } else {
                throw new Error('Failed to kick user');
            }
        } catch (error) {
            logger.error('Kick command error:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Failed to kick user: ' + error.message 
            });
        }
    },
    promote: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            if (!args[0]) {
                return await sock.sendMessage(msg.key.remoteJid, { 
                    text: '❌ Please mention a user to promote!' 
                });
            }

            const targetUser = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            const success = await safeGroupParticipantUpdate(sock, msg.key.remoteJid, [targetUser], "promote");
            if (success) {
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: `✅ Promoted @${targetUser.split('@')[0]} to admin`, 
                    mentions: [targetUser] 
                });
            } else {
                throw new Error('Failed to promote user');
            }
        } catch (error) {
            logger.error('Error in promote command:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Failed to promote user: ' + error.message 
            });
        }
    },
    demote: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            if (!args[0]) {
                return await sock.sendMessage(msg.key.remoteJid, { 
                    text: '❌ Please mention a user to demote!' 
                });
            }

            const targetUser = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            const success = await safeGroupParticipantUpdate(sock, msg.key.remoteJid, [targetUser], "demote");
            if (success) {
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: `✅ Demoted @${targetUser.split('@')[0]} from admin`, 
                    mentions: [targetUser] 
                });
            } else {
                throw new Error('Failed to demote user');
            }
        } catch (error) {
            logger.error('Error in demote command:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Failed to demote user: ' + error.message 
            });
        }
    },
    mute: async (sock, msg) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            await sock.groupSettingUpdate(msg.key.remoteJid, 'announcement');
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '🔇 Group has been muted. Only admins can send messages.' 
            });
        } catch (error) {
            logger.error('Mute command error:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Failed to mute group: ' + error.message 
            });
        }
    },
    unmute: async (sock, msg) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            await sock.groupSettingUpdate(msg.key.remoteJid, 'not_announcement');
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '🔊 Group has been unmuted. Everyone can send messages now.' 
            });
        } catch (error) {
            logger.error('Unmute command error:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Failed to unmute group: ' + error.message 
            });
        }
    },
    everyone: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, false);
            if (!groupMetadata) return;

            const participants = groupMetadata.participants.map(p => p.id);
            const message = args.length > 0 ? args.join(' ') : 'Attention everyone!';

            await sock.sendMessage(msg.key.remoteJid, {
                text: `👥 *Group Announcement*\n\n${message}`,
                mentions: participants
            });
        } catch (error) {
            logger.error('Error in everyone command:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Failed to mention everyone: ' + error.message 
            });
        }
    },
    link: async (sock, msg) => {
        try {
            // First verify basic group context
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            // Additional checks for bot's admin status
            const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const botParticipant = groupMetadata.participants.find(p => p.id === botId);

            if (!botParticipant?.admin) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ I need to be an admin to generate the group link!'
                });
            }

            try {
                // Simple direct method call to get invite code
                const code = await sock.groupInviteCode(msg.key.remoteJid);

                if (!code) {
                    logger.error('No invite code returned');
                    throw new Error('Failed to generate invite code');
                }

                const linkMessage = `🔗 *Group Invite Link*\n\n` +
                                  `Group: ${groupMetadata.subject}\n` +
                                  `Link: https://chat.whatsapp.com/${code}`;

                await sock.sendMessage(msg.key.remoteJid, {
                    text: linkMessage
                });

                logger.info('Group link generated successfully:', {
                    group: msg.key.remoteJid,
                    generatedBy: msg.key.participant
                });
            } catch (error) {
                logger.error('Error in group link generation:', error);
                throw new Error('Unable to generate invite link at this time. Please try again later.');
            }
        } catch (error) {
            logger.error('Error in link command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ ' + error.message
            });
        }
    },
    revoke: async (sock, msg) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            await sock.groupRevokeInvite(msg.key.remoteJid);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '✅ Group link has been revoked.'
            });
        } catch (error) {
            logger.error('Error in revoke command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to revoke group link: ' + error.message
            });
        }
    },
    hidetag: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            const participants = groupMetadata.participants.map(p => p.id);
            const message = args.length > 0 ? args.join(' ') : 'Hidden announcement';

            await sock.sendMessage(msg.key.remoteJid, {
                text: message,
                mentions: participants
            });
        } catch (error) {
            logger.error('Error in hidetag command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to send hidden tag: ' + error.message
            });
        }
    },
    setname: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a new group name!'
                });
            }

            const newName = args.join(' ');
            await sock.groupUpdateSubject(msg.key.remoteJid, newName);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ Group name has been updated to: ${newName}`
            });
        } catch (error) {
            logger.error('Error in setname command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to update group name: ' + error.message
            });
        }
    },
    setdesc: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a new group description!'
                });
            }

            const newDesc = args.join(' ');
            await sock.groupUpdateDescription(msg.key.remoteJid, newDesc);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '✅ Group description has been updated!'
            });
        } catch (error) {
            logger.error('Error in setdesc command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to update group description: ' + error.message
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
                text: '❌ Failed to set welcome message: ' + error.message 
            });
        }
    },
    setgoodbye: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            const goodbyeMsg = args.join(' ');
            if (!goodbyeMsg) {
                return await sock.sendMessage(msg.key.remoteJid, { 
                    text: '❌ Please provide a goodbye message!' 
                });
            }

            await store.setGroupSetting(msg.key.remoteJid, 'goodbyeMessage', goodbyeMsg);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '✅ Goodbye message has been set!' 
            });

            logger.info('Goodbye message set for group:', {
                group: msg.key.remoteJid,
                by: msg.key.participant,
                message: goodbyeMsg
            });
        } catch (error) {
            logger.error('Error in setgoodbye command:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Failed to set goodbye message: ' + error.message 
            });
        }
    },
    antilink: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            if (!args[0] || !['on', 'off'].includes(args[0].toLowerCase())) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Please specify on/off!\nUsage: .antilink on/off`
                });
            }

            const status = args[0].toLowerCase() === 'on';
            await store.setGroupSetting(msg.key.remoteJid, 'antilink', status);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `✅ Antilink has been ${status ? 'enabled' : 'disabled'}`
            });
        } catch (error) {
            logger.error('Error in antilink command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to change antilink status: ' + error.message
            });
        }
    },
    antispam: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            if (!args[0] || !['on', 'off'].includes(args[0].toLowerCase())) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Please specify on/off!\nUsage: .antispam on/off`
                });
            }

            const status = args[0].toLowerCase() === 'on';
            await store.setGroupSetting(msg.key.remoteJid, 'antispam', status);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `✅ Anti-spam has been ${status ? 'enabled' : 'disabled'}`
            });
        } catch (error) {
            logger.error('Error in antispam command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to change anti-spam status: ' + error.message
            });
        }
    },
    antitoxic: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            if (!args[0] || !['on', 'off'].includes(args[0].toLowerCase())) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Please specify on/off!\nUsage: .antitoxic on/off`
                });
            }

            const status = args[0].toLowerCase() === 'on';
            await store.setGroupSetting(msg.key.remoteJid, 'antitoxic', status);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `✅ Anti-toxic has been ${status ? 'enabled' : 'disabled'}`
            });
        } catch (error) {
            logger.error('Error in antitoxic command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to change anti-toxic status: ' + error.message
            });
        }
    },
    groupinfo: async (sock, msg) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, false);
            if (!groupMetadata) return;

            const settings = await store.getGroupSettings(msg.key.remoteJid);
            const admins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);

            let info = `*Group Information*\n\n`;
            info += `• Name: ${groupMetadata.subject}\n`;
            info += `• Description: ${groupMetadata.desc || 'No description'}\n`;
            info += `• Members: ${groupMetadata.participants.length}\n`;
            info += `• Admins: ${admins.length}\n`;
            info += `• Created: ${new Date(groupMetadata.creation * 1000).toLocaleDateString()}\n\n`;
            info += `*Settings*\n`;
            info += `• Antilink: ${settings?.antilink ? '✅' : '❌'}\n`;
            info += `• Anti-spam: ${settings?.antispam ? '✅' : '❌'}\n`;
            info += `• Anti-toxic: ${settings?.antitoxic ? '✅' : '❌'}\n`;

            await sock.sendMessage(msg.key.remoteJid, {
                text: info,
                mentions: admins
            });
        } catch (error) {
            logger.error('Error in groupinfo command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to get group info: ' + error.message
            });
        }
    },
    warn: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            if (!args[0]) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Please mention a user to warn!\nUsage: .warn @user [reason]`
                });
            }

            const targetUser = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            const reason = args.slice(1).join(' ') || 'No reason provided';

            const result = await store.addWarning(
                msg.key.remoteJid,
                targetUser,
                reason,
                msg.key.participant
            );

            if (!result.success) {
                throw new Error(result.error);
            }

            const warningCount = result.warningCount;
            let response = `⚠️ *WARNING #${warningCount}*\n\n`;
            response += `@${targetUser.split('@')[0]} has been warned.\n`;
            response += `Reason: ${reason}\n`;

            if (warningCount >= 3) {
                response += '\n⛔ Maximum warnings reached. User will be removed.';
                const success = await safeGroupParticipantUpdate(sock, msg.key.remoteJid, [targetUser], "remove");
                if (!success) {
                    throw new Error('Failed to remove user after max warnings');
                }
                await store.clearWarnings(msg.key.remoteJid, targetUser);
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: response,
                mentions: [targetUser]
            });
        } catch (error) {
            logger.error('Error in warn command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to warn user: ' + error.message
            });
        }
    },
    delwarn: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            if (args.length < 2) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Please specify user and warning number!\nUsage: .delwarn @user <warning_number>`
                });
            }

            const targetUser = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            const warningIndex = parseInt(args[1]) - 1;

            const result = await store.removeWarning(msg.key.remoteJid, targetUser, warningIndex);
            if (!result.success) {
                throw new Error(result.error);
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ Warning #${warningIndex + 1} has been removed from @${targetUser.split('@')[0]}.\nRemaining warnings: ${result.remainingWarnings}`,
                mentions: [targetUser]
            });
        } catch (error) {
            logger.error('Error in delwarn command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to delete warning: ' + error.message
            });
        }
    },
    warnlist: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            if (!args[0]) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Please mention a user!\nUsage: .warnlist @user`
                });
            }

            const targetUser = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            const warnings = await store.getWarnings(msg.key.remoteJid, targetUser);

            if (!warnings.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `✅ @${targetUser.split('@')[0]} has no warnings.`,
                    mentions: [targetUser]
                });
            }

            let warnText = `⚠️ *Warnings for @${targetUser.split('@')[0]}*\n\n`;
            warnings.forEach((warn, index) => {
                warnText += `*${index + 1}.* ${warn.reason}\n`;
                warnText += `⏰ ${new Date(warn.timestamp).toLocaleString()}\n`;
                warnText += `👮‍♂️ By: @${warn.warnedBy.split('@')[0]}\n\n`;
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: warnText,
                mentions: [targetUser, ...warnings.map(w => w.warnedBy)]
            });
        } catch (error) {
            logger.error('Error in warnlist command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to get warnings: ' + error.message
            });
        }
    },
    del: async (sock, msg) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            if (!msg.message.extendedTextMessage?.contextInfo?.quotedMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to a message to delete it!'
                });
            }

            const quotedMsg = msg.message.extendedTextMessage.contextInfo;
            await sock.sendMessage(msg.key.remoteJid, { 
                delete: quotedMsg.stanzaId 
            });

            logger.info('Message deleted:', {
                group: msg.key.remoteJid,
                deletedBy: msg.key.participant
            });
        } catch (error) {
            logger.error('Error in del command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to delete message: ' + error.message
            });
        }
    },
    poll: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, false);
            if (!groupMetadata) return;

            const [question, ...options] = args;
            if (!question || options.length < 2) {
                return await sock.sendMessage(msg.key.remoteJid, { 
                    text: 'Please provide a question and at least 2 options!\nFormat: .poll "Question" "Option1" "Option2"' 
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
    }
};

module.exports = groupCommands;