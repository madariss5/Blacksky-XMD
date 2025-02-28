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
                        text: `❌ Command "${command}" not found. Use .help to see all commands.`
                    });
                }

                const helpText = `*Command: ${command}*\n\n` +
                               `📝 Description: ${commandInfo.description}\n` +
                               `🔧 Usage: ${commandInfo.usage || `.${command}`}\n` +
                               `📊 Category: ${commandInfo.category}\n` +
                               (commandInfo.examples ? `\n💡 Examples:\n${commandInfo.examples.join('\n')}` : '');

                return await sock.sendMessage(msg.key.remoteJid, { text: helpText });
            }

            // General help message
            const text = `*${config.botName} Help*\n\n` +
                        `📌 *Basic Commands*:\n` +
                        `• .help - Show this help message\n` +
                        `• .ping - Check bot response\n` +
                        `• .menu - Show all commands\n` +
                        `• .info - Bot information\n` +
                        `• .runtime - Check uptime\n` +
                        `• .speed - Test response speed\n\n` +
                        `Type .menu to see the full command list!\n` +
                        `For detailed help on a command, type .help <command>`;

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

            await sock.sendMessage(msg.key.remoteJid, { 
                text: 'Testing bot response...' 
            });

            const latency = Date.now() - start;
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🤖 *Bot Status*\n\n` +
                      `📡 Response Time: ${latency}ms\n` +
                      `🔄 Connection: Active\n` +
                      `💻 System Load: ${loadAvg[0].toFixed(2)}%\n` +
                      `💾 Memory Usage: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`
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
                if (!categories[info.category]) {
                    categories[info.category] = [];
                }
                categories[info.category].push(`• .${cmd} - ${info.description}`);
            });

            // Build menu text with all categories
            let text = `*${config.botName} Commands*\n\n`;

            // Basic commands first
            if (categories['Basic']) {
                text += `📌 *Basic Commands*\n${categories['Basic'].join('\n')}\n\n`;
            }

            // Then other categories with icons
            const categoryIcons = {
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

            // Add other categories
            Object.entries(categories).forEach(([category, commands]) => {
                if (category !== 'Basic' && commands.length > 0) {
                    const icon = categoryIcons[category] || '📌';
                    text += `${icon} *${category} Commands*\n${commands.join('\n')}\n\n`;
                }
            });

            text += `Use .help <command> for detailed info!`;

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
                        `• Version: ${config.version}\n` +
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

            // Test message sending speed
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
    }
};

module.exports = basicCommands;