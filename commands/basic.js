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

            // Define categories with comprehensive filters
            const categories = {
                '⚙️ *BASIC*': allCommands
                    .filter(([cmd]) => 
                        /^(menu|help|ping|info)$/i.test(cmd))
                    .map(([cmd, info]) => `${cmd} ➠ ${info.description}`),

                '📥 *DOWNLOADER*': allCommands
                    .filter(([_, cmd]) => 
                        /download|play|youtube|yt|tiktok|fb|facebook|instagram|ig|twitter|spotify|soundcloud|mediafire|gdrive|mega|apk|ringtone|movie|anime|manga|mp3|mp4|audio|video/i.test(cmd.description))
                    .map(([cmd, info]) => `${cmd} ➠ ${info.description}`),

                '💰 *ECONOMY*': allCommands
                    .filter(([_, cmd]) => 
                        /balance|money|coin|reward|bank|deposit|withdraw|rob|work|mine|shop|gamble|flip|slot|bet|trade|crypto|heist|fish|hunt|farm|craft|inventory/i.test(cmd.description))
                    .map(([cmd, info]) => `${cmd} ➠ ${info.description}`),

                '👥 *GROUP*': allCommands
                    .filter(([_, cmd]) => 
                        /group|admin|kick|ban|promote|demote|mute|unmute|link|revoke|announce|poll|welcome|goodbye|tag|anti|settings/i.test(cmd.description))
                    .map(([cmd, info]) => `${cmd} ➠ ${info.description}`),

                '🎨 *FUN & MEDIA*': allCommands
                    .filter(([_, cmd]) => 
                        /sticker|effect|image|photo|picture|create|convert|quote|meme|emoji|animation|trigger|wasted|jail|rip|trash|rainbow|blur|circle|slap/i.test(cmd.description))
                    .map(([cmd, info]) => `${cmd} ➠ ${info.description}`),

                '🎮 *GAMES*': allCommands
                    .filter(([_, cmd]) => 
                        /game|play|slot|poker|blackjack|dice|hunt|fish|duel|quest|challenge|truth|dare|quiz/i.test(cmd.description))
                    .map(([cmd, info]) => `${cmd} ➠ ${info.description}`),

                '🤖 *AI & TOOLS*': allCommands
                    .filter(([_, cmd]) => 
                        /ai|gpt|chat|generate|imagine|enhance|translate|voice|qr|text|image|dalle|remini|recolor|colorize|upscale|anime2d|cartoon/i.test(cmd.description))
                    .map(([cmd, info]) => `${cmd} ➠ ${info.description}`),

                '👑 *OWNER*': allCommands
                    .filter(([_, cmd]) => 
                        /owner|broadcast|bc|bot|system|prefix|ban|restart|update|eval|exec|join|leave|block|unblock|clear|set/i.test(cmd.description))
                    .map(([cmd, info]) => `${cmd} ➠ ${info.description}`),

                '⚙️ *UTILITY*': allCommands
                    .filter(([_, cmd]) => 
                        /toggle|set|config|backup|restore|language|auto|mode|setting|reply|welcome|goodbye|command/i.test(cmd.description))
                    .map(([cmd, info]) => `${cmd} ➠ ${info.description}`),

                '🔞 *NSFW*': allCommands
                    .filter(([_, cmd]) => cmd.nsfw || /nsfw|hentai|adult|mature|hwaifu|hneko/i.test(cmd.description))
                    .map(([cmd, info]) => `${cmd} ➠ ${info.description}`),

                '🐛 *DEBUG*': allCommands
                    .filter(([_, cmd]) => 
                        /debug|bug|report|test|log|error|status|ping|cache|memory|cpu/i.test(cmd.description))
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

            // Check for uncategorized commands
            const categorizedCommands = new Set(
                Object.values(categories)
                    .flat()
                    .map(cmd => cmd.split(' ➠ ')[0])
            );

            const uncategorizedCommands = allCommands
                .filter(([cmd]) => !categorizedCommands.has(cmd))
                .map(([cmd, info]) => `${cmd} ➠ ${info.description}`);

            if (uncategorizedCommands.length > 0) {
                menuContent += `📋 *OTHER COMMANDS*\n${'-'.repeat(40)}\n`;
                uncategorizedCommands.forEach(cmd => {
                    menuContent += `◈ ${cmd}\n`;
                });
                menuContent += '\n';
            }

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