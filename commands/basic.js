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

            // Define command categories with emojis
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
                    { cmd: 'status', desc: 'Check your WhatsApp status' }
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
                    { cmd: 'fact', desc: 'Learn random facts' }
                ],
                '🎮 Game Commands': [
                    { cmd: 'coinflip', desc: 'Flip a coin' },
                    { cmd: 'wordgame', desc: 'Play word guessing game' },
                    { cmd: 'trivia', desc: 'Play trivia quiz' },
                    { cmd: 'magic8ball', desc: 'Ask the magic 8 ball' },
                    { cmd: 'truth', desc: 'Get truth questions' },
                    { cmd: 'dare', desc: 'Get dare challenges' }
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
                    { cmd: 'system', desc: 'View system stats' }
                ],
                '⚡ Basic Commands': [
                    { cmd: 'menu', desc: 'Show this menu' },
                    { cmd: 'ping', desc: 'Check bot response' },
                    { cmd: 'info', desc: 'Get bot information' }
                ]
            };

            let menuText = menuHeader;

            // Build menu with categories and commands
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

            // Send menu text directly without image for reliability
            await sock.sendMessage(msg.key.remoteJid, {
                text: menuText,
                mentions: [config.ownerNumber]
            });

            logger.info('Menu command executed successfully');
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