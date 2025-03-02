const config = require('../config');
const store = require('../database/store');
const logger = require('pino')();

// Helper function to validate group context and permissions
async function validateGroupContext(sock, msg, requiresAdmin = true) {
    try {
        if (!msg?.key?.remoteJid?.endsWith('@g.us')) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ This command can only be used in groups!' 
            });
            return null;
        }

        const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);

        if (requiresAdmin) {
            const participant = groupMetadata.participants.find(p => p.id === msg.key.participant);
            if (!participant?.admin) {
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

const groupCommands = {
    kick: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            if (!args[0]) {
                return await sock.sendMessage(msg.key.remoteJid, { 
                    text: '❌ Please mention a user to kick!\nUsage: .kick @user' 
                });
            }

            const targetUser = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            await sock.groupParticipantsUpdate(msg.key.remoteJid, [targetUser], "remove");

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `✅ Successfully kicked @${targetUser.split('@')[0]}`,
                mentions: [targetUser]
            });
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
            await sock.groupParticipantsUpdate(msg.key.remoteJid, [targetUser], "promote");

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `✅ Successfully promoted @${targetUser.split('@')[0]} to admin`,
                mentions: [targetUser]
            });
        } catch (error) {
            logger.error('Promote command error:', error);
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
            await sock.groupParticipantsUpdate(msg.key.remoteJid, [targetUser], "demote");

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `✅ Successfully demoted @${targetUser.split('@')[0]} from admin`,
                mentions: [targetUser]
            });
        } catch (error) {
            logger.error('Demote command error:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Failed to demote user: ' + error.message 
            });
        }
    },

    link: async (sock, msg) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            const code = await sock.groupInviteCode(msg.key.remoteJid);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🔗 Group Link: https://chat.whatsapp.com/${code}` 
            });
        } catch (error) {
            logger.error('Link command error:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Failed to get group link: ' + error.message 
            });
        }
    },

    revoke: async (sock, msg) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            await sock.groupRevokeInvite(msg.key.remoteJid);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '✅ Group link has been reset!' 
            });
        } catch (error) {
            logger.error('Revoke command error:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Failed to revoke group link: ' + error.message 
            });
        }
    },

    everyone: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, false);
            if (!groupMetadata) return;

            const participants = groupMetadata.participants.map(p => p.id);
            const message = args.length > 0 ? args.join(' ') : 'Hey everyone!';

            await sock.sendMessage(msg.key.remoteJid, {
                text: `${message}\n\n${participants.map(p => `@${p.split('@')[0]}`).join(' ')}`,
                mentions: participants
            });
        } catch (error) {
            logger.error('Everyone command error:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Failed to mention everyone: ' + error.message 
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
    hidetag: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            // Get all participants' JIDs
            const participants = groupMetadata.participants.map(p => p.id);

            // Construct message with hidden mentions
            const message = args.length > 0 ? args.join(' ') : 'Hidden announcement';

            // Send message with hidden mentions
            await sock.sendMessage(msg.key.remoteJid, {
                text: message,
                mentions: participants,
                contextInfo: {
                    mentionedJid: participants,
                    isHiddenTag: true 
                }
            });

            logger.info('Hidden tag sent:', {
                group: msg.key.remoteJid,
                sender: msg.key.participant,
                participants: participants.length
            });
        } catch (error) {
            logger.error('Error in hidetag command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to send hidden tag: ' + error.message
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

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide the rules!\nUsage: .setrules [rules text]'
                });
            }

            const rules = args.join(' ');
            try {
                await store.setGroupRules(msg.key.remoteJid, rules);
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: '✅ Group rules have been updated successfully!' 
                });

                logger.info('Group rules updated:', {
                    group: msg.key.remoteJid,
                    updatedBy: msg.key.participant
                });
            } catch (error) {
                logger.error('Failed to save group rules:', error);
                throw new Error('Failed to save group rules. Please try again.');
            }
        } catch (error) {
            logger.error('Error in setrules command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ ' + error.message
            });
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
    join: async (sock, msg, args) => {
        try {
            if (!args[0]) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a group invite link!\nUsage: .join <link>'
                });
            }

            // Extract invite code from the link
            let code = args[0];
            if (code.includes('chat.whatsapp.com/')) {
                code = code.split('chat.whatsapp.com/')[1];
            }

            logger.info('Attempting to join group with code:', {
                code: code,
                user: msg.key.participant
            });

            try {
                const response = await sock.groupAcceptInvite(code);
                if (response) {
                    await sock.sendMessage(msg.key.remoteJid, {
                        text: '✅ Successfully joined the group!'
                    });
                    logger.info('Successfully joined group:', {
                        groupId: response,
                        user: msg.key.participant
                    });
                } else {
                    throw new Error('Failed to join group');
                }
            } catch (joinError) {
                logger.error('Failed to join group:', joinError);
                throw new Error('Invalid invite link or group is full');
            }
        } catch (error) {
            logger.error('Error in join command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to join group: ' + error.message
            });
        }
    },

    tagall: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, false);
            if (!groupMetadata) return;

            // Get all participants' JIDs
            const participants = groupMetadata.participants.map(p => p.id);

            // Construct message with mentions
            const message = args.length > 0 ? args.join(' ') : 'Attention everyone!';
            const mentionTags = participants.map(jid => `@${jid.split('@')[0]}`).join(' ');

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*📢 Group Notice*\n\n${message}\n\n${mentionTags}`,
                mentions: participants
            });

            logger.info('Tagged all members:', {
                group: msg.key.remoteJid,
                participants: participants.length
            });
        } catch (error) {
            logger.error('Error in tagall command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to tag members: ' + error.message
            });
        }
    },

    setppgc: async (sock, msg) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image to set as group profile picture!'
                });
            }

            const media = await downloadMediaMessage(
                {
                    key: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMsg,
                    messageTimestamp: msg.messageTimestamp
                },
                'buffer',
                {},
                {
                    logger,
                    reuploadRequest: sock.updateMediaMessage
                }
            );

            await sock.updateProfilePicture(msg.key.remoteJid, media);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '✅ Group profile picture updated successfully!'
            });
        } catch (error) {
            logger.error('Error in setppgc command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to update group profile picture: ' + error.message
            });
        }
    },

    listadmins: async (sock, msg) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, false);
            if (!groupMetadata) return;

            const admins = groupMetadata.participants
                .filter(p => p.admin)
                .map(p => p.id);

            if (!admins.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No admins found in this group!'
                });
            }

            let text = '*Group Admins*\n\n';
            admins.forEach((admin, i) => {
                text += `${i + 1}. @${admin.split('@')[0]}\n`;
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text,
                mentions: admins
            });
        } catch (error) {
            logger.error('Error in listadmins command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to list admins: ' + error.message
            });
        }
    },

    groupsettings: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            if (!args[0] || !['close', 'open', 'locked', 'unlocked'].includes(args[0].toLowerCase())) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please specify a valid setting!\nUsage: !groupsettings <close/open/locked/unlocked>'
                });
            }

            const setting = args[0].toLowerCase();
            switch (setting) {
                case 'close':
                    await sock.groupSettingUpdate(msg.key.remoteJid, 'announcement');
                    await sock.sendMessage(msg.key.remoteJid, {
                        text: '🔒 Group settings updated: Only admins can send messages'
                    });
                    break;
                case 'open':
                    await sock.groupSettingUpdate(msg.key.remoteJid, 'not_announcement');
                    await sock.sendMessage(msg.key.remoteJid, {
                        text: '🔓 Group settings updated: All participants can send messages'
                    });
                    break;
                case 'locked':
                    await sock.groupSettingUpdate(msg.key.remoteJid, 'locked');
                    await sock.sendMessage(msg.key.remoteJid, {
                        text: '🔒 Group settings updated: Group is locked'
                    });
                    break;
                case 'unlocked':
                    await sock.groupSettingUpdate(msg.key.remoteJid, 'unlocked');
                    await sock.sendMessage(msg.key.remoteJid, {
                        text: '🔓 Group settings updated: Group is unlocked'
                    });
                    break;
                default:
                    throw new Error('Invalid setting option');
            }
        } catch (error) {
            logger.error('Error in groupsettings command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to update group settings: ' + error.message
            });
        }
    },

    welcome: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            if (!args[0] || !['on', 'off'].includes(args[0].toLowerCase())) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Please specify on/off!\nUsage: .welcome on/off`
                });
            }

            const status = args[0].toLowerCase() === 'on';
            await store.setGroupSetting(msg.key.remoteJid, 'welcome', status);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ Welcome messages have been turned ${status ? 'on' : 'off'}`
            });

            logger.info('Welcome status updated:', {
                group: msg.key.remoteJid,
                status: status,
                updatedBy: msg.key.participant
            });
        } catch (error) {
            logger.error('Error in welcome command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to update welcome status: ' + error.message
            });
        }
    },

    goodbye: async (sock, msg, args) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            if (!args[0] || !['on', 'off'].includes(args[0].toLowerCase())) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Please specify on/off!\nUsage: .goodbye on/off`
                });
            }

            const status = args[0].toLowerCase() === 'on';
            await store.setGroupSetting(msg.key.remoteJid, 'goodbye', status);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ Goodbye messages have been turned ${status ? 'on' : 'off'}`
            });

            logger.info('Goodbye status updated:', {
                group: msg.key.remoteJid,
                status: status,
                updatedBy: msg.key.participant
            });
        } catch (error) {
            logger.error('Error in goodbye command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to update goodbye status: ' + error.message
            });
        }
    },

    invitelink: async (sock, msg) => {
        try {
            const groupMetadata = await validateGroupContext(sock, msg, true);
            if (!groupMetadata) return;

            const code = await sock.groupInviteCode(msg.key.remoteJid);
            const link = `https://chat.whatsapp.com/${code}`;

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🔗 *Group Invite Link*\n\n${link}\n\nNote: Only admins can generate invite links.`
            });

            logger.info('Invite link generated:', {
                group: msg.key.remoteJid,
                by: msg.key.participant
            });
        } catch (error) {
            logger.error('Error in invitelink command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to generate invite link: ' + error.message
            });
        }
    },

    // Add event handler for group updates
    handleGroupUpdate: async (sock, update) => {
        try {
            const { id, participants, action } = update;
            const groupMetadata = await sock.groupMetadata(id);
            const settings = await store.getGroupSettings(id);

            if (!settings) return;

            switch (action) {
                case 'add':
                    if (settings.welcome) {
                        for (const participant of participants) {
                            const welcomeMsg = settings.welcomeMessage || 
                                `Welcome @${participant.split('@')[0]} to ${groupMetadata.subject}! 👋`;
                            await sock.sendMessage(id, {
                                text: welcomeMsg,
                                mentions: [participant]
                            });
                        }
                    }
                    break;

                case 'remove':
                    if (settings.goodbye) {
                        for (const participant of participants) {
                            const goodbyeMsg = settings.goodbyeMessage || 
                                `Goodbye @${participant.split('@')[0]}! 👋`;
                            await sock.sendMessage(id, {
                                text: goodbyeMsg,
                                mentions: [participant]
                            });
                        }
                    }
                    break;
            }
        } catch (error) {
            logger.error('Error handling group update:', error);
        }
    }
};

module.exports = groupCommands;