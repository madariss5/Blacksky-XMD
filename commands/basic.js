const config = require('../config');
const logger = require('pino')();

const commands = {
    menu: async (sock, msg) => {
        try {
            const menuHeader = `
╭━━━━━━━━━━━━━━━━━━━━━⊱
┃    ⚔️ *${config.botName}* ⚔️
┃    アニメボット v3.0.0
┃ 
┃ 👑 Creator: @${config.ownerNumber.split('@')[0]}
┃ 🎯 Prefix: ${config.prefix}
┃ 🌟 Status: Active
╰━━━━━━━━━━━━━━━━━━━━━⊱

Welcome to the Ultimate Anime Bot! (◕‿◕)♡\n\n`;

            // Define command categories with emojis and all available commands
            const categories = {
                '👤 User Commands': [
                    { cmd: 'profile', desc: 'View your detailed profile' },
                    { cmd: 'register', desc: 'Register your account' },
                    { cmd: 'level', desc: 'Check your current level' },
                    { cmd: 'rank', desc: 'View your ranking' },
                    { cmd: 'daily', desc: 'Claim daily rewards' },
                    { cmd: 'inventory', desc: 'Check your items' },
                    { cmd: 'wallet', desc: 'View your currency balance' },
                    { cmd: 'shop', desc: 'Browse available items' },
                    { cmd: 'buy', desc: 'Purchase items from shop' },
                    { cmd: 'sell', desc: 'Sell items from inventory' },
                    { cmd: 'transfer', desc: 'Transfer currency to others' },
                    { cmd: 'achievements', desc: 'View your achievements' },
                    { cmd: 'stats', desc: 'Check your statistics' },
                    { cmd: 'bio', desc: 'Set or view your biography' },
                    { cmd: 'settings', desc: 'Manage your user settings' }
                ],

                '👥 Group Commands': [
                    { cmd: 'kick', desc: 'Kick a user from group (Admin only)' },
                    { cmd: 'promote', desc: 'Promote a user to admin (Admin only)' },
                    { cmd: 'demote', desc: 'Demote a user from admin (Admin only)' },
                    { cmd: 'mute', desc: 'Mute group (only admins can write)' },
                    { cmd: 'unmute', desc: 'Unmute group (everyone can write)' },
                    { cmd: 'everyone', desc: 'Tag everyone in the group' },
                    { cmd: 'setwelcome', desc: 'Set welcome message for group' },
                    { cmd: 'setbye', desc: 'Set goodbye message for group' },
                    { cmd: 'del', desc: 'Delete a message (Admin only)' },
                    { cmd: 'antilink', desc: 'Enable/disable anti-link protection' },
                    { cmd: 'groupinfo', desc: 'Show group information' },
                    { cmd: 'poll', desc: 'Create a poll in the group' },
                    { cmd: 'setrules', desc: 'Set group rules (Admin only)' },
                    { cmd: 'viewrules', desc: 'View group rules' }
                ],

                '🎭 Fun & Reactions': [
                    { cmd: 'slap', desc: 'Slap someone with a sticker' },
                    { cmd: 'hug', desc: 'Give someone a warm hug' },
                    { cmd: 'pat', desc: 'Pat someone gently' },
                    { cmd: 'dance', desc: 'Show a dance sticker' },
                    { cmd: 'kill', desc: 'Playfully eliminate someone' },
                    { cmd: 'highfive', desc: 'Give a high five' },
                    { cmd: 'facepalm', desc: 'Express disappointment' },
                    { cmd: 'poke', desc: 'Poke someone playfully' },
                    { cmd: 'cuddle', desc: 'Cuddle with someone' },
                    { cmd: 'yeet', desc: 'Yeet someone away' },
                    { cmd: 'boop', desc: 'Boop someone\'s nose' },
                    { cmd: 'bonk', desc: 'Bonk someone' },
                    { cmd: 'wave', desc: 'Wave at someone' },
                    { cmd: 'kiss', desc: 'Kiss someone' },
                    { cmd: 'punch', desc: 'Punch someone' },
                    { cmd: 'wink', desc: 'Wink at someone' }
                ],

                '🎨 Anime & Manga': [
                    { cmd: 'anime', desc: 'Search for anime info' },
                    { cmd: 'manga', desc: 'Search for manga info' },
                    { cmd: 'character', desc: 'Search anime characters' },
                    { cmd: 'schedule', desc: 'View anime schedules' },
                    { cmd: 'seasonal', desc: 'View seasonal anime' }
                ],

                '🎵 Music Commands': [
                    { cmd: 'play', desc: 'Play anime music' },
                    { cmd: 'queue', desc: 'View music queue' },
                    { cmd: 'skip', desc: 'Skip current song' },
                    { cmd: 'lyrics', desc: 'Show song lyrics' },
                    { cmd: 'playlist', desc: 'Manage playlists' }
                ],

                '🎮 Games & Fun': [
                    { cmd: 'rps', desc: 'Play rock, paper, scissors' },
                    { cmd: 'coinflip', desc: 'Flip a coin' },
                    { cmd: 'truth', desc: 'Get truth questions' },
                    { cmd: 'dare', desc: 'Get dare challenges' },
                    { cmd: 'meme', desc: 'Get random memes' }
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
                    { cmd: 'setprefix', desc: 'Change command prefix' },
                    { cmd: 'addmod', desc: 'Add a moderator' },
                    { cmd: 'removemod', desc: 'Remove a moderator' }
                ],

                '⚙️ Basic Commands': [
                    { cmd: 'help', desc: 'Get command help' },
                    { cmd: 'ping', desc: 'Check bot response' },
                    { cmd: 'info', desc: 'Get bot information' },
                    { cmd: 'profile', desc: 'View your profile' },
                    { cmd: 'rank', desc: 'Check your rank' }
                ],
                '🔞 NSFW Commands': [
                    { cmd: 'setnsfw', desc: 'Enable/disable NSFW in group' },
                    { cmd: 'nsfwcheck', desc: 'Check NSFW settings' }
                ]
            };

            // Build menu text with proper formatting
            let menuText = menuHeader;
            for (const [category, commandList] of Object.entries(categories)) {
                menuText += `╭━━━❰ ${category} ❱━━━⊷❍\n`;
                for (const { cmd, desc } of commandList) {
                    menuText += `┃ ⌯ ${config.prefix}${cmd}\n┃   ${desc}\n`;
                }
                menuText += `╰━━━━━━━━━━━━⊷❍\n\n`;
            }

            // Add footer
            menuText += `╭━━━❰ *Usage Info* ❱━━━⊷❍
┃ ⌯ Type ${config.prefix}help <command> for details
┃ ⌯ Use @ to mention users in commands
┃ ⌯ All commands start with: ${config.prefix}
╰━━━━━━━━━━━━⊷❍`;

            await sock.sendMessage(msg.key.remoteJid, {
                text: menuText,
                mentions: [config.ownerNumber]
            });
            logger.info('Menu sent successfully');

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

            // Calculate latency and format response
            const latency = end - start;
            const status = latency < 100 ? '🟢 Excellent' : latency < 200 ? '🟡 Good' : '🔴 High';

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🚀 Bot Status\n\n` +
                      `Response Time: ${latency}ms\n` +
                      `Connection: ${status}`
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
                removemod: `[Owner] Remove a moderator.\nUsage: ${config.prefix}removemod [@user]`,
                kick: `Kick a user from the group (Admin only).\nUsage: ${config.prefix}kick [@user]`,
                promote: `Promote a user to admin (Admin only).\nUsage: ${config.prefix}promote [@user]`,
                demote: `Demote a user from admin (Admin only).\nUsage: ${config.prefix}demote [@user]`,
                mute: `Mute the group (only admins can write).\nUsage: ${config.prefix}mute`,
                unmute: `Unmute the group (everyone can write).\nUsage: ${config.prefix}unmute`,
                everyone: `Tag everyone in the group.\nUsage: ${config.prefix}everyone`,
                setwelcome: `Set a welcome message for the group.\nUsage: ${config.prefix}setwelcome <message>`,
                setbye: `Set a goodbye message for the group.\nUsage: ${config.prefix}setbye <message>`,
                del: `Delete a message (Admin only).\nUsage: ${config.prefix}del <messageID>`,
                antilink: `Enable/disable anti-link protection.\nUsage: ${config.prefix}antilink <on/off>`,
                groupinfo: `Show group information.\nUsage: ${config.prefix}groupinfo`,
                poll: `Create a poll in the group.\nUsage: ${config.prefix}poll <question> <option1> <option2>...`,
                setrules: `Set group rules (Admin only).\nUsage: ${config.prefix}setrules <rules>`,
                viewrules: `View group rules.\nUsage: ${config.prefix}viewrules`

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