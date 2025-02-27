const config = require('../config');
const logger = require('pino')();

const basicCommands = {
    menu: async (sock, msg) => {
        try {
            const menuText = `╭━━━❰ *${config.botName}* ❱━━━⊷❍
┃ Creator: @${config.ownerNumber.split('@')[0]}
┃ Prefix: ${config.prefix}
┃ Status: Online
╰━━━━━━━━━━━━⊷❍

📜 *Command Categories*

1. 👤 *User Commands*
${config.prefix}profile - View profile
${config.prefix}level - Check level
${config.prefix}daily - Daily rewards

2. 👥 *Group Commands*
${config.prefix}kick - Kick member
${config.prefix}promote - Promote admin
${config.prefix}mute - Mute group

3. 🎮 *Fun Commands*
${config.prefix}slap - Slap someone
${config.prefix}hug - Hug someone
${config.prefix}dance - Show dance

4. 🎨 *Anime Commands*
${config.prefix}anime - Search anime
${config.prefix}manga - Search manga
${config.prefix}character - Search character

5. 🎵 *Music Commands*
${config.prefix}play - Play song
${config.prefix}skip - Skip song
${config.prefix}lyrics - Get lyrics

6. ⚙️ *Basic Commands*
${config.prefix}help - Show help
${config.prefix}ping - Check response
${config.prefix}info - Bot info

Use ${config.prefix}help <command> for detailed info
Example: ${config.prefix}help slap`;

            await sock.sendMessage(msg.key.remoteJid, {
                text: menuText,
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
                menu: 'Show command categories\nUsage: !menu'
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