const config = require('../config');
const logger = require('../utils/logger'); // Updated logger import
const store = require('../database/store');

// Game states and cooldowns management
const COOLDOWNS = {
    work: 5 * 60 * 1000,      // 5 minutes
    mine: 10 * 60 * 1000,     // 10 minutes
    fish: 7 * 60 * 1000,      // 7 minutes
    hunt: 15 * 60 * 1000,     // 15 minutes
    daily: 24 * 60 * 60 * 1000, // 24 hours
    weekly: 7 * 24 * 60 * 60 * 1000, // 7 days
    monthly: 30 * 24 * 60 * 60 * 1000 // 30 days
};

// Economy command handlers
const economyCommands = {
    balance: async (sock, msg) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;
            const userData = await store.getUser(userId);

            if (!userData) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ You don\'t have an account yet! Use .register to create one.'
                });
            }

            const balance = userData.balance || 0;
            await sock.sendMessage(msg.key.remoteJid, {
                text: `💰 *Your Balance*\n\n${balance} coins`
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
            const userData = await store.getUser(userId);

            if (!userData) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ You need to register first! Use .register'
                });
            }

            const lastDaily = userData.lastDaily || 0;
            const now = Date.now();
            const timeLeft = lastDaily + COOLDOWNS.daily - now;

            if (timeLeft > 0) {
                const hours = Math.floor(timeLeft / (60 * 60 * 1000));
                const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `⏳ You can claim your daily reward again in ${hours}h ${minutes}m`
                });
            }

            const reward = Math.floor(Math.random() * 1000) + 1000;
            userData.balance = (userData.balance || 0) + reward;
            userData.lastDaily = now;

            await store.setUser(userId, userData);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `✨ *Daily Reward*\n\nYou received ${reward} coins!\nNew balance: ${userData.balance} coins`
            });
        } catch (error) {
            logger.error('Error in daily command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error claiming daily reward'
            });
        }
    },

    work: async (sock, msg) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;
            const userData = await store.getUser(userId);

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
            userData.balance = (userData.balance || 0) + earnings;
            userData.lastWork = now;

            await store.setUser(userId, userData);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `💼 *Work Complete*\n\nYou earned ${earnings} coins!\nNew balance: ${userData.balance} coins`
            });
        } catch (error) {
            logger.error('Error in work command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error while working'
            });
        }
    },
    mine: async (sock, msg) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;
            const userData = await store.getUserData(userId);

            if (!userData?.inventory?.pickaxe) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ You need a pickaxe to mine! Buy one from the shop.'
                });
            }

            const lastMine = userData.lastMine || 0;
            const now = Date.now();
            const timeLeft = lastMine + COOLDOWNS.mine - now;

            if (timeLeft > 0) {
                const minutes = Math.ceil(timeLeft / (60 * 1000));
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

            // Update user data
            userData.gold = (userData.gold || 0) + earnings;
            userData.lastMine = now;
            userData.totalMined = (userData.totalMined || 0) + 1;

            await store.updateUserData(userId, userData);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `⛏️ *Mining Complete!*\n\n` +
                      `💎 Found: ${mineral.name}\n` +
                      `💰 Earned: $${earnings}\n` +
                      `💳 New Balance: $${userData.gold}\n` +
                      `📊 Total Mining Trips: ${userData.totalMined}`
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
            //This part is removed because it's not in the edited code and the intention is to remove dependencies
            //if (!bank) throw new Error('Bank module not available');
            //const info = await bank.getInfo(msg.key.participant);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `This feature is not available yet.` // Placeholder message
            });
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
            const userData = await store.getUserData(msg.key.participant);
            if (!userData || userData.gold < amount) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Insufficient funds in your wallet!'
                });
            }

            // Update wallet (gold) balance
            await store.updateUserGold(msg.key.participant, userData.gold - amount);

            // Update bank balance
            userData.bank = (userData.bank || 0) + amount;
            await store.set(`users.${msg.key.participant}.bank`, userData.bank);

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
            //This part is removed because it's not in the edited code and the intention is to remove dependencies
            //if (!bet) throw new Error('Gambling module not available');
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
            //This part is removed because it's not in the edited code and the intention is to remove dependencies
            //const result = await bet.gamble(msg.key.participant, amount);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `This feature is not available yet.` // Placeholder message
            });
        } catch (error) {
            logger.error('Error in gamble command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ ' + error.message
            });
        }
    },
    flip: async (sock, msg, args) => {
        try {
            //This part is removed because it's not in the edited code and the intention is to remove dependencies
            //if (!flip) throw new Error('Flip module not available');
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
            //This part is removed because it's not in the edited code and the intention is to remove dependencies
            //const result = await flip.coinFlip(msg.key.participant, choice, amount);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `This feature is not available yet.` // Placeholder message
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
            //This part is removed because it's not in the edited code and the intention is to remove dependencies
            //await bank.withdraw(msg.key.participant, amount);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `This feature is not available yet.` // Placeholder message
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
            // Validate arguments
            if (args.length < 2) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please specify recipient and amount!\nUsage: ${config.prefix}transfer @user <amount>`
                });
            }

            // Extract recipient number from mention
            const recipientMention = args[0];
            if (!recipientMention.startsWith('@')) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please mention a user with @ to transfer money!'
                });
            }

            const recipient = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            const amount = parseInt(args[1]);

            // Validate amount
            if (isNaN(amount) || amount <= 0) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please enter a valid amount greater than 0!'
                });
            }

            // Check sender's balance
            //This part is removed because it's not in the edited code and the intention is to remove dependencies
            //const senderBalance = await balance.getBalance(msg.key.participant);
            //if (senderBalance.wallet < amount) {
            //    return await sock.sendMessage(msg.key.remoteJid, {
            //        text: '❌ Insufficient funds in your wallet!'
            //    });
            //}

            // Verify recipient exists
            //This part is removed because it's not in the edited code and the intention is to remove dependencies
            //const recipientBalance = await balance.getBalance(recipient);
            //if (!recipientBalance) {
            //    return await sock.sendMessage(msg.key.remoteJid, {
            //        text: '❌ Could not find the recipient!'
            //    });
            //}

            // Perform transfer
            //This part is removed because it's not in the edited code and the intention is to remove dependencies
            //await balance.deductBalance(msg.key.participant, amount);
            //await balance.addBalance(recipient, amount);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `This feature is not available yet.` // Placeholder message
                //text: `💸 Successfully transferred $${amount} to ${args[0]}!`,
                //mentions: [recipient]
            });
        } catch (error) {
            logger.error('Error in transfer command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error making transfer: ' + error.message
            });
        }
    },
    weekly: async (sock, msg) => {
        try {
            const reward = Math.floor(Math.random() * 2000) + 1000; // 1000-3000
            await store.updateWeeklyReward(msg.key.participant, reward);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `✨ *Weekly Reward*\n\nYou received: $${reward}\nCome back next week!`
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
            const reward = Math.floor(Math.random() * 5000) + 5000; // 5000-10000
            await store.updateMonthlyReward(msg.key.participant, reward);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎉 *Monthly Reward*\n\nYou received: $${reward}\nCome back next month!`
            });
        } catch (error) {
            logger.error('Error in monthly command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ ' + error.message
            });
        }
    },
    shop: async (sock, msg) => {
        try {
            const items = await store.getShopItems();
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
            const result = await store.buyItem(msg.key.participant, itemId);

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

            const result = await store.sellItem(msg.key.participant, itemId, quantity);

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
            const userData = await store.getUserData(msg.key.participant);
            if (!userData || !userData.inventory) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '📦 Your inventory is empty!'
                });
            }

            const items = await store.getShopItems();
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
    },
    hunt: async (sock, msg) => {
        try {
            const userData = await store.getUserData(msg.key.participant);
            if (!userData?.inventory?.hunting_rifle) {
                throw new Error('You need a hunting rifle to hunt! Buy one from the shop.');
            }

            const status = await store.getActivityCooldown(msg.key.participant, 'Hunting');
            if (!status.canDo) {
                const minutesLeft = Math.ceil(status.timeLeft / (60 * 1000));
                throw new Error(`You can hunt again in ${minutesLeft} minutes`);
            }

            const reward = Math.floor(Math.random() * 1000) + 500; // 500-1500
            await store.updateActivity(msg.key.participant, 'Hunting', reward);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🏹 *Hunting Complete*\n\nYou hunted and earned: $${reward}`
            });
        } catch (error) {
            logger.error('Error in hunt command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ ' + error.message
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

            // Get target user from mention
            const target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            if (target === msg.key.participant) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ You cannot rob yourself!'
                });
            }

            const userId = msg.key.participant || msg.key.remoteJid;
            const cooldown = await store.getActivityCooldown(userId, 'Rob');
            if (!cooldown.canDo) {
                const minutesLeft = Math.ceil(cooldown.timeLeft / (60 * 1000));
                throw new Error(`You can rob again in ${minutesLeft} minutes`);
            }

            // Get balances
            const robberData = await store.getUserData(userId);
            const victimData = await store.getUserData(target);

            if (!victimData || victimData.gold < 100) {
                throw new Error('This user doesn\'t have enough gold to rob!');
            }

            // 40% chance to succeed
            const success = Math.random() < 0.4;
            const amount = Math.floor(Math.random() * 200) + 100; // 100-300 gold

            if (success) {
                // Update balances
                await store.updateUserGold(userId, robberData.gold + amount);
                await store.updateUserGold(target, Math.max(0, victimData.gold - amount));

                await sock.sendMessage(msg.key.remoteJid, {
                    text: `🦹 Successfully robbed ${args[0]} and got away with ${amount} gold!`,
                    mentions: [target]
                });
            } else {
                // Penalty for failed robbery
                const penalty = Math.floor(amount * 0.5);
                await store.updateUserGold(userId, Math.max(0, robberData.gold - penalty));

                await sock.sendMessage(msg.key.remoteJid, {
                    text: `👮 You got caught trying to rob ${args[0]} and had to pay a fine of ${penalty} gold!`,
                    mentions: [target]
                });
            }

            await store.updateActivity(userId, 'Rob');

        } catch (error) {
            logger.error('Error in rob command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ ' + error.message
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
            const userData = await store.getUserData(userId);

            if (!userData || userData.gold < amount) {
                throw new Error('You don\'t have enough gold!');
            }

            // 45% chance to win
            const win = Math.random() < 0.45;
            const multiplier = win ? 2 : 0;
            const finalAmount = amount * multiplier;

            // Update balance
            await store.updateUserGold(userId, userData.gold - amount + finalAmount);

            if (win) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `🎰 You won ${finalAmount} gold!\n\nNew balance: ${userData.gold - amount + finalAmount} gold`
                });
            } else {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `💸 You lost ${amount} gold!\n\nNew balance: ${userData.gold - amount} gold`
                });
            }

        } catch (error) {
            logger.error('Error in gamble command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ ' + error.message
            });
        }
    },
    fish: async (sock, msg) => {
        try {
            const userData = await store.getUserData(msg.key.participant);
            if (!userData?.inventory?.fishing_rod) {
                throw new Error('You need a fishing rod to fish! Buy one from the shop.');
            }

            const status = await store.getActivityCooldown(msg.key.participant, 'Fishing');
            if (!status.canDo) {
                const minutesLeft = Math.ceil(status.timeLeft / (60 * 1000));
                throw new Error(`You can fish again in ${minutesLeft} minutes`);
            }

            const reward = Math.floor(Math.random() * 600) + 300; // 300-900
            await store.updateActivity(msg.key.participant, 'Fishing', reward);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎣 *Fishing Complete*\n\nYou caught fish worth: $${reward}`
            });
        } catch (error) {
            logger.error('Error in fish command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ ' + error.message
            });
        }
    }
};

module.exports = economyCommands;