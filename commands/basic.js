const config = require('../config');
const logger = require('pino')();
const os = require('os');

const startTime = Date.now(); // Track bot start time

const basicCommands = {
    help: async (sock, msg, args) => {
        try {
            logger.debug('Executing help command', { args });

            // If a specific command is provided, show detailed help
            if (args.length > 0) {
                const command = args[0].toLowerCase();
                const commandInfo = config.commands[command];

                if (!commandInfo) {
                    return await sock.sendMessage(msg.key.remoteJid, {
                        text: `❌ Command "${command}" not found. Use ${config.prefix}help to see all commands.`
                    });
                }

                const helpText = `*Command: ${command}*\n\n` +
                                `📝 Description: ${commandInfo.description}\n` +
                                `🔧 Usage: ${commandInfo.usage || `${config.prefix}${command}`}\n` +
                                `📊 Category: ${commandInfo.category}\n` +
                                (commandInfo.examples ? `\n💡 Examples:\n${commandInfo.examples.join('\n')}` : '');

                return await sock.sendMessage(msg.key.remoteJid, { text: helpText });
            }

            // General help message with improved formatting
            const basicCmds = ['help', 'ping', 'menu', 'info', 'runtime', 'speed', 'profile', 'me']
                .map(cmd => `• ${config.prefix}${cmd} - ${config.commands[cmd].description}`)
                .join('\n');

            const text = `*${config.botName} Help*\n\n` +
                        `📌 *Basic Commands*\n${basicCmds}\n\n` +
                        `Type ${config.prefix}menu to see the full command list!\n` +
                        `For detailed help on a command, type ${config.prefix}help <command>`;

            await sock.sendMessage(msg.key.remoteJid, { text });
            logger.info('Help command executed successfully');
        } catch (error) {
            logger.error('Help command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing help menu: ' + error.message
            });
        }
    },

    ping: async (sock, msg) => {
        try {
            logger.debug('Executing ping command');
            const start = Date.now();

            const loadAvg = os.loadavg();
            const memUsage = process.memoryUsage();

            // Send initial message and measure response time
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

            logger.info('Ping command executed successfully', { latency });
        } catch (error) {
            logger.error('Ping command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error checking bot status: ' + error.message
            });
        }
    },

    menu: async (sock, msg) => {
        try {
            logger.debug('Executing menu command');

            // Group commands by category
            const categories = {};
            Object.entries(config.commands).forEach(([cmd, info]) => {
                const category = info.category || 'Uncategorized';
                if (!categories[category]) {
                    categories[category] = [];
                }
                categories[category].push(`• ${config.prefix}${cmd} - ${info.description}`);
            });

            // Build menu text with all categories
            let text = `*${config.botName} Commands*\n\n`;

            // Basic commands first
            if (categories['Basic']) {
                text += `📌 *Basic Commands*\n${categories['Basic'].join('\n')}\n\n`;
            }

            // Then other categories with icons
            const categoryIcons = {
                'Basic': '📌',
                'Media': '🎨',
                'Downloader': '📥',
                'Music': '🎵',
                'AI': '🤖',
                'Group': '👥',
                'Fun': '🎮',
                'Game': '🎲',
                'Economy': '💰',
                'Anime': '🎌',
                'Utility': '🛠️',
                'Owner': '👑',
                'NSFW': '🔞',
                'Debug': '🐛'
            };

            Object.entries(categories).forEach(([category, commands]) => {
                if (category !== 'Basic' && commands.length > 0) {
                    const icon = categoryIcons[category] || '📌';
                    text += `${icon} *${category} Commands*\n${commands.join('\n')}\n\n`;
                }
            });

            text += `💡 Use ${config.prefix}help <command> for detailed info!`;

            await sock.sendMessage(msg.key.remoteJid, { text });
            logger.info('Menu command executed successfully');
        } catch (error) {
            logger.error('Menu command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing menu: ' + error.message
            });
        }
    },

    info: async (sock, msg) => {
        try {
            logger.debug('Executing info command');

            const uptimeInSeconds = (Date.now() - startTime) / 1000;
            const days = Math.floor(uptimeInSeconds / 86400);
            const hours = Math.floor((uptimeInSeconds % 86400) / 3600);
            const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
            const seconds = Math.floor(uptimeInSeconds % 60);

            const text = `*${config.botName} Information*\n\n` +
                        `🤖 *Bot Details*\n` +
                        `• Name: ${config.botName}\n` +
                        `• Owner: ${config.ownerName}\n` +
                        `• Prefix: ${config.prefix}\n\n` +
                        `⚙️ *System Info*\n` +
                        `• Platform: ${os.platform()}\n` +
                        `• Node.js: ${process.version}\n` +
                        `• Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\n` +
                        `• CPU Usage: ${(os.loadavg()[0]).toFixed(2)}%\n\n` +
                        `⏰ *Runtime*\n` +
                        `• Uptime: ${days}d ${hours}h ${minutes}m ${seconds}s\n` +
                        `• Started: ${new Date(startTime).toLocaleString()}\n\n` +
                        `📊 *Statistics*\n` +
                        `• Total Commands: ${Object.keys(config.commands).length}`;

            await sock.sendMessage(msg.key.remoteJid, { text });
            logger.info('Info command executed successfully');
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
            logger.info('Starting profile command execution', {
                sender: msg.key.remoteJid,
                args: args
            });
            const store = require('../database/store');
            logger.debug('Store module loaded successfully');

            // Get target user (mentioned user or command sender)
            const mentionedJid = args[0]?.replace('@', '') + '@s.whatsapp.net' || msg.key.remoteJid;
            logger.debug('Profile lookup for:', { mentionedJid });

            const userData = store.get('users')?.[mentionedJid] || {
                name: mentionedJid.split('@')[0],
                commands: 0,
                joinedAt: new Date().toISOString()
            };
            logger.debug('Retrieved user data:', { userData });

            const text = `👤 *User Profile*\n\n` +
                        `• Name: ${userData.name}\n` +
                        `• Number: @${mentionedJid.split('@')[0]}\n` +
                        `• Commands Used: ${userData.commands || 0}\n` +
                        `• Joined: ${new Date(userData.joinedAt).toLocaleDateString()}\n` +
                        `• Status: ${store.getBannedUsers().includes(mentionedJid) ? '🚫 Banned' : '✅ Active'}`;

            await sock.sendMessage(msg.key.remoteJid, {
                text,
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
            const userId = msg.key.remoteJid;
            logger.debug('Me command for user:', { userId });

            const userData = store.get('users')?.[userId] || {
                name: userId.split('@')[0],
                commands: 0,
                joinedAt: new Date().toISOString()
            };
            logger.debug('Retrieved user data:', { userData });

            // Get additional user stats
            const totalGroups = store.get('chats')?.filter(id => id.endsWith('@g.us')).length || 0;
            const warnings = store.getWarnings(userId).length;
            logger.debug('Retrieved additional stats:', {
                totalGroups,
                warnings
            });

            const text = `📱 *Your Profile*\n\n` +
                        `• Name: ${userData.name}\n` +
                        `• Number: @${userId.split('@')[0]}\n` +
                        `• Commands Used: ${userData.commands || 0}\n` +
                        `• Joined: ${new Date(userData.joinedAt).toLocaleDateString()}\n` +
                        `• Warnings: ${warnings}/3\n` +
                        `• Groups: ${totalGroups}\n` +
                        `• Status: ${store.getBannedUsers().includes(userId) ? '🚫 Banned' : '✅ Active'}`;

            await sock.sendMessage(msg.key.remoteJid, {
                text,
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
    }

};

module.exports = basicCommands;