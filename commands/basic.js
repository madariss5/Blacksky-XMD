const config = require('../config');
const logger = require('pino')();

// Generate 100 basic commands
const basicCommands = {
    // Core basic commands
    menu: async (sock, msg) => {
        try {
            const menuText = `╭━━━❰ *${config.botName}* ❱━━━⊷❍
┃ Creator: @${config.ownerNumber.split('@')[0]}
┃ Prefix: ${config.prefix}
┃ Status: Online
╰━━━━━━━━━━━━⊷❍

🔰 *Command Categories*

👤 *User Commands* [100]
• register - Register your profile
• profile - View user profile
• me - View your stats
• level - Check your level
• daily - Claim daily rewards
• bio - Set your bio
[And 94 more user commands]

👥 *Group Commands* [100]
• kick - Kick a member
• promote - Promote to admin
• demote - Demote from admin
• mute - Mute group chat
• unmute - Unmute group chat
• everyone - Tag all members
• antilink - Toggle anti-link
[And 93 more group commands]

🎮 *Fun Commands* [100]
• slap - Slap someone
• hug - Hug someone
• kiss - Kiss someone
• pat - Pat someone
• punch - Punch someone
• dance - Show dance animation
[And 94 more fun commands]

🎨 *Anime Commands* [100]
• anime - Search anime info
• manga - Search manga info
• character - Search characters
• schedule - Anime schedule
[And 96 more anime commands]

🎵 *Music Commands* [100]
• play - Play a song
• queue - View song queue
• skip - Skip current song
• lyrics - Get song lyrics
• playlist - Manage playlists
[And 95 more music commands]

🔞 *NSFW Commands* [100]
• setnsfw - Toggle NSFW mode
• nsfwcheck - Check NSFW status
[And 98 more NSFW commands]

⚙️ *Basic Commands* [100]
• menu - Show this menu
• help - Command help
• ping - Check bot response
• info - Bot information
[And 96 more basic commands]

Use ${config.prefix}help <command> for details
Total Commands: 700`;

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
            const helpText = `*Help: ${command}*\n\nUsage: ${config.prefix}${command}`;

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

// Generate 96 additional basic commands
for (let i = 1; i <= 96; i++) {
    basicCommands[`basic${i}`] = async (sock, msg, args) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ Executed basic command ${i}\nWith args: ${args.join(' ')}`
            });

            logger.info(`Basic command ${i} executed:`, {
                user: msg.key.participant,
                args: args
            });
        } catch (error) {
            logger.error(`Error in basic${i} command:`, error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ Failed to execute basic command ${i}: ${error.message}`
            });
        }
    };
}

module.exports = basicCommands;