const config = require('../config');
const logger = require('../utils/logger');
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
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, { 
                    text: 'Please provide a number to ban!\nUsage: .ban @user' 
                });
            }

            try {
                // Clean the number format and add WhatsApp suffix only for API call
                const cleanNumber = formatPhoneNumber(args[0]);
                const whatsappId = addWhatsAppSuffix(cleanNumber);

                await sock.updateBlockStatus(whatsappId, "block");

                await sock.sendMessage(msg.key.remoteJid, {
                    text: `✅ Banned ${cleanNumber}`,
                    mentions: [whatsappId]
                });
            } catch (error) {
                logger.error('Error in ban command:', error);
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: '❌ Failed to ban user' 
                });
            }
        },

        unban: async (sock, msg, args) => {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, { 
                    text: 'Please provide a number to unban!\nUsage: .unban @user' 
                });
            }

            try {
                // Clean the number format and add WhatsApp suffix only for API call
                const cleanNumber = formatPhoneNumber(args[0]);
                const whatsappId = addWhatsAppSuffix(cleanNumber);

                await sock.updateBlockStatus(whatsappId, "unblock");

                await sock.sendMessage(msg.key.remoteJid, {
                    text: `✅ Unbanned ${cleanNumber}`,
                    mentions: [whatsappId]
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
                    text: '🔄 Restarting bot... Please wait a moment.' 
                });

                // Use the new restart mechanism
                restartBot();
            } catch (error) {
                logger.error('Error in restart command:', error);
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: '❌ Failed to restart: ' + error.message 
                });
            }
        }
    }
};

module.exports = ownerCommands;