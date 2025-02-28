const config = require('../config');
const logger = require('pino')();

// Safe module import function
const safeRequire = (path) => {
    try {
        return require(path);
    } catch (error) {
        logger.warn(`Failed to load module ${path}: ${error.message}`);
        return null;
    }
};

// Import economy modules safely
const modules = {
    balance: '../attached_assets/economy-balance',
    bank: '../attached_assets/economy-bank',
    depo: '../attached_assets/economy-depo',
    bet: '../attached_assets/economy-bet',
    flip: '../attached_assets/economy-flip'
};

const { balance, bank, depo, bet, flip } = Object.entries(modules).reduce((acc, [key, path]) => {
    acc[key] = safeRequire(path);
    return acc;
}, {});

const store = require('../database/store');

const economyCommands = {
    // Existing balance command implementation
    balance: async (sock, msg) => {
        try {
            if (!balance) throw new Error('Balance module not available');
            const userBalance = await balance.getBalance(msg.key.participant);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `💰 *Your Balance*\n\nWallet: $${userBalance.wallet}\nBank: $${userBalance.bank}`
            });
        } catch (error) {
            logger.error('Error in balance command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error checking balance: ' + error.message
            });
        }
    },

    // Updated daily command with proper module check
    daily: async (sock, msg) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;

            // Check daily status
            const status = await store.getDailyStatus(userId);
            if (!status.canClaim) {
                const hours = Math.floor(status.timeLeft / (60 * 60 * 1000));
                const minutes = Math.floor((status.timeLeft % (60 * 60 * 1000)) / (60 * 1000));
                throw new Error(`You can claim your daily reward again in ${hours}h ${minutes}m`);
            }

            // Generate random reward between 500-1000
            const reward = Math.floor(Math.random() * 500) + 500;

            // Update user's rewards
            await store.updateDailyReward(userId, reward);

            // Get updated balance
            const userBalance = await store.getUserData(userId);

            // Assuming XP_REWARDS is defined elsewhere
            const XP_REWARDS = { daily: 10 }; //Example value

            await sock.sendMessage(msg.key.remoteJid, {
                text: `✨ *Daily Reward Claimed!*\n\n` +
                      `💰 You received: $${reward}\n` +
                      `💳 Current balance: $${userBalance.gold}\n` +
                      `⭐ XP gained: +${XP_REWARDS.daily}\n\n` +
                      `Come back tomorrow for more rewards!`
            });
        } catch (error) {
            logger.error('Error in daily command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ ' + error.message
            });
        }
    },

    // Updated bank command with proper module check
    bank: async (sock, msg) => {
        try {
            if (!bank) throw new Error('Bank module not available');
            const info = await bank.getInfo(msg.key.participant);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🏦 *Bank Information*\n\n${info}`
            });
        } catch (error) {
            logger.error('Error in bank command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ ' + error.message
            });
        }
    },

    // Updated deposit command with improved error handling and store integration
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
            if (!userData || userData.wallet < amount) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Insufficient funds in your wallet!'
                });
            }

            // Perform the deposit using store methods
            await store.updateWalletBalance(msg.key.participant, -amount); // Deduct from wallet
            await store.updateBankBalance(msg.key.participant, amount); // Add to bank

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

    // Updated gamble command with proper module check
    gamble: async (sock, msg, args) => {
        try {
            if (!bet) throw new Error('Gambling module not available');
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
            const result = await bet.gamble(msg.key.participant, amount);
            await sock.sendMessage(msg.key.remoteJid, {
                text: result.message
            });
        } catch (error) {
            logger.error('Error in gamble command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ ' + error.message
            });
        }
    },

    // Updated flip command with proper module check
    flip: async (sock, msg, args) => {
        try {
            if (!flip) throw new Error('Flip module not available');
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
            const result = await flip.coinFlip(msg.key.participant, choice, amount);
            await sock.sendMessage(msg.key.remoteJid, {
                text: result.message
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
            await bank.withdraw(msg.key.participant, amount);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `💵 Successfully withdrawn $${amount} from your bank account!`
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
            const senderBalance = await balance.getBalance(msg.key.participant);
            if (senderBalance.wallet < amount) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Insufficient funds in your wallet!'
                });
            }

            // Verify recipient exists
            const recipientBalance = await balance.getBalance(recipient);
            if (!recipientBalance) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Could not find the recipient!'
                });
            }

            // Perform transfer
            await balance.deductBalance(msg.key.participant, amount);
            await balance.addBalance(recipient, amount);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `💸 Successfully transferred $${amount} to ${args[0]}!`,
                mentions: [recipient]
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

    work: async (sock, msg) => {
        try {
            const status = await store.getWorkCooldown(msg.key.participant);
            if (!status.canWork) {
                const minutesLeft = Math.ceil(status.timeLeft / (60 * 1000));
                throw new Error(`You can work again in ${minutesLeft} minutes`);
            }

            const reward = Math.floor(Math.random() * 500) + 200; // 200-700
            await store.updateWorkReward(msg.key.participant, reward);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `💼 *Work Complete*\n\nYou worked hard and earned: $${reward}`
            });
        } catch (error) {
            logger.error('Error in work command:', error);
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

    mine: async (sock, msg) => {
        try {
            const userData = await store.getUserData(msg.key.participant);
            if (!userData?.inventory?.pickaxe) {
                throw new Error('You need a pickaxe to mine! Buy one from the shop.');
            }

            const status = await store.getActivityCooldown(msg.key.participant, 'Mining');
            if (!status.canDo) {
                const minutesLeft = Math.ceil(status.timeLeft / (60 * 1000));
                throw new Error(`You can mine again in ${minutesLeft} minutes`);
            }

            const reward = Math.floor(Math.random() * 800) + 400; // 400-1200
            await store.updateActivity(msg.key.participant, 'Mining', reward);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `⛏️ *Mining Complete*\n\nYou mined and found: $${reward}`
            });
        } catch (error) {
            logger.error('Error in mine command:', error);
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
    }
};

module.exports = economyCommands;