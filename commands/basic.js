const logger = require('pino')();
const config = require('../config');
const handler = require('../handler');

const basicCommands = {
    menu: async (sock, msg) => {
        try {
            if (!sock || !msg?.key?.remoteJid) {
                throw new Error('Invalid parameters');
            }

            // Create simple menu text
            let menuText = '*Available Commands*\n\n';

            // Get all registered commands
            const commands = handler.getRegisteredCommands();

            // Add each command to the menu
            commands.forEach(cmd => {
                menuText += `• ${config.prefix}${cmd}\n`;
            });

            // Send menu
            await sock.sendMessage(msg.key.remoteJid, {
                text: menuText
            });

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
            if (!sock || !msg?.key?.remoteJid) {
                throw new Error('Invalid message or socket parameters');
            }

            if (!args.length) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `Type ${config.prefix}menu to see all commands`
                });
                return;
            }

            const command = args[0].toLowerCase();
            const cmdInfo = config.commands[command];

            if (!cmdInfo) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `Command "${command}" not found`
                });
                return;
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${command}*\n${cmdInfo.description}`
            });
        } catch (error) {
            logger.error('Help command error:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing help'
            });
        }
    }
};

module.exports = basicCommands;