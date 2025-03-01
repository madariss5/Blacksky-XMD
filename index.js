const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    jidDecode,
    proto,
    getContentType,
    Browsers
} = require("@whiskeysockets/baileys");
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const path = require('path');
const pino = require('pino');
const fs = require('fs-extra');
const chalk = require('chalk');
const figlet = require('figlet');
const _ = require('lodash');
const config = require('./config');

// Logger setup
const logger = pino({ level: 'silent' });

// Auth file path
const AUTH_FOLDER = './auth_info';

const startBot = async() => {
    try {
        console.log(chalk.yellow(figlet.textSync('BLACKSKY-MD', {
            font: 'Standard',
            horizontalLayout: 'default',
            verticalLayout: 'default',
            width: 80,
            whitespaceBreak: true
        })));
        console.log(chalk.yellow('\n\nStarting Bot...\n'));

        // Auth state
        const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

        // Socket config
        const sock = makeWASocket({
            version,
            logger,
            printQRInTerminal: true,
            auth: state,
            browser: Browsers.macOS('Desktop'),
            getMessage: async key => {
                return {
                    conversation: 'An Error Occurred, Repeat Command!'
                };
            }
        });

        // Connection update handling
        sock.ev.on('connection.update', async(update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom) ?
                    lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut : true;
                console.log('Connection closed due to:', lastDisconnect?.error, 'Reconnecting:', shouldReconnect);
                if (shouldReconnect) {
                    await startBot();
                }
            } else if (connection === 'open') {
                console.log(chalk.green('\nBot connected!'));
                console.log(chalk.yellow('Connected to WhatsApp Web\n'));
                console.log(chalk.cyan('• Bot Status: Online'));
                console.log(chalk.cyan(`• Bot Name: ${config.botName}`));
                console.log(chalk.cyan('• Type .menu to see available commands\n'));
            }
        });

        // Credentials update
        sock.ev.on('creds.update', saveCreds);

        // Helper function to format menu
        const formatMenu = (commands) => {
            const categories = {};
            Object.entries(commands).forEach(([cmd, info]) => {
                if (!categories[info.category]) {
                    categories[info.category] = [];
                }
                categories[info.category].push(`${config.prefix}${cmd} - ${info.description}`);
            });

            let menu = `╭─「 ${config.botName} 」\n`;
            menu += `│\n`;
            menu += `│ 👋 Hello!\n`;
            menu += `│ 🤖 Bot Name: ${config.botName}\n`;
            menu += `│ 👑 Owner: ${config.ownerName}\n`;
            menu += `│ ⚡ Prefix: ${config.prefix}\n`;
            menu += `│\n`;

            Object.entries(categories).forEach(([category, cmds]) => {
                menu += `│ 📑 *${category} Commands*\n`;
                cmds.forEach(cmd => {
                    menu += `│ • ${cmd}\n`;
                });
                menu += `│\n`;
            });

            menu += `╰────\n\n`;
            menu += `_Send ${config.prefix}help <command> for detailed info_`;

            return menu;
        };

        // Messages handling
        sock.ev.on('messages.upsert', async(m) => {
            try {
                const msg = m.messages[0];
                if (!msg.message) return;
                if (msg.key && msg.key.remoteJid === 'status@broadcast') return;

                const type = getContentType(msg.message);
                const messageText = (type === 'conversation') ?
                    msg.message.conversation :
                    (type === 'extendedTextMessage') ?
                    msg.message.extendedTextMessage.text : '';

                if (!messageText.startsWith(config.prefix)) return;
                const args = messageText.slice(config.prefix.length).trim().split(/ +/);
                const command = args.shift().toLowerCase();

                // Basic command handler
                switch (command) {
                    case 'menu':
                    case 'help':
                        const menuText = formatMenu(config.commands);
                        await sock.sendMessage(msg.key.remoteJid, { 
                            text: menuText,
                            contextInfo: {
                                externalAdReply: {
                                    title: config.botName,
                                    body: "WhatsApp Bot",
                                    thumbnailUrl: config.menuImage,
                                    sourceUrl: "https://wa.me/" + config.ownerNumber
                                }
                            }
                        });
                        break;

                    case 'ping':
                        const start = Date.now();
                        await sock.sendMessage(msg.key.remoteJid, { text: 'Testing ping...' });
                        const end = Date.now();
                        await sock.sendMessage(msg.key.remoteJid, { 
                            text: `🏓 Pong!\n📶 Response Speed: ${end - start}ms` 
                        });
                        break;

                    case 'owner':
                        const ownerContact = `*${config.botName} Owner*\n\n` +
                                          `👤 Name: ${config.ownerName}\n` +
                                          `📞 Number: wa.me/${config.ownerNumber.split('@')[0]}\n\n` +
                                          `_For bug reports and features_`;
                        await sock.sendMessage(msg.key.remoteJid, { text: ownerContact });
                        break;

                    default:
                        if (config.commands[command]) {
                            await sock.sendMessage(msg.key.remoteJid, {
                                text: `⚠️ Command "${command}" is under development`
                            });
                        } else {
                            await sock.sendMessage(msg.key.remoteJid, {
                                text: `❌ Unknown command: ${command}\nUse ${config.prefix}menu to see available commands.`
                            });
                        }
                }
            } catch (error) {
                console.error('Error processing message:', error);
            }
        });

        return sock;
    } catch (error) {
        console.error('Error in startBot:', error);
    }
};

// Start bot
startBot();

// Handle process termination gracefully
process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);