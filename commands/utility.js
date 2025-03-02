const logger = require('pino')();
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const utilityCommands = {
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
    ytmp3: async (sock, msg, args) => {
        try {
            if (!args[0]) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a YouTube URL!\nUsage: !ytmp3 <url>'
                });
            }

            const url = args[0];
            if (!ytdl.validateURL(url)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Invalid YouTube URL!'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Converting video to audio...'
            });

            const info = await ytdl.getInfo(url);
            const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
            const tempDir = path.join(__dirname, '../temp');
            await fs.ensureDir(tempDir);

            const audioPath = path.join(tempDir, `${title}.mp3`);
            const videoReadableStream = ytdl(url, {
                quality: 'highestaudio',
                filter: 'audioonly'
            });

            await new Promise((resolve, reject) => {
                ffmpeg(videoReadableStream)
                    .audioBitrate(128)
                    .toFormat('mp3')
                    .on('end', resolve)
                    .on('error', reject)
                    .save(audioPath);
            });

            await sock.sendMessage(msg.key.remoteJid, {
                audio: { url: audioPath },
                mimetype: 'audio/mp3',
                fileName: `${title}.mp3`
            });

            // Clean up
            await fs.unlink(audioPath);
            logger.info('Successfully converted and sent audio:', { title });

        } catch (error) {
            logger.error('Error in ytmp3 command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to convert video: ' + error.message
            });
        }
    },

    ytmp4: async (sock, msg, args) => {
        try {
            if (!args[0]) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a YouTube URL!\nUsage: !ytmp4 <url>'
                });
            }

            const url = args[0];
            if (!ytdl.validateURL(url)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Invalid YouTube URL!'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Downloading video...'
            });

            const info = await ytdl.getInfo(url);
            const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
            const tempDir = path.join(__dirname, '../temp');
            await fs.ensureDir(tempDir);

            const videoPath = path.join(tempDir, `${title}.mp4`);
            const videoReadableStream = ytdl(url, {
                quality: 'highest',
                filter: 'videoandaudio'
            });

            await new Promise((resolve, reject) => {
                videoReadableStream
                    .pipe(fs.createWriteStream(videoPath))
                    .on('finish', resolve)
                    .on('error', reject);
            });

            await sock.sendMessage(msg.key.remoteJid, {
                video: { url: videoPath },
                caption: `📹 ${title}`
            });

            // Clean up
            await fs.unlink(videoPath);
            logger.info('Successfully downloaded and sent video:', { title });

        } catch (error) {
            logger.error('Error in ytmp4 command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to download video: ' + error.message
            });
        }
    }
};

module.exports = utilityCommands;