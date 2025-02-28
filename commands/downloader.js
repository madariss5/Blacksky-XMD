const config = require('../config');
const logger = require('pino')();
const musicCommands = require('./music'); 
const ytdl = require('@distube/ytdl-core');
const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs-extra');
const path = require('path');
const { fbdl } = require('../attached_assets/downloader-fbdl');
const { tiktok } = require('../attached_assets/downloader-tiktok');
const { mediafire } = require('../attached_assets/downloader-mediafire');
const { apk } = require('../attached_assets/downloader-apk');

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, '../temp');
fs.ensureDirSync(tempDir);

const downloaderCommands = {
    ytmp3: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a YouTube URL!\nUsage: .ytmp3 <url>`
                });
            }

            // Send processing message
            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing your request...'
            });

            let videoId;
            let audioUrl;
            try {
                // Handle both URL and search query
                if (ytdl.validateURL(args[0])) {
                    videoId = ytdl.getVideoID(args[0]);
                } else {
                    // Search for the video if URL not provided
                    const searchResults = await yts(args.join(' '));
                    if (!searchResults.videos.length) {
                        throw new Error('No videos found');
                    }
                    videoId = searchResults.videos[0].videoId;
                }

                logger.info('Processing video ID:', videoId);

                const info = await ytdl.getInfo(videoId);
                const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

                if (!audioFormats.length) {
                    throw new Error('No audio formats available');
                }

                // Get the best audio format
                const format = audioFormats.reduce((prev, curr) => {
                    const prevBitrate = prev.audioBitrate || 0;
                    const currBitrate = curr.audioBitrate || 0;
                    return prevBitrate > currBitrate ? prev : curr;
                });

                // Download to temp file
                const tempFile = path.join(tempDir, `${videoId}.mp3`);
                const writeStream = fs.createWriteStream(tempFile);

                ytdl(videoId, {
                    format: format
                }).pipe(writeStream);

                await new Promise((resolve, reject) => {
                    writeStream.on('finish', resolve);
                    writeStream.on('error', reject);
                });

                // Send the audio file
                await sock.sendMessage(msg.key.remoteJid, {
                    audio: { url: tempFile },
                    mimetype: 'audio/mp4',
                    fileName: `${info.videoDetails.title}.mp3`
                });

                // Cleanup
                await fs.remove(tempFile);

            } catch (error) {
                logger.error('Error processing YouTube video:', error);
                throw new Error('Failed to process video: ' + error.message);
            }

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
                    text: `Please provide a YouTube URL!\nUsage: .ytmp4 <url>`
                });
            }

            // Send processing message
            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing your request...'
            });

            let videoId;
            try {
                // Handle both URL and search query
                if (ytdl.validateURL(args[0])) {
                    videoId = ytdl.getVideoID(args[0]);
                } else {
                    // Search for the video if URL not provided
                    const searchResults = await yts(args.join(' '));
                    if (!searchResults.videos.length) {
                        throw new Error('No videos found');
                    }
                    videoId = searchResults.videos[0].videoId;
                }

                logger.info('Processing video ID:', videoId);

                const info = await ytdl.getInfo(videoId);

                // Get best quality video with audio
                const format = ytdl.chooseFormat(info.formats, { 
                    quality: 'highest',
                    filter: 'audioandvideo' 
                });

                if (!format) {
                    throw new Error('No suitable video format found');
                }

                // Download to temp file
                const tempFile = path.join(tempDir, `${videoId}.mp4`);
                const writeStream = fs.createWriteStream(tempFile);

                ytdl(videoId, {
                    format: format
                }).pipe(writeStream);

                await new Promise((resolve, reject) => {
                    writeStream.on('finish', resolve);
                    writeStream.on('error', reject);
                });

                // Send the video file
                await sock.sendMessage(msg.key.remoteJid, {
                    video: { url: tempFile },
                    caption: `${info.videoDetails.title}`,
                    fileName: `${info.videoDetails.title}.mp4`
                });

                // Cleanup
                await fs.remove(tempFile);

            } catch (error) {
                logger.error('Error processing YouTube video:', error);
                throw new Error('Failed to process video: ' + error.message);
            }

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
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a song name or URL!\nUsage: .play <song name/URL>`
                });
            }
            return await musicCommands.play(sock, msg, args);
        } catch (error) {
            logger.error('Error in play command:', error);
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

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing your request...'
            });

            const result = await tiktok.download(args[0]);

            // Download to temp file to handle large videos
            const tempFile = path.join(tempDir, `tiktok_${Date.now()}.mp4`);
            const writer = fs.createWriteStream(tempFile);

            const response = await axios({
                url: result.url,
                method: 'GET',
                responseType: 'stream'
            });

            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            await sock.sendMessage(msg.key.remoteJid, {
                video: { url: tempFile },
                caption: '📱 TikTok Video'
            });

            // Cleanup
            await fs.remove(tempFile);

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

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing your request...'
            });

            const result = await fbdl.download(args[0]);

            // Download to temp file to handle large videos
            const tempFile = path.join(tempDir, `fb_${Date.now()}.mp4`);
            const writer = fs.createWriteStream(tempFile);

            const response = await axios({
                url: result.url,
                method: 'GET',
                responseType: 'stream'
            });

            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            await sock.sendMessage(msg.key.remoteJid, {
                video: { url: tempFile },
                caption: result.title || '📱 Facebook Video'
            });

            // Cleanup
            await fs.remove(tempFile);

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

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing your request...'
            });

            const result = await mediafire.download(args[0]);

            // Download to temp file
            const tempFile = path.join(tempDir, result.filename);
            const writer = fs.createWriteStream(tempFile);

            const response = await axios({
                url: result.url,
                method: 'GET',
                responseType: 'stream'
            });

            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            await sock.sendMessage(msg.key.remoteJid, {
                document: { url: tempFile },
                mimetype: result.mime,
                fileName: result.filename
            });

            // Cleanup
            await fs.remove(tempFile);

        } catch (error) {
            logger.error('Error in mediafire command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error downloading file: ' + error.message
            });
        }
    },

    // APK downloader command
    apk: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide an app name!\nUsage: ${config.prefix}apk <app name>`
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing your request...'
            });

            const result = await apk.download(args.join(' '));

            // Download to temp file
            const tempFile = path.join(tempDir, `${result.name}.apk`);
            const writer = fs.createWriteStream(tempFile);

            const response = await axios({
                url: result.url,
                method: 'GET',
                responseType: 'stream'
            });

            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            await sock.sendMessage(msg.key.remoteJid, {
                document: { url: tempFile },
                mimetype: 'application/vnd.android.package-archive',
                fileName: `${result.name}.apk`
            });

            // Cleanup
            await fs.remove(tempFile);

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