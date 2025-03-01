const logger = require('pino')();
const utilityCommands = require('../commands/utility');

class CommandHandler {
    constructor() {
        this.commands = new Map();
        this.prefix = '!';
        this.initCommands();
    }

    initCommands() {
        // Register utility commands
        Object.entries(utilityCommands).forEach(([name, handler]) => {
            this.commands.set(name, handler);
        });
    }

    async handleMessage(client, message) {
        try {
            const text = message.body || '';

            if (!text.startsWith(this.prefix)) return;

            const [command, ...args] = text.slice(1).split(' ');

            logger.info('Processing command:', { command, args });

            if (this.commands.has(command)) {
                await this.commands.get(command)(client, message, args);
            } else {
                await client.sendText(message.from, 
                    '❌ Unknown command. Use !menu to see available commands.'
                );
            }
        } catch (error) {
            logger.error('Error handling command:', error);
            await client.sendText(message.from, 
                '❌ Error processing command: ' + error.message
            );
        }
    }
}

module.exports = new CommandHandler();