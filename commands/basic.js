const config = require('../config');
const logger = require('pino')();

const basicCommands = {
    menu: async (sock, msg) => {
        try {
            const menuHeader = `╭━━━❰ *${config.botName}* ❱━━━⊷❍
┃ Creator: @${config.ownerNumber.split('@')[0]}
┃ Prefix: ${config.prefix}
┃ Status: Online
╰━━━━━━━━━━━━⊷❍\n\n`;

            const sections = [
                {
                    title: '📥 *DOWNLOADER*',
                    commands: [
                        'ytmp3 - Download YouTube audio',
                        'ytmp4 - Download YouTube video',
                        'play - Play YouTube audio',
                        'video - Play YouTube video',
                        'tiktok - TikTok video',
                        'facebook - Facebook video',
                        'instagram - Instagram media',
                        'twitter - Twitter media',
                        'pinterest - Pinterest media',
                        'spotify - Spotify tracks'
                    ]
                },
                {
                    title: '💰 *ECONOMY*',
                    commands: [
                        'balance - Check balance',
                        'daily - Daily rewards',
                        'weekly - Weekly rewards',
                        'monthly - Monthly rewards',
                        'bank - Bank operations',
                        'deposit - Bank deposit',
                        'withdraw - Bank withdraw',
                        'transfer - Send money',
                        'rob - Rob users',
                        'work - Work for money'
                    ]
                },
                {
                    title: '🎮 *GAMES*',
                    commands: [
                        'gamble - Gamble money',
                        'flip - Coin flip',
                        'slots - Slot machine',
                        'blackjack - Play blackjack',
                        'poker - Play poker',
                        'roulette - Play roulette',
                        'dice - Roll dice',
                        'lottery - Buy lottery',
                        'hunt - Go hunting',
                        'fish - Go fishing'
                    ]
                },
                {
                    title: '👥 *GROUP*',
                    commands: [
                        'kick - Kick member',
                        'add - Add member',
                        'promote - Make admin',
                        'demote - Remove admin',
                        'setname - Group name',
                        'setdesc - Group desc',
                        'setppgc - Group pic',
                        'tagall - Tag all',
                        'hidetag - Hidden tag',
                        'antilink - Anti link'
                    ]
                },
                {
                    title: '🎨 *FUN*',
                    commands: [
                        'sticker - Make sticker',
                        'emojimix - Mix emojis',
                        'toimg - Sticker to image',
                        'tomp3 - Video to audio',
                        'tts - Text to speech',
                        'quote - Quote image',
                        'triggered - Triggered effect',
                        'wasted - Wasted effect',
                        'jail - Jail effect',
                        'rip - RIP effect'
                    ]
                },
                {
                    title: '🤖 *AI*',
                    commands: [
                        'gpt - Chat with GPT',
                        'dalle - DALL-E art',
                        'imagine - Generate art',
                        'lisa - Chat with Lisa',
                        'rias - Chat with Rias',
                        'toxxic - Chat with Toxxic',
                        'remini - Enhance image',
                        'anime2d - Photo to anime',
                        'txt2img - Text to image',
                        'img2txt - Image to text'
                    ]
                },
                {
                    title: '👑 *OWNER*',
                    commands: [
                        'broadcast - Send to all',
                        'ban - Ban user',
                        'unban - Unban user',
                        'block - Block user',
                        'unblock - Unblock user',
                        'setbotbio - Set bot bio',
                        'setbotname - Set bot name',
                        'setbotpp - Set bot pic',
                        'setstatus - Set status',
                        'setprefix - Change prefix'
                    ]
                }
            ];

            let menuContent = menuHeader;

            // Add each section with its commands
            sections.forEach(section => {
                menuContent += `${section.title}\n`;
                section.commands.forEach((cmd, i) => {
                    menuContent += `${i + 1}. ${config.prefix}${cmd}\n`;
                });
                menuContent += '\n';
            });

            // Add footer
            menuContent += `╭━━━❰ *STATS* ❱━━━⊷❍
┃ Total Commands: ${Object.keys(config.commands).length}
┃ Version: 1.0.0
╰━━━━━━━━━━━━⊷❍\n\n`;

            menuContent += `Note: Use ${config.prefix}help <command> for detailed info`;

            await sock.sendMessage(msg.key.remoteJid, {
                text: menuContent,
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
                    text: `❓ Please specify a command for help!\nExample: ${config.prefix}help ytmp3`
                });
            }

            const command = args[0].toLowerCase();
            const cmdInfo = config.commands[command];

            if (!cmdInfo) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Command "${command}" not found!`
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*Command: ${config.prefix}${command}*\n\n` +
                      `📝 Description: ${cmdInfo.description}\n` +
                      `ℹ️ Category: ${cmdInfo.category || 'General'}\n` +
                      `🔞 NSFW: ${cmdInfo.nsfw ? 'Yes' : 'No'}`
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
                        `• Commands: ${Object.keys(config.commands).length}\n` +
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

module.exports = basicCommands;