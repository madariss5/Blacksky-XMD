const pino = require('pino');
const logger = pino({ level: 'silent' });
const os = require('os');
const moment = require('moment-timezone');
const config = require('../config');
const fs = require('fs').promises;
const path = require('path');

const basicCommands = {
    menu: async (sock, msg) => {
        try {
            // Create fancy header with timestamp
            let menuText = `╭━━━━『 ${config.botName} 』━━━━┈⊷\n`;
            menuText += `│ ⎆  User: ${msg.pushName || 'User'}\n`;
            menuText += `│ ⎆  Time: ${moment().format('HH:mm:ss')}\n`;
            menuText += `│ ⎆  Date: ${moment().format('DD/MM/YYYY')}\n`;
            menuText += `╰━━━━━━━━━━━━━━━┈⊷\n\n`;

            // Define command categories with emojis
            const categories = {
                'ai': { emoji: '🤖', title: 'AI Commands' },
                'anime': { emoji: '🎭', title: 'Anime Commands' },
                'downloader': { emoji: '📥', title: 'Downloader' },
                'economy': { emoji: '💰', title: 'Economy' },
                'fun': { emoji: '🎮', title: 'Fun & Games' },
                'game': { emoji: '🎲', title: 'Gaming' },
                'group': { emoji: '👥', title: 'Group Commands' },
                'media': { emoji: '📸', title: 'Media Commands' },
                'music': { emoji: '🎵', title: 'Music' },
                'nsfw': { emoji: '🔞', title: 'NSFW' },
                'owner': { emoji: '👑', title: 'Owner Commands' },
                'reactions': { emoji: '🎭', title: 'Reactions' },
                'social': { emoji: '🌐', title: 'Social Media' },
                'tool': { emoji: '🛠️', title: 'Tools' },
                'user': { emoji: '👤', title: 'User Commands' },
                'utility': { emoji: '⚙️', title: 'Utility' }
            };

            // Read commands directory
            const commandsDir = path.join(__dirname, '../commands');
            const commandFiles = await fs.readdir(commandsDir);

            // Process each command file
            for (const category of Object.keys(categories)) {
                const filename = `${category}.js`;
                if (commandFiles.includes(filename)) {
                    try {
                        const commands = require(`./${filename}`);
                        const cmdList = Object.keys(commands);

                        if (cmdList.length > 0) {
                            const { emoji, title } = categories[category];
                            menuText += `╭─❏ ${emoji} *${title}*\n`;
                            cmdList.forEach(cmd => {
                                menuText += `│ ⎆ ${config.prefix}${cmd}\n`;
                            });
                            menuText += `╰─────────────────◆\n\n`;
                        }
                    } catch (error) {
                        logger.error(`Error loading ${category} commands:`, error);
                    }
                }
            }

            // Add footer
            menuText += `╭━━━━『 Bot Info 』━━━━┈⊷\n`;
            menuText += `│ ⎆ Prefix: ${config.prefix}\n`;
            menuText += `│ ⎆ Owner: ${config.ownerName}\n`;
            menuText += `╰━━━━━━━━━━━━━━━┈⊷\n\n`;
            menuText += `Type ${config.prefix}help <command> for details`;

            // Send menu with anime image
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: config.menuImage },
                caption: menuText,
                gifPlayback: false
            });

            logger.info('Menu command executed successfully');
        } catch (error) {
            logger.error('Menu command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing menu: ' + error.message
            });
        }
    },
    help: async (sock, msg, args) => {
        try {
            if (args.length > 0) {
                const command = args[0].toLowerCase();
                const cmdInfo = config.commands[command];

                if (cmdInfo) {
                    await sock.sendMessage(msg.key.remoteJid, {
                        text: `*Command: ${config.prefix}${command}*\n\n` +
                              `📝 Description: ${cmdInfo.description}\n` +
                              `📁 Category: ${cmdInfo.category}`
                    });
                    return;
                }
            }

            const text = `*🤖 ${config.botName} Help*\n\n` +
                        `Basic Commands:\n` +
                        `• ${config.prefix}help - Show this help message\n` +
                        `• ${config.prefix}ping - Check bot response time\n` +
                        `• ${config.prefix}info - Show bot information\n` +
                        `• ${config.prefix}menu - Show all available commands\n\n` +
                        `Type ${config.prefix}menu to see full command list!`;

            await sock.sendMessage(msg.key.remoteJid, { text });
        } catch (error) {
            logger.error('Help command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing help menu: ' + error.message
            });
        }
    },
    ping: async (sock, msg) => {
        try {
            const start = Date.now();
            const loadAvg = os.loadavg();
            const memUsage = process.memoryUsage();

            await sock.sendMessage(msg.key.remoteJid, { 
                text: '🏓 Testing bot response...' 
            });

            const latency = Date.now() - start;
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🏓 *Pong!*\n\n` +
                      `🕒 Response: ${latency}ms\n` +
                      `💻 System Load: ${loadAvg[0].toFixed(2)}%\n` +
                      `💾 Memory: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`
            });

        } catch (error) {
            logger.error('Ping command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error checking bot status: ' + error.message
            });
        }
    },
    info: async (sock, msg) => {
        try {
            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor((uptime % 86400) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);

            const text = `*🤖 Bot Information*\n\n` +
                        `*System Info*\n` +
                        `• Platform: ${os.platform()}\n` +
                        `• Node.js: ${process.version}\n` +
                        `• Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\n` +
                        `• CPU Load: ${(os.loadavg()[0]).toFixed(2)}%\n\n` +
                        `*Runtime*\n` +
                        `• Uptime: ${days}d ${hours}h ${minutes}m ${seconds}s\n` +
                        `• Started: ${moment().subtract(uptime, 'seconds').format('YYYY-MM-DD HH:mm:ss')}\n\n` +
                        `*Status*: 🟢 Online`;

            await sock.sendMessage(msg.key.remoteJid, { text });
        } catch (error) {
            logger.error('Info command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing bot info: ' + error.message
            });
        }
    },
    runtime: async (sock, msg) => {
        try {
            logger.debug('Executing runtime command');

            const uptimeInSeconds = (Date.now() - startTime) / 1000;
            const days = Math.floor(uptimeInSeconds / 86400);
            const hours = Math.floor((uptimeInSeconds % 86400) / 3600);
            const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
            const seconds = Math.floor(uptimeInSeconds % 60);

            const text = `⏰ *Bot Runtime*\n\n` +
                        `• Uptime: ${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds\n` +
                        `• Started: ${new Date(startTime).toLocaleString()}`;

            await sock.sendMessage(msg.key.remoteJid, { text });
            logger.info('Runtime command executed successfully');
        } catch (error) {
            logger.error('Runtime command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error checking runtime: ' + error.message
            });
        }
    },
    speed: async (sock, msg) => {
        try {
            logger.debug('Executing speed command');
            const start = Date.now();

            // Send initial message
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '🚀 Testing bot speed...' 
            });

            // Test system performance
            const loadAvg = os.loadavg();
            const memUsage = process.memoryUsage();
            const responseTime = Date.now() - start;

            const text = `🚀 *Speed Test Results*\n\n` +
                        `• Response Time: ${responseTime}ms\n` +
                        `• System Load: ${loadAvg[0].toFixed(2)}%\n` +
                        `• Memory Usage: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB\n` +
                        `• Node.js Version: ${process.version}`;

            await sock.sendMessage(msg.key.remoteJid, { text });
            logger.info('Speed command executed successfully', { responseTime });
        } catch (error) {
            logger.error('Speed command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error testing bot speed: ' + error.message
            });
        }
    },
    profile: async (sock, msg, args) => {
        try {
            if (!msg.key.participant) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: 'Could not identify user. Please try again.'
                });
            }

            logger.info('Starting profile command execution', {
                sender: msg.key.participant || msg.key.remoteJid,
                args: args
            });
            const store = require('../database/store');
            logger.debug('Store module loaded successfully');

            // Get target user (mentioned user or command sender)
            const mentionedJid = args[0]?.replace('@', '') + '@s.whatsapp.net' || msg.key.participant || msg.key.remoteJid;
            logger.debug('Profile lookup for:', { mentionedJid });

            // Get user's profile picture URL
            let ppUrl;
            try {
                ppUrl = await sock.profilePictureUrl(mentionedJid, 'image');
            } catch (error) {
                logger.warn('Failed to fetch profile picture:', error);
                ppUrl = 'https://raw.githubusercontent.com/WhiskeySockets/Baileys/master/src/BaileysDefaultImage.png';
            }

            const userData = await store.getUserData(mentionedJid) || {};
            logger.debug('Retrieved user data:', { userData });

            // Calculate level progress
            const nextLevelXP = Math.pow((userData.level || 1) + 1, 2) * 100;
            const progress = ((userData.xp || 0) / nextLevelXP) * 100;
            const progressBar = '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));

            // Get warnings count and format warning display
            const warnings = (await store.getWarnings(mentionedJid) || []).length;
            const warningDisplay = '⚠️'.repeat(warnings) + '○'.repeat(3 - warnings);

            // Get WhatsApp contact name directly from the pushName property
            const displayName = msg.pushName || mentionedJid.split('@')[0];

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: ppUrl },
                caption: `👤 *User Profile*\n\n` +
                        `• Name: ${displayName}\n` +
                        `• Number: ${await formatPhoneNumber(mentionedJid)}\n` +
                        `• Level: ${userData.level || 1}\n` +
                        `• XP: ${userData.xp || 0}/${nextLevelXP}\n` +
                        `• Progress: [${progressBar}] ${Math.floor(progress)}%\n` +
                        `• Commands Used: ${userData.commands || 0} commands\n` +
                        `• Command Activity: ${userData.commands ? '🟢 Active' : '🔴 Inactive'}\n` +
                        `• Warnings: ${warningDisplay} (${warnings}/3)\n` +
                        `• Joined: ${new Date(userData.joinedAt || Date.now()).toLocaleDateString()}\n` +
                        `• Status: ${(await store.getBannedUsers() || []).includes(mentionedJid) ? '🚫 Banned' : '✅ Active'}`,
                mentions: [mentionedJid]
            });
            logger.info('Profile command completed successfully');
        } catch (error) {
            logger.error('Profile command failed:', {
                error: error.message,
                stack: error.stack
            });
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing profile: ' + error.message
            });
        }
    },
    me: async (sock, msg) => {
        try {
            logger.info('Starting me command execution', {
                sender: msg.key.remoteJid
            });
            const store = require('../database/store');
            logger.debug('Store module loaded successfully');

            // Get sender's data
            const userId = msg.key.participant || msg.key.remoteJid;
            logger.debug('Me command for user:', { userId });

            // Get user's profile picture URL
            let ppUrl;
            try {
                ppUrl = await sock.profilePictureUrl(userId, 'image');
            } catch (error) {
                logger.warn('Failed to fetch profile picture:', error);
                ppUrl = 'https://raw.githubusercontent.com/WhiskeySockets/Baileys/master/src/BaileysDefaultImage.png';
            }

            const userData = await store.getUserData(userId) || {};
            logger.debug('Retrieved user data:', { userData });

            // Calculate level progress
            const nextLevelXP = Math.pow((userData.level || 1) + 1, 2) * 100;
            const progress = ((userData.xp || 0) / nextLevelXP) * 100;
            const progressBar = '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));

            // Get warnings count and format warning display
            const warnings = (await store.getWarnings(userId) || []).length;
            const warningDisplay = '⚠️'.repeat(warnings) + '○'.repeat(3 - warnings);

            // Get WhatsApp contact name directly from the pushName property
            const displayName = msg.pushName || userId.split('@')[0];

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: ppUrl },
                caption: `📱 *Your Profile*\n\n` +
                        `• Name: ${displayName}\n` +
                        `• Number: ${await formatPhoneNumber(userId)}\n` +
                        `• Level: ${userData.level || 1}\n` +
                        `• XP: ${userData.xp || 0}/${nextLevelXP}\n` +
                        `• Progress: [${progressBar}] ${Math.floor(progress)}%\n` +
                        `• Commands Used: ${userData.commands || 0} commands\n` +
                        `• Command Activity: ${userData.commands ? '🟢 Active' : '🔴 Inactive'}\n` +
                        `• Warnings: ${warningDisplay} (${warnings}/3)\n` +
                        `• Joined: ${new Date(userData.joinedAt || Date.now()).toLocaleDateString()}\n` +
                        `• Status: ${(await store.getBannedUsers() || []).includes(userId) ? '🚫 Banned' : '✅ Active'}`,
                mentions: [userId]
            });
            logger.info('Me command completed successfully');
        } catch (error) {
            logger.error('Me command failed:', {
                error: error.message,
                stack: error.stack
            });
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing your profile: ' + error.message
            });
        }
    },
    creator: async (sock, msg) => {
        try {
            const text = `*👨‍💻 Bot Creator Info*\n\n` +
                        `• Name: ${config.ownerName}\n` +
                        `• Number: ${config.ownerNumber.split('@')[0]}\n` +
                        `• Bot Name: ${config.botName}\n` +
                        `• Version: 1.0.0\n` +
                        `• Language: Node.js\n` +
                        `• Library: @whiskeysockets/baileys\n\n` +
                        `Contact the creator for business inquiries or support!`;

            await sock.sendMessage(msg.key.remoteJid, { text });
            logger.info('Creator command executed successfully');
        } catch (error) {
            logger.error('Creator command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing creator info: ' + error.message
            });
        }
    },
    sc: async (sock, msg) => {
        try {
            const text = `*🌟 Bot Source Code*\n\n` +
                        `This bot is powered by BLACKSKY-MD!\n\n` +
                        `• GitHub: https://github.com/blacksky-md/bot\n` +
                        `• License: MIT\n\n` +
                        `Remember to ⭐ the repository if you like it!`;

            await sock.sendMessage(msg.key.remoteJid, { text });
            logger.info('Source code command executed successfully');
        } catch (error) {
            logger.error('Source code command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing source code: ' + error.message
            });
        }
    },
    tqto: async (sock, msg) => {
        try {
            const text = `*🙏 Special Thanks To*\n\n` +
                        `• WhiskeySockets/Baileys\n` +
                        `• Nodejs Community\n` +
                        `• All Bot Users\n` +
                        `• All Contributors\n\n` +
                        `And everyone who has supported the development!`;

            await sock.sendMessage(msg.key.remoteJid, { text });
            logger.info('Thanks to command executed successfully');
        } catch (error) {
            logger.error('Thanks to command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing credits: ' + error.message
            });
        }
    },
    changelog: async (sock, msg) => {
        try {
            const text = `*📝 Recent Updates*\n\n` +
                        `v1.0.0 (Latest)\n` +
                        `• Added 50+ new commands\n` +
                        `• Improved NSFW command handling\n` +
                        `• Enhanced group management\n` +
                        `• Added new game modes\n` +
                        `• Bug fixes and optimizations\n\n` +
                        `Type ${config.prefix}menu to see all commands!`;

            await sock.sendMessage(msg.key.remoteJid, { text });
            logger.info('Changelog command executed successfully');
        } catch (error) {
            logger.error('Changelog command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing changelog: ' + error.message
            });
        }
    },
    dashboard: async (sock, msg) => {
        try {
            const store = require('../database/store');
            const stats = {
                users: Object.keys(store.get('users') || {}).length,
                groups: store.get('chats')?.filter(id => id.endsWith('@g.us')).length || 0,
                commands: Object.keys(config.commands).length,
                uptime: process.uptime()
            };

            const text = `📊 *Bot Dashboard*\n\n` +
                        `• Total Users: ${stats.users}\n` +
                        `• Total Groups: ${stats.groups}\n` +
                        `• Commands Available: ${stats.commands}\n` +
                        `• Messages Processed: ${store.get('messageCount') || 0}\n` +
                        `• Uptime: ${Math.floor(stats.uptime / 3600)}h ${Math.floor((stats.uptime % 3600) / 60)}m\n\n` +
                        `Type ${config.prefix}stats for more details!`;

            await sock.sendMessage(msg.key.remoteJid, { text });
            logger.info('Dashboard command executed successfully');
        } catch (error) {
            logger.error('Dashboard command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing dashboard: ' + error.message
            });
        }
    },
    rank: async (sock, msg) => {
        try {
            const store = require('../database/store');
            const userId = msg.key.participant || msg.key.remoteJid;
            const userData = await store.getUserData(userId) || {};

            // Calculate level progress
            const nextLevelXP = Math.pow((userData.level || 1) + 1, 2) * 100;
            const progress = ((userData.xp || 0) / nextLevelXP) * 100;
            const progressBar = '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));

            const text = `🏆 *Your Rank*\n\n` +
                        `• Level: ${userData.level || 1}\n` +
                        `• XP: ${userData.xp || 0}/${nextLevelXP}\n` +
                        `• Progress: [${progressBar}] ${Math.floor(progress)}%\n` +
                        `• Commands Used: ${userData.commands || 0}\n` +
                        `• Rank: #${await store.getUserRank(userId) || '??'}\n\n` +
                        `Keep using commands to gain XP and level up!`;

            await sock.sendMessage(msg.key.remoteJid, { text });
            logger.info('Rank command executed successfully');
        } catch (error) {
            logger.error('Rank command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing rank: ' + error.message
            });
        }
    },
    premium: async (sock, msg) => {
        try {
            const store = require('../database/store');
            const isPremium = await store.isPremiumUser(msg.key.participant || msg.key.remoteJid);

            const text = `💎 *Premium Status*\n\n` +
                        `• Status: ${isPremium ? '✅ Premium' : '❌ Free User'}\n` +
                        `${isPremium ? '• Premium Features:\n' +
                        '  - No command cooldowns\n' +
                        '  - Access to premium commands\n' +
                        '  - Priority support\n' +
                        '  - And more!' : 
                        '• Get Premium to unlock:\n' +
                        '  - No command cooldowns\n' +
                        '  - Access to premium commands\n' +
                        '  - Priority support\n' +
                        '  - And more!\n\n' +
                        `Contact ${config.ownerNumber.split('@')[0]} to get Premium!`}`;

            await sock.sendMessage(msg.key.remoteJid, { text });
            logger.info('Premium command executed successfully');
        } catch (error) {
            logger.error('Premium command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error checking premium status: ' + error.message
            });
        }
    },
    about: async (sock, msg) => {
        try {
            const text = `📱 *About ${config.botName}*\n\n` +
                        `${config.botName} is a sophisticated WhatsApp Multi-Device bot with resilient AI integration, featuring an advanced local response system and intelligent communication strategies.\n\n` +
                        `*Key Features:*\n` +
                        `• Advanced AI Integration\n` +
                        `• Smart Response System\n` +
                        `• Group Management\n` +
                        `• Games & Fun Commands\n` +
                        `• Media & Sticker Tools\n` +
                        `• And much more!\n\n` +
                        `*Technical Details:*\n` +
                        `• Version: 1.0.0\n` +
                        `• Library: @whiskeysockets/baileys\n` +
                        `• Platform: ${os.platform()}\n` +
                        `• Node.js: ${process.version}\n\n` +
                        `Type ${config.prefix}menu to explore all features!`;

            await sock.sendMessage(msg.key.remoteJid, { text });
            logger.info('About command executed successfully');
        } catch (error) {
            logger.error('About command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing about info: ' + error.message
            });
        }
    },
    rules: async (sock, msg) => {
        try {
            const text = `📜 *Bot Rules*\n\n` +
                        `1. No spam or excessive command usage\n` +
                        `2. Respect bot owner and other users\n` +
                        `3. Don't abuse the bot features\n` +
                        `4. Report bugs using ${config.prefix}report\n` +
                        `5. NSFW content only in NSFW-enabled groups\n` +
                        `6. Follow group rules when using bot\n` +
                        `7. Don't use bot for illegal activities\n\n` +
                        `Breaking rules may result in:\n` +
                        `• Temporary ban\n` +
                        `• Permanent ban\n` +
                        `• Group restriction\n\n` +
                        `Enjoy using the bot responsibly! 😊`;

            await sock.sendMessage(msg.key.remoteJid, { text });
            logger.info('Rules command executed successfully');
        } catch (error) {
            logger.error('Rules command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing rules: ' + error.message
            });
        }
    },
    status: async (sock, msg) => {
        try {
            const uptime = process.uptime();
            const memUsage = process.memoryUsage();
            const loadAvg = os.loadavg();

            const text = `🤖 *Bot Status*\n\n` +
                        `• Name: ${config.botName}\n` +
                        `• Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m\n` +
                        `• Memory: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB\n` +
                        `• CPU Load: ${loadAvg[0].toFixed(2)}%\n` +
                        `• Node.js: ${process.version}\n` +
                        `• Platform: ${os.platform()}\n` +
                        `• Status: 🟢 Online`;

            await sock.sendMessage(msg.key.remoteJid, { text });
            logger.info('Status command executed successfully');
        } catch (error) {
            logger.error('Status command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error checking status: ' + error.message
            });
        }
    }
};

const startTime = Date.now();
async function formatPhoneNumber(jid) {
    // Remove any @s.whatsapp.net or @g.us suffix and format the number
    const cleanNumber = jid.split('@')[0];
    // Format with spaces for display (e.g., +49 123 456 7890)
    return cleanNumber.replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, '+$1 $2 $3 $4');
}

module.exports = basicCommands;