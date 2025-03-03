const logger = require('pino')();
const { getUptime } = require('../utils');
const config = require('../config');
const moment = require('moment-timezone');
const axios = require('axios');
const mathjs = require('mathjs');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { translate } = require('@vitalets/google-translate-api');
const wikipedia = require('wikipedia');

// Helper function to format duration
function formatDuration(ms) {
    const duration = moment.duration(ms);
    const days = Math.floor(duration.asDays());
    const hours = duration.hours();
    const minutes = duration.minutes();
    const seconds = duration.seconds();
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// Helper function for text encoding/decoding
const textUtils = {
    toBase64: (text) => Buffer.from(text).toString('base64'),
    fromBase64: (text) => Buffer.from(text, 'base64').toString('utf8'),
    toBinary: (text) => text.split('').map(char => char.charCodeAt(0).toString(2)).join(' '),
    fromBinary: (binary) => binary.split(' ').map(bin => String.fromCharCode(parseInt(bin, 2))).join(''),
    toMorse: (text) => {
        const morseCode = {
            'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
            'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
            'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
            'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
            'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
            '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
            '8': '---..', '9': '----.', ' ': '/'
        };
        return text.toUpperCase().split('').map(char => morseCode[char] || char).join(' ');
    },
    fromMorse: (morse) => {
        const morseCode = {
            '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E', '..-.': 'F',
            '--.': 'G', '....': 'H', '..': 'I', '.---': 'J', '-.-': 'K', '.-..': 'L',
            '--': 'M', '-.': 'N', '---': 'O', '.--.': 'P', '--.-': 'Q', '.-.': 'R',
            '...': 'S', '-': 'T', '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X',
            '-.--': 'Y', '--..': 'Z', '-----': '0', '.----': '1', '..---': '2',
            '...--': '3', '....-': '4', '.....': '5', '-....': '6', '--...': '7',
            '---..': '8', '----.': '9', '/': ' '
        };
        return morse.split(' ').map(code => morseCode[code] || code).join('');
    }
};

const basicCommands = {
    ping: async (sock, msg) => {
        try {
            const start = Date.now();
            await sock.sendMessage(msg.key.remoteJid, { text: '📱 Testing bot response...' });
            const end = Date.now();

            const pingText = `*🤖 Bot Status*\n\n` +
                         `Response Time: ${end - start}ms\n` +
                         `Uptime: ${formatDuration(process.uptime() * 1000)}\n` +
                         `Status: Online ✅`;

            await sock.sendMessage(msg.key.remoteJid, { text: pingText });
            logger.info('Ping command executed successfully');

        } catch (error) {
            logger.error('Error in ping command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error checking ping'
            });
        }
    },

    runtime: async (sock, msg) => {
        try {
            const uptimeText = `*🕒 Bot Runtime*\n\n` +
                           `• Running for: ${formatDuration(process.uptime() * 1000)}\n` +
                           `• Started: ${moment(Date.now() - (process.uptime() * 1000)).format('llll')}`;

            await sock.sendMessage(msg.key.remoteJid, { text: uptimeText });
            logger.info('Runtime command executed successfully');

        } catch (error) {
            logger.error('Error in runtime command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error checking runtime'
            });
        }
    },

    creator: async (sock, msg) => {
        try {
            const ownerJid = config.ownerNumber || '0@s.whatsapp.net';

            let pp;
            try {
                pp = await sock.profilePictureUrl(ownerJid, 'image');
            } catch {
                pp = 'https://i.imgur.com/wuxBN7M.png';
            }

            const creatorText = `*🤖 Bot Creator*\n\n` +
                            `• Name: ${config.botName}\n` +
                            `• Owner: @${ownerJid.split('@')[0]}\n` +
                            `• Version: ${config.version || '1.0.0'}\n` +
                            `• GitHub: https://github.com/LoopZhou/WhatsApp-Bot\n` +
                            `• Prefix: ${config.prefix}\n\n` +
                            `Contact owner for any issues or questions!`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: pp },
                caption: creatorText,
                mentions: [ownerJid]
            });
            logger.info('Creator command executed successfully');

        } catch (error) {
            logger.error('Error in creator command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing creator info'
            });
        }
    },

    botinfo: async (sock, msg) => {
        try {
            const memory = process.memoryUsage();
            const infoText = `*🤖 Bot Information*\n\n` +
                         `• Name: ${config.botName}\n` +
                         `• Version: ${config.version || '1.0.0'}\n` +
                         `• Platform: ${process.platform}\n` +
                         `• Node Version: ${process.version}\n` +
                         `• Memory Usage: ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB\n` +
                         `• Uptime: ${formatDuration(process.uptime() * 1000)}\n` +
                         `• Commands: ${Object.keys(config.commands).length}\n` +
                         `• Owner: @${config.ownerNumber.split('@')[0]}`;

            await sock.sendMessage(msg.key.remoteJid, {
                text: infoText,
                mentions: [config.ownerNumber]
            });
        } catch (error) {
            logger.error('Error in botinfo command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching bot information'
            });
        }
    },

    calculate: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a mathematical expression!'
                });
            }

            const expression = args.join(' ');
            const result = mathjs.evaluate(expression);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `*🔢 Calculator*\n\n` +
                      `• Expression: ${expression}\n` +
                      `• Result: ${result}`
            });
        } catch (error) {
            logger.error('Error in calculate command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Invalid mathematical expression!'
            });
        }
    },

    translate: async (sock, msg, args) => {
        try {
            if (args.length < 2) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide language and text!\n' +
                         'Usage: .translate <lang> <text>'
                });
            }

            const targetLang = args[0];
            const text = args.slice(1).join(' ');
            const result = await translate(text, { to: targetLang });

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*🌐 Translation*\n\n` +
                      `• Original: ${text}\n` +
                      `• Translated (${targetLang}): ${result.text}`
            });
        } catch (error) {
            logger.error('Error in translate command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Translation failed! Make sure the language code is valid.'
            });
        }
    },

    wiki: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a search query!'
                });
            }

            const query = args.join(' ');
            const page = await wikipedia.search(query);
            const summary = await wikipedia.summary(page.results[0].title);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*📚 Wikipedia*\n\n` +
                      `• Title: ${summary.title}\n\n` +
                      `${summary.extract}`
            });
        } catch (error) {
            logger.error('Error in wiki command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Wikipedia search failed!'
            });
        }
    },

    qr: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide text or URL to convert!'
                });
            }

            const text = args.join(' ');
            const qrBuffer = await QRCode.toBuffer(text);

            await sock.sendMessage(msg.key.remoteJid, {
                image: qrBuffer,
                caption: `*QR Code*\n\nContent: ${text}`
            });
        } catch (error) {
            logger.error('Error in qr command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to generate QR code!'
            });
        }
    },

    base64: async (sock, msg, args) => {
        try {
            if (args.length < 2) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Usage: .base64 <encode/decode> <text>'
                });
            }

            const action = args[0].toLowerCase();
            const text = args.slice(1).join(' ');
            let result;

            if (action === 'encode') {
                result = textUtils.toBase64(text);
            } else if (action === 'decode') {
                result = textUtils.fromBase64(text);
            } else {
                throw new Error('Invalid action');
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*Base64 ${action}*\n\n` +
                      `• Input: ${text}\n` +
                      `• Output: ${result}`
            });
        } catch (error) {
            logger.error('Error in base64 command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Base64 conversion failed!'
            });
        }
    },

    binary: async (sock, msg, args) => {
        try {
            if (args.length < 2) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Usage: .binary <encode/decode> <text>'
                });
            }

            const action = args[0].toLowerCase();
            const text = args.slice(1).join(' ');
            let result;

            if (action === 'encode') {
                result = textUtils.toBinary(text);
            } else if (action === 'decode') {
                result = textUtils.fromBinary(text);
            } else {
                throw new Error('Invalid action');
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*Binary ${action}*\n\n` +
                      `• Input: ${text}\n` +
                      `• Output: ${result}`
            });
        } catch (error) {
            logger.error('Error in binary command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Binary conversion failed!'
            });
        }
    },

    morse: async (sock, msg, args) => {
        try {
            if (args.length < 2) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Usage: .morse <encode/decode> <text>'
                });
            }

            const action = args[0].toLowerCase();
            const text = args.slice(1).join(' ');
            let result;

            if (action === 'encode') {
                result = textUtils.toMorse(text);
            } else if (action === 'decode') {
                result = textUtils.fromMorse(text);
            } else {
                throw new Error('Invalid action');
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*Morse Code ${action}*\n\n` +
                      `• Input: ${text}\n` +
                      `• Output: ${result}`
            });
        } catch (error) {
            logger.error('Error in morse command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Morse code conversion failed!'
            });
        }
    },

    password: async (sock, msg, args) => {
        try {
            const length = parseInt(args[0]) || 12;
            if (length < 8 || length > 32) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Password length must be between 8 and 32!'
                });
            }

            const password = crypto.randomBytes(Math.ceil(length / 2))
                .toString('hex')
                .slice(0, length);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*🔐 Password Generator*\n\n` +
                      `• Length: ${length}\n` +
                      `• Generated: ${password}`
            });
        } catch (error) {
            logger.error('Error in password command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to generate password!'
            });
        }
    },

    serverinfo: async (sock, msg) => {
        try {
            const os = require('os');
            const formatBytes = (bytes) => {
                const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                if (bytes === 0) return '0 Byte';
                const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
                return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
            };

            const info = `*🖥️ Server Information*\n\n` +
                      `• Platform: ${os.platform()}\n` +
                      `• Architecture: ${os.arch()}\n` +
                      `• CPU Cores: ${os.cpus().length}\n` +
                      `• Total Memory: ${formatBytes(os.totalmem())}\n` +
                      `• Free Memory: ${formatBytes(os.freemem())}\n` +
                      `• Uptime: ${formatDuration(os.uptime() * 1000)}\n` +
                      `• Node Version: ${process.version}\n` +
                      `• Process Uptime: ${formatDuration(process.uptime() * 1000)}`;

            await sock.sendMessage(msg.key.remoteJid, { text: info });
        } catch (error) {
            logger.error('Error in serverinfo command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to get server information'
            });
        }
    },

    speed: async (sock, msg) => {
        try {
            const start = Date.now();
            await sock.sendMessage(msg.key.remoteJid, { text: '🚀 Testing speed...' });
            const end = Date.now();

            const memoryUsage = process.memoryUsage();
            const speedInfo = `*🚀 Speed Test Results*\n\n` +
                          `• Response Time: ${end - start}ms\n` +
                          `• Memory Usage: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB\n` +
                          `• Message Processing: ${end - msg.messageTimestamp * 1000}ms`;

            await sock.sendMessage(msg.key.remoteJid, { text: speedInfo });
        } catch (error) {
            logger.error('Error in speed command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to complete speed test'
            });
        }
    },

    unit: async (sock, msg, args) => {
        try {
            if (args.length !== 3) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Usage: .unit <value> <from> <to>\nExample: .unit 1 km mi'
                });
            }

            const [value, from, to] = args;
            const result = mathjs.evaluate(`${value} ${from} to ${to}`);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*📏 Unit Conversion*\n\n` +
                      `${value} ${from} = ${result} ${to}`
            });
        } catch (error) {
            logger.error('Error in unit command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Invalid unit conversion'
            });
        }
    },

    worldclock: async (sock, msg) => {
        try {
            const cities = [
                { name: 'London', tz: 'Europe/London' },
                { name: 'New York', tz: 'America/New_York' },
                { name: 'Tokyo', tz: 'Asia/Tokyo' },
                { name: 'Sydney', tz: 'Australia/Sydney' },
                { name: 'Dubai', tz: 'Asia/Dubai' }
            ];

            let clockText = '*🌍 World Clock*\n\n';
            cities.forEach(city => {
                const time = moment().tz(city.tz).format('LLLL');
                clockText += `• ${city.name}: ${time}\n`;
            });

            await sock.sendMessage(msg.key.remoteJid, { text: clockText });
        } catch (error) {
            logger.error('Error in worldclock command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to get world time'
            });
        }
    },

    calendar: async (sock, msg, args) => {
        try {
            const now = moment();
            const month = args[0] ? parseInt(args[0]) - 1 : now.month();
            const year = args[1] ? parseInt(args[1]) : now.year();

            if (isNaN(month) || month < 0 || month > 11) {
                throw new Error('Invalid month');
            }

            const date = moment([year, month]);
            const calendar = [];
            const daysInMonth = date.daysInMonth();
            const firstDay = date.startOf('month').day();

            // Add month header
            calendar.push(`*📅 Calendar - ${date.format('MMMM YYYY')}*\n`);
            calendar.push('Su Mo Tu We Th Fr Sa');

            // Add empty spaces for first week
            let week = '   '.repeat(firstDay);

            // Add days
            for (let day = 1; day <= daysInMonth; day++) {
                week += day.toString().padStart(2) + ' ';
                if ((firstDay + day) % 7 === 0 || day === daysInMonth) {
                    calendar.push(week);
                    week = '';
                }
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: calendar.join('\n')
            });
        } catch (error) {
            logger.error('Error in calendar command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Invalid calendar format. Use: .calendar [month] [year]'
            });
        }
    },

    shorturl: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a URL to shorten'
                });
            }

            const url = args[0];
            const response = await axios.post('https://tinyurl.com/api-create.php', null, {
                params: { url }
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*🔗 URL Shortener*\n\n` +
                      `• Original: ${url}\n` +
                      `• Shortened: ${response.data}`
            });
        } catch (error) {
            logger.error('Error in shorturl command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to shorten URL'
            });
        }
    },

    uuid: async (sock, msg) => {
        try {
            const uuid = crypto.randomUUID();
            await sock.sendMessage(msg.key.remoteJid, {
                text: `*🆔 UUID Generator*\n\n${uuid}`
            });
        } catch (error) {
            logger.error('Error in uuid command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to generate UUID'
            });
        }
    },

    random: async (sock, msg, args) => {
        try {
            if (args.length !== 2) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Usage: .random <min> <max>'
                });
            }

            const min = parseInt(args[0]);
            const max = parseInt(args[1]);

            if (isNaN(min) || isNaN(max) || min >= max) {
                throw new Error('Invalid range');
            }

            const random = Math.floor(Math.random() * (max - min + 1)) + min;
            await sock.sendMessage(msg.key.remoteJid, {
                text: `*🎲 Random Number*\n\n` +
                      `Range: ${min} - ${max}\n` +
                      `Result: ${random}`
            });
        } catch (error) {
            logger.error('Error in random command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Invalid number range'
            });
        }
    }
};

module.exports = basicCommands;