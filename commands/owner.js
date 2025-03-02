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
        broadcast: async (sock, msg, args) => {
            try {
                if (!args.length) {
                    return await sock.sendMessage(msg.key.remoteJid, {
                        text: '❌ Please provide a message to broadcast!\nUsage: .broadcast <message>'
                    });
                }

                const message = args.join(' ');
                const chats = await sock.groupFetchAllParticipating();

                let successCount = 0;
                let failCount = 0;

                await sock.sendMessage(msg.key.remoteJid, {
                    text: '📢 Starting broadcast...'
                });

                for (const [id, chat] of Object.entries(chats)) {
                    try {
                        await sock.sendMessage(id, {
                            text: `*📢 Broadcast Message*\n\n${message}\n\n_From: ${config.botName}_`
                        });
                        successCount++;
                    } catch (err) {
                        logger.error(`Failed to broadcast to ${id}:`, err);
                        failCount++;
                    }
                }

                await sock.sendMessage(msg.key.remoteJid, {
                    text: `📢 Broadcast completed!\n✅ Success: ${successCount}\n❌ Failed: ${failCount}`
                });

            } catch (error) {
                logger.error('Error in broadcast command:', error);
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Failed to broadcast message'
                });
            }
        },

        block: async (sock, msg, args) => {
            try {
                if (!args[0]) {
                    return await sock.sendMessage(msg.key.remoteJid, {
                        text: '❌ Please mention a user to block!\nUsage: .block @user'
                    });
                }

                const number = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                await sock.updateBlockStatus(number, "block");

                await sock.sendMessage(msg.key.remoteJid, {
                    text: `✅ Blocked user @${number.split('@')[0]}`,
                    mentions: [number]
                });

            } catch (error) {
                logger.error('Error in block command:', error);
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Failed to block user'
                });
            }
        },

        unblock: async (sock, msg, args) => {
            try {
                if (!args[0]) {
                    return await sock.sendMessage(msg.key.remoteJid, {
                        text: '❌ Please mention a user to unblock!\nUsage: .unblock @user'
                    });
                }

                const number = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                await sock.updateBlockStatus(number, "unblock");

                await sock.sendMessage(msg.key.remoteJid, {
                    text: `✅ Unblocked user @${number.split('@')[0]}`,
                    mentions: [number]
                });

            } catch (error) {
                logger.error('Error in unblock command:', error);
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Failed to unblock user'
                });
            }
        },

        leave: async (sock, msg) => {
            try {
                if (!msg.key.remoteJid.endsWith('@g.us')) {
                    return await sock.sendMessage(msg.key.remoteJid, {
                        text: '❌ This command can only be used in groups!'
                    });
                }

                await sock.sendMessage(msg.key.remoteJid, {
                    text: '👋 Goodbye! Bot is leaving the group.'
                });

                await sock.groupLeave(msg.key.remoteJid);
                logger.info('Left group:', msg.key.remoteJid);

            } catch (error) {
                logger.error('Error in leave command:', error);
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Failed to leave group'
                });
            }
        },

        restart: async (sock, msg) => {
            try {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '🔄 Restarting bot...'
                });

                logger.info('Bot restart initiated by owner');
                await restartBot();

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