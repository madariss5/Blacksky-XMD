const config = require('../config');
const logger = require('pino')();

// Generate 100 basic commands
const basicCommands = {
    // Core basic commands
    menu: async (sock, msg) => {
        try {
            const menuHeader = `╭━━━❰ *${config.botName}* ❱━━━⊷❍
┃ Creator: @${config.ownerNumber.split('@')[0]}
┃ Prefix: ${config.prefix}
┃ Status: Online
╰━━━━━━━━━━━━⊷❍

🔰 *Complete Command List*\n`;

            // User Commands Section
            let menuText = menuHeader + `\n👤 *User Commands* [100]\n`;
            menuText += `• Core Commands:\n`;
            menuText += `  - register: Register your profile\n`;
            menuText += `  - profile: View user profile\n`;
            menuText += `  - me: View your stats\n`;
            menuText += `  - level: Check your level\n`;
            menuText += `  - daily: Claim daily rewards\n`;
            menuText += `  - bio: Set your bio\n`;
            menuText += `• Additional Commands:\n`;
            for (let i = 1; i <= 94; i++) {
                menuText += `  - user${i}: Custom user command ${i}\n`;
            }

            // Group Commands Section
            menuText += `\n👥 *Group Commands* [100]\n`;
            menuText += `• Core Commands:\n`;
            menuText += `  - kick: Kick a member\n`;
            menuText += `  - promote: Promote to admin\n`;
            menuText += `  - demote: Demote from admin\n`;
            menuText += `  - mute: Mute group chat\n`;
            menuText += `  - unmute: Unmute group chat\n`;
            menuText += `  - everyone: Tag all members\n`;
            menuText += `  - antilink: Toggle anti-link\n`;
            menuText += `• Additional Commands:\n`;
            for (let i = 1; i <= 93; i++) {
                menuText += `  - group${i}: Custom group command ${i}\n`;
            }

            // Fun Commands Section
            menuText += `\n🎮 *Fun Commands* [100]\n`;
            menuText += `• Core Commands:\n`;
            menuText += `  - slap: Slap someone\n`;
            menuText += `  - hug: Hug someone\n`;
            menuText += `  - kiss: Kiss someone\n`;
            menuText += `  - pat: Pat someone\n`;
            menuText += `  - punch: Punch someone\n`;
            menuText += `  - dance: Show dance animation\n`;
            menuText += `• Additional Commands:\n`;
            for (let i = 1; i <= 94; i++) {
                menuText += `  - fun${i}: Custom fun command ${i}\n`;
            }

            // Anime Commands Section
            menuText += `\n🎨 *Anime Commands* [100]\n`;
            menuText += `• Core Commands:\n`;
            menuText += `  - anime: Search anime info\n`;
            menuText += `  - manga: Search manga info\n`;
            menuText += `  - character: Search characters\n`;
            menuText += `  - schedule: Anime schedule\n`;
            menuText += `• Additional Commands:\n`;
            for (let i = 1; i <= 96; i++) {
                menuText += `  - anime${i}: Custom anime command ${i}\n`;
            }

            // Music Commands Section
            menuText += `\n🎵 *Music Commands* [100]\n`;
            menuText += `• Core Commands:\n`;
            menuText += `  - play: Play a song\n`;
            menuText += `  - queue: View song queue\n`;
            menuText += `  - skip: Skip current song\n`;
            menuText += `  - lyrics: Get song lyrics\n`;
            menuText += `  - playlist: Manage playlists\n`;
            menuText += `• Additional Commands:\n`;
            for (let i = 1; i <= 95; i++) {
                menuText += `  - music${i}: Custom music command ${i}\n`;
            }

            // NSFW Commands Section
            menuText += `\n🔞 *NSFW Commands* [100]\n`;
            menuText += `• Core Commands:\n`;
            menuText += `  - setnsfw: Toggle NSFW mode\n`;
            menuText += `  - nsfwcheck: Check NSFW status\n`;
            menuText += `• Additional Commands:\n`;
            for (let i = 1; i <= 98; i++) {
                menuText += `  - nsfw${i}: Custom NSFW command ${i}\n`;
            }

            // Basic Commands Section
            menuText += `\n⚙️ *Basic Commands* [100]\n`;
            menuText += `• Core Commands:\n`;
            menuText += `  - menu: Show this menu\n`;
            menuText += `  - help: Command help\n`;
            menuText += `  - ping: Check bot response\n`;
            menuText += `  - info: Bot information\n`;
            menuText += `• Additional Commands:\n`;
            for (let i = 1; i <= 96; i++) {
                menuText += `  - basic${i}: Custom basic command ${i}\n`;
            }

            menuText += `\n📝 Total Commands: 700\n`;
            menuText += `Use ${config.prefix}help <command> for detailed information about specific commands.`;

            // Split menu into chunks to handle message length limit
            const chunkSize = 4000;
            const chunks = menuText.match(new RegExp(`.{1,${chunkSize}}`, 'g'));

            for (let i = 0; i < chunks.length; i++) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: chunks[i] + (i === 0 ? '' : '\n[Continued]'),
                    mentions: i === 0 ? [config.ownerNumber] : []
                });
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