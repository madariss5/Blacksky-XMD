const fs = require('fs-extra');
const path = require('path');
const config = require('../config');
const logger = require('pino')();

async function validateCommands() {
    try {
        logger.info('Starting command validation...');
        const commandsDir = path.join(__dirname, '../commands');
        const commandFiles = await fs.readdir(commandsDir);
        const implementedCommands = new Map();
        const missingCommands = new Set();

        // Load all implemented commands with enhanced logging
        for (const file of commandFiles) {
            if (file.endsWith('.js')) {
                try {
                    const filePath = path.join(commandsDir, file);
                    logger.info(`Loading commands from ${file}`);
                    delete require.cache[require.resolve(filePath)]; // Clear cache
                    const commands = require(filePath);

                    Object.keys(commands).forEach(cmd => {
                        implementedCommands.set(cmd, {
                            file: file,
                            handler: commands[cmd]
                        });
                        logger.info(`Registered command: ${cmd} from ${file}`);
                    });
                } catch (error) {
                    logger.error(`Error loading commands from ${file}:`, error);
                }
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
                logger.warn(`Missing command implementation: ${cmd}`);
            }
        });

        const validationResult = {
            total: Object.keys(config.commands).length,
            implemented: implementedCommands.size,
            missing: Array.from(missingCommands),
            files: commandFiles,
            commands: Array.from(implementedCommands.keys())
        };

        logger.info('Command validation complete:', validationResult);
        return validationResult;
    } catch (error) {
        logger.error('Command validation failed:', error);
        throw error;
    }
}

module.exports = { validateCommands };