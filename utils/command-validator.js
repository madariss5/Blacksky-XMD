const fs = require('fs-extra');
const path = require('path');
const config = require('../config');
const logger = require('pino')();

async function validateCommands() {
    const commandFiles = await fs.readdir(path.join(__dirname, '../commands'));
    const implementedCommands = new Map();
    const missingCommands = new Set();

    // Load all implemented commands
    for (const file of commandFiles) {
        if (file.endsWith('.js')) {
            const commands = require(`../commands/${file}`);
            Object.keys(commands).forEach(cmd => {
                implementedCommands.set(cmd, file);
            });
        }
    }

    // Check each command in config
    Object.entries(config.commands).forEach(([cmd, info]) => {
        if (!implementedCommands.has(cmd)) {
            missingCommands.add({
                command: cmd,
                category: info.category,
                description: info.description
            });
        }
    });

    return {
        total: Object.keys(config.commands).length,
        implemented: implementedCommands.size,
        missing: Array.from(missingCommands),
        files: commandFiles
    };
}

module.exports = { validateCommands };
