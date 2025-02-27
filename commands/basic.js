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
            if (isNaN(page) || page < 1 || page > 10) {  
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
                    pageTitle = '📥 *Downloader Commands*';
                    pageContent = `201. ${config.prefix}ytmp3 - YouTube audio\n` +
                                `202. ${config.prefix}ytmp4 - YouTube video\n` +
                                `203. ${config.prefix}play - Play YouTube audio\n` +
                                `204. ${config.prefix}video - Play YouTube video\n` +
                                `205. ${config.prefix}tiktok - TikTok downloader\n` +
                                `206. ${config.prefix}facebook - Facebook video\n` +
                                `207. ${config.prefix}instagram - Instagram media\n` +
                                `208. ${config.prefix}mediafire - MediaFire files\n` +
                                `209. ${config.prefix}apk - Android apps\n` +
                                `210. ${config.prefix}lyrics - Find song lyrics`;
                    break;

                case 3:
                    pageTitle = '💰 *Economy Commands*';
                    pageContent = `301. ${config.prefix}balance - Check balance\n` +
                                `302. ${config.prefix}daily - Daily rewards\n` +
                                `303. ${config.prefix}transfer - Send money\n` +
                                `304. ${config.prefix}bank - Bank operations\n` +
                                `305. ${config.prefix}deposit - Bank deposit\n` +
                                `306. ${config.prefix}withdraw - Bank withdraw\n` +
                                `307. ${config.prefix}rob - Rob users\n` +
                                `308. ${config.prefix}work - Earn money\n` +
                                `309. ${config.prefix}mine - Mine resources\n` +
                                `310. ${config.prefix}shop - Buy items`;
                    break;

                case 4:
                    pageTitle = '🎮 *Games & Gambling*';
                    pageContent = `401. ${config.prefix}gamble - Gamble money\n` +
                                `402. ${config.prefix}flip - Coin flip bet\n` +
                                `403. ${config.prefix}slots - Slot machine\n` +
                                `404. ${config.prefix}inventory - View items\n` +
                                `405. ${config.prefix}use - Use items\n` +
                                `406. ${config.prefix}give - Gift items\n` +
                                `407. ${config.prefix}trade - Trade items\n` +
                                `408. ${config.prefix}quest - Daily quests\n` +
                                `409. ${config.prefix}challenge - Challenges\n` +
                                `410. ${config.prefix}leaderboard - Rankings`;
                    break;

                case 5:
                    pageTitle = '👥 *Group Commands*';
                    pageContent = `501. ${config.prefix}kick - Kick member\n` +
                                `502. ${config.prefix}promote - Make admin\n` +
                                `503. ${config.prefix}demote - Remove admin\n` +
                                `504. ${config.prefix}add - Add member\n` +
                                `505. ${config.prefix}remove - Remove member\n` +
                                `506. ${config.prefix}link - Group link\n` +
                                `507. ${config.prefix}revoke - Reset link\n` +
                                `508. ${config.prefix}announce - Send announcement\n` +
                                `509. ${config.prefix}poll - Create poll\n` +
                                `510. ${config.prefix}settings - Group settings`;
                    break;

                case 6:
                    pageTitle = '🎨 *Anime Commands*';
                    pageContent = `601. ${config.prefix}anime - Search anime\n` +
                                `602. ${config.prefix}waifu - Random waifu\n` +
                                `603. ${config.prefix}neko - Random neko\n` +
                                `604. ${config.prefix}couplepp - Couple pfp\n` +
                                `605. ${config.prefix}trap - Trap images\n` +
                                `606. ${config.prefix}hentai - NSFW content\n` +
                                `607. ${config.prefix}hneko - NSFW neko\n` +
                                `608. ${config.prefix}hwaifu - NSFW waifu\n` +
                                `609. ${config.prefix}schedule - Airing list\n` +
                                `610. ${config.prefix}season - Current anime`;
                    break;

                case 7:
                    pageTitle = '🤖 *AI Commands*';
                    pageContent = `701. ${config.prefix}gpt - Chat with GPT\n` +
                                `702. ${config.prefix}imagine - Generate images\n` +
                                `703. ${config.prefix}lisa - Chat with Lisa\n` +
                                `704. ${config.prefix}rias - Chat with Rias\n` +
                                `705. ${config.prefix}toxxic - Chat with Toxxic\n` +
                                `706. ${config.prefix}txt2img - Text to image\n` +
                                `707. ${config.prefix}aiuser - AI settings\n` +
                                `708. ${config.prefix}bugandro - Report Android\n` +
                                `709. ${config.prefix}bugios - Report iOS\n` +
                                `710. ${config.prefix}help - AI commands help`;
                    break;

                case 8:
                    pageTitle = '🔧 *Owner Commands*';
                    pageContent = `801. ${config.prefix}broadcast - Send to all\n` +
                                `802. ${config.prefix}ban - Ban user\n` +
                                `803. ${config.prefix}unban - Unban user\n` +
                                `804. ${config.prefix}banlist - View bans\n` +
                                `805. ${config.prefix}bangroup - Ban group\n` +
                                `806. ${config.prefix}unbangroup - Unban group\n` +
                                `807. ${config.prefix}restart - Restart bot\n` +
                                `808. ${config.prefix}setprefix - Change prefix\n` +
                                `809. ${config.prefix}setbotname - Change name\n` +
                                `810. ${config.prefix}stats - View stats`;
                    break;

                case 9:
                    pageTitle = '⚙️ *Config Commands*';
                    pageContent = `901. ${config.prefix}setautoreply - Auto reply\n` +
                                `902. ${config.prefix}setwelcome - Welcome msg\n` +
                                `903. ${config.prefix}setgoodbye - Goodbye msg\n` +
                                `904. ${config.prefix}addcommand - Add command\n` +
                                `905. ${config.prefix}delcommand - Del command\n` +
                                `906. ${config.prefix}setlanguage - Language\n` +
                                `907. ${config.prefix}backup - Create backup\n` +
                                `908. ${config.prefix}restore - Restore bot\n` +
                                `909. ${config.prefix}update - Update bot\n` +
                                `910. ${config.prefix}reset - Reset settings`;
                    break;

                case 10:
                    pageTitle = '🔞 *NSFW Commands*';
                    pageContent = `1001. ${config.prefix}togglensfw - Toggle NSFW\n` +
                                `1002. ${config.prefix}verifyage - Age verify\n` +
                                `1003. ${config.prefix}nsfwart - View artwork\n` +
                                `1004. ${config.prefix}nsfwstory - View stories\n` +
                                `1005. ${config.prefix}nsfwmedia - View media\n` +
                                `1006. ${config.prefix}hentai - View hentai\n` +
                                `1007. ${config.prefix}hneko - Neko content\n` +
                                `1008. ${config.prefix}hwaifu - Waifu content\n` +
                                `1009. ${config.prefix}nsearch - NSFW search\n` +
                                `1010. ${config.prefix}nrandom - Random NSFW`;
                    break;
            }

            const navigation = `\n📖 *Page Navigation*\n` +
                             `• Current: Page ${currentPage}/10\n` +  
                             `• Next page: ${config.prefix}menu ${currentPage + 1}\n` +
                             `• Previous: ${config.prefix}menu ${currentPage - 1}\n` +
                             `• Go to page: ${config.prefix}menu [1-10]\n\n` +  
                             `💡 Commands shown: 100 (10 per category)`;  

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
                        `• Commands: 100\n` + // Updated command count
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