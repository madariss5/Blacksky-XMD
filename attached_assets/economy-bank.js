const logger = require('pino')();

const bank = {
    // Get bank information for a user
    getInfo: async (userId) => {
        logger.info('Stub bank.getInfo called for user:', userId);
        return `🏦 Bank Account Info\n` +
               `Balance: $5000\n` +
               `Interest Rate: 2%\n` +
               `Account Type: Standard`;
    },

    // Handle withdrawals
    withdraw: async (userId, amount) => {
        logger.info('Stub bank.withdraw called:', { userId, amount });
        return true;
    },

    // Handle transfers between users
    transfer: async (userId, recipientId, amount) => {
        logger.info('Stub bank.transfer called:', { userId, recipientId, amount });
        return true;
    }
};

module.exports = bank;