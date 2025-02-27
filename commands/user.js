const config = require('../config');
const store = require('../database/store');
const logger = require('pino')();

async function safeProfilePicture(sock, jid) {
    try {
        const pp = await sock.profilePictureUrl(jid, 'image');
        logger.info('Profile picture fetched successfully');
        return pp;
    } catch (err) {
        logger.warn('Failed to fetch profile picture:', err);
        return 'https://i.imgur.com/wuxBN7M.png'; // Default profile picture
    }
}

// Core user commands
const coreUserCommands = {
    profile: async (sock, msg, args) => {
        try {
            let targetUser;
            if (args[0]) {
                targetUser = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            } else {
                targetUser = msg.key.participant || msg.key.remoteJid;
            }

            logger.info('Fetching profile for user:', targetUser);

            const userInfo = store.getUserInfo(targetUser);
            const pp = await safeProfilePicture(sock, targetUser);

            const info = userInfo ? 
                `*User Profile*\n\n` +
                `• Number: @${targetUser.split('@')[0]}\n` +
                `• Name: ${userInfo.name || 'Not set'}\n` +
                `• Age: ${userInfo.age || 'Not set'}\n` +
                `• Level: ${userInfo.level || 1}\n` +
                `• XP: ${userInfo.xp || 0}\n` +
                `• Bio: ${userInfo.bio || 'No bio set'}\n` +
                `• Registered: ${userInfo.registeredAt ? new Date(userInfo.registeredAt).toLocaleDateString() : 'No'}`
                :
                `*User Profile*\n\n` +
                `• Number: @${targetUser.split('@')[0]}\n` +
                `• Status: Not registered\n\n` +
                `Use ${config.prefix}register <name> <age> to create a profile!`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: pp },
                caption: info,
                mentions: [targetUser]
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
            const user = msg.key.participant || msg.key.remoteJid;
            const stats = store.getUserInfo(user);

            const pp = await safeProfilePicture(sock, user);

            const info = `*Your Profile*\n\n` +
                        `• Number: @${user.split('@')[0]}\n` +
                        `• Name: ${stats.name || 'Not registered'}\n` +
                        `• Age: ${stats.age || 'Not registered'}\n` +
                        `• Level: ${stats.level || 1}\n` +
                        `• XP: ${stats.xp || 0}\n` +
                        `• Gold: ${stats.gold || 0}\n` +
                        `• Rank: #${store.getUserRank(user)}\n` +
                        `• Bio: ${stats.bio || 'No bio set'}`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: pp },
                caption: info,
                mentions: [user]
            });

        } catch (error) {
            logger.error('Error in me command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching your profile. Please try again later.'
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

    daily: async (sock, msg) => {
        try {
            const user = msg.key.participant || msg.key.remoteJid;
            const lastDaily = store.getUserLastDaily(user);
            const now = Date.now();

            if (lastDaily && now - lastDaily < 24 * 60 * 60 * 1000) {
                const remaining = 24 * 60 * 60 * 1000 - (now - lastDaily);
                const hours = Math.floor(remaining / (60 * 60 * 1000));
                const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `⏰ Please wait ${hours}h ${minutes}m before claiming daily rewards again!`
                });
            }

            const reward = Math.floor(Math.random() * 1000) + 500;
            await store.addXP(user, reward);
            await store.setUserLastDaily(user, now);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎁 *Daily Reward*\n\n` +
                      `You received ${reward} XP!\n` +
                      `Come back tomorrow for more rewards!`
            });
        } catch (error) {
            logger.error('Error in daily command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error claiming daily reward. Please try again later.'
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

// Initialize user commands object
const userCommands = {};

// Add core commands
Object.assign(userCommands, coreUserCommands);

// Generate 94 additional user commands
for (let i = 1; i <= 94; i++) {
    userCommands[`user${i}`] = async (sock, msg, args) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `👤 Executed user command ${i}!\n` +
                      `Args: ${args.join(' ')}\n` +
                      `User: ${msg.pushName || 'Unknown'}`
            });

            logger.info(`User command ${i} executed:`, {
                command: `user${i}`,
                user: msg.key.participant || msg.key.remoteJid,
                args: args
            });
        } catch (error) {
            logger.error(`Error in user${i} command:`, error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ Failed to execute user command ${i}: ${error.message}`
            });
        }
    };
}

module.exports = userCommands;