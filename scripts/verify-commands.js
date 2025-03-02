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

// Run verification and log results
async function verifyCommandImplementations() {
    try {
        const { results, missingByCategory } = await main();

        // Print detailed report
        console.log('\nCommand Implementation Report:');
        console.log('----------------------------');
        console.log(`Total Commands: ${results.total}`);
        console.log(`Implemented: ${results.implemented}`);
        console.log(`Missing: ${results.missing.length}`);

        if (Object.keys(missingByCategory).length > 0) {
            console.log('\nMissing Commands by Category:');
            for (const [category, commands] of Object.entries(missingByCategory)) {
                console.log(`\n${category}:`);
                commands.forEach(cmd => console.log(`  - ${cmd}`));
            }
        }

        return results;
    } catch (error) {
        logger.error('Verification failed:', error);
        throw error;
    }
}

// Export both functions for different use cases
module.exports = { main, verifyCommandImplementations };