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

const userCommands = {
    profile: async (sock, msg, args) => {
        try {
            const user = args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : msg.key.participant;
            const userInfo = store.getUserInfo(user);

            if (!userInfo) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: 'User not found or not registered. Use !register to create a profile.'
                });
            }

            const pp = await safeProfilePicture(sock, user);

            const info = `*User Profile*\n\n` +
                        `• Number: @${user.split('@')[0]}\n` +
                        `• Name: ${userInfo.name || 'Not registered'}\n` +
                        `• Age: ${userInfo.age || 'Not registered'}\n` +
                        `• Level: ${userInfo.level || 1}\n` +
                        `• XP: ${userInfo.xp || 0}\n` +
                        `• Bio: ${userInfo.bio || 'No bio set'}\n` +
                        `• Registered: ${userInfo.registeredAt ? new Date(userInfo.registeredAt).toLocaleDateString() : 'No'}`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: pp },
                caption: info,
                mentions: [user]
            });

        } catch (error) {
            logger.error('Error in profile command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: 'Error fetching profile. Please try again later.'
            });
        }
    },

    me: async (sock, msg) => {
        try {
            const user = msg.key.participant;
            const stats = store.getUserInfo(user);

            logger.info('Fetching self profile for user:', user);

            let pp;
            try {
                pp = await sock.profilePictureUrl(user, 'image');
                logger.info('Profile picture fetched successfully');
            } catch (err) {
                logger.warn('Failed to fetch profile picture:', err);
                pp = 'https://i.imgur.com/wuxBN7M.png'; // Default profile picture URL
            }

            const info = `*Your Profile*\n\n` +
                        `• Number: @${user.split('@')[0]}\n` +
                        `• Name: ${stats.name || 'Not registered'}\n` +
                        `• Age: ${stats.age || 'Not registered'}\n` +
                        `• Level: ${stats.level}\n` +
                        `• XP: ${stats.xp}\n` +
                        `• Session ID: ${sock.authState.creds.me?.id || 'Not available'}`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: pp },
                caption: info,
                mentions: [user]
            });

        } catch (error) {
            logger.error('Error in me command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: 'Error fetching your profile. Please try again later.'
            });
        }
    },

    register: async (sock, msg, args) => {
        if (store.isUserRegistered(msg.key.participant)) {
            return await sock.sendMessage(msg.key.remoteJid, { 
                text: 'You are already registered!' 
            });
        }

        if (args.length < 2) {
            return await sock.sendMessage(msg.key.remoteJid, { 
                text: `Please provide your name and age!\nFormat: ${config.prefix}register <name> <age>`
            });
        }

        const age = parseInt(args[args.length - 1]);
        const name = args.slice(0, -1).join(' ');

        if (isNaN(age) || age < 13 || age > 100) {
            return await sock.sendMessage(msg.key.remoteJid, { 
                text: 'Please provide a valid age between 13 and 100!' 
            });
        }

        await store.registerUser(msg.key.participant, name, age);
        await sock.sendMessage(msg.key.remoteJid, {
            text: `Registration successful!\n\n` +
                  `Name: ${name}\n` +
                  `Age: ${age}\n\n` +
                  `Use ${config.prefix}profile to view your profile!`
        });
    },
    daily: async (sock, msg) => {
        const user = msg.key.participant;
        const lastDaily = store.getLastDaily(user);
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
        store.addUserXP(user, reward);
        store.setLastDaily(user, now);

        await sock.sendMessage(msg.key.remoteJid, {
            text: `🎁 *Daily Reward*\n\nYou received ${reward} XP!\nCome back tomorrow for more rewards!`
        });
    },

    rank: async (sock, msg) => {
        const user = msg.key.participant;
        const stats = store.getUserStats(user);
        const rank = store.getUserRank(user);
        const nextLevel = Math.pow((stats.level + 1) / 0.1, 2);

        await sock.sendMessage(msg.key.remoteJid, {
            text: `🏆 *Your Rank*\n\n` +
                  `• Level: ${stats.level}\n` +
                  `• XP: ${stats.xp}/${nextLevel}\n` +
                  `• Rank: #${rank}\n` +
                  `• Progress: ${Math.floor((stats.xp / nextLevel) * 100)}%`
        });
    },

    inventory: async (sock, msg) => {
        const user = msg.key.participant;
        const inventory = store.getUserInventory(user);

        if (!inventory || Object.keys(inventory).length === 0) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: '🎒 Your inventory is empty!'
            });
        }

        let items = Object.entries(inventory)
            .map(([item, count]) => `• ${item}: ${count}`)
            .join('\n');

        await sock.sendMessage(msg.key.remoteJid, {
            text: `🎒 *Your Inventory*\n\n${items}`
        });
    },

    achievements: async (sock, msg) => {
        const user = msg.key.participant;
        const achievements = store.getUserAchievements(user);

        if (!achievements || achievements.length === 0) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: '🏅 No achievements yet! Keep playing to earn them!'
            });
        }

        let achievementList = achievements
            .map(a => `• ${a.name}: ${a.description}`)
            .join('\n');

        await sock.sendMessage(msg.key.remoteJid, {
            text: `🏅 *Your Achievements*\n\n${achievementList}`
        });
    },

    bio: async (sock, msg, args) => {
        const user = msg.key.participant;

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

        try {
            store.setUserBio(user, newBio);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '✅ Bio updated successfully!'
            });
        } catch (error) {
            logger.error('Error updating bio:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to update bio. Please try again later.'
            });
        }
    },

    reminder: async (sock, msg, args) => {
        const user = msg.key.participant;

        if (!args.length) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: `⏰ Usage: ${config.prefix}reminder <time in minutes> <message>`
            });
        }

        const time = parseInt(args[0]);
        if (isNaN(time) || time < 1 || time > 1440) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Please provide a valid time between 1 and 1440 minutes!'
            });
        }

        const message = args.slice(1).join(' ');
        if (!message) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Please provide a reminder message!'
            });
        }

        // Store reminder in memory with cleanup
        const reminderTimeout = setTimeout(async () => {
            try {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `⏰ *Reminder*\n\n@${user.split('@')[0]}, you asked me to remind you:\n${message}`,
                    mentions: [user]
                });
            } catch (error) {
                logger.error('Error sending reminder:', error);
            }
        }, time * 60 * 1000);

        // Store timeout reference for cleanup
        if (!global.reminderTimeouts) global.reminderTimeouts = new Map();
        global.reminderTimeouts.set(`${user}-${Date.now()}`, reminderTimeout);

        await sock.sendMessage(msg.key.remoteJid, {
            text: `✅ I'll remind you about "${message}" in ${time} minutes!`
        });
    },
    level: async (sock, msg) => {
        const user = msg.key.participant;
        const stats = store.getUserStats(user);

        await sock.sendMessage(msg.key.remoteJid, {
            text: `*Level Stats*\n\n` +
                  `• Current Level: ${stats.level}\n` +
                  `• Total XP: ${stats.xp}\n` +
                  `• Next Level: ${stats.level + 1} (${Math.pow((stats.level + 1) / 0.1, 2) - stats.xp} XP needed)`,
            mentions: [user]
        });
    },

    status: async (sock, msg) => {
        const status = await sock.fetchStatus(msg.key.participant);
        await sock.sendMessage(msg.key.remoteJid, {
            text: `*Your Status*\n\n${status?.status || 'No status available'}`
        });
    },

    owner: async (sock, msg) => {
        try {
            const pp = await sock.profilePictureUrl(config.ownerNumber, 'image');
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: pp },
                caption: `*Bot Owner Information*\n\n` +
                        `• Name: ${config.ownerName}\n` +
                        `• Number: @${config.ownerNumber.split('@')[0]}\n` +
                        `• Bot Name: ${config.botName}\n` +
                        `• Session ID: ${sock.authState.creds.me?.id || 'Not available'}`,
                mentions: [config.ownerNumber]
            });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `*Bot Owner Information*\n\n` +
                      `• Name: ${config.ownerName}\n` +
                      `• Number: @${config.ownerNumber.split('@')[0]}\n` +
                      `• Bot Name: ${config.botName}\n` +
                      `• Session ID: ${sock.authState.creds.me?.id || 'Not available'}`,
                mentions: [config.ownerNumber]
            });
        }
    }
};

module.exports = userCommands;