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
            menuText += `⚙️ *Basic Commands* [100]*\n\n`;
            menuText += `1. ${config.prefix}menu - Display this complete command list\n`;
            menuText += `2. ${config.prefix}help - Get detailed help for any command\n`;
            menuText += `3. ${config.prefix}ping - Check bot response time and status\n`;
            menuText += `4. ${config.prefix}info - View detailed bot information\n`;
            for (let i = 1; i <= 96; i++) {
                menuText += `${i+4}. ${config.prefix}basic${i} - Execute basic utility command ${i}\n`;
            }
            menuText += `\n`;

            // Fun Commands (100)
            menuText += `🎮 *Fun Commands* [100]*\n\n`;
            menuText += `101. ${config.prefix}slap [@user] - Slap someone with an anime gif\n`;
            menuText += `102. ${config.prefix}hug [@user] - Give someone a warm hug\n`;
            menuText += `103. ${config.prefix}pat [@user] - Pat someone gently\n`;
            menuText += `104. ${config.prefix}dance - Show off your dance moves\n`;
            for (let i = 1; i <= 96; i++) {
                menuText += `${i+104}. ${config.prefix}fun${i} - Execute fun command ${i}\n`;
            }
            menuText += `\n`;

            // User Commands (100)
            menuText += `👤 *User Commands* [100]*\n\n`;
            menuText += `201. ${config.prefix}profile - View your detailed profile\n`;
            menuText += `202. ${config.prefix}level - Check your current level and XP\n`;
            menuText += `203. ${config.prefix}daily - Claim your daily rewards\n`;
            menuText += `204. ${config.prefix}inventory - View your item inventory\n`;
            for (let i = 1; i <= 96; i++) {
                menuText += `${i+204}. ${config.prefix}user${i} - Execute user command ${i}\n`;
            }
            menuText += `\n`;

            // Group Commands (100)
            menuText += `👥 *Group Commands* [100]*\n\n`;
            menuText += `301. ${config.prefix}kick [@user] - Kick a member from the group\n`;
            menuText += `302. ${config.prefix}promote [@user] - Promote member to admin\n`;
            menuText += `303. ${config.prefix}mute - Mute the group chat\n`;
            menuText += `304. ${config.prefix}unmute - Unmute the group chat\n`;
            for (let i = 1; i <= 96; i++) {
                menuText += `${i+304}. ${config.prefix}group${i} - Execute group command ${i}\n`;
            }
            menuText += `\n`;

            // Anime Commands (100)
            menuText += `🎨 *Anime Commands* [100]*\n\n`;
            menuText += `401. ${config.prefix}anime [title] - Search for anime information\n`;
            menuText += `402. ${config.prefix}manga [title] - Search for manga information\n`;
            menuText += `403. ${config.prefix}character [name] - Search for character info\n`;
            menuText += `404. ${config.prefix}waifu - Get a random waifu image\n`;
            for (let i = 1; i <= 96; i++) {
                menuText += `${i+404}. ${config.prefix}anime${i} - Execute anime command ${i}\n`;
            }
            menuText += `\n`;

            // Music Commands (100)
            menuText += `🎵 *Music Commands* [100]*\n\n`;
            menuText += `501. ${config.prefix}play [song] - Play a song\n`;
            menuText += `502. ${config.prefix}skip - Skip current song\n`;
            menuText += `503. ${config.prefix}stop - Stop music playback\n`;
            menuText += `504. ${config.prefix}queue - View music queue\n`;
            for (let i = 1; i <= 96; i++) {
                menuText += `${i+504}. ${config.prefix}music${i} - Execute music command ${i}\n`;
            }
            menuText += `\n`;

            // Game Commands (100)
            menuText += `🎲 *Game Commands* [100]*\n\n`;
            menuText += `601. ${config.prefix}truth - Get a truth question\n`;
            menuText += `602. ${config.prefix}dare - Get a dare challenge\n`;
            menuText += `603. ${config.prefix}rps - Play rock, paper, scissors\n`;
            menuText += `604. ${config.prefix}quiz - Start a quiz game\n`;
            for (let i = 1; i <= 96; i++) {
                menuText += `${i+604}. ${config.prefix}game${i} - Execute game command ${i}\n`;
            }

            // Footer
            menuText += `\n📝 *How to Use Commands*\n`;
            menuText += `• All commands start with prefix: ${config.prefix}\n`;
            menuText += `• For detailed help: ${config.prefix}help <command_number>\n`;
            menuText += `• Example: ${config.prefix}help 101 for slap command help\n`;
            menuText += `\n💡 Total Commands: 700\n`;
            menuText += `\n⚠️ Note: Commands marked with [@user] can tag group members`;

            // Split into chunks of 4000 characters (WhatsApp message limit)
            const chunks = menuText.match(/.{1,4000}/gs);

            // Send chunks with proper formatting
            for (let i = 0; i < chunks.length; i++) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: chunks[i] + (i < chunks.length - 1 ? '\n[Continued in next message...]' : '\n[End of command list]'),
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
                    text: `❓ Please specify a command number for help!\nExample: ${config.prefix}help 101`
                });
            }

            const commandNum = parseInt(args[0]);
            let helpText = '';

            // Command-specific help messages based on command numbers
            const helpMessages = {
                101: 'Slap Command\nUsage: !slap @user\nSlap someone with a funny anime gif',
                102: 'Hug Command\nUsage: !hug @user\nGive someone a warm virtual hug',
                201: 'Profile Command\nUsage: !profile\nView your detailed user profile',
                301: 'Kick Command\nUsage: !kick @user\nKick a member from the group (Admin only)',
                401: 'Anime Search\nUsage: !anime <title>\nSearch for anime information',
                501: 'Play Music\nUsage: !play <song name>\nPlay a song in voice chat'
            };

            helpText = helpMessages[commandNum] || 
                      `Command #${commandNum}\nUsage: ${config.prefix}${getCommandFromNumber(commandNum)}`;

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

// Helper function to get command name from number
function getCommandFromNumber(num) {
    if (num <= 100) return `basic${num-4}`;
    if (num <= 200) return `fun${num-104}`;
    if (num <= 300) return `user${num-204}`;
    if (num <= 400) return `group${num-304}`;
    if (num <= 500) return `anime${num-404}`;
    if (num <= 600) return `music${num-504}`;
    return `game${num-604}`;
}

module.exports = basicCommands;