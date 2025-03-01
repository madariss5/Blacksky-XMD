const basicCommands = require('./commands/basic');
const logger = require('pino')({ level: 'silent' });

module.exports = async (hans, m, chatUpdate, store) => {
    try {
        const prefix = '.'; // Using . as prefix for commands
        const isCmd = m.body?.startsWith(prefix);
        const command = isCmd ? m.body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : '';
        const args = m.body?.trim().split(/ +/).slice(1) || [];

        logger.info('Processing command:', { command, args });

        // If it's a command but not in message body, return
        if (!m.body) return;

        // Handle basic commands
        if (isCmd && basicCommands[command]) {
            try {
                await basicCommands[command](hans, m, args);
                logger.info(`Successfully executed command: ${command}`);
            } catch (error) {
                logger.error(`Error executing command ${command}:`, error);
                await hans.sendMessage(m.key.remoteJid, {
                    text: `❌ Error executing command: ${error.message}`
                });
            }
            return;
        }

        // If command not found but prefix was used
        if (isCmd) {
            await hans.sendMessage(m.key.remoteJid, {
                text: `Command *${command}* not found. Type ${prefix}menu to see available commands.`
            });
        }

    } catch (err) {
        logger.error("Error in command handler:", err);
        try {
            await hans.sendMessage(m.key.remoteJid, {
                text: "❌ An error occurred while processing your command."
            });
        } catch (sendError) {
            logger.error("Failed to send error message:", sendError);
        }
    }
};