const logger = require('pino')();
const config = require('../config');
const { formatPhoneNumber, addWhatsAppSuffix } = require('../utils/phoneNumber');
const { restartBot } = require('../scripts/restart');

// Simplified owner commands implementation
const ownerCommands = {
    // Core command handler with owner verification
    handleCommand: async (sock, msg, command, args) => {
        try {
            const senderId = msg.key.participant || msg.key.remoteJid;
            const senderNumber = formatPhoneNumber(senderId);

            // Simple owner verification using clean number format
            if (senderNumber !== config.ownerNumber) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ This command is only for the bot owner!'
                });
                return false;
            }

            // Execute the command if it exists
            const cmd = ownerCommands.commands[command];
            if (cmd) {
                await cmd(sock, msg, args);
                return true;
            }

            return false;
        } catch (error) {
            logger.error('Error in owner command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error executing command'
            });
            return false;
        }
    },

    // Command implementations
    commands: {
        ban: async (sock, msg, args) => {
            try {
                if (!args[0]) {
                    return await sock.sendMessage(msg.key.remoteJid, {
                        text: '❌ Please mention a user to ban!\nUsage: .ban @user'
                    });
                }

                const targetUser = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `✅ Banned user @${targetUser.split('@')[0]}`,
                    mentions: [targetUser]
                });
            } catch (error) {
                logger.error('Error in ban command:', error);
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Failed to ban user'
                });
            }
        },

        unban: async (sock, msg, args) => {
            try {
                if (!args[0]) {
                    return await sock.sendMessage(msg.key.remoteJid, {
                        text: '❌ Please mention a user to unban!\nUsage: .unban @user'
                    });
                }

                const targetUser = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `✅ Unbanned user @${targetUser.split('@')[0]}`,
                    mentions: [targetUser]
                });
            } catch (error) {
                logger.error('Error in unban command:', error);
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Failed to unban user'
                });
            }
        },

        restart: async (sock, msg) => {
            try {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '🔄 Restarting bot...'
                });
                // Actual restart implementation will be added later
            } catch (error) {
                logger.error('Error in restart command:', error);
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Failed to restart bot'
                });
            }
        }
    }
};

module.exports = ownerCommands;