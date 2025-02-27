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

            let newBalance;
            switch (type) {
                case 'deposit':
                    newBalance = userData.gold + amount;
                    await this.store.updateUserGold(userId, newBalance);
                    break;
                case 'withdraw':
                    if (userData.gold < amount) {
                        throw new Error('Insufficient funds');
                    }
                    newBalance = userData.gold - amount;
                    await this.store.updateUserGold(userId, newBalance);
                    break;
                case 'add':
                    newBalance = userData.gold + amount;
                    await this.store.updateUserGold(userId, newBalance);
                    break;
                case 'remove':
                    if (userData.gold < amount) {
                        throw new Error('Insufficient funds');
                    }
                    newBalance = userData.gold - amount;
                    await this.store.updateUserGold(userId, newBalance);
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

    async canAfford(userId, amount) {
        try {
            const { gold } = await this.getBalance(userId);
            return gold >= amount;
        } catch (error) {
            logger.error('Failed to check affordability:', error);
            return false;
        }
    }

    async getDailyStatus(userId) {
        try {
            const userData = await this.store.getUserData(userId);
            if (!userData) {
                return {
                    canClaim: true,
                    timeLeft: 0
                };
            }

            const lastDaily = userData.lastDaily || 0;
            const now = Date.now();
            const cooldown = 24 * 60 * 60 * 1000; // 24 hours
            const timeLeft = Math.max(0, cooldown - (now - lastDaily));

            return {
                canClaim: timeLeft === 0,
                timeLeft
            };
        } catch (error) {
            logger.error('Failed to get daily status:', error);
            throw error;
        }
    }
}

module.exports = new EconomyHandler();