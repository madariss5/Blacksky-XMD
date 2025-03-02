const { exec } = require('child_process');
const path = require('path');
const logger = require('../utils/logger');

function restartBot() {
    try {
        logger.info('Initiating bot restart...');

        // Path to main bot file
        const mainFile = path.join(__dirname, '..', 'index.js');

        // Get the current Node.js executable path
        const nodePath = process.execPath;

        // Create platform-independent restart command
        const cmd = `"${nodePath}" "${mainFile}"`;

        // Execute restart command
        const child = exec(cmd, {
            detached: true,
            stdio: 'inherit',
            shell: true
        }, (error) => {
            if (error) {
                logger.error('Failed to restart bot:', error);
                return;
            }
        });

        // Unref parent from child to allow parent to exit
        child.unref();

        logger.info('New bot process started, terminating old process');

        // Exit current process after a short delay to ensure new process starts
        setTimeout(() => {
            process.exit(0);
        }, 1000);
    } catch (error) {
        logger.error('Failed to restart bot:', error);
        throw error;
    }
}

module.exports = { restartBot };