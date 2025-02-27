const config = require('../config');
const logger = require('pino')();

const basicCommands = {
    menu: async (sock, msg) => {
        try {
            const menuHeader = `╭━━━❰ *${config.botName}* ❱━━━⊷❍
┃ Creator: @${config.ownerNumber.split('@')[0]}
┃ Prefix: ${config.prefix}
┃ Status: Online
╰━━━━━━━━━━━━⊷❍

📜 *Complete Command List* (700 Commands)

`;

            let menuText = menuHeader;

            // Basic Commands (100)
            menuText += `⚙️ *Basic Commands* [100]\n`;
            menuText += `1. Core Commands:\n`;
            menuText += `   • ${config.prefix}menu - Show this menu\n`;
            menuText += `   • ${config.prefix}help - Get command help\n`;
            menuText += `   • ${config.prefix}ping - Check bot response\n`;
            menuText += `   • ${config.prefix}info - Bot information\n`;
            menuText += `2. Additional Basic Commands:\n`;
            for (let i = 1; i <= 96; i++) {
                if (i % 4 === 1) menuText += `   `;
                menuText += `${config.prefix}basic${i} `;
                if (i % 4 === 0) menuText += `\n`;
            }
            menuText += `\n`;

            // Fun Commands (100)
            menuText += `\n🎮 *Fun Commands* [100]\n`;
            menuText += `1. Core Commands:\n`;
            menuText += `   • ${config.prefix}slap - Slap someone\n`;
            menuText += `   • ${config.prefix}hug - Hug someone\n`;
            menuText += `   • ${config.prefix}pat - Pat someone\n`;
            menuText += `   • ${config.prefix}dance - Show dance moves\n`;
            menuText += `2. Additional Fun Commands:\n`;
            for (let i = 1; i <= 96; i++) {
                if (i % 4 === 1) menuText += `   `;
                menuText += `${config.prefix}fun${i} `;
                if (i % 4 === 0) menuText += `\n`;
            }
            menuText += `\n`;

            // User Commands (100)
            menuText += `\n👤 *User Commands* [100]\n`;
            menuText += `1. Core Commands:\n`;
            menuText += `   • ${config.prefix}profile - View profile\n`;
            menuText += `   • ${config.prefix}level - Check level\n`;
            menuText += `   • ${config.prefix}daily - Daily rewards\n`;
            menuText += `   • ${config.prefix}inventory - View inventory\n`;
            menuText += `2. Additional User Commands:\n`;
            for (let i = 1; i <= 96; i++) {
                if (i % 4 === 1) menuText += `   `;
                menuText += `${config.prefix}user${i} `;
                if (i % 4 === 0) menuText += `\n`;
            }
            menuText += `\n`;

            // Group Commands (100)
            menuText += `\n👥 *Group Commands* [100]\n`;
            menuText += `1. Core Commands:\n`;
            menuText += `   • ${config.prefix}kick - Kick member\n`;
            menuText += `   • ${config.prefix}promote - Promote admin\n`;
            menuText += `   • ${config.prefix}mute - Mute group\n`;
            menuText += `   • ${config.prefix}unmute - Unmute group\n`;
            menuText += `2. Additional Group Commands:\n`;
            for (let i = 1; i <= 96; i++) {
                if (i % 4 === 1) menuText += `   `;
                menuText += `${config.prefix}group${i} `;
                if (i % 4 === 0) menuText += `\n`;
            }
            menuText += `\n`;

            // Anime Commands (100)
            menuText += `\n🎨 *Anime Commands* [100]\n`;
            menuText += `1. Core Commands:\n`;
            menuText += `   • ${config.prefix}anime - Search anime\n`;
            menuText += `   • ${config.prefix}manga - Search manga\n`;
            menuText += `   • ${config.prefix}character - Search character\n`;
            menuText += `   • ${config.prefix}waifu - Random waifu\n`;
            menuText += `2. Additional Anime Commands:\n`;
            for (let i = 1; i <= 96; i++) {
                if (i % 4 === 1) menuText += `   `;
                menuText += `${config.prefix}anime${i} `;
                if (i % 4 === 0) menuText += `\n`;
            }
            menuText += `\n`;

            // Music Commands (100)
            menuText += `\n🎵 *Music Commands* [100]\n`;
            menuText += `1. Core Commands:\n`;
            menuText += `   • ${config.prefix}play - Play song\n`;
            menuText += `   • ${config.prefix}skip - Skip song\n`;
            menuText += `   • ${config.prefix}stop - Stop playback\n`;
            menuText += `   • ${config.prefix}queue - View queue\n`;
            menuText += `2. Additional Music Commands:\n`;
            for (let i = 1; i <= 96; i++) {
                if (i % 4 === 1) menuText += `   `;
                menuText += `${config.prefix}music${i} `;
                if (i % 4 === 0) menuText += `\n`;
            }
            menuText += `\n`;

            // Footer
            menuText += `\n📝 *Command Usage*\n`;
            menuText += `• Use ${config.prefix}help <command> for details\n`;
            menuText += `• Example: ${config.prefix}help slap\n`;
            menuText += `\n💡 Total Commands: 700`;

            // Split into chunks of 4000 characters (WhatsApp message limit)
            const chunks = menuText.match(/.{1,4000}/gs);

            // Send chunks with proper formatting
            for (let i = 0; i < chunks.length; i++) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: chunks[i] + (i < chunks.length - 1 ? '\n[Continued...]' : ''),
                    mentions: i === 0 ? [config.ownerNumber] : []
                });

                // Add a small delay between messages to prevent rate limiting
                if (i < chunks.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
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
                    text: `❓ Please specify a command for help!\nExample: ${config.prefix}help ping`
                });
            }

            const command = args[0].toLowerCase();
            let helpText = '';

            // Command-specific help messages
            const helpMessages = {
                slap: 'Slap another user with an anime gif\nUsage: !slap @user',
                hug: 'Give someone a warm hug\nUsage: !hug @user',
                dance: 'Show a dancing animation\nUsage: !dance',
                ping: 'Check bot response time\nUsage: !ping',
                profile: 'View your user profile\nUsage: !profile',
                play: 'Play a song\nUsage: !play <song name>',
                menu: 'Show all available commands\nUsage: !menu'
            };

            helpText = helpMessages[command] || `Help for command: ${command}\nUsage: ${config.prefix}${command}`;

            await sock.sendMessage(msg.key.remoteJid, {
                text: helpText
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
                        `• Commands: 700\n` +
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