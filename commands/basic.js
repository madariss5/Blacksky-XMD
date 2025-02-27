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

            const getCommandName = (category, index) => {
                const basicNames = ['menu', 'help', 'ping', 'info', 'rules', 'about', 'owner', 'donate', 'stats', 'uptime',
                    'speed', 'rank', 'level', 'profile', 'settings', 'language', 'timezone', 'restart', 'update', 'status'];
                const funNames = ['slap', 'hug', 'pat', 'dance', 'joke', 'meme', 'quote', '8ball', 'roll', 'flip',
                    'rps', 'tictactoe', 'hangman', 'trivia', 'riddle', 'dare', 'truth', 'snake', 'puzzle', 'memory'];
                const userNames = ['profile', 'level', 'daily', 'inventory', 'register', 'nickname', 'bio', 'avatar',
                    'balance', 'transfer', 'shop', 'buy', 'sell', 'gift', 'marry', 'divorce', 'quest', 'achievement', 'pet', 'collection'];
                const groupNames = ['kick', 'promote', 'demote', 'add', 'remove', 'link', 'revoke', 'announce', 'poll',
                    'settings', 'welcome', 'leave', 'rules', 'antilink', 'antispam', 'warning', 'ban', 'unban', 'mute', 'unmute'];
                const animeNames = ['anime', 'manga', 'character', 'waifu', 'neko', 'schedule', 'airing', 'upcoming',
                    'genre', 'studio', 'recommend', 'quote', 'wallpaper', 'news', 'watch', 'seasonal', 'top', 'random', 'search', 'info'];
                const musicNames = ['play', 'skip', 'stop', 'queue', 'pause', 'resume', 'volume', 'lyrics', 'playlist',
                    'nowplaying', 'search', 'loop', 'shuffle', 'radio', 'spotify', 'youtube', 'download', 'favorite', 'history', 'trending'];
                const gameNames = ['truth', 'dare', 'rps', 'quiz', 'blackjack', 'poker', 'slots', 'dice', 'fish', 'mine',
                    'hunt', 'duel', 'battle', 'adventure', 'quest', 'lottery', 'coinflip', 'jackpot', 'bet', 'gamble'];

                const baseNames = {
                    'basic': basicNames,
                    'fun': funNames,
                    'user': userNames,
                    'group': groupNames,
                    'anime': animeNames,
                    'music': musicNames,
                    'game': gameNames
                };

                if (index < baseNames[category].length) {
                    return baseNames[category][index];
                }

                // Generate descriptive names for remaining commands
                const themes = {
                    'basic': ['config', 'system', 'utility', 'tool', 'option'],
                    'fun': ['game', 'play', 'enjoy', 'mini', 'action'],
                    'user': ['account', 'profile', 'social', 'stats', 'perk'],
                    'group': ['admin', 'manage', 'control', 'mod', 'chat'],
                    'anime': ['weeb', 'otaku', 'japan', 'watch', 'series'],
                    'music': ['song', 'audio', 'sound', 'track', 'tune'],
                    'game': ['play', 'challenge', 'compete', 'battle', 'mission']
                };

                const theme = themes[category][Math.floor((index - baseNames[category].length) % themes[category].length)];
                const num = Math.floor((index - baseNames[category].length) / themes[category].length) + 1;
                return `${theme}${num}`;
            };

            const generateCommands = (start, category) => {
                let content = '';
                for (let i = 0; i < 100; i++) {
                    const cmdNum = start + i;
                    const cmdName = getCommandName(category, i);
                    content += `${cmdNum}. ${config.prefix}${cmdName}\n`;
                }
                return content;
            };

            switch(currentPage) {
                case 1:
                    pageTitle = '⚙️ *Basic Commands* [100]';
                    pageContent = generateCommands(1, 'basic');
                    break;
                case 2:
                    pageTitle = '🎮 *Fun Commands* [100]';
                    pageContent = generateCommands(101, 'fun');
                    break;
                case 3:
                    pageTitle = '👤 *User Commands* [100]';
                    pageContent = generateCommands(201, 'user');
                    break;
                case 4:
                    pageTitle = '👥 *Group Commands* [100]';
                    pageContent = generateCommands(301, 'group');
                    break;
                case 5:
                    pageTitle = '🎨 *Anime Commands* [100]';
                    pageContent = generateCommands(401, 'anime');
                    break;
                case 6:
                    pageTitle = '🎵 *Music Commands* [100]';
                    pageContent = generateCommands(501, 'music');
                    break;
                case 7:
                    pageTitle = '🎲 *Game Commands* [100]';
                    pageContent = generateCommands(601, 'game');
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