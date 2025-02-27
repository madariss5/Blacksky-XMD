const config = require('../config');
const logger = require('pino')();

// Safe module import function
const safeRequire = (path) => {
    try {
        return require(path);
    } catch (error) {
        logger.warn(`Failed to load module ${path}: ${error.message}`);
        return {
            getBalance: () => Promise.reject(new Error(`Module ${path} not available`)),
            claim: () => Promise.reject(new Error(`Module ${path} not available`)),
            transfer: () => Promise.reject(new Error(`Module ${path} not available`)),
            deposit: () => Promise.reject(new Error(`Module ${path} not available`)),
            withdraw: () => Promise.reject(new Error(`Module ${path} not available`)),
            getInfo: () => Promise.reject(new Error(`Module ${path} not available`)),
            gamble: () => Promise.reject(new Error(`Module ${path} not available`)),
            coinFlip: () => Promise.reject(new Error(`Module ${path} not available`))
        };
    }
};

// Import economy modules safely
const modules = {
    balance: '../attached_assets/economy-balance',
    bank: '../attached_assets/economy-bank',
    bet: '../attached_assets/economy-bet',
    buy: '../attached_assets/economy-buy',
    daily: '../attached_assets/economy-daily',
    depo: '../attached_assets/economy-depo',
    flip: '../attached_assets/economy-flip'
};

// Import modules with fallback
const {
    balance,
    bank,
    bet,
    buy,
    daily,
    depo,
    flip
} = Object.entries(modules).reduce((acc, [key, path]) => {
    acc[key] = safeRequire(path);
    return acc;
}, {});

const economyCommands = {
    balance: async (sock, msg) => {
        try {
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

    daily: async (sock, msg) => {
        try {
            const reward = await daily.claim(msg.key.participant);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `✨ *Daily Reward*\n\nYou received: $${reward}\nCome back tomorrow!`
            });
        } catch (error) {
            logger.error('Error in daily command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ ' + error.message
            });
        }
    },

    bank: async (sock, msg) => {
        try {
            const info = await bank.getInfo(msg.key.participant);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🏦 *Bank Information*\n\n${info}`
            });
        } catch (error) {
            logger.error('Error in bank command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error getting bank info: ' + error.message
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
            await depo.deposit(msg.key.participant, amount);
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
            const result = await bet.gamble(msg.key.participant, amount);
            await sock.sendMessage(msg.key.remoteJid, {
                text: result.message
            });
        } catch (error) {
            logger.error('Error in gamble command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error gambling: ' + error.message
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
            const result = await flip.coinFlip(msg.key.participant, choice, amount);
            await sock.sendMessage(msg.key.remoteJid, {
                text: result.message
            });
        } catch (error) {
            logger.error('Error in flip command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error flipping coin: ' + error.message
            });
        }
    }
};

module.exports = economyCommands;