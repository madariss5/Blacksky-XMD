const { validateCommands } = require('../utils/command-validator');
const logger = require('pino')();

async function main() {
    logger.info('Starting command verification...');
    
    const results = await validateCommands();
    
    logger.info('Command Verification Results:', {
        totalCommands: results.total,
        implementedCommands: results.implemented,
        missingCommands: results.missing.length
    });

    if (results.missing.length > 0) {
        logger.warn('Missing Command Implementations:', results.missing);
    } else {
        logger.info('All commands are implemented!');
    }

    // Group missing commands by category
    const missingByCategory = results.missing.reduce((acc, cmd) => {
        if (!acc[cmd.category]) acc[cmd.category] = [];
        acc[cmd.category].push(cmd.command);
        return acc;
    }, {});

    return { results, missingByCategory };
}

main().catch(console.error);

module.exports = { main };
