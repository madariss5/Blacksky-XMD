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

            // Define categories with more inclusive filters
            const categories = {
                '📥 *DOWNLOADER*': Object.entries(config.commands)
                    .filter(([_, cmd]) => 
                        cmd.description.includes('Download') || 
                        cmd.description.includes('Play') ||
                        cmd.description.includes('📥') ||
                        cmd.description.includes('🎵') ||
                        cmd.description.includes('📱'))
                    .map(([cmd, info]) => `${config.prefix}${cmd} - ${info.description}`),

                '💰 *ECONOMY*': Object.entries(config.commands)
                    .filter(([_, cmd]) => 
                        cmd.description.includes('💰') || 
                        cmd.description.includes('💸') || 
                        cmd.description.includes('🎲') ||
                        cmd.description.includes('🏦') ||
                        cmd.description.includes('💼'))
                    .map(([cmd, info]) => `${config.prefix}${cmd} - ${info.description}`),

                '👥 *GROUP*': Object.entries(config.commands)
                    .filter(([_, cmd]) => 
                        cmd.description.toLowerCase().includes('group') || 
                        cmd.description.toLowerCase().includes('admin') ||
                        cmd.description.includes('👥'))
                    .map(([cmd, info]) => `${config.prefix}${cmd} - ${info.description}`),

                '🎨 *FUN & MEDIA*': Object.entries(config.commands)
                    .filter(([_, cmd]) => 
                        cmd.description.includes('Create') || 
                        cmd.description.includes('effect') || 
                        cmd.description.includes('sticker') ||
                        cmd.description.includes('🎨'))
                    .map(([cmd, info]) => `${config.prefix}${cmd} - ${info.description}`),

                '🎮 *GAMES*': Object.entries(config.commands)
                    .filter(([_, cmd]) => 
                        cmd.description.includes('🎮') ||
                        cmd.description.includes('game') ||
                        cmd.description.includes('Play'))
                    .map(([cmd, info]) => `${config.prefix}${cmd} - ${info.description}`),

                '🤖 *AI & TOOLS*': Object.entries(config.commands)
                    .filter(([_, cmd]) => 
                        cmd.description.includes('🤖') ||
                        cmd.description.includes('AI') || 
                        cmd.description.includes('Generate'))
                    .map(([cmd, info]) => `${config.prefix}${cmd} - ${info.description}`),

                '👑 *OWNER*': Object.entries(config.commands)
                    .filter(([_, cmd]) => 
                        cmd.description.includes('👑') ||
                        cmd.description.toLowerCase().includes('owner') || 
                        cmd.description.toLowerCase().includes('bot'))
                    .map(([cmd, info]) => `${config.prefix}${cmd} - ${info.description}`),

                '⚙️ *UTILITY*': Object.entries(config.commands)
                    .filter(([_, cmd]) => 
                        cmd.description.includes('⚙️') ||
                        cmd.description.includes('Toggle') || 
                        cmd.description.includes('Set'))
                    .map(([cmd, info]) => `${config.prefix}${cmd} - ${info.description}`),

                '🔞 *NSFW*': Object.entries(config.commands)
                    .filter(([_, cmd]) => 
                        cmd.description.includes('🔞') ||
                        cmd.nsfw === true)
                    .map(([cmd, info]) => `${config.prefix}${cmd} - ${info.description}`),

                '🐛 *DEBUG*': Object.entries(config.commands)
                    .filter(([_, cmd]) => 
                        cmd.description.includes('🐛') ||
                        cmd.description.toLowerCase().includes('debug'))
                    .map(([cmd, info]) => `${config.prefix}${cmd} - ${info.description}`)
            };

            let menuContent = menuHeader;

            // Add categories and their commands
            Object.entries(categories).forEach(([category, commands]) => {
                if (commands.length > 0) {  // Only show categories with commands
                    menuContent += `${category}\n${'-'.repeat(40)}\n`;
                    commands.forEach((cmd, i) => {
                        menuContent += `${i + 1}. ${cmd}\n`;
                    });
                    menuContent += '\n';
                }
            });

            // Add footer stats
            menuContent += `╭━━━❰ *STATS* ❱━━━⊷❍
┃ Total Commands: ${Object.keys(config.commands).length}
┃ Version: 1.0.0
╰━━━━━━━━━━━━⊷❍\n\n`;

            menuContent += `Note: Use ${config.prefix}help <command> for detailed info\n`;
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