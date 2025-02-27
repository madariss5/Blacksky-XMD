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
                for (const { cmd, desc } of commandList) {
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
    },
    help: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please specify a command to get help for!\nExample: ${config.prefix}help ping`
                });
            }

            const command = args[0].toLowerCase();
            const helpText = {
                menu: `Shows all available commands categorized by their types.\nUsage: ${config.prefix}menu`,
                ping: `Check bot's response time.\nUsage: ${config.prefix}ping`,
                info: `Display bot information and status.\nUsage: ${config.prefix}info`,
                profile: `View user profile.\nUsage: ${config.prefix}profile [@user]`,
                register: `Register your profile.\nUsage: ${config.prefix}register <name> <age>`,
                daily: `Claim daily rewards.\nUsage: ${config.prefix}daily`,
                rank: `Check your rank and level.\nUsage: ${config.prefix}rank`,
                slap: `Slap someone with an anime gif.\nUsage: ${config.prefix}slap [@user]`,
                hug: `Give someone a warm hug.\nUsage: ${config.prefix}hug [@user]`,
                pat: `Pat someone gently.\nUsage: ${config.prefix}pat [@user]`,
                coinflip: `Flip a coin.\nUsage: ${config.prefix}coinflip`,
                wordgame: `Play word guessing game.\nUsage: ${config.prefix}wordgame\nThen use ${config.prefix}guess <word> to play`,
                trivia: `Play trivia quiz.\nUsage: ${config.prefix}trivia\nThen use ${config.prefix}answer <number> to answer`,
                broadcast: `[Owner] Send message to all chats.\nUsage: ${config.prefix}broadcast <message>`,
                ban: `[Owner] Ban a user.\nUsage: ${config.prefix}ban [@user]`,
                maintenance: `[Owner] Toggle maintenance mode.\nUsage: ${config.prefix}maintenance <on/off>`,
                about: `About the bot.\nUsage: ${config.prefix}about`,
                donate: `Support the bot.\nUsage: ${config.prefix}donate`,
                report: `Report a bug.\nUsage: ${config.prefix}report <description>`,
                owner: `Contact owner.\nUsage: ${config.prefix}owner`,
                speed: `Check bot speed.\nUsage: ${config.prefix}speed`,
                uptime: `Bot uptime.\nUsage: ${config.prefix}uptime`,
                stats: `Bot statistics.\nUsage: ${config.prefix}stats`,
                runtime: `Bot runtime.\nUsage: ${config.prefix}runtime`,
                credits: `Bot credits.\nUsage: ${config.prefix}credits`,
                support: `Get support.\nUsage: ${config.prefix}support`,
                feedback: `Send feedback.\nUsage: ${config.prefix}feedback <feedback>`,
                rules: `Bot rules.\nUsage: ${config.prefix}rules`,
                tos: `Terms of service.\nUsage: ${config.prefix}tos`,
                privacy: `Privacy policy.\nUsage: ${config.prefix}privacy`,
                status: `Bot status.\nUsage: ${config.prefix}status`,
                source: `Source code.\nUsage: ${config.prefix}source`,
                me: `View your own profile with picture.\nUsage: ${config.prefix}me`,
                inventory: `View your inventory.\nUsage: ${config.prefix}inventory`,
                achievements: `View your achievements.\nUsage: ${config.prefix}achievements`,
                bio: `Set or view your bio.\nUsage: ${config.prefix}bio <bio>`,
                reminder: `Set a reminder.\nUsage: ${config.prefix}reminder <time> <message>`,
                level: `View detailed level stats.\nUsage: ${config.prefix}level`,
                wallet: `Check your virtual wallet.\nUsage: ${config.prefix}wallet`,
                shop: `Browse available items.\nUsage: ${config.prefix}shop`,
                buy: `Purchase items from shop.\nUsage: ${config.prefix}buy <item>`,
                sell: `Sell items from inventory.\nUsage: ${config.prefix}sell <item>`,
                trade: `Trade items with users.\nUsage: ${config.prefix}trade [@user] <item>`,
                gift: `Send gifts to other users.\nUsage: ${config.prefix}gift [@user] <item>`,
                quest: `View available quests.\nUsage: ${config.prefix}quest`,
                missions: `Check daily missions.\nUsage: ${config.prefix}missions`,
                dance: `Show off dance moves.\nUsage: ${config.prefix}dance`,
                kill: `Dramatically eliminate someone.\nUsage: ${config.prefix}kill [@user]`,
                highfive: `Give a high-five.\nUsage: ${config.prefix}highfive [@user]`,
                facepalm: `Express disappointment.\nUsage: ${config.prefix}facepalm`,
                poke: `Poke someone playfully.\nUsage: ${config.prefix}poke [@user]`,
                cuddle: `Cuddle with someone.\nUsage: ${config.prefix}cuddle [@user]`,
                yeet: `Yeet someone to space.\nUsage: ${config.prefix}yeet [@user]`,
                boop: `Boop someone's nose.\nUsage: ${config.prefix}boop [@user]`,
                bonk: `Bonk someone.\nUsage: ${config.prefix}bonk [@user]`,
                joke: `Get a random joke.\nUsage: ${config.prefix}joke`,
                meme: `Get anime memes.\nUsage: ${config.prefix}meme`,
                quote: `Get inspiring quotes.\nUsage: ${config.prefix}quote`,
                fact: `Learn random facts.\nUsage: ${config.prefix}fact`,
                punch: `Punch with style.\nUsage: ${config.prefix}punch [@user]`,
                kiss: `Kiss someone sweetly.\nUsage: ${config.prefix}kiss [@user]`,
                wave: `Wave at someone.\nUsage: ${config.prefix}wave [@user]`,
                wink: `Wink at someone.\nUsage: ${config.prefix}wink [@user]`,
                magic8ball: `Ask the magic 8 ball.\nUsage: ${config.prefix}magic8ball <question>`,
                truth: `Get truth questions.\nUsage: ${config.prefix}truth`,
                dare: `Get dare challenges.\nUsage: ${config.prefix}dare`,
                rps: `Play rock, paper, scissors.\nUsage: ${config.prefix}rps <rock/paper/scissors>`,
                pokemon: `Catch and battle Pokemon.\nUsage: ${config.prefix}pokemon`,
                slots: `Play slot machine.\nUsage: ${config.prefix}slots`,
                blackjack: `Play blackjack.\nUsage: ${config.prefix}blackjack`,
                dice: `Roll the dice.\nUsage: ${config.prefix}dice`,
                quiz: `Anime quiz game.\nUsage: ${config.prefix}quiz`,
                hangman: `Play hangman.\nUsage: ${config.prefix}hangman`,
                tictactoe: `Play tic-tac-toe.\nUsage: ${config.prefix}tictactoe`,
                memory: `Test your memory.\nUsage: ${config.prefix}memory`,
                math: `Solve math problems.\nUsage: ${config.prefix}math <problem>`,
                scramble: `Word scramble game.\nUsage: ${config.prefix}scramble`,
                battle: `Battle other users.\nUsage: ${config.prefix}battle [@user]`,
                fish: `Go fishing.\nUsage: ${config.prefix}fish`,
                mine: `Go mining.\nUsage: ${config.prefix}mine`,
                unban: `[Owner] Unban a user.\nUsage: ${config.prefix}unban [@user]`,
                banlist: `[Owner] View banned users.\nUsage: ${config.prefix}banlist`,
                setbotname: `[Owner] Change bot name.\nUsage: ${config.prefix}setbotname <name>`,
                setbotbio: `[Owner] Change bot bio.\nUsage: ${config.prefix}setbotbio <bio>`,
                block: `[Owner] Block a user.\nUsage: ${config.prefix}block [@user]`,
                unblock: `[Owner] Unblock a user.\nUsage: ${config.prefix}unblock [@user]`,
                system: `[Owner] View system stats.\nUsage: ${config.prefix}system`,
                restart: `[Owner] Restart the bot.\nUsage: ${config.prefix}restart`,
                update: `[Owner] Update bot files.\nUsage: ${config.prefix}update`,
                backup: `[Owner] Backup database.\nUsage: ${config.prefix}backup`,
                restore: `[Owner] Restore database.\nUsage: ${config.prefix}restore`,
                logs: `[Owner] View bot logs.\nUsage: ${config.prefix}logs`,
                eval: `[Owner] Evaluate code.\nUsage: ${config.prefix}eval <code>`,
                shell: `[Owner] Execute shell command.\nUsage: ${config.prefix}shell <command>`,
                setprefix: `[Owner] Change command prefix.\nUsage: ${config.prefix}setprefix <prefix>`,
                addmod: `[Owner] Add a moderator.\nUsage: ${config.prefix}addmod [@user]`,
                removemod: `[Owner] Remove a moderator.\nUsage: ${config.prefix}removemod [@user]`
            };

            const cmdHelp = helpText[command];
            if (!cmdHelp) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ No help available for '${command}' command.`
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `📖 *Help: ${command}*\n\n${cmdHelp}`
            });
            logger.info(`Help command executed for: ${command}`);
        } catch (error) {
            logger.error('Error in help command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: 'Error displaying help. Please try again later.'
            });
        }
    }
};

module.exports = commands;