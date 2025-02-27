const config = require('../config');
const logger = require('pino')();

// Import economy modules
const balance = require('../attached_assets/economy-balance');
const bank = require('../attached_assets/economy-bank');
const bet = require('../attached_assets/economy-bet');
const buy = require('../attached_assets/economy-buy');
const daily = require('../attached_assets/economy-daily');
const depo = require('../attached_assets/economy-depo');
const flip = require('../attached_assets/economy-flip');

const economyCommands = {
    balance: async (sock, msg) => {
        try {
            const balance = await balance.getBalance(msg.key.participant);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `💰 *Your Balance*\n\nWallet: $${balance.wallet}\nBank: $${balance.bank}`
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
                text: '❌ Error claiming daily reward: ' + error.message
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
            const result = await depo.deposit(msg.key.participant, amount);
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
            const result = await bank.withdraw(msg.key.participant, amount);
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
            if (args.length < 2) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please specify recipient and amount!\nUsage: ${config.prefix}transfer @user <amount>`
                });
            }
            const recipient = args[0];
            const amount = parseInt(args[1]);
            const result = await bank.transfer(msg.key.participant, recipient, amount);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `💸 Successfully transferred $${amount} to ${recipient}!`
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
            const amount = parseInt(args[1]);
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
