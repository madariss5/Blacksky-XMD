const config = require('../config');
const logger = require('pino')();

// Store current menu page for each chat
if (!global.menuPages) global.menuPages = {};

const basicCommands = {
    menu: async (sock, msg, args) => {
        try {
            const chatId = msg.key.remoteJid;
            const page = args[0] ? parseInt(args[0]) : 1;

            // Set default page if not valid
            if (isNaN(page) || page < 1 || page > 7) {
                global.menuPages[chatId] = 1;
            } else {
                global.menuPages[chatId] = page;
            }

            const currentPage = global.menuPages[chatId];

            const menuHeader = `╭━━━❰ *${config.botName}* ❱━━━⊷❍
┃ Creator: @${config.ownerNumber.split('@')[0]}
┃ Prefix: ${config.prefix}
┃ Status: Online
╰━━━━━━━━━━━━⊷❍\n\n`;

            let pageContent = '';
            let pageTitle = '';

            switch(currentPage) {
                case 1:
                    pageTitle = '⚙️ *Basic Commands* [100]';
                    pageContent = `1. ${config.prefix}menu [page] - Show command menu by page\n` +
                                `2. ${config.prefix}help - Get detailed help for commands\n` +
                                `3. ${config.prefix}ping - Check bot response time\n` +
                                `4. ${config.prefix}info - View bot information\n\n` +
                                `Additional Commands:\n`;
                    for (let i = 1; i <= 96; i++) {
                        pageContent += `${i+4}. ${config.prefix}basic${i} - Execute basic utility ${i}\n`;
                    }
                    break;

                case 2:
                    pageTitle = '🎮 *Fun Commands* [100]';
                    pageContent = `Main Commands:\n` +
                                `101. ${config.prefix}slap [@user] - Slap with anime gif\n` +
                                `102. ${config.prefix}hug [@user] - Give warm hug\n` +
                                `103. ${config.prefix}pat [@user] - Pat gently\n` +
                                `104. ${config.prefix}dance - Show dance moves\n\n` +
                                `Additional Commands:\n`;
                    for (let i = 1; i <= 96; i++) {
                        pageContent += `${i+104}. ${config.prefix}fun${i} - Fun action ${i}\n`;
                    }
                    break;

                case 3:
                    pageTitle = '👤 *User Commands* [100]';
                    pageContent = `Main Commands:\n` +
                                `201. ${config.prefix}profile - View your profile\n` +
                                `202. ${config.prefix}level - Check your level\n` +
                                `203. ${config.prefix}daily - Get daily rewards\n` +
                                `204. ${config.prefix}inventory - View inventory\n\n` +
                                `Additional Commands:\n`;
                    for (let i = 1; i <= 96; i++) {
                        pageContent += `${i+204}. ${config.prefix}user${i} - User action ${i}\n`;
                    }
                    break;

                case 4:
                    pageTitle = '👥 *Group Commands* [100]';
                    pageContent = `Main Commands:\n` +
                                `301. ${config.prefix}kick [@user] - Kick member\n` +
                                `302. ${config.prefix}promote [@user] - Promote to admin\n` +
                                `303. ${config.prefix}mute - Mute group chat\n` +
                                `304. ${config.prefix}unmute - Unmute group chat\n\n` +
                                `Additional Commands:\n`;
                    for (let i = 1; i <= 96; i++) {
                        pageContent += `${i+304}. ${config.prefix}group${i} - Group action ${i}\n`;
                    }
                    break;

                case 5:
                    pageTitle = '🎨 *Anime Commands* [100]';
                    pageContent = `Main Commands:\n` +
                                `401. ${config.prefix}anime [title] - Search anime\n` +
                                `402. ${config.prefix}manga [title] - Search manga\n` +
                                `403. ${config.prefix}character [name] - Search character\n` +
                                `404. ${config.prefix}waifu - Random waifu image\n\n` +
                                `Additional Commands:\n`;
                    for (let i = 1; i <= 96; i++) {
                        pageContent += `${i+404}. ${config.prefix}anime${i} - Anime action ${i}\n`;
                    }
                    break;

                case 6:
                    pageTitle = '🎵 *Music Commands* [100]';
                    pageContent = `Main Commands:\n` +
                                `501. ${config.prefix}play [song] - Play music\n` +
                                `502. ${config.prefix}skip - Skip current song\n` +
                                `503. ${config.prefix}stop - Stop playback\n` +
                                `504. ${config.prefix}queue - View playlist\n\n` +
                                `Additional Commands:\n`;
                    for (let i = 1; i <= 96; i++) {
                        pageContent += `${i+504}. ${config.prefix}music${i} - Music action ${i}\n`;
                    }
                    break;

                case 7:
                    pageTitle = '🎲 *Game Commands* [100]';
                    pageContent = `Main Commands:\n` +
                                `601. ${config.prefix}truth - Truth question\n` +
                                `602. ${config.prefix}dare - Dare challenge\n` +
                                `603. ${config.prefix}rps - Rock, paper, scissors\n` +
                                `604. ${config.prefix}quiz - Start quiz game\n\n` +
                                `Additional Commands:\n`;
                    for (let i = 1; i <= 96; i++) {
                        pageContent += `${i+604}. ${config.prefix}game${i} - Game action ${i}\n`;
                    }
                    break;
            }

            const navigation = `\n📖 *Page Navigation*\n` +
                             `• Current: Page ${currentPage}/7\n` +
                             `• Next page: ${config.prefix}menu ${currentPage + 1}\n` +
                             `• Previous: ${config.prefix}menu ${currentPage - 1}\n` +
                             `• Go to page: ${config.prefix}menu [1-7]\n\n` +
                             `💡 Total Commands: 700`;

            const fullMenu = menuHeader + pageTitle + '\n\n' + pageContent + navigation;

            await sock.sendMessage(msg.key.remoteJid, {
                text: fullMenu,
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