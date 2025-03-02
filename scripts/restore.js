const SessionManager = require('../utils/session');
const logger = require('pino')();

async function restoreToTime() {
    try {
        const sessionManager = new SessionManager('./auth_info');
        
        // Create timestamp for today 2 PM
        const targetDate = new Date();
        targetDate.setHours(14, 0, 0, 0);  // Set to 2 PM today
        
        logger.info('Starting restoration process to:', targetDate);
        
        // Initialize and restore session
        await sessionManager.initialize();
        const success = await sessionManager.restoreToTimestamp(targetDate);
        
        if (!success) {
            throw new Error('Failed to restore to target timestamp');
        }
        
        // Restart the bot
        const { restartBot } = require('./restart');
        await restartBot();
        
        logger.info('Restoration completed successfully');
    } catch (error) {
        logger.error('Restoration failed:', error);
        throw error;
    }
}

module.exports = { restoreToTime };
