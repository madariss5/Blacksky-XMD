const config = require('../config');
const logger = require('../utils/logger');
const { dbStore } = require('../database/store');

// Define cooldown periods
const COOLDOWNS = {
    work: 5 * 60 * 1000,      // 5 minutes
    mine: 10 * 60 * 1000,     // 10 minutes
    fish: 7 * 60 * 1000,      // 7 minutes
    hunt: 15 * 60 * 1000,     // 15 minutes
    rob: 30 * 60 * 1000       // 30 minutes
};

const economyCommands = {
    balance: async (sock, msg) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;
            const userData = await dbStore.getUserData(userId);

            if (!userData) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ You need to register first!\nUse ${config.prefix}register <name> <age>`
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `💰 *Your Balance*\n\nCurrent balance: ${userData.balance || 0} coins`
            });
        } catch (error) {
            logger.error('Error in balance command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error checking balance'
            });
        }
    },

    daily: async (sock, msg) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;
            logger.info('Processing daily claim for user:', userId);

            const userData = await dbStore.getUserData(userId);
            if (!userData) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ You need to register first!\nUse ${config.prefix}register <name> <age>`
                });
            }

            // Check if user can claim
            const canClaim = await dbStore.canClaimDaily(userId);
            if (!canClaim) {
                logger.debug('Daily claim not available for user:', userId);
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏰ You can claim your daily reward once every 24 hours!'
                });
            }

            // Claim daily reward
            const result = await dbStore.claimDaily(userId);
            logger.info('Daily claim successful:', result);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `✨ *Daily Reward*\n\nYou received ${result.reward} coins!\nNew balance: ${result.newBalance} coins`
            });
        } catch (error) {
            logger.error('Error in daily command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error claiming daily reward: ' + error.message
            });
        }
    },

    weekly: async (sock, msg) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;
            const userData = await dbStore.getUserData(userId);

            if (!userData) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ You need to register first!\nUse ${config.prefix}register <name> <age>`
                });
            }

            // Check if user can claim weekly reward
            const canClaim = await dbStore.canClaimWeekly(userId);
            if (!canClaim) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏰ You can claim your weekly reward once every 7 days!'
                });
            }

            // Generate reward (1000-3000 coins)
            const reward = Math.floor(Math.random() * 2000) + 1000;
            const result = await dbStore.updateWeeklyReward(userId, reward);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `✨ *Weekly Reward*\n\nYou received ${reward} coins!\nNew balance: ${result.newBalance} coins`
            });
        } catch (error) {
            logger.error('Error in weekly command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ ' + error.message
            });
        }
    },

    monthly: async (sock, msg) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;
            const userData = await dbStore.getUserData(userId);

            if (!userData) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ You need to register first!\nUse ${config.prefix}register <name> <age>`
                });
            }

            // Check if user can claim monthly reward
            const canClaim = await dbStore.canClaimMonthly(userId);
            if (!canClaim) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏰ You can claim your monthly reward once every 30 days!'
                });
            }

            // Generate reward (5000-10000 coins)
            const reward = Math.floor(Math.random() * 5000) + 5000;
            const result = await dbStore.updateMonthlyReward(userId, reward);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎉 *Monthly Reward*\n\nYou received ${reward} coins!\nNew balance: ${result.newBalance} coins`
            });
        } catch (error) {
            logger.error('Error in monthly command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error claiming monthly reward: ' + error.message
            });
        }
    },

    work: async (sock, msg) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;
            const userData = await dbStore.getUserData(userId);

            if (!userData) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ You need to register first! Use .register'
                });
            }

            const lastWork = userData.lastWork || 0;
            const now = Date.now();
            const timeLeft = lastWork + COOLDOWNS.work - now;

            if (timeLeft > 0) {
                const minutes = Math.ceil(timeLeft / (60 * 1000));
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `⏳ You can work again in ${minutes} minutes`
                });
            }

            const earnings = Math.floor(Math.random() * 500) + 500;
            await dbStore.updateBalance(userId, earnings);
            await dbStore.setUser(userId, { lastWork: now });

            await sock.sendMessage(msg.key.remoteJid, {
                text: `💼 *Work Complete*\n\nYou earned ${earnings} coins!`
            });
        } catch (error) {
            logger.error('Error in work command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error while working'
            });
        }
    },

    rob: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please mention a user to rob!\nUsage: ${config.prefix}rob @user`
                });
            }

            const userId = msg.key.participant || msg.key.remoteJid;
            const userData = await dbStore.getUserData(userId);

            if (!userData) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ You need to register first! Use .register'
                });
            }

            const lastRob = userData.lastRob || 0;
            const now = Date.now();
            const timeLeft = lastRob + COOLDOWNS.rob - now;

            if (timeLeft > 0) {
                const minutes = Math.ceil(timeLeft / (60 * 1000));
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `⏳ You can rob again in ${minutes} minutes`
                });
            }

            const targetId = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            const targetData = await dbStore.getUserData(targetId);

            if (!targetData || targetData.balance < 100) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ This user doesn\'t have enough coins to rob!'
                });
            }

            // 40% chance to succeed
            const success = Math.random() < 0.4;
            const amount = Math.min(
                Math.floor(Math.random() * 200) + 100,
                Math.floor(targetData.balance * 0.3)
            );

            await dbStore.setUser(userId, { lastRob: now });

            if (success) {
                await dbStore.updateBalance(userId, amount);
                await dbStore.updateBalance(targetId, -amount);

                await sock.sendMessage(msg.key.remoteJid, {
                    text: `🦹 Successfully robbed ${args[0]} and got away with ${amount} coins!`,
                    mentions: [targetId]
                });
            } else {
                const fine = Math.floor(amount * 0.5);
                await dbStore.updateBalance(userId, -fine);

                await sock.sendMessage(msg.key.remoteJid, {
                    text: `👮 You got caught trying to rob ${args[0]} and had to pay a fine of ${fine} coins!`,
                    mentions: [targetId]
                });
            }
        } catch (error) {
            logger.error('Error in rob command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error while attempting to rob'
            });
        }
    },
    mine: async (sock, msg) => {
        try {
            const userData = await dbStore.getUserData(msg.key.participant);
            if (!userData?.inventory?.pickaxe) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ You need a pickaxe to mine! Buy one from the shop.'
                });
            }

            const status = await dbStore.getActivityCooldown(msg.key.participant, 'Mining');
            if (!status.canDo) {
                const minutes = Math.ceil(status.timeLeft / (60 * 1000));
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `⏳ You can mine again in ${minutes} minutes`
                });
            }

            const minerals = [
                { name: 'Diamond', chance: 0.05, reward: [1000, 2000] },
                { name: 'Gold', chance: 0.15, reward: [500, 1000] },
                { name: 'Silver', chance: 0.3, reward: [250, 500] },
                { name: 'Iron', chance: 0.5, reward: [100, 250] }
            ];

            const roll = Math.random();
            let mineral = minerals[minerals.length - 1];
            let cumulativeChance = 0;

            for (const m of minerals) {
                cumulativeChance += m.chance;
                if (roll <= cumulativeChance) {
                    mineral = m;
                    break;
                }
            }

            const earnings = Math.floor(Math.random() * (mineral.reward[1] - mineral.reward[0])) + mineral.reward[0];
            await dbStore.updateActivity(msg.key.participant, 'Mining', earnings);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `⛏️ *Mining Complete!*\n\n` +
                      `💎 Found: ${mineral.name}\n` +
                      `💰 Earned: ${earnings} coins`
            });
        } catch (error) {
            logger.error('Error in mine command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error while mining: ' + error.message
            });
        }
    },
    bank: async (sock, msg) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;
            const userData = await dbStore.getUserData(userId);

            if (!userData) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ You need to register first! Use .register'
                });
            }

            const bankBalance = userData.bank || 0;
            const walletBalance = userData.gold || 0;

            let text = `🏦 *BANK STATEMENT*\n` +
                      `─`.repeat(20) + `\n\n` +
                      `💰 Bank Balance: $${bankBalance}\n` +
                      `👛 Wallet Balance: $${walletBalance}\n` +
                      `💵 Total Assets: $${bankBalance + walletBalance}\n\n` +
                      `Use ${config.prefix}deposit or ${config.prefix}withdraw to manage your money!`;

            await sock.sendMessage(msg.key.remoteJid, { text });
        } catch (error) {
            logger.error('Error in bank command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ ' + error.message
            });
        }
    },
    deposit: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please specify an amount!\nUsage: ${config.prefix}deposit <amount>`
                });
            }

            const amount = parseInt(args[0]);
            if (isNaN(amount) || amount <= 0) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please enter a valid amount greater than 0!'
                });
            }

            // Get user's current balance
            const userData = await dbStore.getUserData(msg.key.participant);
            if (!userData || userData.gold < amount) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Insufficient funds in your wallet!'
                });
            }

            // Update wallet (gold) balance
            await dbStore.updateUserGold(msg.key.participant, userData.gold - amount);

            // Update bank balance
            userData.bank = (userData.bank || 0) + amount;
            await dbStore.set(`users.${msg.key.participant}.bank`, userData.bank);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `💳 Successfully deposited $${amount} to your bank account!`
            });
        } catch (error) {
            logger.error('Error in deposit command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error making deposit: ' + error.message
            });
        }
    },
    gamble: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please specify an amount!\nUsage: ${config.prefix}gamble <amount>`
                });
            }

            const amount = parseInt(args[0]);
            if (isNaN(amount) || amount <= 0) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please enter a valid amount greater than 0!'
                });
            }

            const userId = msg.key.participant || msg.key.remoteJid;
            const balance = await dbStore.getUserBalance(userId);

            if (balance < amount) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Insufficient balance!'
                });
            }

            // 45% chance to win
            const win = Math.random() < 0.45;
            const multiplier = win ? 2 : 0;
            const finalAmount = amount * multiplier;

            // Update balance
            await dbStore.updateBalance(userId, -amount + finalAmount);
            const newBalance = await dbStore.getUserBalance(userId);

            if (win) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `🎰 You won ${finalAmount} coins!\n\nNew balance: ${newBalance} coins`
                });
            } else {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `💸 You lost ${amount} coins!\n\nNew balance: ${newBalance} coins`
                });
            }
        } catch (error) {
            logger.error('Error in gamble command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error while gambling'
            });
        }
    },
    flip: async (sock, msg, args) => {
        try {
            if (args.length < 2) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please specify choice and amount!\nUsage: ${config.prefix}flip heads/tails <amount>`
                });
            }

            const choice = args[0].toLowerCase();
            if (choice !== 'heads' && choice !== 'tails') {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please choose either heads or tails!'
                });
            }

            const amount = parseInt(args[1]);
            if (isNaN(amount) || amount <= 0) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please enter a valid amount greater than 0!'
                });
            }

            const userId = msg.key.participant || msg.key.remoteJid;
            const balance = await dbStore.getUserBalance(userId);

            if (balance < amount) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Insufficient balance!'
                });
            }

            // Flip the coin
            const result = Math.random() < 0.5 ? 'heads' : 'tails';
            const win = choice === result;
            const finalAmount = win ? amount : -amount;

            // Update balance
            await dbStore.updateBalance(userId, finalAmount);
            const newBalance = await dbStore.getUserBalance(userId);

            const flipText = win ?
                `🎯 *You won!*\nCoin landed on ${result}\nYou won $${amount}!` :
                `💔 *You lost!*\nCoin landed on ${result}\nYou lost $${amount}`;

            await sock.sendMessage(msg.key.remoteJid, {
                text: `${flipText}\n\nNew balance: $${newBalance}`
            });
        } catch (error) {
            logger.error('Error in flip command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ ' + error.message
            });
        }
    },
    withdraw: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please specify an amount!\nUsage: ${config.prefix}withdraw <amount>`
                });
            }

            const amount = parseInt(args[0]);
            if (isNaN(amount) || amount <= 0) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please enter a valid amount greater than 0!'
                });
            }

            const userId = msg.key.participant || msg.key.remoteJid;
            const userData = await dbStore.getUserData(userId);

            if (!userData) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ You need to register first! Use .register'
                });
            }

            if (!userData.bank || userData.bank < amount) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Insufficient funds in your bank account!'
                });
            }

            // Update bank balance
            userData.bank -= amount;
            await dbStore.set(`users.${userId}.bank`, userData.bank);

            // Update wallet (gold) balance
            const currentGold = userData.gold || 0;
            await dbStore.updateUserGold(userId, currentGold + amount);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `💳 Successfully withdrew $${amount} from your bank account!`
            });
        } catch (error) {
            logger.error('Error in withdraw command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error making withdrawal: ' + error.message
            });
        }
    },
    transfer: async (sock, msg, args) => {
        try {
            if (args.length < 2) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please specify recipient and amount!\nUsage: ${config.prefix}transfer @user <amount>`
                });
            }

            const senderId = msg.key.participant || msg.key.remoteJid;
            const recipientId = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            const amount = parseInt(args[1]);

            if (isNaN(amount) || amount <= 0) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please enter a valid amount!'
                });
            }

            // Check sender's balance
            const senderBalance = await dbStore.getUserBalance(senderId);
            if (senderBalance < amount) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Insufficient balance!'
                });
            }

            // Transfer coins
            await dbStore.updateBalance(senderId, -amount);
            await dbStore.updateBalance(recipientId, amount);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `💸 Successfully transferred ${amount} coins to ${args[0]}!`,
                mentions: [recipientId]
            });
        } catch (error) {
            logger.error('Error in transfer command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error transferring coins'
            });
        }
    },
    hunt: async (sock, msg) => {
        try {
            const userData = await dbStore.getUserData(msg.key.participant);
            if (!userData?.inventory?.hunting_rifle) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ You need a hunting rifle to hunt! Buy one from the shop.'
                });
            }

            const status = await dbStore.getActivityCooldown(msg.key.participant, 'Hunting');
            if (!status.canDo) {
                const minutes = Math.ceil(status.timeLeft / (60 * 1000));
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `⏳ You can hunt again in ${minutes} minutes`
                });
            }

            const reward = Math.floor(Math.random() * 1000) + 500; // 500-1500
            await dbStore.updateActivity(msg.key.participant, 'Hunting', reward);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🏹 *Hunting Complete*\n\nYou hunted and earned: ${reward} coins`
            });
        } catch (error) {
            logger.error('Error in hunt command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ ' + error.message
            });
        }
    },
    fish: async (sock, msg) => {
        try {
            const userData = await dbStore.getUserData(msg.key.participant);
            if (!userData?.inventory?.fishing_rod) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ You need a fishing rod to fish! Buy one from the shop.'
                });
            }

            const status = await dbStore.getActivityCooldown(msg.key.participant, 'Fishing');
            if (!status.canDo) {
                const minutes = Math.ceil(status.timeLeft / (60 * 1000));
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `⏳ You can fish again in ${minutes} minutes`
                });
            }

            const reward = Math.floor(Math.random() * 600) + 300; // 300-900
            await dbStore.updateActivity(msg.key.participant, 'Fishing', reward);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎣 *Fishing Complete*\n\nYou caught fish worth: ${reward} coins`
            });
        } catch (error) {
            logger.error('Error in fish command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ ' + error.message
            });
        }
    },
    shop: async (sock, msg) => {
        try {
            const items = await dbStore.getShopItems();
            let shopText = '🛍️ *ITEM SHOP*\n' + '─'.repeat(40) + '\n\n';

            items.forEach(item => {
                shopText += `📦 *${item.name}*\n`;
                shopText += `💰 Price: $${item.price}\n`;
                shopText += `📝 ${item.description}\n`;
                shopText += `🔑 ID: ${item.id}\n\n`;
            });

            shopText += `\nTo buy an item: ${config.prefix}buy <item_id>`;

            await sock.sendMessage(msg.key.remoteJid, { text: shopText });
        } catch (error) {
            logger.error('Error in shop command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error accessing shop'
            });
        }
    },
    buy: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please specify an item to buy!\nUsage: ${config.prefix}buy <item_id>`
                });
            }

            const itemId = args[0].toLowerCase();
            const result = await dbStore.buyItem(msg.key.participant, itemId);

            if (!result.success) {
                throw new Error(result.error);
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ Successfully bought ${result.item.name} for $${result.item.price}!`
            });
        } catch (error) {
            logger.error('Error in buy command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ ' + error.message
            });
        }
    },
    sell: async (sock, msg, args) => {
        try {
            if (args.length < 1) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please specify what to sell!\nUsage: ${config.prefix}sell <item_id> [quantity]`
                });
            }

            const itemId = args[0].toLowerCase();
            const quantity = parseInt(args[1]) || 1;

            if (quantity <= 0) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please enter a valid quantity!'
                });
            }

            const result = await dbStore.sellItem(msg.key.participant, itemId, quantity);

            if (!result.success) {
                throw new Error(result.error);
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `💰 Successfully sold item(s) for $${result.amount}!`
            });
        } catch (error) {
            logger.error('Error in sell command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ ' + error.message
            });
        }
    },
    inventory: async (sock, msg) => {
        try {
            const userData = await dbStore.getUserData(msg.key.participant);
            if (!userData || !userData.inventory) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '📦 Your inventory is empty!'
                });
            }

            const items = await dbStore.getShopItems();
            let invText = '📦 *YOUR INVENTORY*\n' + '─'.repeat(40) + '\n\n';

            Object.entries(userData.inventory).forEach(([itemId, quantity]) => {
                if (quantity > 0) {
                    const item = items.find(i => i.id === itemId);
                    if (item) {
                        invText += `📍 ${item.name} x${quantity}\n`;
                    }
                }
            });

            await sock.sendMessage(msg.key.remoteJid, { text: invText });
        } catch (error) {
            logger.error('Error in inventory command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error accessing inventory'
            });
        }
    }
};

module.exports = economyCommands;