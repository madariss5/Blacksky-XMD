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

            const userData = store.getUserData(msg.key.participant);
            if (!userData) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `You need to register first! Use ${config.prefix}register <name> <age> to create your profile.`
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎮 *RPG Status*\n\n` +
                      `• Level: ${userData.level || 1}\n` +
                      `• HP: ${userData.hp || 100}/100\n` +
                      `• MP: ${userData.mp || 100}/100\n` +
                      `• Gold: ${userData.gold || 0}\n` +
                      `• XP: ${userData.xp || 0}\n\n` +
                      `Use ${config.prefix}quest to start an adventure!`
            });

            logger.info('RPG status displayed for user:', msg.key.participant);
        } catch (error) {
            logger.error('Error in rpg command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: 'Error accessing RPG status. Please try again.'
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
            const challengerData = store.getUserData(challenger);
            const opponentData = store.getUserData(opponent);

            if (!challengerData || !opponentData) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: 'Both players need to be registered to battle!'
                });
            }

            // Battle logic
            const challengerRoll = Math.floor(Math.random() * 100) + (challengerData.level || 1);
            const opponentRoll = Math.floor(Math.random() * 100) + (opponentData.level || 1);

            const winner = challengerRoll > opponentRoll ? challenger : opponent;
            const loser = winner === challenger ? opponent : challenger;
            const reward = 100;

            // Update winner's gold
            const currentGold = (winner === challenger ? challengerData : opponentData).gold || 0;
            await store.updateUserGold(winner, currentGold + reward);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `⚔️ *Battle Results*\n\n` +
                      `${challengerData.name || 'Challenger'} vs ${opponentData.name || 'Opponent'}\n\n` +
                      `🏆 Winner: @${winner.split('@')[0]}\n` +
                      `💰 Reward: ${reward} gold\n\n` +
                      `Battle Stats:\n` +
                      `🎲 ${challengerData.name}: ${challengerRoll}\n` +
                      `🎲 ${opponentData.name}: ${opponentRoll}`,
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

            const userData = store.getUserData(msg.key.participant);
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
                'Defeat the Dragon',
                'Find the Lost Treasure',
                'Save the Village',
                'Clear the Dungeon',
                'Hunt Monsters'
            ];

            const randomQuest = quests[Math.floor(Math.random() * quests.length)];
            const reward = Math.floor(Math.random() * 50) + 50;

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🗺️ *New Quest*\n\n` +
                      `Quest: ${randomQuest}\n` +
                      `Reward: ${reward} gold\n\n` +
                      `Type ${config.prefix}complete to finish the quest!`
            });

            // Store active quest
            if (!global.activeQuests) global.activeQuests = new Map();
            global.activeQuests.set(msg.key.participant, {
                quest: randomQuest,
                reward: reward,
                timestamp: Date.now()
            });

            logger.info('New quest started:', { user: msg.key.participant, quest: randomQuest, reward });
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

            // Update user's gold
            const userData = store.getUserData(msg.key.participant);
            const currentGold = userData?.gold || 0;
            const success = await store.updateUserGold(msg.key.participant, currentGold + quest.reward);

            if (!success) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: 'Failed to update rewards. Please try again.'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎉 *Quest Completed*\n\n` +
                      `Quest: ${quest.quest}\n` +
                      `Reward: ${quest.reward} gold\n\n` +
                      `Current Gold: ${currentGold + quest.reward}`
            });

            // Clear completed quest
            global.activeQuests.delete(msg.key.participant);
            logger.info('Quest completed:', { user: msg.key.participant, quest: quest.quest, reward: quest.reward });

        } catch (error) {
            logger.error('Error in complete command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: 'Error completing quest. Please try again.'
            });
        }
    }
};

module.exports = gameCommands;