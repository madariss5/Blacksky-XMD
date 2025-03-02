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
            // Create fancy header
            let menuText = `╭━━━━『 ${config.botName} 』━━━━⊷\n`;
            menuText += `┃ ⎆ User: ${msg.pushName}\n`;
            menuText += `┃ ⎆ Time: ${moment().format('HH:mm:ss')}\n`;
            menuText += `┃ ⎆ Date: ${moment().format('DD/MM/YYYY')}\n`;
            menuText += `╰━━━━━━━━━━━━━━━━━━⊷\n\n`;

            // Category emojis
            const categoryEmojis = {
                'AI': '🤖',
                'Anime': '🎭',
                'Downloader': '📥',
                'Economy': '💰',
                'Fun': '🎮',
                'Game': '🎲',
                'Group': '👥',
                'Media': '📸',
                'Music': '🎵',
                'NSFW': '🔞',
                'Owner': '👑',
                'Reactions': '🎭',
                'Social': '🌐',
                'Tool': '🛠️',
                'User': '👤',
                'Utility': '⚙️'
            };

            // Read all command files
            const commandsDir = path.join(__dirname);
            const files = await fs.readdir(commandsDir);

            // Process each command file
            for (const file of files) {
                if (file.endsWith('.js')) {
                    try {
                        // Clear require cache to ensure fresh load
                        delete require.cache[require.resolve(path.join(commandsDir, file))];

                        // Get category name from file name
                        const category = file.replace('.js', '');
                        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
                        const emoji = categoryEmojis[categoryName] || '📌';

                        // Import commands from file
                        const commands = require(path.join(commandsDir, file));
                        const commandList = Object.keys(commands);

                        if (commandList.length > 0) {
                            menuText += `╭━━━━『 ${emoji} ${categoryName.toUpperCase()} 』━━━━⊷\n`;
                            commandList.forEach(cmd => {
                                menuText += `┃ ⎆ ${config.prefix}${cmd}\n`;
                            });
                            menuText += `╰━━━━━━━━━━━━━━━━━━⊷\n\n`;
                        }
                    } catch (error) {
                        logger.error(`Error loading commands from ${file}:`, error);
                    }
                }
            }

            // Add footer
            menuText += `╭━━━━『 INFO 』━━━━⊷\n`;
            menuText += `┃ ⎆ Prefix: ${config.prefix}\n`;
            menuText += `┃ ⎆ Owner: ${config.ownerName}\n`;
            menuText += `╰━━━━━━━━━━━━━━━━━━⊷\n\n`;
            menuText += `Type ${config.prefix}help <command> for details`;

            // Send menu with image
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
                        `• ${config.prefix}info - Show bot information\n\n` +
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
    }
};

module.exports = basicCommands;