const logger = require('pino')();
const axios = require('axios');
const os = require('os');

const utilityCommands = {
    menu: async (sock, msg) => {
        try {
            const menuText = `🛠️ *Utility Commands*\n\n` +
                           `*Media Conversion:*\n` +
                           `!sticker - Create sticker from image/video\n` +
                           `!tts <text> - Convert text to speech\n` +
                           `!translate <lang> <text> - Translate text\n\n` +
                           `*Information:*\n` +
                           `!weather <city> - Get weather info\n` +
                           `!calc <expression> - Calculate expression\n` +
                           `!stats - Show bot statistics\n\n` +
                           `*System:*\n` +
                           `!ping - Check bot response time\n` +
                           `!uptime - Show bot uptime\n` +
                           `!report <issue> - Report an issue`;

            await sock.sendMessage(msg.key.remoteJid, { text: menuText });
        } catch (error) {
            logger.error('Error in menu command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to show menu'
            });
        }
    },

    sticker: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '⚠️ Sticker creation is temporarily unavailable due to system maintenance.'
            });
        } catch (error) {
            logger.error('Error in sticker command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to process sticker command'
            });
        }
    },

    tts: async (sock, msg, args) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '⚠️ Text-to-speech is temporarily unavailable due to system maintenance.'
            });
        } catch (error) {
            logger.error('Error in tts command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to process TTS command'
            });
        }
    },

    translate: async (sock, msg, args) => {
        try {
            if (args.length < 2) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide language and text!\nUsage: !translate <lang> <text>'
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

            logger.info('Translation completed successfully');
        } catch (error) {
            logger.error('Error in translate command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to translate: ' + error.message
            });
        }
    },

    weather: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a city name!\nUsage: !weather <city>'
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

    calc: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide an expression to calculate!\nUsage: !calc <expression>'
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
    stats: async (sock, msg) => {
        try {
            const memory = process.memoryUsage();
            const stats = {
                uptime: process.uptime(),
                memory: {
                    used: Math.round(memory.heapUsed / 1024 / 1024),
                    total: Math.round(memory.heapTotal / 1024 / 1024)
                },
                platform: process.platform,
                version: process.version
            };

            const statsText = `📊 *Bot Statistics*\n\n` +
                            `• Status: Online\n` +
                            `• Uptime: ${Math.floor(stats.uptime / 3600)}h ${Math.floor((stats.uptime % 3600) / 60)}m\n` +
                            `• Memory: ${stats.memory.used}MB / ${stats.memory.total}MB\n` +
                            `• Platform: ${stats.platform}\n` +
                            `• Node.js: ${stats.version}`;

            await sock.sendMessage(msg.key.remoteJid, { text: statsText });
        } catch (error) {
            logger.error('Error in stats command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to fetch statistics'
            });
        }
    },

    report: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide an issue to report!\nUsage: !report <issue description>'
                });
            }

            const issue = args.join(' ');
            logger.info('Issue reported:', { 
                issue, 
                reporter: msg.key.participant || msg.key.remoteJid 
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: '✅ Thank you for your report! The issue has been logged for review.'
            });

            // If owner number is set, forward the report
            if (process.env.OWNER_NUMBER) {
                const ownerJid = `${process.env.OWNER_NUMBER}@s.whatsapp.net`;
                await sock.sendMessage(ownerJid, {
                    text: `📝 *New Issue Report*\n\n` +
                          `From: ${msg.key.participant || msg.key.remoteJid}\n` +
                          `Issue: ${issue}`
                });
            }
        } catch (error) {
            logger.error('Error in report command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to submit report'
            });
        }
    },

    ping: async (sock, msg) => {
        try {
            const start = Date.now();
            await sock.sendMessage(msg.key.remoteJid, { text: '📍 Checking...' });
            const end = Date.now();

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🏓 Pong!\nResponse Time: ${end - start}ms`
            });
        } catch (error) {
            logger.error('Error in ping command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to measure response time'
            });
        }
    },

    uptime: async (sock, msg) => {
        try {
            const uptime = process.uptime();
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `⏱️ *Bot Uptime*\n\n` +
                      `${hours}h ${minutes}m ${seconds}s`
            });
        } catch (error) {
            logger.error('Error in uptime command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to get uptime'
            });
        }
    },

    help: async (sock, msg) => {
        // Alias for menu command
        await utilityCommands.menu(sock, msg);
    }
};

module.exports = utilityCommands;