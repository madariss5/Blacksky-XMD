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

            switch(currentPage) {
                case 1:
                    pageTitle = '⚙️ *Basic Commands* [100]';
                    pageContent = `1. ${config.prefix}menu - Show command menu\n` +
                                `2. ${config.prefix}help - Get command help\n` +
                                `3. ${config.prefix}ping - Check bot response\n` +
                                `4. ${config.prefix}info - View bot info\n\n` +
                                `Additional Basic Commands:\n` +
                                `5. ${config.prefix}rules - Show bot rules\n` +
                                `6. ${config.prefix}about - About the bot\n` +
                                `7. ${config.prefix}owner - Contact owner\n` +
                                `8. ${config.prefix}donate - Support development\n` +
                                `9. ${config.prefix}report - Report issues\n` +
                                `10. ${config.prefix}feedback - Give feedback\n` +
                                `11. ${config.prefix}uptime - Bot uptime\n` +
                                `12. ${config.prefix}stats - Bot statistics\n` +
                                `13. ${config.prefix}speed - Connection speed\n` +
                                `14. ${config.prefix}restart - Restart bot\n` +
                                `15. ${config.prefix}update - Check updates\n`;
                    break;

                case 2:
                    pageTitle = '🎮 *Fun Commands* [100]';
                    pageContent = `Main Fun Commands:\n` +
                                `101. ${config.prefix}slap - Slap with anime gif\n` +
                                `102. ${config.prefix}hug - Give warm hug\n` +
                                `103. ${config.prefix}pat - Pat gently\n` +
                                `104. ${config.prefix}dance - Show dance moves\n\n` +
                                `Additional Fun Commands:\n` +
                                `105. ${config.prefix}joke - Random joke\n` +
                                `106. ${config.prefix}meme - Random meme\n` +
                                `107. ${config.prefix}quote - Random quote\n` +
                                `108. ${config.prefix}8ball - Magic 8ball\n` +
                                `109. ${config.prefix}roll - Roll dice\n` +
                                `110. ${config.prefix}flip - Flip coin\n` +
                                `111. ${config.prefix}rps - Rock paper scissors\n` +
                                `112. ${config.prefix}tictactoe - Play TicTacToe\n` +
                                `113. ${config.prefix}hangman - Play Hangman\n` +
                                `114. ${config.prefix}trivia - Play Trivia\n` +
                                `115. ${config.prefix}riddle - Get a riddle\n`;
                    break;

                case 3:
                    pageTitle = '👤 *User Commands* [100]';
                    pageContent = `Main User Commands:\n` +
                                `201. ${config.prefix}profile - View profile\n` +
                                `202. ${config.prefix}level - Check level\n` +
                                `203. ${config.prefix}daily - Daily rewards\n` +
                                `204. ${config.prefix}inventory - View inventory\n\n` +
                                `Additional User Commands:\n` +
                                `205. ${config.prefix}register - Create account\n` +
                                `206. ${config.prefix}nickname - Set nickname\n` +
                                `207. ${config.prefix}bio - Set bio\n` +
                                `208. ${config.prefix}avatar - Set avatar\n` +
                                `209. ${config.prefix}rank - Check rank\n` +
                                `210. ${config.prefix}balance - Check wallet\n` +
                                `211. ${config.prefix}transfer - Send money\n` +
                                `212. ${config.prefix}shop - Visit shop\n` +
                                `213. ${config.prefix}buy - Buy items\n` +
                                `214. ${config.prefix}sell - Sell items\n` +
                                `215. ${config.prefix}gift - Send gifts\n`;
                    break;

                case 4:
                    pageTitle = '👥 *Group Commands* [100]';
                    pageContent = `Main Group Commands:\n` +
                                `301. ${config.prefix}kick - Kick member\n` +
                                `302. ${config.prefix}promote - Promote admin\n` +
                                `303. ${config.prefix}mute - Mute group\n` +
                                `304. ${config.prefix}unmute - Unmute group\n\n` +
                                `Additional Group Commands:\n` +
                                `305. ${config.prefix}add - Add member\n` +
                                `306. ${config.prefix}remove - Remove member\n` +
                                `307. ${config.prefix}link - Group link\n` +
                                `308. ${config.prefix}revoke - Revoke link\n` +
                                `309. ${config.prefix}announce - Announcement\n` +
                                `310. ${config.prefix}poll - Create poll\n` +
                                `311. ${config.prefix}settings - Group settings\n` +
                                `312. ${config.prefix}welcome - Welcome message\n` +
                                `313. ${config.prefix}leave - Leave message\n` +
                                `314. ${config.prefix}rules - Group rules\n` +
                                `315. ${config.prefix}antilink - Toggle antilink\n`;
                    break;

                case 5:
                    pageTitle = '🎨 *Anime Commands* [100]';
                    pageContent = `Main Anime Commands:\n` +
                                `401. ${config.prefix}anime - Search anime\n` +
                                `402. ${config.prefix}manga - Search manga\n` +
                                `403. ${config.prefix}character - Search character\n` +
                                `404. ${config.prefix}waifu - Random waifu\n\n` +
                                `Additional Anime Commands:\n` +
                                `405. ${config.prefix}schedule - Anime schedule\n` +
                                `406. ${config.prefix}season - Season info\n` +
                                `407. ${config.prefix}upcoming - Coming soon\n` +
                                `408. ${config.prefix}airing - Currently airing\n` +
                                `409. ${config.prefix}genre - Anime by genre\n` +
                                `410. ${config.prefix}studio - Anime by studio\n` +
                                `411. ${config.prefix}recommend - Get recommendations\n` +
                                `412. ${config.prefix}quote - Anime quotes\n` +
                                `413. ${config.prefix}wallpaper - Anime wallpapers\n` +
                                `414. ${config.prefix}news - Anime news\n` +
                                `415. ${config.prefix}watch - Watch order\n`;
                    break;

                case 6:
                    pageTitle = '🎵 *Music Commands* [100]';
                    pageContent = `Main Music Commands:\n` +
                                `501. ${config.prefix}play - Play music\n` +
                                `502. ${config.prefix}skip - Skip song\n` +
                                `503. ${config.prefix}stop - Stop music\n` +
                                `504. ${config.prefix}queue - View queue\n\n` +
                                `Additional Music Commands:\n` +
                                `505. ${config.prefix}pause - Pause music\n` +
                                `506. ${config.prefix}resume - Resume music\n` +
                                `507. ${config.prefix}volume - Adjust volume\n` +
                                `508. ${config.prefix}lyrics - Get lyrics\n` +
                                `509. ${config.prefix}playlist - Manage playlists\n` +
                                `510. ${config.prefix}nowplaying - Current song\n` +
                                `511. ${config.prefix}search - Search songs\n` +
                                `512. ${config.prefix}loop - Toggle loop\n` +
                                `513. ${config.prefix}shuffle - Shuffle queue\n` +
                                `514. ${config.prefix}radio - Play radio\n` +
                                `515. ${config.prefix}spotify - Spotify search\n`;
                    break;

                case 7:
                    pageTitle = '🎲 *Game Commands* [100]';
                    pageContent = `Main Game Commands:\n` +
                                `601. ${config.prefix}truth - Truth question\n` +
                                `602. ${config.prefix}dare - Dare challenge\n` +
                                `603. ${config.prefix}rps - Rock paper scissors\n` +
                                `604. ${config.prefix}quiz - Start quiz\n\n` +
                                `Additional Game Commands:\n` +
                                `605. ${config.prefix}blackjack - Play blackjack\n` +
                                `606. ${config.prefix}poker - Play poker\n` +
                                `607. ${config.prefix}slots - Play slots\n` +
                                `608. ${config.prefix}dice - Roll dice\n` +
                                `609. ${config.prefix}fish - Go fishing\n` +
                                `610. ${config.prefix}mine - Go mining\n` +
                                `611. ${config.prefix}hunt - Go hunting\n` +
                                `612. ${config.prefix}duel - Challenge duel\n` +
                                `613. ${config.prefix}battle - Pokemon battle\n` +
                                `614. ${config.prefix}adventure - Start adventure\n` +
                                `615. ${config.prefix}quest - Daily quests\n`;
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