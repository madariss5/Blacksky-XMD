const logger = require('pino')();
const basicCommands = require('../commands/basic');
const groupCommands = require('../commands/group');
const mediaCommands = require('../commands/media');
const downloaderCommands = require('../commands/downloader');
const funCommands = require('../commands/fun');
const reactionCommands = require('../commands/reactions');
const toolCommands = require('../commands/tool');
const aiCommands = require('../commands/ai');
const ownerCommands = require('../commands/owner');
const userCommands = require('../commands/user');
const economyCommands = require('../commands/economy');
const nsfwCommands = require('../commands/nsfw');
const utilityCommands = require('../commands/utility');

class CommandHandler {
    constructor() {
        this.commands = new Map();
        this.prefix = '.';
        this.initCommands();
    }

    initCommands() {
        // Register commands from each module
        const commandModules = {
            basic: basicCommands,
            group: groupCommands,
            media: mediaCommands,
            downloader: downloaderCommands,
            fun: funCommands,
            reactions: reactionCommands,
            tool: toolCommands,
            utility: utilityCommands,
            ai: aiCommands,
            owner: ownerCommands,
            user: userCommands,
            economy: economyCommands,
            nsfw: nsfwCommands
        };

        for (const [category, module] of Object.entries(commandModules)) {
            if (module) {
                Object.entries(module).forEach(([name, handler]) => {
                    this.commands.set(name, {
                        handler,
                        category
                    });
                    logger.info(`Registered command: ${name} from ${category}`);
                });
            }
        }

        logger.info('All commands registered successfully');
    }

    async handleMessage(client, message) {
        try {
            const text = message.body || '';

            if (!text.startsWith(this.prefix)) return;

            const [command, ...args] = text.slice(1).split(' ');
            const cmd = this.commands.get(command);

            logger.info('Processing command:', { command, args });

            if (cmd) {
                try {
                    await cmd.handler(client, message, args);
                } catch (error) {
                    logger.error('Error executing command:', error);
                    await client.sendMessage(message.from, { 
                        text: '❌ Error executing command: ' + error.message 
                    });
                }
            } else {
                await client.sendMessage(message.from, {
                    text: `❌ Unknown command: ${command}\nUse ${this.prefix}menu to see available commands.`
                });
            }
        } catch (error) {
            logger.error('Error handling message:', error);
            await client.sendMessage(message.from, { 
                text: '❌ An error occurred while processing your command.' 
            });
        }
    }
}

module.exports = new CommandHandler();