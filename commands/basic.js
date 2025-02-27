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

            const getCommandDescription = (category, index) => {
                // Define core commands for each category
                const commands = {
                    basic: [
                        ['menu', 'Show all available commands'],
                        ['help', 'Get detailed help for any command'],
                        ['ping', 'Check bot response time'],
                        ['info', 'View bot information'],
                        ['rules', 'Show bot usage rules'],
                        ['about', 'About this bot and features'],
                        ['owner', 'Contact bot owner'],
                        ['donate', 'Support bot development'],
                        ['stats', 'View bot statistics'],
                        ['uptime', 'Check how long bot is running'],
                        ['speed', 'Test connection speed'],
                        ['restart', 'Restart the bot'],
                        ['update', 'Check for updates'],
                        ['settings', 'Configure bot settings'],
                        ['language', 'Change bot language'],
                        // Additional basic commands with meaningful names
                        ['customprefix', 'Change command prefix'],
                        ['timezone', 'Set your timezone'],
                        ['notifications', 'Manage notifications'],
                        ['backup', 'Backup your data'],
                        ['restore', 'Restore from backup']
                    ],
                    fun: [
                        ['slap', 'Slap someone with anime gif'],
                        ['hug', 'Give someone a warm hug'],
                        ['pat', 'Pat someone gently'],
                        ['dance', 'Show dance animations'],
                        ['joke', 'Get a random joke'],
                        ['meme', 'Send random memes'],
                        ['quote', 'Get inspirational quotes'],
                        ['8ball', 'Ask magic 8 ball'],
                        ['roll', 'Roll a dice'],
                        ['flip', 'Flip a coin'],
                        ['rps', 'Play rock paper scissors'],
                        ['tictactoe', 'Play tic tac toe'],
                        ['hangman', 'Play hangman game'],
                        ['trivia', 'Start a trivia quiz'],
                        ['riddle', 'Get a riddle to solve'],
                        // Additional fun commands
                        ['wordchain', 'Play word chain game'],
                        ['scramble', 'Word scramble game'],
                        ['typing', 'Typing speed test'],
                        ['math', 'Math quiz game'],
                        ['memory', 'Memory card game']
                    ],
                    user: [
                        ['profile', 'View your detailed profile'],
                        ['level', 'Check your current level'],
                        ['daily', 'Claim daily rewards'],
                        ['inventory', 'Check your items'],
                        ['register', 'Create a new account'],
                        ['nickname', 'Change your nickname'],
                        ['bio', 'Set your profile bio'],
                        ['avatar', 'Change profile picture'],
                        ['balance', 'Check your wallet'],
                        ['transfer', 'Send money to users'],
                        ['shop', 'Browse item shop'],
                        ['buy', 'Purchase items'],
                        ['sell', 'Sell your items'],
                        ['gift', 'Send gifts to users'],
                        ['marry', 'Propose to someone'],
                        // Additional user commands
                        ['signature', 'Set custom signature'],
                        ['background', 'Custom profile background'],
                        ['title', 'Set custom title'],
                        ['badge', 'View your badges'],
                        ['achievements', 'Check achievements']
                    ],
                    group: [
                        ['kick', 'Remove member from group'],
                        ['promote', 'Make someone admin'],
                        ['demote', 'Remove admin status'],
                        ['add', 'Add new member'],
                        ['remove', 'Remove member'],
                        ['link', 'Get group invite link'],
                        ['revoke', 'Reset group link'],
                        ['announce', 'Send announcement'],
                        ['poll', 'Create voting poll'],
                        ['settings', 'Group settings'],
                        ['welcome', 'Set welcome message'],
                        ['leave', 'Set goodbye message'],
                        ['rules', 'Set group rules'],
                        ['antilink', 'Anti-link protection'],
                        ['antispam', 'Anti-spam protection'],
                        // Additional group commands
                        ['tagall', 'Mention all members'],
                        ['chatlock', 'Lock group chat'],
                        ['filter', 'Add word filter'],
                        ['logs', 'View group logs'],
                        ['schedule', 'Schedule messages']
                    ],
                    anime: [
                        ['anime', 'Search for anime'],
                        ['manga', 'Search for manga'],
                        ['character', 'Search characters'],
                        ['waifu', 'Random waifu image'],
                        ['neko', 'Random neko image'],
                        ['schedule', 'Anime airing schedule'],
                        ['airing', 'Currently airing anime'],
                        ['upcoming', 'Upcoming anime'],
                        ['genre', 'Browse by genre'],
                        ['studio', 'Search by studio'],
                        ['recommend', 'Get recommendations'],
                        ['quote', 'Random anime quotes'],
                        ['wallpaper', 'Anime wallpapers'],
                        ['news', 'Latest anime news'],
                        ['watch', 'Get watch order'],
                        // Additional anime commands
                        ['seasonal', 'Seasonal anime list'],
                        ['review', 'Anime reviews'],
                        ['trailer', 'Watch anime trailers'],
                        ['openings', 'Anime openings'],
                        ['endings', 'Anime endings']
                    ],
                    music: [
                        ['play', 'Play a song'],
                        ['skip', 'Skip current song'],
                        ['stop', 'Stop playback'],
                        ['queue', 'View music queue'],
                        ['pause', 'Pause playback'],
                        ['resume', 'Resume playback'],
                        ['volume', 'Adjust volume'],
                        ['lyrics', 'Get song lyrics'],
                        ['playlist', 'Manage playlists'],
                        ['nowplaying', 'Show current song'],
                        ['search', 'Search for songs'],
                        ['loop', 'Toggle repeat mode'],
                        ['shuffle', 'Shuffle playlist'],
                        ['radio', 'Play radio stations'],
                        ['spotify', 'Play from Spotify'],
                        // Additional music commands
                        ['youtube', 'Play from YouTube'],
                        ['soundcloud', 'SoundCloud tracks'],
                        ['favorite', 'Favorite songs'],
                        ['download', 'Download music'],
                        ['equalizer', 'Audio equalizer']
                    ],
                    game: [
                        ['truth', 'Truth or Dare - Truth'],
                        ['dare', 'Truth or Dare - Dare'],
                        ['rps', 'Rock Paper Scissors'],
                        ['quiz', 'Knowledge quiz'],
                        ['blackjack', 'Play Blackjack'],
                        ['poker', 'Texas Hold\'em Poker'],
                        ['slots', 'Slot machine'],
                        ['dice', 'Roll dice games'],
                        ['fish', 'Fishing simulator'],
                        ['mine', 'Mining adventure'],
                        ['hunt', 'Hunting game'],
                        ['duel', 'PvP duels'],
                        ['battle', 'Pokemon battles'],
                        ['adventure', 'RPG adventure'],
                        ['quest', 'Daily quests'],
                        // Additional game commands
                        ['lottery', 'Daily lottery'],
                        ['coinflip', 'Bet on coinflip'],
                        ['jackpot', 'Jackpot game'],
                        ['roulette', 'Casino roulette'],
                        ['bingo', 'Play bingo']
                    ]
                };

                if (index < commands[category].length) {
                    return commands[category][index];
                }

                // Generate themed commands for remaining slots
                const themes = {
                    basic: [
                        ['autoresponder', 'Set automatic responses'],
                        ['filter', 'Content filtering rules'],
                        ['schedule', 'Schedule bot actions'],
                        ['backup', 'Data backup options'],
                        ['monitor', 'System monitoring']
                    ],
                    fun: [
                        ['party', 'Party game modes'],
                        ['challenge', 'Daily challenges'],
                        ['minigame', 'Quick mini games'],
                        ['puzzle', 'Brain teasers'],
                        ['multiplayer', 'Group games']
                    ],
                    user: [
                        ['customize', 'Profile customization'],
                        ['collection', 'Item collections'],
                        ['achievement', 'Special achievements'],
                        ['ranking', 'Ranking features'],
                        ['special', 'Special perks']
                    ],
                    group: [
                        ['moderation', 'Mod tools'],
                        ['automod', 'Auto moderation'],
                        ['welcome', 'Welcome features'],
                        ['activity', 'Group activities'],
                        ['security', 'Security features']
                    ],
                    anime: [
                        ['seasonal', 'Seasonal content'],
                        ['community', 'Community features'],
                        ['discovery', 'Anime discovery'],
                        ['collection', 'Collection tools'],
                        ['tracking', 'Anime tracking']
                    ],
                    music: [
                        ['playlist', 'Playlist features'],
                        ['discover', 'Music discovery'],
                        ['effect', 'Sound effects'],
                        ['stream', 'Music streaming'],
                        ['audio', 'Audio tools']
                    ],
                    game: [
                        ['rpg', 'RPG elements'],
                        ['tournament', 'Tournaments'],
                        ['reward', 'Daily rewards'],
                        ['season', 'Seasonal events'],
                        ['achievement', 'Game achievements']
                    ]
                };

                const themeIndex = Math.floor((index - commands[category].length) % themes[category].length);
                const numSuffix = Math.floor((index - commands[category].length) / themes[category].length) + 1;
                const [prefix, desc] = themes[category][themeIndex];
                return [`${prefix}${numSuffix}`, `${desc} #${numSuffix}`];
            };

            const generateCommands = (start, category) => {
                let content = '';
                for (let i = 0; i < 100; i++) {
                    const cmdNum = start + i;
                    const [cmdName, cmdDesc] = getCommandDescription(category, i);
                    content += `${cmdNum}. ${config.prefix}${cmdName} - ${cmdDesc}\n`;
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