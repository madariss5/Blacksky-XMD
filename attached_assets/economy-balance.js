const store = require('../database/store');
const logger = require('pino')();

const balance = {
    getBalance: async (userId) => {
        try {
            const userData = await store.getUserData(userId);
            if (!userData) {
                return {
                    wallet: 0,
                    bank: 0
                };
            }
            return {
                wallet: userData.gold || 0,
                bank: userData.bank || 0
            };
        } catch (error) {
            logger.error('Error getting balance:', error);
            throw error;
        }
    },

    addBalance: async (userId, amount) => {
        try {
            const userData = await store.getUserData(userId);
            const newBalance = (userData?.gold || 0) + amount;
            return await store.updateUserGold(userId, newBalance);
        } catch (error) {
            logger.error('Error adding balance:', error);
            return false;
        }
    },

    deductBalance: async (userId, amount) => {
        try {
            const userData = await store.getUserData(userId);
            if (!userData || userData.gold < amount) {
                return false;
            }
            const newBalance = userData.gold - amount;
            return await store.updateUserGold(userId, newBalance);
        } catch (error) {
            logger.error('Error deducting balance:', error);
            return false;
        }
    }
};

module.exports = balance;