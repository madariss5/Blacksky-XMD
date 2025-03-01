const logger = require('pino')();

const utilityCommands = {
    menu: async (sock, msg) => {
        try {
            const menuText = `🤖 *WhatsApp Bot Commands*\n\n` +
                           `*Utility Commands:*\n` +
                           `!menu - Show this menu\n` +
                           `!stats - Show bot statistics\n` +
                           `!report <issue> - Report an issue\n` +
                           `!donate - Support information\n` +
                           `!broadcast <message> - Send message to all groups (admin only)\n` +
                           `!ping - Check bot response time\n` +
                           `!uptime - Show bot uptime\n\n` +

                           `*Group Commands:*\n` +
                           `!groupinfo - Show group information\n` +
                           `!members - List group members\n` +
                           `!admins - List group admins\n` +
                           `!link - Get group invite link (admin only)\n\n` +

                           `*Owner Commands:*\n` +
                           `!shutdown - Shutdown bot (owner only)\n` +
                           `!restart - Restart bot (owner only)\n` +
                           `!update - Check for updates (owner only)`;

            await sock.sendMessage(msg.key.remoteJid, { text: menuText });
        } catch (error) {
            logger.error('Error in menu command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to show menu'
            });
        }
    },

    stats: async (sock, msg) => {
        try {
            const memory = process.memoryUsage();
            const stats = {
                uptime: process.uptime(),
                memory: {
                    used: Math.round(memory.heapUsed / 1024 / 1024),
                    total: Math.round(memory.heapTotal / 1024 / 1024)
                },
                platform: process.platform,
                version: process.version
            };

            const statsText = `📊 *Bot Statistics*\n\n` +
                            `• Status: Online\n` +
                            `• Uptime: ${Math.floor(stats.uptime / 3600)}h ${Math.floor((stats.uptime % 3600) / 60)}m\n` +
                            `• Memory: ${stats.memory.used}MB / ${stats.memory.total}MB\n` +
                            `• Platform: ${stats.platform}\n` +
                            `• Node.js: ${stats.version}`;

            await sock.sendMessage(msg.key.remoteJid, { text: statsText });
        } catch (error) {
            logger.error('Error in stats command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to fetch statistics'
            });
        }
    },

    report: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide an issue to report!\nUsage: !report <issue description>'
                });
            }

            const issue = args.join(' ');
            logger.info('Issue reported:', { 
                issue, 
                reporter: msg.key.participant || msg.key.remoteJid 
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: '✅ Thank you for your report! The issue has been logged for review.'
            });

            // If owner number is set, forward the report
            if (process.env.OWNER_NUMBER) {
                const ownerJid = `${process.env.OWNER_NUMBER}@s.whatsapp.net`;
                await sock.sendMessage(ownerJid, {
                    text: `📝 *New Issue Report*\n\n` +
                          `From: ${msg.key.participant || msg.key.remoteJid}\n` +
                          `Issue: ${issue}`
                });
            }
        } catch (error) {
            logger.error('Error in report command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to submit report'
            });
        }
    },

    donate: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '💝 *Support the Bot*\n\n' +
                      'Thank you for considering a donation!\n' +
                      'Your support helps keep the bot running and improving.\n\n' +
                      'Contact the bot owner for donation information.'
            });
        } catch (error) {
            logger.error('Error in donate command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to show donation information'
            });
        }
    },

    ping: async (sock, msg) => {
        try {
            const start = Date.now();
            await sock.sendMessage(msg.key.remoteJid, { text: '📍 Checking...' });
            const end = Date.now();

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🏓 Pong!\nResponse Time: ${end - start}ms`
            });
        } catch (error) {
            logger.error('Error in ping command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to measure response time'
            });
        }
    },

    uptime: async (sock, msg) => {
        try {
            const uptime = process.uptime();
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `⏱️ *Bot Uptime*\n\n` +
                      `${hours}h ${minutes}m ${seconds}s`
            });
        } catch (error) {
            logger.error('Error in uptime command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to get uptime'
            });
        }
    },

    broadcast: async (sock, msg, args) => {
        try {
            // Check if sender is admin
            if (!process.env.OWNER_NUMBER || 
                !msg.key.remoteJid.includes(process.env.OWNER_NUMBER)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ This command is only available to bot administrators'
                });
            }

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a message to broadcast!\nUsage: !broadcast <message>'
                });
            }

            const message = args.join(' ');
            const groups = await sock.groupFetchAllParticipating();
            let successCount = 0;
            let failCount = 0;

            for (const group of Object.values(groups)) {
                try {
                    await sock.sendMessage(group.id, {
                        text: `📢 *Broadcast Message*\n\n${message}`
                    });
                    successCount++;
                } catch (error) {
                    logger.error('Error broadcasting to group:', error);
                    failCount++;
                }
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `📢 *Broadcast Complete*\n\n` +
                      `✅ Sent to: ${successCount} groups\n` +
                      `❌ Failed: ${failCount} groups`
            });
        } catch (error) {
            logger.error('Error in broadcast command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to broadcast message'
            });
        }
    },

    qrmaker: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide text to convert to QR!\nUsage: !qrmaker <text>'
                });
            }

            const text = args.join(' ');
            // Note: QR generation would go here
            await sock.sendMessage(msg.key.remoteJid, {
                text: '🔄 QR code generation is currently under development.'
            });
        } catch (error) {
            logger.error('Error in qrmaker command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to generate QR code'
            });
        }
    },

    qrreader: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '🔄 QR code reading is currently under development.'
            });
        } catch (error) {
            logger.error('Error in qrreader command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to read QR code'
            });
        }
    },
    help: async (sock, msg) => {
        // Alias for menu command
        await utilityCommands.menu(sock, msg);
    }
};

module.exports = utilityCommands;