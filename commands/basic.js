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
            if (isNaN(page) || page < 1 || page > 15) {  // Increased to 15 pages
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
                    pageTitle = '📥 *Downloader Commands - Basic*';
                    pageContent = generatePageContent(1, [
                        'ytmp3 - YouTube audio',
                        'ytmp4 - YouTube video',
                        'play - Play YouTube audio',
                        'video - Play YouTube video',
                        'tiktok - TikTok video',
                        'facebook - Facebook video',
                        'instagram - Instagram media',
                        'twitter - Twitter media',
                        'pinterest - Pinterest media',
                        'spotify - Spotify tracks'
                    ]);
                    break;

                case 2:
                    pageTitle = '📥 *Downloader Commands - Advanced*';
                    pageContent = generatePageContent(11, [
                        'soundcloud - SoundCloud tracks',
                        'mediafire - MediaFire files',
                        'gdrive - Google Drive files',
                        'mega - MEGA files',
                        'apk - Android apps',
                        'ringtone - Download ringtones',
                        'movie - Download movies',
                        'anime - Download anime',
                        'manga - Download manga',
                        'lyrics - Find song lyrics'
                    ]);
                    break;

                case 3:
                    pageTitle = '💰 *Economy Commands - Basic*';
                    pageContent = generatePageContent(21, [
                        'balance - Check balance',
                        'daily - Daily rewards',
                        'weekly - Weekly rewards',
                        'monthly - Monthly rewards',
                        'transfer - Send money',
                        'bank - Bank operations',
                        'deposit - Bank deposit',
                        'withdraw - Bank withdraw',
                        'rob - Rob users',
                        'heist - Bank heist'
                    ]);
                    break;

                case 4:
                    pageTitle = '💰 *Economy Commands - Jobs*';
                    pageContent = generatePageContent(31, [
                        'work - Work for money',
                        'jobs - View jobs',
                        'mine - Mine resources',
                        'fish - Go fishing',
                        'hunt - Go hunting',
                        'farm - Manage farm',
                        'shop - Buy items',
                        'sell - Sell items',
                        'inventory - View items',
                        'craft - Craft items'
                    ]);
                    break;

                case 5:
                    pageTitle = '🎮 *Economy Commands - Gambling*';
                    pageContent = generatePageContent(41, [
                        'gamble - Gamble money',
                        'flip - Coin flip',
                        'slots - Slot machine',
                        'blackjack - Play blackjack',
                        'poker - Play poker',
                        'roulette - Play roulette',
                        'dice - Roll dice',
                        'lottery - Buy lottery',
                        'investments - Invest money',
                        'stocks - Trade stocks'
                    ]);
                    break;

                case 6:
                    pageTitle = '👥 *Group Commands - Basic*';
                    pageContent = generatePageContent(51, [
                        'kick - Kick member',
                        'add - Add member',
                        'promote - Make admin',
                        'demote - Remove admin',
                        'setname - Set group name',
                        'setdesc - Set description',
                        'setppgc - Set group pic',
                        'tagall - Tag everyone',
                        'hidetag - Hidden tag',
                        'totag - Convert to tag'
                    ]);
                    break;

                case 7:
                    pageTitle = '👥 *Group Commands - Voting*';
                    pageContent = generatePageContent(61, [
                        'vote - Start vote',
                        'upvote - Vote up',
                        'devote - Vote down',
                        'checkvote - Check votes',
                        'delvote - Delete vote',
                        'groupinfo - Group info',
                        'grouplink - Get link',
                        'resetlink - Reset link',
                        'listonline - Online list',
                        'listadmin - Admin list'
                    ]);
                    break;

                case 8:
                    pageTitle = '👥 *Group Commands - Protection*';
                    pageContent = generatePageContent(71, [
                        'autosticker - Auto sticker',
                        'antidelete - Anti delete',
                        'antilink - Anti link',
                        'antispam - Anti spam',
                        'antitoxic - Anti toxic',
                        'welcome - Welcome msg',
                        'goodbye - Goodbye msg',
                        'setwelcome - Set welcome',
                        'setgoodbye - Set goodbye',
                        'mute - Mute group'
                    ]);
                    break;

                case 9:
                    pageTitle = '👑 *Owner Commands - Basic*';
                    pageContent = generatePageContent(81, [
                        'broadcast - Send to all',
                        'bc - Broadcast message',
                        'bcgc - Group broadcast',
                        'join - Join group',
                        'leave - Leave group',
                        'block - Block user',
                        'unblock - Unblock user',
                        'ban - Ban user',
                        'unban - Unban user',
                        'banlist - Banned users'
                    ]);
                    break;

                case 10:
                    pageTitle = '👑 *Owner Commands - System*';
                    pageContent = generatePageContent(91, [
                        'update - Update bot',
                        'restart - Restart bot',
                        'setbotbio - Set bot bio',
                        'setbotname - Set bot name',
                        'setbotpp - Set bot pic',
                        'setstatus - Set status',
                        'setprefix - Set prefix',
                        'eval - Run JS code',
                        'exec - Run terminal',
                        'ipbot - Show bot IP'
                    ]);
                    break;

                case 11:
                    pageTitle = '🎨 *Fun Commands - Stickers*';
                    pageContent = generatePageContent(101, [
                        'sticker - Make sticker',
                        'stickermeme - Meme sticker',
                        'emojimix - Mix emojis',
                        'toimg - Sticker to image',
                        'tomp3 - Video to audio',
                        'tovn - Audio to voice',
                        'tts - Text to speech',
                        'quote - Quote image',
                        'quotely - Quote sticker',
                        'triggered - Triggered effect'
                    ]);
                    break;

                case 12:
                    pageTitle = '🎨 *Fun Commands - Effects*';
                    pageContent = generatePageContent(111, [
                        'wasted - Wasted effect',
                        'jail - Jail effect',
                        'rip - RIP effect',
                        'trash - Trash effect',
                        'rainbow - Rainbow effect',
                        'circle - Circle effect',
                        'slap - Slap effect',
                        'affect - Affect effect',
                        'beautiful - Beautiful effect',
                        'blur - Blur effect'
                    ]);
                    break;

                case 13:
                    pageTitle = '🤖 *AI Commands - Chat*';
                    pageContent = generatePageContent(121, [
                        'gpt - GPT chat',
                        'gpt4 - GPT-4 chat',
                        'dalle - DALL-E art',
                        'imagine - Generate art',
                        'lisa - Chat with Lisa',
                        'rias - Chat with Rias',
                        'toxxic - Chat with Toxxic',
                        'translate - Translate text',
                        'aivoice - AI voice',
                        'aiuser - AI settings'
                    ]);
                    break;

                case 14:
                    pageTitle = '🤖 *AI Commands - Image*';
                    pageContent = generatePageContent(131, [
                        'remini - Enhance image',
                        'recolor - Recolor image',
                        'colorize - Colorize B&W',
                        'upscale - Upscale image',
                        'anime2d - Photo to anime',
                        'cartoon - Photo to cartoon',
                        'toonme - Toonify photo',
                        'txt2img - Text to image',
                        'img2txt - Image to text',
                        'qrmaker - Create QR code'
                    ]);
                    break;

                case 15:
                    pageTitle = '🔧 *Debug Commands*';
                    pageContent = generatePageContent(141, [
                        'bugandro - Android bugs',
                        'bugios - iOS bugs',
                        'clearcache - Clear cache',
                        'ping - Check speed',
                        'status - Bot status',
                        'runtime - Up time',
                        'memory - Memory usage',
                        'cpu - CPU usage',
                        'debug - Debug mode',
                        'test - Test features'
                    ]);
                    break;
            }

            const navigation = `\n📖 *Page Navigation*\n` +
                             `• Current: Page ${currentPage}/15\n` +
                             `• Next page: ${config.prefix}menu ${currentPage + 1}\n` +
                             `• Previous: ${config.prefix}menu ${currentPage - 1}\n` +
                             `• Go to page: ${config.prefix}menu [1-15]\n\n` +
                             `💡 Commands shown: 150 (10 per page)`;

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
                        `• Commands: 150\n` + 
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

// Helper function to generate formatted page content
function generatePageContent(startNum, commands) {
    return commands.map((cmd, index) => 
        `${startNum + index}. ${config.prefix}${cmd}`
    ).join('\n');
}

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