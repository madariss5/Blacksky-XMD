const { validateCommands } = require('../utils/command-validator');
const logger = require('pino')();
const config = require('../config');

// Return a detailed analysis of command implementations
async function analyzeCommandImplementations() {
    logger.info('Starting command implementation analysis...');
    const results = await validateCommands();

    // Group commands by category
    const commandsByCategory = {};
    Object.entries(config.commands).forEach(([cmd, info]) => {
        if (!commandsByCategory[info.category]) {
            commandsByCategory[info.category] = {
                implemented: [],
                missing: []
            };
        }

        const isImplemented = results.commands.includes(cmd);
        if (isImplemented) {
            commandsByCategory[info.category].implemented.push(cmd);
        } else {
            commandsByCategory[info.category].missing.push(cmd);
        }
    });

    return {
        summary: {
            total: results.total,
            implemented: results.implemented,
            missing: results.missing.length
        },
        byCategory: commandsByCategory,
        missingCommands: results.missing
    };
}

// Run the analysis and print a detailed report
async function generateDetailedReport() {
    try {
        const analysis = await analyzeCommandImplementations();

        console.log('\nCommand Implementation Analysis Report');
        console.log('====================================');
        console.log('\nSummary:');
        console.log(`Total Commands: ${analysis.summary.total}`);
        console.log(`Implemented: ${analysis.summary.implemented}`);
        console.log(`Missing: ${analysis.summary.missing}`);

        console.log('\nBreakdown by Category:');
        Object.entries(analysis.byCategory).forEach(([category, status]) => {
            console.log(`\n${category}:`);
            console.log('  Implemented:', status.implemented.length ? status.implemented.join(', ') : 'None');
            console.log('  Missing:', status.missing.length ? status.missing.join(', ') : 'None');
        });

        return analysis;
    } catch (error) {
        logger.error('Failed to generate implementation report:', error);
        throw error;
    }
}

// Export functions for different use cases
module.exports = { analyzeCommandImplementations, generateDetailedReport };