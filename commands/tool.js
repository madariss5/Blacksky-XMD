const logger = require('pino')();
const axios = require('axios');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const tempDir = path.join(__dirname, '../temp');
fs.ensureDirSync(tempDir);

// Rate limiting configuration
const userCooldowns = new Map();
const COOLDOWN_PERIOD = 5000; // 5 seconds

const isOnCooldown = (userId) => {
    if (!userCooldowns.has(userId)) return false;
    const lastUsage = userCooldowns.get(userId);
    return Date.now() - lastUsage < COOLDOWN_PERIOD;
};

const setCooldown = (userId) => {
    userCooldowns.set(userId, Date.now());
};

const toolCommands = {
    calc: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide an expression to calculate!\nUsage: .calc <expression>'
                });
            }

            const expression = args.join('');
            // Simple evaluation with basic security
            const result = eval(expression.replace(/[^0-9+\-*/.()]/g, ''));

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🔢 *Calculator*\n\n${expression} = ${result}`
            });
        } catch (error) {
            logger.error('Error in calc command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Invalid expression!'
            });
        }
    },

    translate: async (sock, msg, args) => {
        try {
            if (args.length < 2) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide language and text!\nUsage: .translate <lang> <text>'
                });
            }

            const targetLang = args[0].toLowerCase();
            const text = args.slice(1).join(' ');

            // Using a free translation API
            const response = await axios.get('https://translate.googleapis.com/translate_a/single', {
                params: {
                    client: 'gtx',
                    sl: 'auto',
                    tl: targetLang,
                    dt: 't',
                    q: text
                }
            });

            const translation = response.data[0][0][0];
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🌐 *Translation*\n\nOriginal: ${text}\nTranslated (${targetLang}): ${translation}`
            });
        } catch (error) {
            logger.error('Error in translate command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to translate: ' + error.message
            });
        }
    },

    tts: async (sock, msg, args) => {
        const userId = msg.key.participant || msg.key.remoteJid;

        if (isOnCooldown(userId)) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Please wait a few seconds before using this command again.'
            });
        }

        if (!args.length) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Please provide text to convert!\nUsage: .tts [lang] <text>'
            });
        }

        try {
            let lang = 'en';
            let text;

            if (args[0].length === 2) {
                lang = args[0];
                text = args.slice(1).join(' ');
            } else {
                text = args.join(' ');
            }

            const tempFile = path.join(tempDir, `tts_${Date.now()}.mp3`);
            const gtts = new (require('node-gtts'))(lang);

            await new Promise((resolve, reject) => {
                gtts.save(tempFile, text, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            await sock.sendMessage(msg.key.remoteJid, {
                audio: { url: tempFile },
                mimetype: 'audio/mp4',
                ptt: true
            });

            setCooldown(userId);
            await fs.remove(tempFile);

        } catch (error) {
            logger.error('Error in tts command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to convert text to speech: ' + error.message
            });
        }
    },

    weather: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a city name!\nUsage: .weather <city>'
                });
            }

            const city = args.join(' ');
            const response = await axios.get(`http://api.openweathermap.org/data/2.5/weather`, {
                params: {
                    q: city,
                    appid: process.env.OPENWEATHER_API_KEY,
                    units: 'metric'
                }
            });

            const weather = response.data;
            const weatherText = `🌤️ *Weather in ${weather.name}*\n\n` +
                              `• Temperature: ${weather.main.temp}°C\n` +
                              `• Feels like: ${weather.main.feels_like}°C\n` +
                              `• Weather: ${weather.weather[0].main}\n` +
                              `• Description: ${weather.weather[0].description}\n` +
                              `• Humidity: ${weather.main.humidity}%\n` +
                              `• Wind Speed: ${weather.wind.speed} m/s`;

            await sock.sendMessage(msg.key.remoteJid, { text: weatherText });
        } catch (error) {
            logger.error('Error in weather command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to get weather info: ' + error.message
            });
        }
    },

    dictionary: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a word to look up!\nUsage: .dictionary <word>'
                });
            }

            const word = args[0];
            const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            const data = response.data[0];

            let text = `📚 *Dictionary: ${data.word}*\n\n`;
            text += `*Phonetic:* ${data.phonetic || 'N/A'}\n\n`;

            data.meanings.forEach((meaning, index) => {
                text += `*${meaning.partOfSpeech}*\n`;
                meaning.definitions.slice(0, 2).forEach((def, i) => {
                    text += `${i + 1}. ${def.definition}\n`;
                    if (def.example) text += `   Example: ${def.example}\n`;
                });
                text += '\n';
            });

            await sock.sendMessage(msg.key.remoteJid, { text });
        } catch (error) {
            logger.error('Error in dictionary command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Word not found or error occurred'
            });
        }
    },

    styletext: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide text to style!\nUsage: .styletext <text>'
                });
            }

            const text = args.join(' ');
            const styles = {
                '𝒮𝒸𝓇𝒾𝓅𝓉': text.split('').map(c => c.replace(/[a-z]/gi, char => String.fromCharCode(char.charCodeAt(0) + 119945))).join(''),
                '𝔊𝔬𝔱𝔥𝔦𝔠': text.split('').map(c => c.replace(/[a-z]/gi, char => String.fromCharCode(char.charCodeAt(0) + 120107))).join(''),
                '𝕒𝕖𝕤𝕥𝕙𝕖𝕥𝕚𝕔': text.split('').map(c => c.replace(/[a-z]/gi, char => String.fromCharCode(char.charCodeAt(0) + 120205))).join(''),
                'ᴜᴘᴘᴇʀᴄᴀsᴇ': text.toUpperCase(),
                'ʟᴏᴡᴇʀᴄᴀsᴇ': text.toLowerCase(),
                'sᴘᴀᴄᴇᴅ': text.split('').join(' '),
                'ʀᴇᴠᴇʀsᴇ': text.split('').reverse().join('')
            };

            let styledText = `🎨 *Styled Text*\n\n`;
            Object.entries(styles).forEach(([style, text]) => {
                styledText += `${style}: ${text}\n\n`;
            });

            await sock.sendMessage(msg.key.remoteJid, { text: styledText });
        } catch (error) {
            logger.error('Error in styletext command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to style text'
            });
        }
    },

    shortlink: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a URL to shorten!\nUsage: .shortlink <url>'
                });
            }

            const url = args[0];
            const response = await axios.post('https://cleanuri.com/api/v1/shorten', {
                url: url
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🔗 *URL Shortener*\n\nOriginal: ${url}\nShortened: ${response.data.result_url}`
            });
        } catch (error) {
            logger.error('Error in shortlink command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to shorten URL'
            });
        }
    },

    qr: async (sock, msg, args) => {
        if (!args.length) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Please provide text to convert to QR code!\nUsage: .qr <text>'
            });
        }

        try {
            const text = args.join(' ');
            const qr = require('qrcode');
            const tempFile = path.join(tempDir, `qr_${Date.now()}.png`);

            await qr.toFile(tempFile, text);

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: tempFile },
                caption: '📱 QR Code Generated'
            });

            await fs.remove(tempFile);
        } catch (error) {
            logger.error('Error in qr command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to generate QR code'
            });
        }
    },

    readqr: async (sock, msg) => {
        if (!msg.message.imageMessage) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Please send an image with QR code!\nUsage: Send image with caption .readqr'
            });
        }

        try {
            const tempFile = path.join(tempDir, `qr_read_${Date.now()}.png`);
            const buffer = await downloadMediaMessage(msg, 'buffer', {});
            await fs.writeFile(tempFile, buffer);

            const QrCode = require('qrcode-reader');
            const jimp = require('jimp');
            const qr = new QrCode();
            const image = await jimp.read(tempFile);

            const result = await new Promise((resolve, reject) => {
                qr.callback = (err, value) => err ? reject(err) : resolve(value);
                qr.decode(image.bitmap);
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: `📱 *QR Code Content*\n\n${result.result}`
            });

            await fs.remove(tempFile);
        } catch (error) {
            logger.error('Error in readqr command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to read QR code'
            });
        }
    },

    reminder: async (sock, msg, args) => {
        if (args.length < 2) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Please provide time and message!\nUsage: .reminder <time in minutes> <message>'
            });
        }

        try {
            const minutes = parseInt(args[0]);
            if (isNaN(minutes) || minutes < 1 || minutes > 1440) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a valid time between 1 and 1440 minutes'
                });
            }

            const message = args.slice(1).join(' ');
            const userId = msg.key.participant || msg.key.remoteJid;

            await sock.sendMessage(msg.key.remoteJid, {
                text: `⏰ Reminder set for ${minutes} minutes from now!`
            });

            setTimeout(async () => {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `⏰ *Reminder*\n\n@${userId.split('@')[0]}, here's your reminder:\n${message}`,
                    mentions: [userId]
                });
            }, minutes * 60000);

        } catch (error) {
            logger.error('Error in reminder command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to set reminder'
            });
        }
    }
};

module.exports = toolCommands;