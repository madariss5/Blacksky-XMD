const logger = require('./utils/logger');
const moment = require('moment-timezone');
const config = require('./config');
const { getUptime } = require('./utils');

const basicCommands = {
    ping: async (sock, msg) => {
        try {
            const start = Date.now();
            await sock.sendMessage(msg.key.remoteJid, { text: 'Testing ping...' });
            const end = Date.now();

            const pingText = `🏓 *Ping Statistics*\n\n` +
                           `• Response Time: ${end - start}ms\n` +
                           `• Bot Status: Active`;

            await sock.sendMessage(msg.key.remoteJid, { text: pingText });
            logger.info('Ping command executed successfully');

        } catch (error) {
            logger.error('Error in ping command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error checking ping'
            });
        }
    },

    help: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `To get command details, use: ${config.prefix}help <command>\nExample: ${config.prefix}help ping`
                });
            }

            const command = args[0].toLowerCase();
            const cmdInfo = config.commands[command];

            if (!cmdInfo) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Command not found'
                });
            }

            const helpText = `╭━━━『 Command Info 』━━━⊷\n` +
                           `┃ Name: ${command}\n` +
                           `┃ Category: ${cmdInfo.category}\n` +
                           `┃ Description: ${cmdInfo.description}\n` +
                           `┃ Usage: ${cmdInfo.usage || `${config.prefix}${command}`}\n` +
                           `╰━━━━━━━━━━━━━━━⊷`;

            await sock.sendMessage(msg.key.remoteJid, { text: helpText });
            logger.info(`Help command executed for: ${command}`);

        } catch (error) {
            logger.error('Error in help command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error displaying help'
            });
        }
    },

    stats: async (sock, msg) => {
        try {
            const usedMemory = process.memoryUsage();
            const stats = {
                uptime: getUptime(),
                memory: {
                    used: Math.round(usedMemory.heapUsed / 1024 / 1024),
                    total: Math.round(usedMemory.heapTotal / 1024 / 1024)
                },
                platform: process.platform,
                version: process.version
            };

            const statsText = `📊 *Bot Statistics*\n\n` +
                            `• Status: Online ✅\n` +
                            `• Uptime: ${stats.uptime}\n` +
                            `• Memory: ${stats.memory.used}MB / ${stats.memory.total}MB\n` +
                            `• Platform: ${stats.platform}\n` +
                            `• Node.js: ${stats.version}\n` +
                            `• Time: ${moment().format('HH:mm:ss')}\n` +
                            `• Date: ${moment().format('DD/MM/YYYY')}`;

            await sock.sendMessage(msg.key.remoteJid, { text: statsText });
            logger.info('Stats command executed successfully');

        } catch (error) {
            logger.error('Error in stats command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing statistics'
            });
        }
    },

    uptime: async (sock, msg) => {
        try {
            const uptime = getUptime();
            const uptimeText = `⌚ *Bot Uptime*\n\n` +
                             `• Running for: ${uptime}\n` +
                             `• Started: ${moment().subtract(process.uptime(), 'seconds').format('DD/MM/YYYY HH:mm:ss')}`;

            await sock.sendMessage(msg.key.remoteJid, { text: uptimeText });
            logger.info('Uptime command executed successfully');

        } catch (error) {
            logger.error('Error in uptime command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing uptime'
            });
        }
    }
};

module.exports = basicCommands;