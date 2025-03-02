const logger = require('pino')();
const handler = require('../handler');
const config = require('../config');

const basicCommands = {
    menu: async (sock, msg) => {
        try {
            if (!sock || !msg?.key?.remoteJid) {
                logger.error('Invalid menu command parameters');
                return;
            }

            logger.info('Building menu with available commands');

            // Create menu text with categories
            let menuText = `*${config.botName} Commands*\n\n`;

            // Group commands by category
            const categories = {
                '🎯 Basic': ['help', 'ping'],
                '🤖 AI': ['ai', 'gpt', 'dalle'],
                '🎮 Games': ['numguess', 'hangman', 'leaderboard'],
                '📚 Education': ['math', 'dictionary', 'wiki', 'translate'],
                '💰 Economy': ['balance', 'bank', 'work', 'shop', 'inventory'],
                '🎵 Media': ['sticker', 'toimg', 'tomp3', 'ytmp3', 'ytmp4'],
                '👥 Group': ['welcome', 'goodbye', 'invitelink']
            };

            // Add commands by category
            Object.entries(categories).forEach(([category, commands]) => {
                menuText += `${category}\n`;
                commands.forEach(cmd => {
                    const cmdInfo = config.commands[cmd] || { description: 'No description available' };
                    menuText += `• ${config.prefix}${cmd} - ${cmdInfo.description}\n`;
                });
                menuText += '\n';
            });

            menuText += `\nType ${config.prefix}help <command> for more details`;

            logger.info('Sending menu message');
            await sock.sendMessage(msg.key.remoteJid, {
                text: menuText
            });

            logger.info('Menu sent successfully');

        } catch (error) {
            logger.error('Menu command error:', error);
            if (sock && msg?.key?.remoteJid) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Error showing menu. Please try again.'
                });
            }
        }
    },

    help: async (sock, msg, args) => {
        try {
            if (!sock || !msg?.key?.remoteJid) return;

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Use ${config.prefix}menu to see all commands\nOr ${config.prefix}help <command> for specific help`
                });
            }

            const command = args[0].toLowerCase();
            const cmdInfo = config.commands[command];

            if (!cmdInfo) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Command "${command}" not found\nUse ${config.prefix}menu to see available commands`
                });
            }

            const helpText = `*Command: ${command}*\n` +
                           `Category: ${cmdInfo.category}\n` +
                           `Description: ${cmdInfo.description}`;

            await sock.sendMessage(msg.key.remoteJid, {
                text: helpText
            });

        } catch (error) {
            logger.error('Help command error:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing help'
            });
        }
    },

    ping: async (sock, msg) => {
        try {
            if (!sock || !msg?.key?.remoteJid) return;

            const start = Date.now();
            await sock.sendMessage(msg.key.remoteJid, { text: 'Measuring ping...' });
            const ping = Date.now() - start;

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🏓 Pong!\nResponse time: ${ping}ms`
            });

        } catch (error) {
            logger.error('Ping command error:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error measuring ping'
            });
        }
    }
};

module.exports = basicCommands;