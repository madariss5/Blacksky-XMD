const store = require('../database/store');
const logger = require('pino')();

class EconomyHandler {
    constructor() {
        this.store = store;
    }

    async handleTransaction(userId, amount, type) {
        try {
            const userData = await this.store.getUserData(userId);
            if (!userData) {
                throw new Error('User not found');
            }

            switch (type) {
                case 'deposit':
                    await this.store.updateUserGold(userId, userData.gold + amount);
                    break;
                case 'withdraw':
                    if (userData.gold < amount) {
                        throw new Error('Insufficient funds');
                    }
                    await this.store.updateUserGold(userId, userData.gold - amount);
                    break;
                default:
                    throw new Error('Invalid transaction type');
            }

            return {
                success: true,
                newBalance: (await this.store.getUserData(userId)).gold
            };
        } catch (error) {
            logger.error('Transaction failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getBalance(userId) {
        try {
            const userData = await this.store.getUserData(userId);
            if (!userData) {
                return {
                    gold: 0,
                    bank: 0
                };
            }
            return {
                gold: userData.gold || 0,
                bank: userData.bank || 0
            };
        } catch (error) {
            logger.error('Failed to get balance:', error);
            throw error;
        }
    }

    async updateBalance(userId, amount) {
        try {
            const userData = await this.store.getUserData(userId);
            if (!userData) {
                throw new Error('User not found');
            }

            const newBalance = userData.gold + amount;
            if (newBalance < 0) {
                throw new Error('Insufficient funds');
            }

            await this.store.updateUserGold(userId, newBalance);
            return {
                success: true,
                newBalance
            };
        } catch (error) {
            logger.error('Failed to update balance:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new EconomyHandler();
