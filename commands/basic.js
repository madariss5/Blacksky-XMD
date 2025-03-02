const logger = require('pino')();
const moment = require('moment-timezone');
const config = require('../config');

const basicCommands = {
    menu: async (sock, msg) => {
        try {
            logger.info('Starting menu generation...');

            // Basic header
            let menuText = `*${config.botName} MENU*\n\n`;
            menuText += `User: ${msg.pushName || 'User'}\n`;
            menuText += `Time: ${moment().format('HH:mm:ss')}\n`;
            menuText += `Date: ${moment().format('DD/MM/YYYY')}\n\n`;

            // Simplified category display
            const categories = {};

            // Group commands by category
            for (const [cmd, info] of Object.entries(config.commands)) {
                if (!categories[info.category]) {
                    categories[info.category] = [];
                }
                categories[info.category].push({
                    command: cmd,
                    description: info.description || 'No description available'
                });
            }

            // Add each category and its commands
            for (const [category, commands] of Object.entries(categories)) {
                menuText += `*${category}*\n`;
                for (const cmd of commands) {
                    menuText += `• ${config.prefix}${cmd.command} - ${cmd.description}\n`;
                }
                menuText += '\n';
            }

            menuText += `\nType ${config.prefix}help for more information.`;

            logger.info('Menu text generated successfully');

            // Send the menu
            await sock.sendMessage(msg.key.remoteJid, {
                text: menuText
            });

        } catch (error) {
            logger.error('Error in menu command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error generating menu. Please try again.'
            });
        }
    },

    help: async (sock, msg) => {
        try {
            const text = `*Basic Commands*\n\n` +
                        `• ${config.prefix}menu - Show all commands\n` +
                        `• ${config.prefix}help - Show this help message`;

            await sock.sendMessage(msg.key.remoteJid, { text });
        } catch (error) {
            logger.error('Help command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing help.'
            });
        }
    }
};

module.exports = basicCommands;