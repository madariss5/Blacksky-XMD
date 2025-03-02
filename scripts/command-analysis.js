const config = require('../config');
const fs = require('fs-extra');
const path = require('path');
const logger = require('pino')();

async function analyzeCommands() {
    const commandsDir = path.join(__dirname, '../commands');
    const files = await fs.readdir(commandsDir);
    const implementedCommands = new Set();
    const analysis = {
        categories: {},
        summary: {
            total: 0,
            implemented: 0,
            missing: 0
        }
    };

    // Load implemented commands
    for (const file of files) {
        if (file.endsWith('.js')) {
            try {
                const commands = require(path.join(commandsDir, file));
                Object.keys(commands).forEach(cmd => implementedCommands.add(cmd));
            } catch (error) {
                logger.error(`Error loading ${file}:`, error);
            }
        }
    }

    // Analyze config.commands
    Object.entries(config.commands).forEach(([cmd, info]) => {
        const category = info.category;
        if (!analysis.categories[category]) {
            analysis.categories[category] = {
                total: 0,
                implemented: [],
                missing: []
            };
        }

        analysis.categories[category].total++;
        analysis.summary.total++;

        if (implementedCommands.has(cmd)) {
            analysis.categories[category].implemented.push(cmd);
            analysis.summary.implemented++;
        } else {
            analysis.categories[category].missing.push(cmd);
            analysis.summary.missing++;
        }
    });

    return analysis;
}

// Run analysis and print report
async function generateReport() {
    console.log('\nCommand Implementation Analysis Report');
    console.log('=====================================');

    const analysis = await analyzeCommands();

    console.log('\nSummary:');
    console.log(`Total Commands: ${analysis.summary.total}`);
    console.log(`Implemented: ${analysis.summary.implemented}`);
    console.log(`Missing: ${analysis.summary.missing}`);

    console.log('\nDetailed Analysis by Category:');
    Object.entries(analysis.categories).forEach(([category, stats]) => {
        console.log(`\n${category}:`);
        console.log(`Total Commands: ${stats.total}`);
        console.log('Implemented:', stats.implemented.join(', ') || 'None');
        console.log('Missing:', stats.missing.join(', ') || 'None');
    });
}

generateReport().catch(console.error);
