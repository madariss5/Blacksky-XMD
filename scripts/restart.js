const { spawn } = require('child_process');
const path = require('path');
const logger = require('../utils/logger');

function restartBot() {
    try {
        logger.info('Initiating bot restart...');
        
        // Path to main bot file
        const mainFile = path.join(__dirname, '..', 'index.js');
        
        // Spawn new process
        const child = spawn('node', [mainFile], {
            detached: true,
            stdio: 'inherit'
        });

        // Unref parent from child to allow parent to exit
        child.unref();

        logger.info('New bot process started, terminating old process');
        
        // Exit current process
        process.exit(0);
    } catch (error) {
        logger.error('Failed to restart bot:', error);
        throw error;
    }
}

module.exports = { restartBot };
