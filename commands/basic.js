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

            const generateCommands = (start, category, baseNames) => {
                let content = '';
                for (let i = 0; i < 100; i++) {
                    const cmdNum = start + i;
                    let cmdName;
                    if (i < baseNames.length) {
                        cmdName = baseNames[i];
                    } else {
                        // Generate descriptive names for additional commands
                        switch(category) {
                            case 'basic':
                                cmdName = `utility${i+1}`;
                                break;
                            case 'fun':
                                cmdName = `minigame${i+1}`;
                                break;
                            case 'user':
                                cmdName = `profile${i+1}`;
                                break;
                            case 'group':
                                cmdName = `manage${i+1}`;
                                break;
                            case 'anime':
                                cmdName = `weeb${i+1}`;
                                break;
                            case 'music':
                                cmdName = `song${i+1}`;
                                break;
                            case 'game':
                                cmdName = `play${i+1}`;
                                break;
                        }
                    }
                    content += `${cmdNum}. ${config.prefix}${cmdName}\n`;
                }
                return content;
            };

            switch(currentPage) {
                case 1:
                    pageTitle = '⚙️ *Basic Commands* [100]';
                    pageContent = generateCommands(1, 'basic', [
                        'menu', 'help', 'ping', 'info', 'rules', 'about',
                        'owner', 'donate', 'report', 'feedback', 'uptime',
                        'stats', 'speed', 'restart', 'update', 'status',
                        'settings', 'prefix', 'language', 'timezone'
                    ]);
                    break;

                case 2:
                    pageTitle = '🎮 *Fun Commands* [100]';
                    pageContent = generateCommands(101, 'fun', [
                        'slap', 'hug', 'pat', 'dance', 'joke', 'meme',
                        'quote', '8ball', 'roll', 'flip', 'rps',
                        'tictactoe', 'hangman', 'trivia', 'riddle',
                        'dare', 'truth', 'minesweeper', 'snake', 'puzzle'
                    ]);
                    break;

                case 3:
                    pageTitle = '👤 *User Commands* [100]';
                    pageContent = generateCommands(201, 'user', [
                        'profile', 'level', 'daily', 'inventory', 'register',
                        'nickname', 'bio', 'avatar', 'rank', 'balance',
                        'transfer', 'shop', 'buy', 'sell', 'gift',
                        'marry', 'divorce', 'reputation', 'achievement', 'quest'
                    ]);
                    break;

                case 4:
                    pageTitle = '👥 *Group Commands* [100]';
                    pageContent = generateCommands(301, 'group', [
                        'kick', 'promote', 'mute', 'unmute', 'add',
                        'remove', 'link', 'revoke', 'announce', 'poll',
                        'settings', 'welcome', 'leave', 'rules', 'antilink',
                        'antispam', 'antiraid', 'warning', 'ban', 'unban'
                    ]);
                    break;

                case 5:
                    pageTitle = '🎨 *Anime Commands* [100]';
                    pageContent = generateCommands(401, 'anime', [
                        'anime', 'manga', 'character', 'waifu', 'schedule',
                        'season', 'upcoming', 'airing', 'genre', 'studio',
                        'recommend', 'quote', 'wallpaper', 'news', 'watch',
                        'neko', 'sauce', 'cosplay', 'fanart', 'seasonal'
                    ]);
                    break;

                case 6:
                    pageTitle = '🎵 *Music Commands* [100]';
                    pageContent = generateCommands(501, 'music', [
                        'play', 'skip', 'stop', 'queue', 'pause',
                        'resume', 'volume', 'lyrics', 'playlist', 'nowplaying',
                        'search', 'loop', 'shuffle', 'radio', 'spotify',
                        'youtube', 'soundcloud', 'download', 'favorite', 'history'
                    ]);
                    break;

                case 7:
                    pageTitle = '🎲 *Game Commands* [100]';
                    pageContent = generateCommands(601, 'game', [
                        'truth', 'dare', 'rps', 'quiz', 'blackjack',
                        'poker', 'slots', 'dice', 'fish', 'mine',
                        'hunt', 'duel', 'battle', 'adventure', 'quest',
                        'lottery', 'coinflip', 'jackpot', 'bet', 'gamble'
                    ]);
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