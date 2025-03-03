const config = require('../config');
const dbStore = require('../database/store');
const logger = require('../utils/logger');
const { formatPhoneNumber, addWhatsAppSuffix, formatDisplayNumber } = require('../utils/phoneNumber');
const moment = require('moment-timezone');

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

// Helper function to format duration
function formatDuration(ms) {
    const duration = moment.duration(ms);
    const days = Math.floor(duration.asDays());
    const hours = duration.hours();
    const minutes = duration.minutes();
    return `${days}d ${hours}h ${minutes}m`;
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
                text: error.message === 'Link invalid'
                    ? '❌ Invalid or expired group link!'
                    : '❌ Failed to join group: ' + error.message
            });
        }
    },
    level: async (sock, msg) => {
        try {
            const user = msg.key.participant || msg.key.remoteJid;
            const xpData = await dbStore.getUserXP(user);

            if (!xpData.success) {
                throw new Error(xpData.error || 'Failed to get XP data');
            }

            // Create progress bar
            const progressBarLength = 20;
            const filledBars = Math.floor((xpData.progress / 100) * progressBarLength);
            const progressBar = '█'.repeat(filledBars) + '░'.repeat(progressBarLength - filledBars);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*🎮 Level Progress*\n\n` +
                      `• Level: ${xpData.level}\n` +
                      `• XP: ${xpData.xp}/${xpData.nextLevelXP}\n` +
                      `• Progress: ${Math.floor(xpData.progress)}%\n` +
                      `\n${progressBar}\n\n` +
                      `Keep chatting to earn more XP!`,
                mentions: [user]
            });
        } catch (error) {
            logger.error('Error in level command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching level stats. Please try again later.'
            });
        }
    },

    leaderboard: async (sock, msg) => {
        try {
            const result = await dbStore.getLeaderboard(10);
            if (!result.success) {
                throw new Error(result.error || 'Failed to get leaderboard');
            }

            let lbText = '🏆 *Global Leaderboard*\n\n';
            result.users.forEach((user, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '•';
                lbText += `${medal} ${index + 1}. @${user.jid.split('@')[0]}\n`;
                lbText += `   Level ${user.level} • ${user.xp} XP\n\n`;
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: lbText,
                mentions: result.users.map(u => u.jid)
            });
        } catch (error) {
            logger.error('Error in leaderboard command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching leaderboard. Please try again later.'
            });
        }
    },

    rewards: async (sock, msg) => {
        try {
            const user = msg.key.participant || msg.key.remoteJid;
            const xpData = await dbStore.getUserXP(user);

            const rewardsText = `🎁 *Level Rewards*\n\n` +
                              `Your current level: ${xpData.level}\n\n` +
                              `Available Perks:\n` +
                              `• Level 5: Custom bio\n` +
                              `• Level 10: Special title\n` +
                              `• Level 15: Custom commands\n` +
                              `• Level 20: Premium features\n` +
                              `• Level 25: VIP status\n\n` +
                              `Keep leveling up to unlock more rewards!`;

            await sock.sendMessage(msg.key.remoteJid, {
                text: rewardsText,
                mentions: [user]
            });
        } catch (error) {
            logger.error('Error in rewards command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching rewards. Please try again later.'
            });
        }
    },
    afk: async (sock, msg, args) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;
            const reason = args.join(' ') || null;

            // Check if user is already AFK
            const currentAFK = await dbStore.isUserAFK(userId);
            if (currentAFK && !reason) {
                // Remove AFK status
                const afkDuration = await dbStore.removeUserAFK(userId);
                if (afkDuration) {
                    await sock.sendMessage(msg.key.remoteJid, {
                        text: `Welcome back @${userId.split('@')[0]}!\nYou were AFK for ${formatDuration(afkDuration)}`,
                        mentions: [userId]
                    });
                }
                return;
            }

            // Set user as AFK
            await dbStore.setUserAFK(userId, reason);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `@${userId.split('@')[0]} is now AFK${reason ? `\nReason: ${reason}` : ''}`,
                mentions: [userId]
            });

            logger.info('User set AFK:', { userId, reason });
        } catch (error) {
            logger.error('Error in afk command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to update AFK status'
            });
        }
    },

    stats: async (sock, msg) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;
            const result = await dbStore.getUserStats(userId);

            if (!result.success) {
                throw new Error(result.error || 'Failed to get user stats');
            }

            const stats = result.stats;
            const lastActive = moment(stats.lastActive).fromNow();

            const statsText = `📊 *User Statistics*\n\n` +
                          `• Messages Sent: ${stats.messageCount}\n` +
                          `• Commands Used: ${stats.commandsUsed}\n` +
                          `• Media Shared: ${stats.mediaCount}\n` +
                          `• Level: ${stats.level}\n` +
                          `• XP: ${stats.xp}\n` +
                          `• Last Active: ${lastActive}`;

            await sock.sendMessage(msg.key.remoteJid, {
                text: statsText,
                mentions: [userId]
            });
        } catch (error) {
            logger.error('Error in stats command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to fetch user statistics'
            });
        }
    },

    about: async (sock, msg) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;
            const userData = await dbStore.getUserData(userId);
            const stats = await dbStore.getUserStats(userId);

            if (!userData) {
                throw new Error('User data not found');
            }

            let pp;
            try {
                pp = await safeProfilePicture(sock, userId);
            } catch (err) {
                logger.error('Error fetching profile picture:', err);
                pp = 'https://i.imgur.com/wuxBN7M.png';
            }

            const registrationDate = userData.registrationTime
                ? moment(userData.registrationTime).format('MMMM Do YYYY')
                : 'Not registered';

            const aboutText = `*👤 About @${userId.split('@')[0]}*\n\n` +
                          `• Name: ${userData.name || 'Not set'}\n` +
                          `• Bio: ${userData.bio || 'No bio set'}\n` +
                          `• Registered: ${registrationDate}\n` +
                          `• Level: ${stats.stats.level}\n` +
                          `• XP: ${stats.stats.xp}\n` +
                          `• Messages: ${stats.stats.messageCount}\n` +
                          `• Commands Used: ${stats.stats.commandsUsed}\n` +
                          `• Last Active: ${moment(stats.stats.lastActive).fromNow()}`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: pp },
                caption: aboutText,
                mentions: [userId]
            });
        } catch (error) {
            logger.error('Error in about command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to fetch user information'
            });
        }
    },
    nickname: async (sock, msg, args) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a nickname!\nUsage: .nickname <name>'
                });
            }

            const nickname = args.join(' ');
            await dbStore.setUserPreference(userId, 'nickname', nickname);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ Nickname updated to: ${nickname}`,
                mentions: [userId]
            });
        } catch (error) {
            logger.error('Error in nickname command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to update nickname'
            });
        }
    },

    language: async (sock, msg, args) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;

            if (!args.length) {
                const prefs = await dbStore.getUserPreferences(userId);
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Current language: ${prefs.language}\n\nAvailable languages:\n• en (English)\n• es (Spanish)\n• fr (French)\n• id (Indonesian)\n• ar (Arabic)`
                });
            }

            const language = args[0].toLowerCase();
            const supportedLangs = ['en', 'es', 'fr', 'id', 'ar'];

            if (!supportedLangs.includes(language)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Unsupported language code!'
                });
            }

            await dbStore.setUserPreference(userId, 'language', language);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ Language set to: ${language}`,
                mentions: [userId]
            });
        } catch (error) {
            logger.error('Error in language command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to update language'
            });
        }
    },

    timezone: async (sock, msg, args) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;

            if (!args.length) {
                const prefs = await dbStore.getUserPreferences(userId);
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Current timezone: ${prefs.timezone}\n\nUse .timezone <timezone>\nExample: .timezone Asia/Tokyo`
                });
            }

            const timezone = args[0];
            if (!moment.tz.zone(timezone)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Invalid timezone! Please use a valid timezone name.'
                });
            }

            await dbStore.setUserPreference(userId, 'timezone', timezone);
            const time = moment().tz(timezone).format('LLLL');
            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ Timezone set to: ${timezone}\nCurrent time: ${time}`,
                mentions: [userId]
            });
        } catch (error) {
            logger.error('Error in timezone command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to update timezone'
            });
        }
    },

    privacy: async (sock, msg, args) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;

            if (args.length < 2) {
                const prefs = await dbStore.getUserPreferences(userId);
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `*🔒 Privacy Settings*\n\n` +
                         `• Profile: ${prefs.privacy.profile}\n` +
                         `• Status: ${prefs.privacy.status}\n` +
                         `• Last Seen: ${prefs.privacy.lastSeen}\n\n` +
                         `To change: .privacy <setting> <value>\n` +
                         `Values: public, private, contacts`
                });
            }

            const [setting, value] = args;
            const validSettings = ['profile', 'status', 'lastSeen'];
            const validValues = ['public', 'private', 'contacts'];

            if (!validSettings.includes(setting)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Invalid privacy setting!'
                });
            }

            if (!validValues.includes(value)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Invalid value! Use: public, private, or contacts'
                });
            }

            const prefs = await dbStore.getUserPreferences(userId);
            prefs.privacy[setting] = value;
            await dbStore.setUserPreference(userId, 'privacy', prefs.privacy);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ Privacy setting updated!\n${setting}: ${value}`,
                mentions: [userId]
            });
        } catch (error) {
            logger.error('Error in privacy command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to update privacy settings'
            });
        }
    },

    blocklist: async (sock, msg) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;
            const blockedUsers = await dbStore.getBlockedUsers(userId);

            if (!blockedUsers.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: 'You have no blocked users.'
                });
            }

            let blockText = '*📋 Blocked Users*\n\n';
            for (const blockedId of blockedUsers) {
                blockText += `• @${blockedId.split('@')[0]}\n`;
            }
            blockText += '\nUse .unblock @user to unblock';

            await sock.sendMessage(msg.key.remoteJid, {
                text: blockText,
                mentions: blockedUsers
            });
        } catch (error) {
            logger.error('Error in blocklist command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to get blocked users'
            });
        }
    },

    block: async (sock, msg, args) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please mention a user to block!'
                });
            }

            const targetUser = formatPhoneNumber(args[0]);
            const result = await dbStore.toggleBlockUser(userId, targetUser);

            if (result === null) {
                throw new Error('Failed to block user');
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: result ?
                    `✅ Blocked @${targetUser.split('@')[0]}` :
                    `✅ Unblocked @${targetUser.split('@')[0]}`,
                mentions: [targetUser]
            });
        } catch (error) {
            logger.error('Error in block command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to block/unblock user'
            });
        }
    },
    achievements: async (sock, msg) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;
            const achievements = await dbStore.getUserAchievements(userId);

            let achieveText = '*🏆 Achievements*\n\n';
            if (achievements.completed.length === 0) {
                achieveText += 'No achievements unlocked yet!\n\n';
            } else {
                achieveText += '*Completed:*\n';
                achievements.completed.forEach(id => {
                    achieveText += `✅ ${id}\n`;
                });
                achieveText += `\nTotal Points: ${achievements.points}\n`;
            }

            achieveText += '\n*In Progress:*\n';
            Object.entries(achievements.progress).forEach(([id, progress]) => {
                if (!achievements.completed.includes(id)) {
                    achieveText += `• ${id}: ${progress}%\n`;
                }
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: achieveText,
                mentions: [userId]
            });
        } catch (error) {
            logger.error('Error in achievements command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to fetch achievements'
            });
        }
    },

    quests: async (sock, msg) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;
            const questData = await dbStore.getAvailableQuests(userId);

            let questText = '*📜 Available Quests*\n\n';

            // Daily Quests
            questText += '*Daily Quests:*\n';
            questData.available.daily.forEach(quest => {
                const progress = questData.progress.progress[quest.id] || 0;
                const status = questData.progress.completed.includes(quest.id) ? '✅' : '⭐';
                questText += `${status} ${quest.name}\n`;
                questText += `Progress: ${progress}/${quest.requirement}\n`;
                questText += `Reward: ${quest.reward} coins\n\n`;
            });

            // Weekly Quests
            questText += '*Weekly Quests:*\n';
            questData.available.weekly.forEach(quest => {
                const progress = questData.progress.progress[quest.id] || 0;
                const status = questData.progress.completed.includes(quest.id) ? '✅' : '⭐';
                questText += `${status} ${quest.name}\n`;
                questText += `Progress: ${progress}/${quest.requirement}\n`;
                questText += `Reward: ${quest.reward} coins\n\n`;
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: questText,
                mentions: [userId]
            });
        } catch (error) {
            logger.error('Error in quests command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to fetch quests'
            });
        }
    },
    inventory: async (sock, msg) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;
            const inventory = await dbStore.getUserInventory(userId);

            if (!inventory) {
                throw new Error('Failed to fetch inventory');
            }

            let invText = '*🎒 Your Inventory*\n\n';

            if (Object.keys(inventory.items).length === 0) {
                invText += 'Your inventory is empty!\nUse .shop to view available items.';
            } else {
                Object.entries(inventory.items).forEach(([itemId, quantity]) => {
                    invText += `• ${itemId}: ${quantity}x\n`;
                });

                if (Object.keys(inventory.equipped).length > 0) {
                    invText += '\n*Equipped Items:*\n';
                    Object.entries(inventory.equipped).forEach(([slot, itemId]) => {
                        invText += `• ${slot}: ${itemId}\n`;
                    });
                }
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: invText,
                mentions: [userId]
            });
        } catch (error) {
            logger.error('Error in inventory command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to fetch inventory'
            });
        }
    },

    shop: async (sock, msg) => {
        try {
            const shop = await dbStore.getShopItems();
            if (!shop) {
                throw new Error('Failed to fetch shop items');
            }

            let shopText = '*🛍️ Available Items*\n\n';
            shop.items.forEach(item => {
                shopText += `*${item.name}*\n`;
                shopText += `• ID: ${item.id}\n`;
                shopText += `• Description: ${item.description}\n`;
                shopText += `• Price: ${item.price} coins\n`;
                shopText += `• Type: ${item.type}\n\n`;
            });
            shopText += 'To buy an item: .buy <item_id>';

            await sock.sendMessage(msg.key.remoteJid, { text: shopText });
        } catch (error) {
            logger.error('Error in shop command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to fetch shop items'
            });
        }
    },

    daily: async (sock, msg) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;
            const result = await dbStore.claimDailyReward(userId);

            if (!result.success) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: result.error === 'already_claimed' ?
                        '❌ You have already claimed your daily reward today.' :
                        '❌ Failed to claim daily reward.'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*🎁 Daily Reward Claimed!*\n\n` +
                      `• Coins: +${result.coins}\n` +
                      `• XP: +${result.xp}\n\n` +
                      `Current streak: ${result.streak} days\n` +
                      `Come back tomorrow for more rewards!`,
                mentions: [userId]
            });
        } catch (error) {
            logger.error('Error in daily command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to process daily reward'
            });
        }
    },

    claim: async (sock, msg, args) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please specify a quest ID to claim.\nUse .quests to view available quests.'
                });
            }

            const questId = args[0];
            const result = await dbStore.claimQuestReward(userId, questId);

            if (!result.success) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: result.error === 'not_completed' ?
                        '❌ You haven\'t completed this quest yet!' :
                        result.error === 'already_claimed' ?
                        '❌ You have already claimed this quest\'s reward!' :
                        '❌ Failed to claim quest reward.'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*🎉 Quest Reward Claimed!*\n\n` +
                      `• Quest: ${result.questName}\n` +
                      `• Reward: ${result.reward} coins\n\n` +
                      `Keep completing quests to earn more rewards!`,
                mentions: [userId]
            });
        } catch (error) {
            logger.error('Error in claim command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to claim quest reward'
            });
        }
    },

    transfer: async (sock, msg, args) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;

            if (args.length < 2) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Usage: .transfer @user <amount>'
                });
            }

            const targetUser = formatPhoneNumber(args[0]);
            const amount = parseInt(args[1]);

            if (isNaN(amount) || amount <= 0) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a valid amount to transfer.'
                });
            }

            const result = await dbStore.transferCoins(userId, targetUser, amount);

            if (!result.success) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: result.error === 'insufficient_funds' ?
                        '❌ You don\'t have enough coins!' :
                        '❌ Failed to transfer coins.'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*💰 Coins Transferred!*\n\n` +
                      `• Amount: ${amount} coins\n` +
                      `• To: @${targetUser.split('@')[0]}\n` +
                      `• Your balance: ${result.newBalance} coins`,
                mentions: [userId, targetUser]
            });
        } catch (error) {
            logger.error('Error in transfer command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to transfer coins'
            });
        }
    },

    feedback: async (sock, msg, args) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide your feedback message!'
                });
            }

            const feedback = args.join(' ');
            const result = await dbStore.saveFeedback(userId, feedback);

            if (!result.success) {
                throw new Error('Failed to save feedback');
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '✅ Thank you for your feedback! We appreciate your input.',
                mentions: [userId]
            });

            // Notify owner if configured
            if (config.ownerNumber) {
                await sock.sendMessage(config.ownerNumber, {
                    text: `*📝 New Feedback*\n\n` +
                          `From: @${userId.split('@')[0]}\n` +
                          `Message: ${feedback}`,
                    mentions: [userId]
                });
            }
        } catch (error) {
            logger.error('Error in feedback command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to send feedback'
            });
        }
    }
};

module.exports = userCommands;