const pino = require('pino');
const logger = pino({ level: 'silent' });
const os = require('os');
const moment = require('moment-timezone');
const config = require('../config');

// Import all command modules
const aiCommands = require('./ai');
const utilityCommands = require('./utility');
const groupCommands = require('./group');
const mediaCommands = require('./media');
const funCommands = require('./fun');
const ownerCommands = require('./owner');
const userCommands = require('./user');

const basicCommands = {
    menu: async (sock, msg) => {
        try {
            // Create fancy header
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

            // All available commands from each module
            const commandModules = {
                '🤖 AI': aiCommands,
                '⚙️ UTILITY': utilityCommands,
                '👥 GROUP': groupCommands,
                '📸 MEDIA': mediaCommands,
                '🎮 FUN': funCommands,
                '👑 OWNER': ownerCommands,
                '👤 USER': userCommands,
                '📌 BASIC': basicCommands
            };

            // Add commands from each module
            for (const [category, commands] of Object.entries(commandModules)) {
                if (commands && Object.keys(commands).length > 0) {
                    menuText += `┏━━━⟪ ${category} ⟫━━━┓\n`;
                    for (const cmd of Object.keys(commands)) {
                        menuText += `┃ ඬ⃟ ${config.prefix}${cmd}\n`;
                        // Add description if available
                        if (config.commands[cmd]?.description) {
                            menuText += `┃ └ ${config.commands[cmd].description}\n`;
                        }
                    }
                    menuText += `┗━━━━━━━━━━━━━━━┛\n\n`;
                }
            }

            // Footer
            menuText += `╔═══════ஜ۩۞۩ஜ═══════╗\n`;
            menuText += `║  Type ${config.prefix}help <command>  ║\n`;
            menuText += `╚═══════ஜ۩۞۩ஜ═══════╝`;

            // Send the menu with image
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
                    await sock.sendMessage(msg.key.remoteJid, {
                        text: `*Command: ${config.prefix}${command}*\n\n` +
                              `📝 Description: ${cmdInfo.description}\n` +
                              `📁 Category: ${cmdInfo.category}`
                    });
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