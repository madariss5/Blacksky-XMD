const config = require('../config');
const logger = require('pino')();

const commands = {
    menu: async (sock, msg) => {
        try {
            const menuHeader = `╭━━━❰ *${config.botName}* ❱━━━⊷❍
┃ ⌯ Creator: @${config.ownerNumber.split('@')[0]}
┃ ⌯ Prefix: ${config.prefix}
┃ ⌯ Version: 2.0.0
╰━━━━━━━━━━━━⊷❍\n\n`;

            // Define command categories with emojis and expanded commands
            const categories = {
                '👤 User Commands': [
                    { cmd: 'profile', desc: 'View user profile with picture' },
                    { cmd: 'me', desc: 'View your own profile with picture' },
                    { cmd: 'register', desc: 'Register your profile' },
                    { cmd: 'daily', desc: 'Claim daily rewards' },
                    { cmd: 'rank', desc: 'Check your rank and level' },
                    { cmd: 'inventory', desc: 'View your inventory' },
                    { cmd: 'achievements', desc: 'View your achievements' },
                    { cmd: 'bio', desc: 'Set or view your bio' },
                    { cmd: 'reminder', desc: 'Set a reminder' },
                    { cmd: 'level', desc: 'View detailed level stats' },
                    { cmd: 'status', desc: 'Check your WhatsApp status' },
                    { cmd: 'stats', desc: 'View your game statistics' },
                    { cmd: 'wallet', desc: 'Check your virtual wallet' },
                    { cmd: 'shop', desc: 'Browse available items' },
                    { cmd: 'buy', desc: 'Purchase items from shop' },
                    { cmd: 'sell', desc: 'Sell items from inventory' },
                    { cmd: 'trade', desc: 'Trade items with users' },
                    { cmd: 'gift', desc: 'Send gifts to other users' },
                    { cmd: 'quest', desc: 'View available quests' },
                    { cmd: 'missions', desc: 'Check daily missions' }
                    // Additional commands up to 50 can be added here
                ],
                '🎭 Fun Commands': [
                    { cmd: 'slap', desc: 'Slap someone with anime gif' },
                    { cmd: 'hug', desc: 'Give someone a warm hug' },
                    { cmd: 'pat', desc: 'Pat someone gently' },
                    { cmd: 'dance', desc: 'Show off dance moves' },
                    { cmd: 'kill', desc: 'Dramatically eliminate someone' },
                    { cmd: 'highfive', desc: 'Give a high-five' },
                    { cmd: 'facepalm', desc: 'Express disappointment' },
                    { cmd: 'poke', desc: 'Poke someone playfully' },
                    { cmd: 'cuddle', desc: 'Cuddle with someone' },
                    { cmd: 'yeet', desc: 'Yeet someone to space' },
                    { cmd: 'boop', desc: 'Boop someone\'s nose' },
                    { cmd: 'bonk', desc: 'Bonk someone' },
                    { cmd: 'joke', desc: 'Get a random joke' },
                    { cmd: 'meme', desc: 'Get anime memes' },
                    { cmd: 'quote', desc: 'Get inspiring quotes' },
                    { cmd: 'fact', desc: 'Learn random facts' },
                    { cmd: 'punch', desc: 'Punch with style' },
                    { cmd: 'kiss', desc: 'Kiss someone sweetly' },
                    { cmd: 'wave', desc: 'Wave at someone' },
                    { cmd: 'wink', desc: 'Wink at someone' }
                    // Additional commands up to 50 can be added here
                ],
                '🎮 Game Commands': [
                    { cmd: 'coinflip', desc: 'Flip a coin' },
                    { cmd: 'wordgame', desc: 'Play word guessing game' },
                    { cmd: 'trivia', desc: 'Play trivia quiz' },
                    { cmd: 'magic8ball', desc: 'Ask the magic 8 ball' },
                    { cmd: 'truth', desc: 'Get truth questions' },
                    { cmd: 'dare', desc: 'Get dare challenges' },
                    { cmd: 'rps', desc: 'Play rock, paper, scissors' },
                    { cmd: 'pokemon', desc: 'Catch and battle Pokemon' },
                    { cmd: 'slots', desc: 'Play slot machine' },
                    { cmd: 'blackjack', desc: 'Play blackjack' },
                    { cmd: 'dice', desc: 'Roll the dice' },
                    { cmd: 'quiz', desc: 'Anime quiz game' },
                    { cmd: 'hangman', desc: 'Play hangman' },
                    { cmd: 'tictactoe', desc: 'Play tic-tac-toe' },
                    { cmd: 'memory', desc: 'Test your memory' },
                    { cmd: 'math', desc: 'Solve math problems' },
                    { cmd: 'scramble', desc: 'Word scramble game' },
                    { cmd: 'battle', desc: 'Battle other users' },
                    { cmd: 'fish', desc: 'Go fishing' },
                    { cmd: 'mine', desc: 'Go mining' }
                    // Additional commands up to 50 can be added here
                ],
                '👑 Owner Commands': [
                    { cmd: 'broadcast', desc: 'Send message to all chats' },
                    { cmd: 'ban', desc: 'Ban a user' },
                    { cmd: 'unban', desc: 'Unban a user' },
                    { cmd: 'banlist', desc: 'View banned users' },
                    { cmd: 'maintenance', desc: 'Toggle maintenance mode' },
                    { cmd: 'setbotname', desc: 'Change bot name' },
                    { cmd: 'setbotbio', desc: 'Change bot bio' },
                    { cmd: 'block', desc: 'Block a user' },
                    { cmd: 'unblock', desc: 'Unblock a user' },
                    { cmd: 'system', desc: 'View system stats' },
                    { cmd: 'restart', desc: 'Restart the bot' },
                    { cmd: 'update', desc: 'Update bot files' },
                    { cmd: 'backup', desc: 'Backup database' },
                    { cmd: 'restore', desc: 'Restore database' },
                    { cmd: 'logs', desc: 'View bot logs' },
                    { cmd: 'eval', desc: 'Evaluate code' },
                    { cmd: 'shell', desc: 'Execute shell command' },
                    { cmd: 'setprefix', desc: 'Change command prefix' },
                    { cmd: 'addmod', desc: 'Add a moderator' },
                    { cmd: 'removemod', desc: 'Remove a moderator' }
                    // Additional commands up to 50 can be added here
                ],
                '⚡ Basic Commands': [
                    { cmd: 'menu', desc: 'Show this menu' },
                    { cmd: 'ping', desc: 'Check bot response' },
                    { cmd: 'info', desc: 'Get bot information' },
                    { cmd: 'help', desc: 'Get command help' },
                    { cmd: 'about', desc: 'About the bot' },
                    { cmd: 'donate', desc: 'Support the bot' },
                    { cmd: 'report', desc: 'Report a bug' },
                    { cmd: 'owner', desc: 'Contact owner' },
                    { cmd: 'speed', desc: 'Check bot speed' },
                    { cmd: 'uptime', desc: 'Bot uptime' },
                    { cmd: 'stats', desc: 'Bot statistics' },
                    { cmd: 'runtime', desc: 'Bot runtime' },
                    { cmd: 'credits', desc: 'Bot credits' },
                    { cmd: 'support', desc: 'Get support' },
                    { cmd: 'feedback', desc: 'Send feedback' },
                    { cmd: 'rules', desc: 'Bot rules' },
                    { cmd: 'tos', desc: 'Terms of service' },
                    { cmd: 'privacy', desc: 'Privacy policy' },
                    { cmd: 'status', desc: 'Bot status' },
                    { cmd: 'source', desc: 'Source code' }
                    // Additional commands up to 50 can be added here
                ]
            };

            // Build menu text
            let menuText = menuHeader;
            for (const [category, commandList] of Object.entries(categories)) {
                menuText += `╭━━━❰ ${category} ❱━━━⊷❍\n`;
                for (const {cmd, desc} of commandList) {
                    menuText += `┃ ⌯ ${config.prefix}${cmd}\n┃   ${desc}\n`;
                }
                menuText += `╰━━━━━━━━━━━━⊷❍\n\n`;
            }

            menuText += `╭━━━❰ *Usage Info* ❱━━━⊷❍
┃ ⌯ Type ${config.prefix}help <command> for details
┃ ⌯ Use @ to mention users in commands
┃ ⌯ All commands start with: ${config.prefix}
╰━━━━━━━━━━━━⊷❍`;

            // First try to send with image
            try {
                await sock.sendMessage(msg.key.remoteJid, {
                    image: { url: 'https://i.ibb.co/JQpNzxT/anime-menu.jpg' },
                    caption: menuText,
                    mentions: [config.ownerNumber]
                });
                logger.info('Menu sent successfully with image');
            } catch (imageError) {
                logger.warn('Failed to send menu with image:', imageError);
                // Fallback to text-only menu
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: menuText,
                    mentions: [config.ownerNumber]
                });
                logger.info('Menu sent successfully as text-only');
            }

        } catch (error) {
            logger.error('Error in menu command:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: 'Error displaying menu. Please try again later.' 
            });
        }
    },

    ping: async (sock, msg) => {
        try {
            const start = Date.now();
            await sock.sendMessage(msg.key.remoteJid, { text: '📡 Testing ping...' });
            const end = Date.now();
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `🚀 Response speed: ${end - start}ms` 
            });
            logger.info('Ping command executed successfully');
        } catch (error) {
            logger.error('Error in ping command:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: 'Error checking ping. Please try again later.' 
            });
        }
    },

    info: async (sock, msg) => {
        try {
            const info = `╭━━━❰ *${config.botName}* ❱━━━⊷❍
┃ 👑 Creator: @${config.ownerNumber.split('@')[0]}
┃ ⌯ Bot Name: ${config.botName}
┃ ⌯ Prefix: ${config.prefix}
┃ ⌯ Status: Active
┃ ⌯ Library: @whiskeysockets/baileys
┃ ⌯ Platform: Multi-Device
┃ ⌯ Language: Node.js
┃ ⌯ Database: JSON Store
╰━━━━━━━━━━━━⊷❍`;

            await sock.sendMessage(msg.key.remoteJid, { 
                text: info,
                mentions: [config.ownerNumber]
            });
            logger.info('Info command executed successfully');
        } catch (error) {
            logger.error('Error in info command:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: 'Error displaying info. Please try again later.' 
            });
        }
    }
};

module.exports = commands;