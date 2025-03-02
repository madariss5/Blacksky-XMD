const config = require('../config');
const store = require('../database/store');
const logger = require('../utils/logger');
const { formatPhoneNumber, addWhatsAppSuffix, formatDisplayNumber } = require('../utils/phoneNumber');

// Helper function for safely fetching profile pictures
async function safeProfilePicture(sock, jid) {
    try {
        const whatsappId = addWhatsAppSuffix(formatPhoneNumber(jid));
        const pp = await sock.profilePictureUrl(whatsappId, 'image');
        logger.info('Profile picture fetched successfully');
        return pp;
    } catch (err) {
        logger.warn('Failed to fetch profile picture:', err);
        return 'https://i.imgur.com/wuxBN7M.png'; // Default profile picture
    }
}

const userCommands = {
    profile: async (sock, msg, args) => {
        try {
            // Get target user (mentioned user or command sender)
            const targetUser = args[0] ? 
                formatPhoneNumber(args[0]) : 
                formatPhoneNumber(msg.key.participant || msg.key.remoteJid);

            const userData = await store.getUserData(targetUser) || {};
            const pp = await safeProfilePicture(sock, targetUser);
            const whatsappId = addWhatsAppSuffix(targetUser);

            const info = userData ? 
                `*User Profile*\n\n` +
                `• Number: ${formatDisplayNumber(targetUser)}\n` +
                `• Name: ${userData.name || 'Not set'}\n` +
                `• Age: ${userData.age || 'Not set'}\n` +
                `• Level: ${userData.level || 1}\n` +
                `• XP: ${userData.xp || 0}\n` +
                `• Bio: ${userData.bio || 'No bio set'}\n` +
                `• Registered: ${userData.registeredAt ? new Date(userData.registeredAt).toLocaleDateString() : 'No'}`
                :
                `*User Profile*\n\n` +
                `• Number: ${formatDisplayNumber(targetUser)}\n` +
                `• Status: Not registered\n\n` +
                `Use ${config.prefix}register <name> <age> to create a profile!`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: pp },
                caption: info,
                mentions: [whatsappId]
            });

        } catch (error) {
            logger.error('Error in profile command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching profile. Please try again later.'
            });
        }
    },

    me: async (sock, msg) => {
        try {
            const userId = formatPhoneNumber(msg.key.participant || msg.key.remoteJid);
            const stats = store.getUserStats(userId);
            const userInfo = store.getUserInfo(userId);
            const whatsappId = addWhatsAppSuffix(userId);

            const pp = await safeProfilePicture(sock, userId);

            const info = `*Your Profile*\n\n` +
                        `• Number: ${formatDisplayNumber(userId)}\n` +
                        `• Name: ${userInfo?.name || 'Not registered'}\n` +
                        `• Age: ${userInfo?.age || 'Not registered'}\n` +
                        `• Level: ${stats.level || 1}\n` +
                        `• XP: ${stats.xp || 0}\n` +
                        `• Rank: #${store.getUserRank(userId)}\n` +
                        `• Bio: ${userInfo?.bio || 'No bio set'}`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: pp },
                caption: info,
                mentions: [whatsappId]
            });

        } catch (error) {
            logger.error('Error in me command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing your profile. Please try again later.'
            });
        }
    },
    join: async (sock, msg, args) => {
        try {
            if (!args[0]) {
                return await sock.sendMessage(msg.key.remoteJid, { 
                    text: '❌ Please provide a group link!\nUsage: .join <group_link>' 
                });
            }

            // Extract invite code from link
            const linkParts = args[0].split('whatsapp.com/');
            if (linkParts.length < 2) {
                return await sock.sendMessage(msg.key.remoteJid, { 
                    text: '❌ Invalid group link provided!' 
                });
            }

            const inviteCode = linkParts[1];
            await sock.groupAcceptInvite(inviteCode);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '✅ Successfully joined the group!' 
            });

            logger.info('Successfully joined group with code:', inviteCode);
        } catch (error) {
            logger.error('Error in join command:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Failed to join group: ' + error.message 
            });
        }
    },
    register: async (sock, msg, args) => {
        if (store.isUserRegistered(msg.key.participant)) {
            return await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ You are already registered!' 
            });
        }

        if (args.length < 2) {
            return await sock.sendMessage(msg.key.remoteJid, { 
                text: `❓ Please provide your name and age!\nFormat: ${config.prefix}register <name> <age>`
            });
        }

        const age = parseInt(args[args.length - 1]);
        const name = args.slice(0, -1).join(' ');

        if (isNaN(age) || age < 13 || age > 100) {
            return await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Please provide a valid age between 13 and 100!' 
            });
        }

        try {
            await store.registerUser(msg.key.participant, name, age);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ Registration successful!\n\n` +
                      `Name: ${name}\n` +
                      `Age: ${age}\n\n` +
                      `Use ${config.prefix}profile to view your profile!`
            });
        } catch (error) {
            logger.error('Error in register command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Registration failed. Please try again later.'
            });
        }
    },
    level: async (sock, msg) => {
        try {
            const user = msg.key.participant || msg.key.remoteJid;
            const stats = store.getUserStats(user);
            const nextLevel = Math.pow((stats.level + 1) / 0.1, 2);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*Level Stats*\n\n` +
                      `• Current Level: ${stats.level}\n` +
                      `• Total XP: ${stats.xp}\n` +
                      `• Next Level: ${stats.level + 1}\n` +
                      `• XP Needed: ${nextLevel - stats.xp}\n` +
                      `• Progress: ${Math.floor((stats.xp / nextLevel) * 100)}%`,
                mentions: [user]
            });
        } catch (error) {
            logger.error('Error in level command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching level stats. Please try again later.'
            });
        }
    },
    bio: async (sock, msg, args) => {
        try {
            const user = msg.key.participant || msg.key.remoteJid;

            if (!args.length) {
                const currentBio = store.getUserBio(user);
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: currentBio ? 
                        `📝 *Your Bio*\n\n${currentBio}` :
                        `You haven't set a bio yet! Use ${config.prefix}bio <text> to set one.`
                });
            }

            const newBio = args.join(' ');
            if (newBio.length > 100) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Bio must be less than 100 characters!'
                });
            }

            await store.setUserBio(user, newBio);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '✅ Bio updated successfully!'
            });
        } catch (error) {
            logger.error('Error in bio command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to update bio. Please try again later.'
            });
        }
    }
};

module.exports = userCommands;