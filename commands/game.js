const config = require('../config');
const store = require('../database/store');
const logger = require('pino')();

const gameCommands = {
    rpg: async (sock, msg) => {
        try {
            if (!msg.key.participant) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: 'Could not identify user. Please try again.'
                });
            }

            const userData = await store.getUserData(msg.key.participant);
            if (!userData) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `You need to register first! Use ${config.prefix}register <name> <age> to create your profile.`
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎮 *RPG Status*\n\n` +
                      `📊 *Player Info*\n` +
                      `• Name: ${userData.name || 'Anonymous'}\n` +
                      `• Level: ${userData.level || 1}\n` +
                      `• XP: ${userData.xp || 0}/${Math.pow((userData.level || 1) + 1, 2) * 100}\n\n` +
                      `💪 *Stats*\n` +
                      `• HP: ${userData.hp || 100}/100\n` +
                      `• MP: ${userData.mp || 100}/100\n` +
                      `• Gold: ${userData.gold || 0} 💰\n\n` +
                      `💎 *Inventory*\n` +
                      `${Object.entries(userData.inventory || {}).map(([item, count]) => `• ${item}: ${count}`).join('\n') || '• Empty'}\n\n` +
                      `Use ${config.prefix}quest to start an adventure!`
            });

            logger.info('RPG status displayed for user:', msg.key.participant);
        } catch (error) {
            logger.error('Error in rpg command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error accessing RPG status. Please try again.'
            });
        }
    },

    battle: async (sock, msg, args) => {
        try {
            if (!msg.key.participant) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: 'Could not identify user. Please try again.'
                });
            }

            if (!args[0]) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please mention a user to battle!\nUsage: ${config.prefix}battle @user`
                });
            }

            const challenger = msg.key.participant;
            const opponent = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';

            if (challenger === opponent) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ You cannot battle yourself!'
                });
            }

            // Get challenger and opponent data
            const challengerData = await store.getUserData(challenger);
            const opponentData = await store.getUserData(opponent);

            if (!challengerData || !opponentData) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: 'Both players need to be registered to battle!'
                });
            }

            // Battle mechanics with level consideration
            const challengerPower = Math.floor(Math.random() * 100) + (challengerData.level || 1) * 10;
            const opponentPower = Math.floor(Math.random() * 100) + (opponentData.level || 1) * 10;

            const winner = challengerPower > opponentPower ? challenger : opponent;
            const loser = winner === challenger ? opponent : challenger;
            const reward = Math.floor(Math.random() * 100) + 100; // Random reward between 100-200 gold

            // Update winner's gold and XP
            const winnerData = winner === challenger ? challengerData : opponentData;
            await store.updateUserGold(winner, (winnerData.gold || 0) + reward);
            await store.addXP(winner, 50); // Add XP for winning

            // Add some XP to loser for participating
            await store.addXP(loser, 20);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `⚔️ *Battle Results*\n\n` +
                      `${challengerData.name || 'Challenger'} vs ${opponentData.name || 'Opponent'}\n\n` +
                      `🏆 Winner: @${winner.split('@')[0]}\n` +
                      `💰 Reward: ${reward} gold\n` +
                      `✨ XP Gained: Winner +50, Loser +20\n\n` +
                      `Battle Stats:\n` +
                      `🎲 ${challengerData.name}: ${challengerPower}\n` +
                      `🎲 ${opponentData.name}: ${opponentPower}`,
                mentions: [winner, loser]
            });

            logger.info('Battle completed:', { winner, reward });
        } catch (error) {
            logger.error('Error in battle command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: 'Error during battle. Please try again.'
            });
        }
    },

    quest: async (sock, msg) => {
        try {
            if (!msg.key.participant) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: 'Could not identify user. Please try again.'
                });
            }

            const userData = await store.getUserData(msg.key.participant);
            if (!userData) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `You need to register first! Use ${config.prefix}register <name> <age> to create your profile.`
                });
            }

            // Check if user already has an active quest
            if (global.activeQuests?.has(msg.key.participant)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `You already have an active quest! Use ${config.prefix}complete to finish it first.`
                });
            }

            const quests = [
                { name: 'Defeat the Dragon', reward: { gold: 150, xp: 100 } },
                { name: 'Find the Lost Treasure', reward: { gold: 200, xp: 80 } },
                { name: 'Save the Village', reward: { gold: 120, xp: 90 } },
                { name: 'Clear the Dungeon', reward: { gold: 180, xp: 110 } },
                { name: 'Hunt Monsters', reward: { gold: 100, xp: 70 } }
            ];

            const randomQuest = quests[Math.floor(Math.random() * quests.length)];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🗺️ *New Quest*\n\n` +
                      `Quest: ${randomQuest.name}\n` +
                      `Rewards:\n` +
                      `• Gold: ${randomQuest.reward.gold} 💰\n` +
                      `• XP: ${randomQuest.reward.xp} ✨\n\n` +
                      `Type ${config.prefix}complete to finish the quest!`
            });

            // Store active quest
            if (!global.activeQuests) global.activeQuests = new Map();
            global.activeQuests.set(msg.key.participant, {
                quest: randomQuest.name,
                reward: randomQuest.reward,
                timestamp: Date.now()
            });

            logger.info('New quest started:', { user: msg.key.participant, quest: randomQuest });
        } catch (error) {
            logger.error('Error in quest command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: 'Error starting quest. Please try again.'
            });
        }
    },

    complete: async (sock, msg) => {
        try {
            if (!msg.key.participant) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: 'Could not identify user. Please try again.'
                });
            }

            if (!global.activeQuests?.has(msg.key.participant)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `You don't have an active quest! Use ${config.prefix}quest to start one.`
                });
            }

            const quest = global.activeQuests.get(msg.key.participant);
            const timeElapsed = Date.now() - quest.timestamp;

            // Minimum 1 minute between starting and completing quest
            if (timeElapsed < 60000) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ You need to wait at least 1 minute to complete the quest!'
                });
            }

            // Update user's gold and XP
            const userData = await store.getUserData(msg.key.participant);
            const currentGold = userData?.gold || 0;

            await store.updateUserGold(msg.key.participant, currentGold + quest.reward.gold);
            const xpResult = await store.addXP(msg.key.participant, quest.reward.xp);

            let completionMessage = `🎉 *Quest Completed*\n\n` +
                                  `Quest: ${quest.quest}\n` +
                                  `Rewards:\n` +
                                  `• Gold: +${quest.reward.gold} 💰\n` +
                                  `• XP: +${quest.reward.xp} ✨\n\n` +
                                  `Current Gold: ${currentGold + quest.reward.gold}`;

            if (xpResult.levelUp) {
                completionMessage += `\n\n🎊 *LEVEL UP!*\n` +
                                   `You've reached level ${xpResult.newLevel}!`;
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: completionMessage
            });

            // Clear completed quest
            global.activeQuests.delete(msg.key.participant);
            logger.info('Quest completed:', { 
                user: msg.key.participant, 
                quest: quest.quest, 
                rewards: quest.reward 
            });

        } catch (error) {
            logger.error('Error in complete command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: 'Error completing quest. Please try again.'
            });
        }
    },
    level: async (sock, msg) => {
        try {
            if (!msg.key.participant) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: 'Could not identify user. Please try again.'
                });
            }

            const userData = await store.getUserData(msg.key.participant);
            if (!userData) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `You need to register first! Use ${config.prefix}register <name> <age> to create your profile.`
                });
            }

            // Calculate XP needed for next level
            const nextLevelXP = Math.pow((userData.level || 1) + 1, 2) * 100;
            const progress = ((userData.xp || 0) / nextLevelXP) * 100;

            // Create progress bar
            const progressBar = '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));

            await sock.sendMessage(msg.key.remoteJid, {
                text: `📊 *Level Status*\n\n` +
                      `👤 *${userData.name || 'Player'}*\n` +
                      `📈 Level: ${userData.level || 1}\n` +
                      `✨ XP: ${userData.xp || 0}/${nextLevelXP}\n` +
                      `⭐ Progress: ${Math.floor(progress)}%\n` +
                      `[${progressBar}]\n\n` +
                      `💡 Earn XP by:\n` +
                      `• Completing quests\n` +
                      `• Winning battles\n` +
                      `• Daily activities`
            });

            logger.info('Level status displayed for user:', msg.key.participant);
        } catch (error) {
            logger.error('Error in level command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error accessing level status. Please try again.'
            });
        }
    },

    leveling: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎮 *Leveling System Guide*\n\n` +
                      `📊 *How Leveling Works*\n` +
                      `• Each level requires: Level² × 100 XP\n` +
                      `• Example: Level 2 needs 400 XP\n\n` +
                      `🎯 *XP Sources*\n` +
                      `• Quests: 70-110 XP\n` +
                      `• Battles: 20-50 XP\n` +
                      `• Daily Tasks: 100 XP\n\n` +
                      `💫 *Level Benefits*\n` +
                      `• Higher battle power\n` +
                      `• Better quest rewards\n` +
                      `• Special titles\n\n` +
                      `Use ${config.prefix}level to check your progress!`
            });

            logger.info('Leveling guide displayed');
        } catch (error) {
            logger.error('Error displaying leveling guide:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing leveling guide. Please try again.'
            });
        }
    },

    levelup: async (sock, msg) => {
        try {
            if (!msg.key.participant) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: 'Could not identify user. Please try again.'
                });
            }

            const userData = await store.getUserData(msg.key.participant);
            if (!userData) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `You need to register first! Use ${config.prefix}register <name> <age> to create your profile.`
                });
            }

            // Get the top 10 players by level
            const users = store.data.users || {};
            const topPlayers = Object.entries(users)
                .map(([id, data]) => ({
                    name: data.name || id.split('@')[0],
                    level: data.level || 1,
                    xp: data.xp || 0
                }))
                .sort((a, b) => b.level - a.level || b.xp - a.xp)
                .slice(0, 10);

            let leaderboard = `🏆 *Top 10 Players*\n\n`;
            topPlayers.forEach((player, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤';
                leaderboard += `${medal} ${index + 1}. ${player.name}\n` +
                             `   Level ${player.level} • ${player.xp} XP\n`;
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: leaderboard
            });

            logger.info('Levelup leaderboard displayed');
        } catch (error) {
            logger.error('Error displaying levelup leaderboard:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing leaderboard. Please try again.'
            });
        }
    }
};

module.exports = gameCommands;