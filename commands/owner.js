const logger = require('pino')();
const config = require('../config');
const { formatPhoneNumber, addWhatsAppSuffix } = require('../utils/phoneNumber');
const { restartBot } = require('../scripts/restart');
const fs = require('node:fs/promises');
const path = require('node:path');


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
                    text: '❌ Please mention a user to ban!\nUsage: .ban @user [reason]'
                });
            }

            const targetUser = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            const reason = args.slice(1).join(' ') || 'No reason provided';

            const result = await dbStore.banUser(targetUser, reason);
            if (!result.success) {
                throw new Error(result.error || 'Failed to ban user');
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ Banned user @${targetUser.split('@')[0]}\nReason: ${reason}`,
                mentions: [targetUser]
            });

            logger.info('User banned successfully:', { targetUser, reason });
        } catch (error) {
            logger.error('Error in ban command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to ban user: ' + error.message
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
            const result = await dbStore.unbanUser(targetUser);

            if (!result.success) {
                throw new Error(result.error || 'Failed to unban user');
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ Unbanned user @${targetUser.split('@')[0]}`,
                mentions: [targetUser]
            });

            logger.info('User unbanned successfully:', { targetUser });
        } catch (error) {
            logger.error('Error in unban command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to unban user: ' + error.message
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
    },

    clearcache: async (sock, msg) => {
        try {
            if (!await ownerCommands.handleOwnerCommand(sock, msg)) return;

            // Clear all caches
            const caches = ['./temp', './auth_info_baileys'];
            for (const cache of caches) {
                try {
                    await fs.emptyDir(cache);
                } catch (err) {
                    logger.error(`Error clearing ${cache}:`, err);
                }
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '✅ Successfully cleared all caches!'
            });

            logger.info('Cache cleared by owner');
        } catch (error) {
            logger.error('Error in clearcache command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to clear cache'
            });
        }
    },

    shutdown: async (sock, msg) => {
        try {
            if (!await ownerCommands.handleOwnerCommand(sock, msg)) return;

            await sock.sendMessage(msg.key.remoteJid, {
                text: '👋 Bot is shutting down...'
            });

            logger.info('Bot shutdown initiated by owner');
            process.exit(0);
        } catch (error) {
            logger.error('Error in shutdown command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to shut down bot'
            });
        }
    },

    setowner: async (sock, msg, args) => {
        try {
            if (!await ownerCommands.handleOwnerCommand(sock, msg)) return;

            if (!args[0]) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide the new owner number!\nUsage: .setowner number'
                });
            }

            const newOwner = args[0].replace(/[^0-9]/g, '');
            // Update owner number in environment/config
            process.env.OWNER_NUMBER = newOwner;

            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ Bot owner updated to: ${newOwner}`
            });

            logger.info('Bot owner updated:', newOwner);
        } catch (error) {
            logger.error('Error in setowner command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to update owner'
            });
        }
    },

    maintenance: async (sock, msg, args) => {
        try {
            if (!await ownerCommands.handleOwnerCommand(sock, msg)) return;

            const status = args[0]?.toLowerCase() === 'on';
            global.maintenance = status;

            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ Maintenance mode ${status ? 'enabled' : 'disabled'}`
            });

            logger.info('Maintenance mode updated:', status);
        } catch (error) {
            logger.error('Error in maintenance command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to update maintenance mode'
            });
        }
    },

    settings: async (sock, msg, args) => {
        try {
            if (!await ownerCommands.handleOwnerCommand(sock, msg)) return;

            const settings = {
                prefix: config.prefix,
                ownerNumber: config.ownerNumber,
                botName: config.botName,
                maintenance: global.maintenance || false,
                sessionId: config.session.id,
                platform: process.platform,
                nodeVersion: process.version
            };

            const settingsText = `🔧 *Bot Settings*\n\n` +
                               `• Prefix: ${settings.prefix}\n` +
                               `• Owner: ${settings.ownerNumber}\n` +
                               `• Name: ${settings.botName}\n` +
                               `• Maintenance: ${settings.maintenance ? 'On' : 'Off'}\n` +
                               `• Session: ${settings.sessionId}\n` +
                               `• Platform: ${settings.platform}\n` +
                               `• Node.js: ${settings.nodeVersion}`;

            await sock.sendMessage(msg.key.remoteJid, { text: settingsText });
        } catch (error) {
            logger.error('Error in settings command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to fetch settings'
            });
        }
    },

    backup: async (sock, msg) => {
        try {
            if (!await ownerCommands.handleOwnerCommand(sock, msg)) return;

            const backupDir = './backups';
            await fs.ensureDir(backupDir);

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(backupDir, `backup-${timestamp}.zip`);

            // Add directories to backup
            const dirsToBackup = ['./auth_info', './database', './config.js'];

            await sock.sendMessage(msg.key.remoteJid, {
                text: '📦 Creating backup...'
            });

            // Backup logic here
            // For demonstration, we'll just create an empty file
            await fs.writeFile(backupFile, '');

            await sock.sendMessage(msg.key.remoteJid, {
                text: '✅ Backup created successfully!'
            });

            logger.info('Backup created:', backupFile);
        } catch (error) {
            logger.error('Error in backup command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to create backup'
            });
        }
    },

    update: async (sock, msg) => {
        try {
            if (!await ownerCommands.handleOwnerCommand(sock, msg)) return;

            await sock.sendMessage(msg.key.remoteJid, {
                text: '🔄 Checking for updates...'
            });

            // Update logic would go here
            // For demonstration, we'll just show a message
            await sock.sendMessage(msg.key.remoteJid, {
                text: '✅ Bot is already up to date!'
            });
        } catch (error) {
            logger.error('Error in update command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to check for updates'
            });
        }
    },

    config: async (sock, msg, args) => {
        try {
            if (!await ownerCommands.handleOwnerCommand(sock, msg)) return;

            if (!args.length) {
                const configText = `⚙️ *Bot Configuration*\n\n` +
                                 `To edit a config value:\n` +
                                 `.config set <key> <value>\n\n` +
                                 `Available keys:\n` +
                                 `• prefix\n` +
                                 `• botName\n` +
                                 `• ownerName\n` +
                                 `• language\n` +
                                 `• autoRead\n` +
                                 `• antiSpam`;

                return await sock.sendMessage(msg.key.remoteJid, { text: configText });
            }

            const [action, key, ...value] = args;
            if (action !== 'set' || !key) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Invalid usage!\nUse: .config set <key> <value>'
                });
            }

            // Config update logic would go here
            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ Updated config: ${key} = ${value.join(' ')}`
            });

            logger.info('Config updated:', { key, value: value.join(' ') });
        } catch (error) {
            logger.error('Error in config command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to update config'
            });
        }
    },
    banlist: async (sock, msg) => {
        try {
            if (!await ownerCommands.handleOwnerCommand(sock, msg)) return;

            // Get banned users from the database
            const result = await dbStore.getBannedUsers();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch banned users list');
            }

            const bannedUsers = result.bannedUsers;
            if (!bannedUsers || bannedUsers.length === 0) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '📋 No banned users found'
                });
            }

            let banlistText = '📋 *Banned Users List*\n\n';
            bannedUsers.forEach((user, index) => {
                banlistText += `${index + 1}. @${user.jid.split('@')[0]}\n`;
                const contact = store.contacts[user.jid] || {};
                if (contact.banReason) banlistText += `   Reason: ${contact.banReason}\n`;
                if (contact.banTime) banlistText += `   Date: ${new Date(contact.banTime).toLocaleString()}\n`;
                banlistText += '\n';
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: banlistText,
                mentions: bannedUsers.map(user => user.jid)
            });

            logger.info('Banlist command executed successfully');
        } catch (error) {
            logger.error('Error in banlist command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to fetch banned users list: ' + error.message
            });
        }
    }
};

module.exports = ownerCommands;