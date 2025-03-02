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
            const time = moment().format('HH:mm:ss');
            const date = moment().format('DD/MM/YYYY');
            const uptime = process.uptime();
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);

            // Create fancy header
            let text = `╔═══════ஜ۩۞۩ஜ═══════╗\n`;
            text += `║    ⚡ ${config.botName} ⚡    ║\n`;
            text += `╚═══════ஜ۩۞۩ஜ═══════╝\n\n`;

            // Bot Info Section
            text += `┏━━━⟪ *BOT INFO* ⟫━━━┓\n`;
            text += `┃ ⚡ *Bot Name:* ${config.botName}\n`;
            text += `┃ 👤 *User:* ${msg.pushName}\n`;
            text += `┃ ⏰ *Time:* ${time}\n`;
            text += `┃ 📅 *Date:* ${date}\n`;
            text += `┃ ⌛ *Uptime:* ${hours}h ${minutes}m ${seconds}s\n`;
            text += `┗━━━━━━━━━━━━━━━┛\n\n`;

            // Get commands directory path
            const commandsDir = path.join(__dirname);
            const files = await fs.readdir(commandsDir);
            const commandFiles = files.filter(file => file.endsWith('.js'));

            // Process each command file
            for (const file of commandFiles) {
                try {
                    logger.info(`Loading commands from ${file}`);
                    delete require.cache[require.resolve(path.join(commandsDir, file))];
                    const commands = require(`./${file}`);

                    const categoryName = file.replace('.js', '').toUpperCase();
                    const commandList = Object.keys(commands);

                    if (commandList.length > 0) {
                        text += `┏━━━⟪ *${categoryName}* ⟫━━━┓\n`;
                        for (const cmd of commandList) {
                            text += `┃ ඬ⃟ ${config.prefix}${cmd}\n`;
                        }
                        text += `┗━━━━━━━━━━━━━━━┛\n\n`;
                    }
                } catch (error) {
                    logger.error(`Error loading commands from ${file}:`, error);
                }
            }

            // Footer
            text += `╔═══════ஜ۩۞۩ஜ═══════╗\n`;
            text += `║  Type ${config.prefix}help <command>  ║\n`;
            text += `║     for detailed usage info    ║\n`;
            text += `╚═══════ஜ۩۞۩ஜ═══════╝`;

            // Send the menu with image
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: config.menuImage },
                caption: text,
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