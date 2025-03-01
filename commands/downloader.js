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
                    text: `Please provide a YouTube URL!\nUsage: ${config.prefix}ytmp3 <url>`
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing your request...'
            });

            let videoId;
            try {
                if (ytdl.validateURL(args[0])) {
                    videoId = ytdl.getVideoID(args[0]);
                } else {
                    const searchResults = await yts(args.join(' '));
                    if (!searchResults.videos.length) {
                        throw new Error('No videos found');
                    }
                    videoId = searchResults.videos[0].videoId;
                }

                logger.info('Processing video ID:', videoId);

                const info = await ytdl.getInfo(videoId);

                // Check video duration
                const duration = parseInt(info.videoDetails.lengthSeconds);
                if (duration > 600) { // 10 minutes max
                    throw new Error('Video is too long. Maximum duration is 10 minutes.');
                }

                const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
                if (!audioFormats.length) {
                    throw new Error('No audio formats available');
                }

                // Get best audio format
                const format = audioFormats.reduce((prev, curr) => {
                    const prevBitrate = prev.audioBitrate || 0;
                    const currBitrate = curr.audioBitrate || 0;
                    return prevBitrate > currBitrate ? prev : curr;
                });

                // Send progress message
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `🎵 *Downloading Audio*\n\n` +
                          `• Title: ${info.videoDetails.title}\n` +
                          `• Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}\n` +
                          `• Quality: ${format.audioBitrate}kbps\n\n` +
                          `Please wait...`
                });

                const tempFile = path.join(tempDir, `${videoId}.mp3`);
                const writeStream = fs.createWriteStream(tempFile);

                ytdl(videoId, {
                    format: format
                }).pipe(writeStream);

                await new Promise((resolve, reject) => {
                    writeStream.on('finish', resolve);
                    writeStream.on('error', reject);
                });

                // Check file size
                const stats = await fs.stat(tempFile);
                const fileSizeMB = stats.size / (1024 * 1024);
                if (fileSizeMB > 100) { // 100MB limit
                    await fs.remove(tempFile);
                    throw new Error('Audio file is too large. Maximum size is 100MB.');
                }

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
    },
    instagram: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide an Instagram URL!\nUsage: ${config.prefix}instagram <url>`
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing your request...'
            });

            // Generate temp file path
            const tempFile = path.join(tempDir, `instagram_${Date.now()}.mp4`);

            try {
                // Use Instagram API to fetch media
                const response = await axios.get(`https://api.instagram.com/oembed?url=${args[0]}`);
                const mediaUrl = response.data.thumbnail_url.replace('/s150x150/', '/s1080x1080/');

                // Download media
                const mediaResponse = await axios({
                    url: mediaUrl,
                    method: 'GET',
                    responseType: 'stream'
                });

                const writer = fs.createWriteStream(tempFile);
                mediaResponse.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                // Send the media
                await sock.sendMessage(msg.key.remoteJid, {
                    video: { url: tempFile },
                    caption: '📱 Instagram Media'
                });

                // Cleanup
                await fs.remove(tempFile);

            } catch (error) {
                throw new Error('Failed to fetch Instagram content. Make sure the URL is public and valid.');
            }

        } catch (error) {
            logger.error('Error in instagram command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error downloading Instagram media: ' + error.message
            });
        }
    },

    spotify: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a Spotify track URL!\nUsage: ${config.prefix}spotify <url>`
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing Spotify track...\n\n⚠️ Note: This feature is experimental and may not work for all tracks.'
            });

            // Extract track ID from URL
            const trackId = args[0].split('track/')[1]?.split('?')[0];
            if (!trackId) {
                throw new Error('Invalid Spotify URL. Please provide a valid track URL.');
            }

            // Fetch track metadata
            const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.SPOTIFY_TOKEN}`
                }
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎵 *Track Information*\n\n` +
                      `• Title: ${response.data.name}\n` +
                      `• Artist: ${response.data.artists[0].name}\n` +
                      `• Album: ${response.data.album.name}\n` +
                      `• Duration: ${Math.floor(response.data.duration_ms / 1000 / 60)}:${Math.floor((response.data.duration_ms / 1000) % 60).toString().padStart(2, '0')}\n\n` +
                      `⚠️ Due to copyright restrictions, I cannot download Spotify tracks directly. Please use the official Spotify app to listen to this track.`
            });

        } catch (error) {
            logger.error('Error in spotify command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error processing Spotify track: ' + error.message
            });
        }
    }
};

module.exports = downloaderCommands;