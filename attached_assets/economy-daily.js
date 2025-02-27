// Daily reward functionality
const store = require('../database/store');
const logger = require('pino')();

async function claim(userId) {
    try {
        // Check if user can claim daily reward
        const status = await store.getDailyStatus(userId);
        if (!status.canClaim) {
            const hoursLeft = Math.ceil(status.timeLeft / (60 * 60 * 1000));
            throw new Error(`You can claim your daily reward in ${hoursLeft} hours`);
        }

        // Generate random reward between 100 and 1000
        const reward = Math.floor(Math.random() * 900) + 100;

        // Update user's gold and daily claim timestamp
        await store.updateDailyReward(userId, reward);

        // Return the reward amount
        return reward;
    } catch (error) {
        logger.error('Error in daily claim:', error);
        throw error;
    }
}

module.exports = {
    claim
};