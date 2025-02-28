const config = require('../config');
const logger = require('pino')();
const musicCommands = require('./music'); 
const ytdl = require('ytdl-core');
const axios = require('axios');

// Safe module import function
const safeRequire = (path) => {
    try {
        return require(path);
    } catch (error) {
        logger.warn(`Failed to load module ${path}: ${error.message}`);
        return null;
    }
};

const downloaderCommands = {
    ytmp3: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a YouTube URL!\nUsage: ${config.prefix}ytmp3 <url>`
                });
            }

            // Get video info with retries
            let videoId;
            let audioUrl;
            try {
                videoId = ytdl.getVideoID(args[0]);
                logger.info('Extracted video ID for ytmp3:', videoId);

                const info = await ytdl.getInfo(videoId);
                logger.info('Retrieved video info successfully');

                const format = ytdl.chooseFormat(info.formats, {
                    quality: 'highestaudio',
                    filter: 'audioonly'
                });

                if (!format) {
                    throw new Error('No suitable audio format found');
                }
                logger.info('Selected audio format:', format.qualityLabel);

                // Validate URL before using
                try {
                    logger.info('Validating initial audio URL...');
                    const response = await axios.head(format.url);
                    logger.info('URL validation response status:', response.status);

                    if (response.status === 404) {
                        throw new Error('Initial URL invalid');
                    }
                    audioUrl = format.url;
                    logger.info('Initial URL validation successful');
                } catch (urlError) {
                    logger.info('Initial URL validation failed, getting fresh URL...', urlError.message);
                    const freshInfo = await ytdl.getInfo(videoId);
                    const freshFormat = ytdl.chooseFormat(freshInfo.formats, {
                        quality: 'highestaudio',
                        filter: 'audioonly'
                    });
                    audioUrl = freshFormat.url;
                    logger.info('Successfully obtained fresh URL');
                }
            } catch (error) {
                logger.error('Error getting video info:', error);
                throw new Error('Failed to get audio source. Please try again.');
            }

            logger.info('Sending audio message with URL:', audioUrl);
            await sock.sendMessage(msg.key.remoteJid, {
                audio: { url: audioUrl },
                mimetype: 'audio/mp4'
            });
            logger.info('Audio message sent successfully');
        } catch (error) {
            logger.error('Error in ytmp3 command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error downloading audio: ' + error.message
            });
        }
    },

    ytmp4: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a YouTube URL!\nUsage: ${config.prefix}ytmp4 <url>`
                });
            }

            // Get video info with retries
            let videoId;
            let videoUrl;
            try {
                videoId = ytdl.getVideoID(args[0]);
                logger.info('Extracted video ID for ytmp4:', videoId);

                const info = await ytdl.getInfo(videoId);
                logger.info('Retrieved video info successfully');

                const format = ytdl.chooseFormat(info.formats, {
                    quality: 'highest'
                });

                if (!format) {
                    throw new Error('No suitable video format found');
                }
                logger.info('Selected video format:', format.qualityLabel);

                // Validate URL before using
                try {
                    logger.info('Validating initial video URL...');
                    const response = await axios.head(format.url);
                    logger.info('URL validation response status:', response.status);

                    if (response.status === 404) {
                        throw new Error('Initial URL invalid');
                    }
                    videoUrl = format.url;
                    logger.info('Initial URL validation successful');
                } catch (urlError) {
                    logger.info('Initial URL validation failed, getting fresh URL...', urlError.message);
                    const freshInfo = await ytdl.getInfo(videoId);
                    const freshFormat = ytdl.chooseFormat(freshInfo.formats, {
                        quality: 'highest'
                    });
                    videoUrl = freshFormat.url;
                    logger.info('Successfully obtained fresh URL');
                }
            } catch (error) {
                logger.error('Error getting video info:', error);
                throw new Error('Failed to get video source. Please try again.');
            }

            logger.info('Sending video message with URL:', videoUrl);
            await sock.sendMessage(msg.key.remoteJid, {
                video: { url: videoUrl },
                caption: info.videoDetails.title
            });
            logger.info('Video message sent successfully');
        } catch (error) {
            logger.error('Error in ytmp4 command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error downloading video: ' + error.message
            });
        }
    },

    // Redirect play command to music module
    play: async (sock, msg, args) => {
        try {
            return await musicCommands.play(sock, msg, args);
        } catch (error) {
            logger.error('Error in play command redirect:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error playing audio: ' + error.message
            });
        }
    },
    tiktok: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a TikTok URL!\nUsage: ${config.prefix}tiktok <url>`
                });
            }
            const result = await tiktok.download(args[0]);
            await sock.sendMessage(msg.key.remoteJid, {
                video: { url: result.url },
                caption: '📱 TikTok Video'
            });
        } catch (error) {
            logger.error('Error in tiktok command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error downloading TikTok: ' + error.message
            });
        }
    },

    facebook: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a Facebook URL!\nUsage: ${config.prefix}facebook <url>`
                });
            }
            const result = await fbdl.download(args[0]);
            await sock.sendMessage(msg.key.remoteJid, {
                video: { url: result.url },
                caption: '📱 Facebook Video'
            });
        } catch (error) {
            logger.error('Error in facebook command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error downloading Facebook video: ' + error.message
            });
        }
    },

    mediafire: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a MediaFire URL!\nUsage: ${config.prefix}mediafire <url>`
                });
            }
            const result = await mediafire.download(args[0]);
            await sock.sendMessage(msg.key.remoteJid, {
                document: { url: result.url },
                mimetype: result.mime,
                fileName: result.filename
            });
        } catch (error) {
            logger.error('Error in mediafire command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error downloading file: ' + error.message
            });
        }
    },

    apk: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide an app name!\nUsage: ${config.prefix}apk <app name>`
                });
            }
            const result = await apk.download(args.join(' '));
            await sock.sendMessage(msg.key.remoteJid, {
                document: { url: result.url },
                mimetype: 'application/vnd.android.package-archive',
                fileName: result.name + '.apk'
            });
        } catch (error) {
            logger.error('Error in apk command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error downloading APK: ' + error.message
            });
        }
    },

    lyrics: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a song name!\nUsage: ${config.prefix}lyrics <song name>`
                });
            }
            const result = await lyrics.search(args.join(' '));
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎵 *${result.title}*\n👤 ${result.artist}\n\n${result.lyrics}`
            });
        } catch (error) {
            logger.error('Error in lyrics command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error finding lyrics: ' + error.message
            });
        }
    }
};

module.exports = downloaderCommands;