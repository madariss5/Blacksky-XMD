const logger = require('pino')();
const config = require('../config');
const { formatPhoneNumber, addWhatsAppSuffix } = require('../utils/phoneNumber');
const { restartBot } = require('../scripts/restart');

// Core owner validation
const isOwner = (senderId) => {
    const senderNumber = formatPhoneNumber(senderId);
    return senderNumber === config.ownerNumber;
};

const ownerCommands = {
    // Owner verification helper
    handleOwnerCommand: async (sock, msg, command, args) => {
        try {
            const senderId = msg.key.participant || msg.key.remoteJid;
            if (!isOwner(senderId)) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ This command is only for the bot owner!'
                });
                return false;
            }
            return true;
        } catch (error) {
            logger.error('Error in owner verification:', error);
            return false;
        }
    },

    // Bot Status Commands
    getStatus: async (sock, msg) => {
        try {
            if (!await ownerCommands.handleOwnerCommand(sock, msg)) return;

            const uptime = process.uptime();
            const memory = process.memoryUsage();

            const status = `🤖 *Bot Status Report*\n\n` +
                          `Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m\n` +
                          `Memory: ${Math.round(memory.heapUsed / 1024 / 1024)}MB / ${Math.round(memory.heapTotal / 1024 / 1024)}MB\n` +
                          `Platform: ${process.platform}\n` +
                          `Node: ${process.version}`;

            await sock.sendMessage(msg.key.remoteJid, { text: status });
        } catch (error) {
            logger.error('Error in getStatus command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error getting bot status'
            });
        }
    },

    // User Management Commands
    ban: async (sock, msg, args) => {
        try {
            if (!await ownerCommands.handleOwnerCommand(sock, msg)) return;

            if (!args[0]) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please mention a user to ban!\nUsage: .ban @user'
                });
            }

            const targetUser = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            // Implement ban logic here (e.g., update banned users database)

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
            if (!await ownerCommands.handleOwnerCommand(sock, msg)) return;

            if (!args[0]) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please mention a user to unban!\nUsage: .unban @user'
                });
            }

            const targetUser = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            // Implement unban logic here

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

    // Broadcasting and Communication
    broadcast: async (sock, msg, args) => {
        try {
            if (!await ownerCommands.handleOwnerCommand(sock, msg)) return;

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

    // Group Management
    join: async (sock, msg, args) => {
        try {
            if (!await ownerCommands.handleOwnerCommand(sock, msg)) return;

            if (!args[0]) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a group link!\nUsage: .join <link>'
                });
            }

            let url = args[0];
            if (!url.includes('chat.whatsapp.com/')) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Invalid group link!'
                });
            }

            const code = url.split('chat.whatsapp.com/')[1];
            await sock.groupAcceptInvite(code);

            await sock.sendMessage(msg.key.remoteJid, {
                text: '✅ Successfully joined the group!'
            });
        } catch (error) {
            logger.error('Error in join command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to join group'
            });
        }
    },

    leave: async (sock, msg) => {
        try {
            if (!await ownerCommands.handleOwnerCommand(sock, msg)) return;

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

    // User Block Management
    block: async (sock, msg, args) => {
        try {
            if (!await ownerCommands.handleOwnerCommand(sock, msg)) return;

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
            if (!await ownerCommands.handleOwnerCommand(sock, msg)) return;

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

    // System Commands
    eval: async (sock, msg, args) => {
        try {
            if (!await ownerCommands.handleOwnerCommand(sock, msg)) return;

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide code to evaluate!\nUsage: .eval <code>'
                });
            }

            const code = args.join(' ');
            let result;
            try {
                result = eval(code);
            } catch (e) {
                result = e.message;
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `📝 Eval Result:\n\n${result}`
            });
        } catch (error) {
            logger.error('Error in eval command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error executing eval'
            });
        }
    },

    restart: async (sock, msg) => {
        try {
            if (!await ownerCommands.handleOwnerCommand(sock, msg)) return;

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
    },

    // Settings Management
    setprefix: async (sock, msg, args) => {
        try {
            if (!await ownerCommands.handleOwnerCommand(sock, msg)) return;

            if (!args[0]) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a new prefix!\nUsage: .setprefix <new_prefix>'
                });
            }

            const newPrefix = args[0];
            // Update prefix in config or database
            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ Prefix updated to: ${newPrefix}`
            });
        } catch (error) {
            logger.error('Error in setprefix command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to update prefix'
            });
        }
    },

    setname: async (sock, msg, args) => {
        try {
            if (!await ownerCommands.handleOwnerCommand(sock, msg)) return;

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a new name!\nUsage: .setname <new_name>'
                });
            }

            const newName = args.join(' ');
            await sock.updateProfileName(newName);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ Bot name updated to: ${newName}`
            });
        } catch (error) {
            logger.error('Error in setname command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to update bot name'
            });
        }
    },

    setbio: async (sock, msg, args) => {
        try {
            if (!await ownerCommands.handleOwnerCommand(sock, msg)) return;

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a new bio!\nUsage: .setbio <new_bio>'
                });
            }

            const newBio = args.join(' ');
            await sock.updateProfileStatus(newBio);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ Bot bio updated to: ${newBio}`
            });
        } catch (error) {
            logger.error('Error in setbio command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to update bot bio'
            });
        }
    },

    setppbot: async (sock, msg) => {
        try {
            if (!await ownerCommands.handleOwnerCommand(sock, msg)) return;

            if (!msg.message.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image!\nUsage: Reply to an image with .setppbot'
                });
            }

            const media = await downloadMediaMessage(msg, 'buffer');
            await sock.updateProfilePicture(sock.user.id, media);

            await sock.sendMessage(msg.key.remoteJid, {
                text: '✅ Bot profile picture updated!'
            });
        } catch (error) {
            logger.error('Error in setppbot command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to update bot profile picture'
            });
        }
    }
};

module.exports = ownerCommands;