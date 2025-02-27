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
            if (isNaN(page) || page < 1 || page > 8) {  // Updated max pages to 8
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
                    pageTitle = '⚙️ *Basic Commands*';
                    pageContent = `1. ${config.prefix}menu - Show all commands\n` +
                                `2. ${config.prefix}help - Get command help\n` +
                                `3. ${config.prefix}ping - Check bot response\n` +
                                `4. ${config.prefix}info - View bot information\n` +
                                `5. ${config.prefix}rules - Show bot rules\n` +
                                `6. ${config.prefix}about - About this bot\n` +
                                `7. ${config.prefix}owner - Contact owner\n` +
                                `8. ${config.prefix}donate - Support development\n` +
                                `9. ${config.prefix}stats - View statistics\n` +
                                `10. ${config.prefix}uptime - Check uptime`;
                    break;

                case 2:
                    pageTitle = '🎮 *Fun Commands*';
                    pageContent = `101. ${config.prefix}slap - Slap with anime gif\n` +
                                `102. ${config.prefix}hug - Give warm hug\n` +
                                `103. ${config.prefix}pat - Pat gently\n` +
                                `104. ${config.prefix}dance - Show dance moves\n` +
                                `105. ${config.prefix}joke - Random joke\n` +
                                `106. ${config.prefix}meme - Random meme\n` +
                                `107. ${config.prefix}quote - Random quote\n` +
                                `108. ${config.prefix}8ball - Magic 8ball\n` +
                                `109. ${config.prefix}roll - Roll dice\n` +
                                `110. ${config.prefix}flip - Flip coin`;
                    break;

                case 3:
                    pageTitle = '👤 *User Commands*';
                    pageContent = `201. ${config.prefix}profile - View profile\n` +
                                `202. ${config.prefix}level - Check level\n` +
                                `203. ${config.prefix}daily - Daily rewards\n` +
                                `204. ${config.prefix}inventory - View inventory\n` +
                                `205. ${config.prefix}register - Create account\n` +
                                `206. ${config.prefix}nickname - Set nickname\n` +
                                `207. ${config.prefix}bio - Set bio\n` +
                                `208. ${config.prefix}avatar - Set avatar\n` +
                                `209. ${config.prefix}balance - Check wallet\n` +
                                `210. ${config.prefix}transfer - Send money`;
                    break;

                case 4:
                    pageTitle = '👥 *Group Commands*';
                    pageContent = `301. ${config.prefix}kick - Kick member\n` +
                                `302. ${config.prefix}promote - Promote to admin\n` +
                                `303. ${config.prefix}demote - Remove admin\n` +
                                `304. ${config.prefix}add - Add member\n` +
                                `305. ${config.prefix}remove - Remove member\n` +
                                `306. ${config.prefix}link - Group link\n` +
                                `307. ${config.prefix}revoke - Reset link\n` +
                                `308. ${config.prefix}announce - Send announcement\n` +
                                `309. ${config.prefix}poll - Create poll\n` +
                                `310. ${config.prefix}settings - Group settings`;
                    break;

                case 5:
                    pageTitle = '🎨 *Anime Commands*';
                    pageContent = `401. ${config.prefix}anime - Search anime info\n` +
                                `402. ${config.prefix}manga - Search manga info\n` +
                                `403. ${config.prefix}waifu - Random waifu image\n` +
                                `404. ${config.prefix}neko - Random neko image\n` +
                                `405. ${config.prefix}couplepp - Anime couple pfp\n` +
                                `406. ${config.prefix}trap - Anime trap image\n` +
                                `407. ${config.prefix}schedule - Anime schedule\n` +
                                `408. ${config.prefix}seasonal - Current season\n` +
                                `409. ${config.prefix}character - Search character\n` +
                                `410. ${config.prefix}wallpaper - Anime wallpapers`;
                    break;

                case 6:
                    pageTitle = '🤖 *AI Commands*';
                    pageContent = `701. ${config.prefix}gpt - Chat with GPT\n` +
                                `702. ${config.prefix}imagine - Generate images\n` +
                                `703. ${config.prefix}lisa - Chat with Lisa\n` +
                                `704. ${config.prefix}rias - Chat with Rias\n` +
                                `705. ${config.prefix}toxxic - Chat with Toxxic\n` +
                                `706. ${config.prefix}txt2img - Text to image\n` +
                                `707. ${config.prefix}aiuser - AI user settings\n` +
                                `708. ${config.prefix}bugandro - Report Android bug\n` +
                                `709. ${config.prefix}bugios - Report iOS bug\n` +
                                `710. ${config.prefix}help - AI commands help`;
                    break;

                case 7:
                    pageTitle = '🎵 *Music Commands*';
                    pageContent = `501. ${config.prefix}play - Play song\n` +
                                `502. ${config.prefix}skip - Skip song\n` +
                                `503. ${config.prefix}stop - Stop music\n` +
                                `504. ${config.prefix}queue - View queue\n` +
                                `505. ${config.prefix}pause - Pause music\n` +
                                `506. ${config.prefix}resume - Resume music\n` +
                                `507. ${config.prefix}volume - Adjust volume\n` +
                                `508. ${config.prefix}lyrics - Get lyrics\n` +
                                `509. ${config.prefix}playlist - Manage playlists\n` +
                                `510. ${config.prefix}search - Search songs`;
                    break;

                case 8:
                    pageTitle = '🎲 *Game Commands*';
                    pageContent = `601. ${config.prefix}truth - Truth question\n` +
                                `602. ${config.prefix}dare - Dare challenge\n` +
                                `603. ${config.prefix}rps - Rock paper scissors\n` +
                                `604. ${config.prefix}quiz - Start quiz\n` +
                                `605. ${config.prefix}blackjack - Play blackjack\n` +
                                `606. ${config.prefix}slots - Play slots\n` +
                                `607. ${config.prefix}dice - Roll dice\n` +
                                `608. ${config.prefix}fish - Go fishing\n` +
                                `609. ${config.prefix}hunt - Go hunting\n` +
                                `610. ${config.prefix}duel - Challenge duel`;
                    break;
            }

            const navigation = `\n📖 *Page Navigation*\n` +
                             `• Current: Page ${currentPage}/8\n` +  // Updated max pages
                             `• Next page: ${config.prefix}menu ${currentPage + 1}\n` +
                             `• Previous: ${config.prefix}menu ${currentPage - 1}\n` +
                             `• Go to page: ${config.prefix}menu [1-8]\n\n` +  // Updated range
                             `💡 Commands shown: 80 (10 per category)`;  // Updated count

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
                501: 'Play Music\nUsage: !play <song name>\nPlay a song in voice chat',
                601: 'Truth Command\nUsage: !truth\nGet a random truth question'
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
                        `• Commands: 80\n` +
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
    const commands = {
        101: 'slap', 102: 'hug', 103: 'pat', 104: 'dance', 105: 'joke', 106: 'meme', 107: 'quote', 108: '8ball', 109: 'roll', 110: 'flip',
        201: 'profile', 202: 'level', 203: 'daily', 204: 'inventory', 205: 'register', 206: 'nickname', 207: 'bio', 208: 'avatar', 209: 'balance', 210: 'transfer',
        301: 'kick', 302: 'promote', 303: 'demote', 304: 'add', 305: 'remove', 306: 'link', 307: 'revoke', 308: 'announce', 309: 'poll', 310: 'settings',
        401: 'anime', 402: 'manga', 403: 'character', 404: 'waifu', 405: 'neko', 406: 'schedule', 407: 'upcoming', 408: 'genre', 409: 'quote', 410: 'wallpaper',
        501: 'play', 502: 'skip', 503: 'stop', 504: 'queue', 505: 'pause', 506: 'resume', 507: 'volume', 508: 'lyrics', 509: 'playlist', 510: 'search',
        601: 'truth', 602: 'dare', 603: 'rps', 604: 'quiz', 605: 'blackjack', 606: 'slots', 607: 'dice', 608: 'fish', 609: 'hunt', 610: 'duel',
        701: 'gpt', 702: 'imagine', 703: 'lisa', 704: 'rias', 705: 'toxxic', 706: 'txt2img', 707: 'aiuser', 708: 'bugandro', 709: 'bugios', 710: 'help'
    };
    return commands[num] || 'unknown';
}

module.exports = basicCommands;