const logger = require('pino')();

const balance = {
    getBalance: async (userId) => {
        logger.info('Stub balance.getBalance called for user:', userId);
        return {
            wallet: 1000,
            bank: 5000
        };
    },

    addBalance: async (userId, amount) => {
        logger.info('Stub balance.addBalance called:', { userId, amount });
        return true;
    },

    deductBalance: async (userId, amount) => {
        logger.info('Stub balance.deductBalance called:', { userId, amount });
        return true;
    }
};

module.exports = balance;