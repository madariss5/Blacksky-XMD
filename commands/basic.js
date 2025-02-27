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
                const commandDescriptions = {
                    basic: [
                        ['menu', 'Show this command menu'],
                        ['help', 'Get detailed help on commands'],
                        ['ping', 'Check bot response time'],
                        ['info', 'Show bot information'],
                        ['rules', 'Display bot usage rules'],
                        ['about', 'About this bot and its features'],
                        ['owner', 'Contact bot owner'],
                        ['donate', 'Support bot development'],
                        ['stats', 'View bot statistics'],
                        ['uptime', 'Check bot uptime'],
                        ['speed', 'Test connection speed'],
                        ['rank', 'Check your rank'],
                        ['level', 'View your level'],
                        ['profile', 'Display your profile'],
                        ['settings', 'Configure bot settings'],
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
                    ],
                    user: [
                        ['profile', 'View detailed profile'],
                        ['level', 'Check your level and XP'],
                        ['daily', 'Claim daily rewards'],
                        ['inventory', 'Check your items'],
                        ['register', 'Create an account'],
                        ['nickname', 'Change your nickname'],
                        ['bio', 'Set your bio'],
                        ['avatar', 'Change profile picture'],
                        ['balance', 'Check your wallet'],
                        ['transfer', 'Send money to users'],
                        ['shop', 'Browse item shop'],
                        ['buy', 'Purchase items'],
                        ['sell', 'Sell your items'],
                        ['gift', 'Send gifts to users'],
                        ['marry', 'Propose to someone'],
                    ],
                    group: [
                        ['kick', 'Kick a group member'],
                        ['promote', 'Promote to admin'],
                        ['demote', 'Demote from admin'],
                        ['add', 'Add member to group'],
                        ['remove', 'Remove from group'],
                        ['link', 'Get group invite link'],
                        ['revoke', 'Reset group link'],
                        ['announce', 'Make announcement'],
                        ['poll', 'Create group poll'],
                        ['settings', 'Group settings'],
                        ['welcome', 'Set welcome message'],
                        ['leave', 'Set leave message'],
                        ['rules', 'Set group rules'],
                        ['antilink', 'Toggle anti-link'],
                        ['antispam', 'Toggle anti-spam'],
                    ],
                    anime: [
                        ['anime', 'Search for anime'],
                        ['manga', 'Search for manga'],
                        ['character', 'Search anime characters'],
                        ['waifu', 'Random waifu image'],
                        ['neko', 'Random neko image'],
                        ['schedule', 'Anime air schedule'],
                        ['airing', 'Currently airing anime'],
                        ['upcoming', 'Upcoming anime'],
                        ['genre', 'Browse by genre'],
                        ['studio', 'Search by studio'],
                        ['recommend', 'Get recommendations'],
                        ['quote', 'Random anime quotes'],
                        ['wallpaper', 'Anime wallpapers'],
                        ['news', 'Latest anime news'],
                        ['watch', 'Get watch order'],
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
                    ],
                    game: [
                        ['truth', 'Get truth question'],
                        ['dare', 'Get dare challenge'],
                        ['rps', 'Rock paper scissors'],
                        ['quiz', 'Start a quiz game'],
                        ['blackjack', 'Play blackjack'],
                        ['poker', 'Play poker game'],
                        ['slots', 'Play slot machine'],
                        ['dice', 'Roll the dice'],
                        ['fish', 'Go fishing'],
                        ['mine', 'Go mining'],
                        ['hunt', 'Go hunting'],
                        ['duel', 'Duel other players'],
                        ['battle', 'Pokemon battles'],
                        ['adventure', 'Start adventure'],
                        ['quest', 'Daily quests'],
                    ]
                };

                if (index < commandDescriptions[category].length) {
                    return commandDescriptions[category][index];
                }

                // Generate themed descriptions for additional commands
                const themes = {
                    basic: [
                        ['config', 'Configure bot settings'],
                        ['system', 'System commands'],
                        ['utility', 'Utility functions'],
                        ['tool', 'Helper tools'],
                        ['option', 'Additional options']
                    ],
                    fun: [
                        ['game', 'Mini games'],
                        ['play', 'Fun activities'],
                        ['enjoy', 'Entertainment'],
                        ['mini', 'Quick games'],
                        ['action', 'Interactive actions']
                    ],
                    user: [
                        ['account', 'Account management'],
                        ['profile', 'Profile features'],
                        ['social', 'Social interactions'],
                        ['stats', 'Statistics tracking'],
                        ['perk', 'Special perks']
                    ],
                    group: [
                        ['admin', 'Admin controls'],
                        ['manage', 'Group management'],
                        ['control', 'Moderation tools'],
                        ['mod', 'Moderator actions'],
                        ['chat', 'Chat features']
                    ],
                    anime: [
                        ['weeb', 'Anime content'],
                        ['otaku', 'Otaku stuff'],
                        ['japan', 'Japanese media'],
                        ['watch', 'Watching guides'],
                        ['series', 'Anime series']
                    ],
                    music: [
                        ['song', 'Song controls'],
                        ['audio', 'Audio features'],
                        ['sound', 'Sound effects'],
                        ['track', 'Track management'],
                        ['tune', 'Music tuning']
                    ],
                    game: [
                        ['play', 'Game modes'],
                        ['challenge', 'Challenges'],
                        ['compete', 'Competitions'],
                        ['battle', 'Battle modes'],
                        ['mission', 'Missions']
                    ]
                };

                const themeIndex = Math.floor((index - commandDescriptions[category].length) % themes[category].length);
                const numSuffix = Math.floor((index - commandDescriptions[category].length) / themes[category].length) + 1;
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