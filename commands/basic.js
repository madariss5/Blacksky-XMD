const logger = require('pino')();
const os = require('os');
const moment = require('moment-timezone');
const config = require('../config');
const fs = require('fs').promises;
const path = require('path');

const basicCommands = {
    menu: async (sock, msg) => {
        try {
            let menuText = `╔═══════ஜ۩۞۩ஜ═══════╗\n`;
            menuText += `║    ${config.botName} MENU    ║\n`;
            menuText += `╚═══════ஜ۩۞۩ஜ═══════╝\n\n`;

            // Bot Info Section
            menuText += `┏━━━⟪ *BOT INFO* ⟫━━━┓\n`;
            menuText += `┃ ⚡ *Bot Name:* ${config.botName}\n`;
            menuText += `┃ 👤 *User:* ${msg.pushName}\n`;
            menuText += `┃ ⏰ *Time:* ${moment().format('HH:mm:ss')}\n`;
            menuText += `┃ 📅 *Date:* ${moment().format('DD/MM/YYYY')}\n`;
            menuText += `┗━━━━━━━━━━━━━━━┛\n\n`;

            // Get commands directory
            const commandsDir = path.join(__dirname);
            const files = await fs.readdir(commandsDir);

            // Category emoji mapping
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
                'Education': '📚',
                'Misc': '📦'
            };

            // Process each command file
            for (const file of files) {
                if (file.endsWith('.js')) {
                    try {
                        const filePath = path.join(commandsDir, file);
                        const category = file.replace('.js', '');
                        const emoji = categoryEmojis[category] || '📌';

                        // Clear require cache and load commands
                        delete require.cache[require.resolve(filePath)];
                        const commands = require(filePath);
                        const commandList = Object.keys(commands);

                        if (commandList.length > 0) {
                            menuText += `┏━━━⟪ ${emoji} *${category.toUpperCase()}* ⟫━━━┓\n`;
                            for (const cmd of commandList) {
                                menuText += `┃ ඬ⃟ ${config.prefix}${cmd}\n`;
                                if (config.commands[cmd]?.description) {
                                    menuText += `┃ └ ${config.commands[cmd].description}\n`;
                                }
                            }
                            menuText += `┗━━━━━━━━━━━━━━━┛\n\n`;
                        }
                    } catch (error) {
                        logger.error(`Error loading commands from ${file}:`, error);
                    }
                }
            }

            menuText += `╔═══════ஜ۩۞۩ஜ═══════╗\n`;
            menuText += `║  Type ${config.prefix}help <command>  ║\n`;
            menuText += `╚═══════ஜ۩۞۩ஜ═══════╝`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: config.menuImage },
                caption: menuText,
                gifPlayback: false
            });

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