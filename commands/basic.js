const config = require('../config');
const logger = require('pino')();

const basicCommands = {
    menu: async (sock, msg) => {
        try {
            const menuHeader = `╭━━━❰ *${config.botName}* ❱━━━⊷❍
┃ Creator: @${config.ownerNumber.split('@')[0]}
┃ Prefix: ${config.prefix}
┃ Status: Online
╰━━━━━━━━━━━━⊷❍\n\n`;

            // Get all commands
            const allCommands = Object.entries(config.commands);

            // Define categories with their commands
            const categories = {
                '⚙️ *BASIC COMMANDS*': allCommands
                    .filter(([_, cmd]) => cmd.category === 'Basic')
                    .map(([cmd, info]) => `${cmd} ➠ ${info.description}`),

                '🎨 *MEDIA & STICKERS*': allCommands
                    .filter(([_, cmd]) => cmd.category === 'Media')
                    .map(([cmd, info]) => `${cmd} ➠ ${info.description}`),

                '📥 *DOWNLOADER*': allCommands
                    .filter(([_, cmd]) => cmd.category === 'Downloader')
                    .map(([cmd, info]) => `${cmd} ➠ ${info.description}`),

                '🎵 *MUSIC*': allCommands
                    .filter(([_, cmd]) => cmd.category === 'Music')
                    .map(([cmd, info]) => `${cmd} ➠ ${info.description}`),

                '🤖 *AI & GENERATION*': allCommands
                    .filter(([_, cmd]) => cmd.category === 'AI')
                    .map(([cmd, info]) => `${cmd} ➠ ${info.description}`),

                '👥 *GROUP MANAGEMENT*': allCommands
                    .filter(([_, cmd]) => cmd.category === 'Group')
                    .map(([cmd, info]) => `${cmd} ➠ ${info.description}`),

                '🎮 *FUN & REACTIONS*': allCommands
                    .filter(([_, cmd]) => cmd.category === 'Fun')
                    .map(([cmd, info]) => `${cmd} ➠ ${info.description}`),

                '💰 *ECONOMY*': allCommands
                    .filter(([_, cmd]) => cmd.category === 'Economy')
                    .map(([cmd, info]) => `${cmd} ➠ ${info.description}`),

                '🛠️ *UTILITY*': allCommands
                    .filter(([_, cmd]) => cmd.category === 'Utility')
                    .map(([cmd, info]) => `${cmd} ➠ ${info.description}`),

                '👑 *OWNER*': allCommands
                    .filter(([_, cmd]) => cmd.category === 'Owner')
                    .map(([cmd, info]) => `${cmd} ➠ ${info.description}`),

                '🔞 *NSFW*': allCommands
                    .filter(([_, cmd]) => cmd.category === 'NSFW')
                    .map(([cmd, info]) => `${cmd} ➠ ${info.description}`)
            };

            let menuContent = menuHeader;

            // Add categories and their commands
            Object.entries(categories).forEach(([category, commands]) => {
                if (commands.length > 0) {
                    menuContent += `${category}\n${'-'.repeat(40)}\n`;
                    commands.forEach(cmd => {
                        menuContent += `◈ ${cmd}\n`;
                    });
                    menuContent += '\n';
                }
            });

            // Add footer stats
            menuContent += `╭━━━❰ *STATS* ❱━━━⊷❍
┃ Total Commands: ${Object.keys(config.commands).length}
┃ Version: 1.0.0
╰━━━━━━━━━━━━⊷❍\n\n`;

            menuContent += `Note: Add ${config.prefix} before any command\n`;
            menuContent += `Example: ${config.prefix}help ytmp3`;

            // Send as a single message
            await sock.sendMessage(msg.key.remoteJid, {
                text: menuContent,
                mentions: [config.ownerNumber]
            });

        } catch (error) {
            logger.error('Error in menu command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error displaying menu: ' + error.message
            });
        }
    },

    help: async (sock, msg, args) => {
        try {
            if (!args[0]) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `❓ Please specify a command for help!\nExample: ${config.prefix}help ytmp3`
                });
            }

            const command = args[0].toLowerCase();
            const cmdInfo = config.commands[command];

            if (!cmdInfo) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Command "${command}" not found!`
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*Command: ${config.prefix}${command}*\n\n` +
                      `📝 Description: ${cmdInfo.description}\n` +
                      `ℹ️ Category: ${cmdInfo.category || 'General'}\n` +
                      `🔞 NSFW: ${cmdInfo.nsfw ? 'Yes' : 'No'}`
            });
        } catch (error) {
            logger.error('Error in help command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error displaying help: ' + error.message
            });
        }
    },

    ping: async (sock, msg) => {
        try {
            const start = Date.now();
            await sock.sendMessage(msg.key.remoteJid, { text: '📡 Testing connection...' });
            const end = Date.now();

            const latency = end - start;
            const status = latency < 100 ? '🟢 Excellent' : latency < 200 ? '🟡 Good' : '🔴 High';

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🚀 Status Report\n\n` +
                      `Response Time: ${latency}ms\n` +
                      `Connection: ${status}`
            });
        } catch (error) {
            logger.error('Error in ping command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error checking ping: ' + error.message
            });
        }
    },

    info: async (sock, msg) => {
        try {
            const info = `*Bot Information*\n\n` +
                        `• Name: ${config.botName}\n` +
                        `• Owner: @${config.ownerNumber.split('@')[0]}\n` +
                        `• Prefix: ${config.prefix}\n` +
                        `• Version: 1.0.0\n` +
                        `• Commands: ${Object.keys(config.commands).length}\n` +
                        `• Status: Online`;

            await sock.sendMessage(msg.key.remoteJid, {
                text: info,
                mentions: [config.ownerNumber]
            });
        } catch (error) {
            logger.error('Error in info command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error displaying info: ' + error.message
            });
        }
    }
};

module.exports = basicCommands;