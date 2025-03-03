const config = require('../config');
const dbStore = require('../database/store');
const logger = require('../utils/logger');
const { formatPhoneNumber, addWhatsAppSuffix, formatDisplayNumber } = require('../utils/phoneNumber');

// Helper function to safely get profile picture
async function safeProfilePicture(sock, jid) {
    try {
        const pp = await sock.profilePictureUrl(jid, 'image');
        return pp;
    } catch (error) {
        logger.warn('Could not fetch profile picture:', error);
        return 'https://i.imgur.com/wuxBN7M.png'; // Default profile picture
    }
}

const userCommands = {
    me: async (sock, msg) => {
        try {
            const userId = formatPhoneNumber(msg.key.participant || msg.key.remoteJid);
            logger.info('Fetching self profile for user:', userId);

            const userData = await dbStore.getUserData(userId);
            logger.debug('User data retrieved:', { userId, userData });

            let pp;
            try {
                pp = await safeProfilePicture(sock, userId);
            } catch (err) {
                logger.error('Error fetching profile picture:', err);
                pp = 'https://i.imgur.com/wuxBN7M.png';
            }

            if (!userData || !userData.registered) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `You haven't registered yet!\nUse ${config.prefix}register <name> <age> to create your profile.`
                });
            }

            const whatsappId = addWhatsAppSuffix(userId);
            const userStats = await dbStore.getUserStats(userId);
            const userRank = await dbStore.getUserRank(userId);

            const info = `*Your Profile*\n\n` +
                        `• Number: ${formatDisplayNumber(userId)}\n` +
                        `• Name: ${userData.name || 'Not set'}\n` +
                        `• Age: ${userData.age || 'Not set'}\n` +
                        `• Level: ${userStats.level}\n` +
                        `• XP: ${userStats.xp}\n` +
                        `• Rank: #${userRank}\n` +
                        `• Bio: ${userData.bio || 'No bio set'}`;

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

    profile: async (sock, msg, args) => {
        try {
            const targetUser = args[0] ? 
                formatPhoneNumber(args[0]) : 
                formatPhoneNumber(msg.key.participant || msg.key.remoteJid);

            logger.info('Fetching profile for user:', targetUser);
            const userData = await dbStore.getUserData(targetUser);
            logger.debug('Target user data:', { targetUser, userData });

            let pp;
            try {
                pp = await safeProfilePicture(sock, targetUser);
            } catch (err) {
                logger.error('Error fetching profile picture:', err);
                pp = 'https://i.imgur.com/wuxBN7M.png';
            }

            const whatsappId = addWhatsAppSuffix(targetUser);

            const info = userData && userData.registered ? 
                `*User Profile*\n\n` +
                `• Number: ${formatDisplayNumber(targetUser)}\n` +
                `• Name: ${userData.name || 'Not set'}\n` +
                `• Age: ${userData.age || 'Not set'}\n` +
                `• Level: ${userData.level || 1}\n` +
                `• XP: ${userData.xp || 0}\n` +
                `• Bio: ${userData.bio || 'No bio set'}\n` +
                `• Registered: ${userData.registrationTime ? new Date(userData.registrationTime).toLocaleDateString() : 'No'}`
                :
                `*User Profile*\n\n` +
                `• Number: ${formatDisplayNumber(targetUser)}\n` +
                `• Status: Not registered`;

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

    register: async (sock, msg, args) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;

            if (await dbStore.isUserRegistered(userId)) {
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

            logger.info('Registering user:', { userId, name, age });
            await dbStore.registerUser(userId, name, age);

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

    bio: async (sock, msg, args) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;

            if (!await dbStore.isUserRegistered(userId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ You need to register first!\nUse ${config.prefix}register <name> <age>`
                });
            }

            if (!args.length) {
                const userData = await dbStore.getUserData(userId);
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: userData.bio ? 
                        `📝 *Your Bio*\n\n${userData.bio}` :
                        `You haven't set a bio yet! Use ${config.prefix}bio <text> to set one.`
                });
            }

            const newBio = args.join(' ');
            if (newBio.length > 100) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Bio must be less than 100 characters!'
                });
            }

            await dbStore.setUser(userId, { bio: newBio });
            await sock.sendMessage(msg.key.remoteJid, {
                text: '✅ Bio updated successfully!'
            });
        } catch (error) {
            logger.error('Error in bio command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to update bio. Please try again later.'
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
    level: async (sock, msg) => {
        try {
            const user = msg.key.participant || msg.key.remoteJid;
            const stats = await dbStore.getUserStats(user);
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
    }
};

module.exports = userCommands;