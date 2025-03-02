const logger = require('pino')();
const os = require('os');
const moment = require('moment-timezone');
const config = require('../config');
const handler = require('../handler');

const basicCommands = {
    menu: async (sock, msg) => {
        try {
            logger.info('Generating menu...');

            // Header
            let menuText = `╔══《 ${config.botName} MENU 》══╗\n`;
            menuText += `║ 👤 User: ${msg.pushName}\n`;
            menuText += `║ ⏰ Time: ${moment().format('HH:mm:ss')}\n`;
            menuText += `║ 📅 Date: ${moment().format('DD/MM/YYYY')}\n`;
            menuText += `╚════════════════════╝\n\n`;

            // Organize commands by category
            const categories = {};
            const implementedCommands = handler.allCommands;

            // Process commands from config and check if they're implemented
            Object.entries(config.commands).forEach(([cmd, info]) => {
                if (implementedCommands[cmd]) {  // Only show implemented commands
                    const category = info.category;
                    if (!categories[category]) {
                        categories[category] = [];
                    }
                    categories[category].push({
                        command: cmd,
                        description: info.description
                    });
                }
            });

            // Category emojis
            const categoryEmojis = {
                'AI': '🤖',
                'Anime': '🎭',
                'Basic': '📌',
                'Downloader': '📥',
                'Economy': '💰',
                'Fun': '🎮',
                'Game': '🎲',
                'Group': '👥',
                'Media': '📸',
                'Music': '🎵',
                'NSFW': '🔞',
                'Owner': '👑',
                'Search': '🔍',
                'Social': '🌐',
                'Tool': '🛠️',
                'User': '👤',
                'Utility': '⚙️',
                'Education': '📚'
            };

            // Add commands by category
            Object.entries(categories)
                .sort(([a], [b]) => a.localeCompare(b))
                .forEach(([category, commands]) => {
                    if (commands.length > 0) {
                        const emoji = categoryEmojis[category] || '📌';
                        menuText += `┏━━━《 ${emoji} ${category} 》━━━┓\n`;
                        commands.forEach(({command, description}) => {
                            menuText += `┃ ⌬ ${config.prefix}${command}\n`;
                            if (description) {
                                menuText += `┃ └─ ${description}\n`;
                            }
                        });
                        menuText += `┗━━━━━━━━━━━━━━━┛\n\n`;
                    }
                });

            // Footer
            menuText += `╔════════════════════╗\n`;
            menuText += `║ Type ${config.prefix}help <command> ║\n`;
            menuText += `║    for detailed info     ║\n`;
            menuText += `╚════════════════════╝`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: config.menuImage },
                caption: menuText,
                gifPlayback: false
            });

            logger.info('Menu sent successfully');
        } catch (error) {
            logger.error('Error in menu command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error generating menu: ' + error.message
            });
        }
    },

    help: async (sock, msg, args) => {
        try {
            if (args.length > 0) {
                const command = args[0].toLowerCase();
                const cmdInfo = config.commands[command];

                if (cmdInfo) {
                    const text = `*Command: ${config.prefix}${command}*\n\n` +
                               `📝 Description: ${cmdInfo.description}\n` +
                               `📁 Category: ${cmdInfo.category}`;
                    await sock.sendMessage(msg.key.remoteJid, { text });
                    return;
                }
            }

            const text = `*${config.botName} Help*\n\n` +
                        `To see all commands, type: ${config.prefix}menu\n\n` +
                        `Basic Commands:\n` +
                        `• ${config.prefix}help - Show this help message\n` +
                        `• ${config.prefix}ping - Check bot response time\n` +
                        `• ${config.prefix}info - Show bot information\n\n` +
                        `For detailed command help:\n` +
                        `${config.prefix}help <command>`;

            await sock.sendMessage(msg.key.remoteJid, { text });
        } catch (error) {
            logger.error('Help command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing help: ' + error.message
            });
        }
    },

    ping: async (sock, msg) => {
        try {
            const start = Date.now();
            await sock.sendMessage(msg.key.remoteJid, { text: '🏓 Pinging...' });
            const latency = Date.now() - start;

            const text = `🏓 Pong!\n\n` +
                        `📊 *Status Info*\n` +
                        `• Latency: ${latency}ms\n` +
                        `• Uptime: ${formatUptime(process.uptime())}\n` +
                        `• Memory: ${formatMemory(process.memoryUsage().heapUsed)}`;

            await sock.sendMessage(msg.key.remoteJid, { text });
        } catch (error) {
            logger.error('Ping command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error checking ping: ' + error.message
            });
        }
    },

    info: async (sock, msg) => {
        try {
            const uptime = process.uptime();
            const text = `*🤖 ${config.botName} Info*\n\n` +
                        `*System Info*\n` +
                        `• Platform: ${os.platform()}\n` +
                        `• Node.js: ${process.version}\n` +
                        `• Memory: ${formatMemory(process.memoryUsage().heapUsed)}\n` +
                        `• CPU Load: ${(os.loadavg()[0]).toFixed(2)}%\n\n` +
                        `*Runtime*\n` +
                        `• Uptime: ${formatUptime(uptime)}\n` +
                        `• Started: ${moment().subtract(uptime, 'seconds').format('YYYY-MM-DD HH:mm:ss')}\n\n` +
                        `*Bot Info*\n` +
                        `• Owner: ${config.ownerName}\n` +
                        `• Prefix: ${config.prefix}\n` +
                        `• Status: 🟢 Online`;

            await sock.sendMessage(msg.key.remoteJid, { text });
        } catch (error) {
            logger.error('Info command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing bot info: ' + error.message
            });
        }
    }
};

// Helper functions
function formatUptime(uptime) {
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function formatMemory(bytes) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

module.exports = basicCommands;