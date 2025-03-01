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
const FormData = require('form-data');
const ffmpeg = require('fluent-ffmpeg');

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, '../temp');
fs.ensureDirSync(tempDir);

// Download progress tracking
const downloadProgress = new Map();

// Rate limiting
const rateLimiter = new Map();
const RATE_LIMIT = 60000; // 1 minute

const isRateLimited = (userId) => {
    if (!rateLimiter.has(userId)) return false;
    return Date.now() - rateLimiter.get(userId) < RATE_LIMIT;
};

const setRateLimit = (userId) => {
    rateLimiter.set(userId, Date.now());
};

// Utility function to clean up temp files
const cleanupTempFiles = async (...files) => {
    for (const file of files) {
        try {
            await fs.remove(file);
        } catch (error) {
            logger.error('Error cleaning up temp file:', error);
        }
    }
};

// Enhanced download with progress tracking
const downloadWithProgress = async (url, filePath, messageId) => {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    const totalLength = response.headers['content-length'];
    let downloadedLength = 0;

    downloadProgress.set(messageId, 0);

    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);

        response.data.on('data', (chunk) => {
            downloadedLength += chunk.length;
            const progress = Math.round((downloadedLength / totalLength) * 100);
            downloadProgress.set(messageId, progress);
        });

        writer.on('finish', resolve);
        writer.on('error', reject);
        response.data.pipe(writer);
    });
};

// Function to get Instagram media info
const getInstagramMediaInfo = async (url) => {
    try {
        const response = await axios.get(`https://api.instagram.com/oembed?url=${url}`);
        return {
            type: url.includes('/reel/') ? 'reel' : 'post',
            mediaUrl: response.data.thumbnail_url.replace('/s150x150/', '/s1080x1080/'),
            title: response.data.title || 'Instagram Media'
        };
    } catch (error) {
        throw new Error('Failed to fetch Instagram media info. Make sure the URL is public and valid.');
    }
};

const downloaderCommands = {
    tiktokmp3: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a TikTok URL!\nUsage: ${config.prefix}tiktokmp3 <url>`
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing your request...'
            });

            const result = await tiktok.download(args[0]);

            // Download video first
            const tempVideo = path.join(tempDir, `tiktok_${Date.now()}.mp4`);
            await downloadWithProgress(result.url, tempVideo, msg.key.id);

            // Convert to audio using ffmpeg
            const tempAudio = path.join(tempDir, `tiktok_${Date.now()}.mp3`);
            await new Promise((resolve, reject) => {
                ffmpeg(tempVideo)
                    .toFormat('mp3')
                    .on('end', resolve)
                    .on('error', reject)
                    .save(tempAudio);
            });

            await sock.sendMessage(msg.key.remoteJid, {
                audio: { url: tempAudio },
                mimetype: 'audio/mp4',
                fileName: `tiktok_audio_${Date.now()}.mp3`
            });

            // Cleanup
            await cleanupTempFiles(tempVideo, tempAudio);

        } catch (error) {
            logger.error('Error in tiktokmp3 command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error extracting TikTok audio: ' + error.message
            });
        }
    },

    igdl: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide an Instagram URL!\nUsage: ${config.prefix}igdl <url>`
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing Instagram content...'
            });

            const url = args[0];

            // Handle different Instagram content types
            if (url.includes('/reel/') || url.includes('/p/')) {
                const mediaInfo = await getInstagramMediaInfo(url);
                const tempFile = path.join(tempDir, `instagram_${Date.now()}.mp4`);
                await downloadWithProgress(mediaInfo.mediaUrl, tempFile, msg.key.id);

                await sock.sendMessage(msg.key.remoteJid, {
                    video: { url: tempFile },
                    caption: mediaInfo.title
                });

                await cleanupTempFiles(tempFile);
            } else if (url.includes('/stories/')) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '⚠️ Stories download coming soon!'
                });
            } else {
                throw new Error('Unsupported Instagram URL type');
            }

        } catch (error) {
            logger.error('Error in igdl command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error downloading Instagram content: ' + error.message
            });
        }
    },

    fbhd: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a Facebook URL!\nUsage: ${config.prefix}fbhd <url>`
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing Facebook video in HD...'
            });

            const result = await fbdl.download(args[0], 'hd');

            const tempFile = path.join(tempDir, `fb_${Date.now()}.mp4`);
            await downloadWithProgress(result.url, tempFile, msg.key.id);

            await sock.sendMessage(msg.key.remoteJid, {
                video: { url: tempFile },
                caption: `${result.title || '📱 Facebook Video'} (HD Quality)`
            });

            await cleanupTempFiles(tempFile);

        } catch (error) {
            logger.error('Error in fbhd command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error downloading Facebook video: ' + error.message
            });
        }
    },

    ytplaylist: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a YouTube playlist URL!\nUsage: ${config.prefix}ytplaylist <url>`
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing YouTube playlist...'
            });

            const playlistId = args[0].match(/[&?]list=([^&]+)/)?.[1];
            if (!playlistId) {
                throw new Error('Invalid playlist URL');
            }

            const response = await yts({ listId: playlistId });
            const videos = response.videos.slice(0, 5); // Limit to first 5 videos

            let message = '📋 *Playlist Information*\n\n';
            for (let i = 0; i < videos.length; i++) {
                message += `${i + 1}. ${videos[i].title}\n`;
                message += `⏱️ Duration: ${videos[i].duration.timestamp}\n`;
                message += `👁️ Views: ${videos[i].views.toLocaleString()}\n\n`;
            }

            message += '\nUse .ytmp3 or .ytmp4 with the video URL to download individual videos.';

            await sock.sendMessage(msg.key.remoteJid, { text: message });

        } catch (error) {
            logger.error('Error in ytplaylist command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error processing YouTube playlist: ' + error.message
            });
        }
    },

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
                await downloadWithProgress(format.url, tempFile, msg.key.id);


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
                await cleanupTempFiles(tempFile);

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
                await downloadWithProgress(format.url, tempFile, msg.key.id);

                // Send the video file
                await sock.sendMessage(msg.key.remoteJid, {
                    video: { url: tempFile },
                    caption: `${info.videoDetails.title}`,
                    fileName: `${info.videoDetails.title}.mp4`
                });

                // Cleanup
                await cleanupTempFiles(tempFile);

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
            await downloadWithProgress(result.url, tempFile, msg.key.id);

            await sock.sendMessage(msg.key.remoteJid, {
                video: { url: tempFile },
                caption: '📱 TikTok Video'
            });

            // Cleanup
            await cleanupTempFiles(tempFile);

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
            await downloadWithProgress(result.url, tempFile, msg.key.id);

            await sock.sendMessage(msg.key.remoteJid, {
                video: { url: tempFile },
                caption: result.title || '📱 Facebook Video'
            });

            // Cleanup
            await cleanupTempFiles(tempFile);

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
            await downloadWithProgress(result.url, tempFile, msg.key.id);

            await sock.sendMessage(msg.key.remoteJid, {
                document: { url: tempFile },
                mimetype: result.mime,
                fileName: result.filename
            });

            // Cleanup
            await cleanupTempFiles(tempFile);

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

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing your request...'
            });

            const result = await apk.download(args.join(' '));

            // Download to temp file
            const tempFile = path.join(tempDir, `${result.name}.apk`);
            await downloadWithProgress(result.url, tempFile, msg.key.id);

            await sock.sendMessage(msg.key.remoteJid, {
                document: { url: tempFile },
                mimetype: 'application/vnd.android.package-archive',
                fileName: `${result.name}.apk`
            });

            // Cleanup
            await cleanupTempFiles(tempFile);

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
    igdl: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide an Instagram URL!\nUsage: ${config.prefix}igdl <url>`
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing Instagram content...'
            });

            const url = args[0];

            // Handle different Instagram content types
            if (url.includes('/reel/') || url.includes('/p/')) {
                const response = await axios.get(`https://api.instagram.com/oembed?url=${url}`);
                const mediaUrl = response.data.thumbnail_url.replace('/s150x150/', '/s1080x1080/');

                const tempFile = path.join(tempDir, `instagram_${Date.now()}.mp4`);
                await downloadWithProgress(mediaUrl, tempFile, msg.key.id);

                await sock.sendMessage(msg.key.remoteJid, {
                    video: { url: tempFile },
                    caption: '📱 Instagram Media'
                });

                await cleanupTempFiles(tempFile);
            } else if (url.includes('/stories/')) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '⚠️ Stories download coming soon!'
                });
            } else {
                throw new Error('Unsupported Instagram URL type');
            }

        } catch (error) {
            logger.error('Error in igdl command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error downloading Instagram content: ' + error.message
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
    },
    igreel: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide an Instagram Reel URL!\nUsage: ${config.prefix}igreel <url>`
                });
            }

            const userId = msg.key.participant || msg.key.remoteJid;
            if (isRateLimited(userId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ Please wait a minute before downloading another reel.'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing Instagram Reel...'
            });

            const url = args[0];
            if (!url.includes('/reel/')) {
                throw new Error('Invalid Instagram Reel URL');
            }

            const mediaInfo = await getInstagramMediaInfo(url);
            const tempFile = path.join(tempDir, `instagram_${Date.now()}.mp4`);

            await downloadWithProgress(mediaInfo.mediaUrl, tempFile, msg.key.id);

            await sock.sendMessage(msg.key.remoteJid, {
                video: { url: tempFile },
                caption: '📱 Instagram Reel'
            });

            setRateLimit(userId);
            await cleanupTempFiles(tempFile);

        } catch (error) {
            logger.error('Error in igreel command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error downloading Instagram Reel: ' + error.message
            });
        }
    },

    igstory: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide an Instagram username!\nUsage: ${config.prefix}igstory <username>`
                });
            }

            const userId = msg.key.participant || msg.key.remoteJid;
            if (isRateLimited(userId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ Please wait a minute before downloading another story.'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing Instagram Story...\n\n⚠️ Note: Only public stories can be downloaded.'
            });

            // Story download functionality will be implemented when Instagram's API access is available
            await sock.sendMessage(msg.key.remoteJid, {
                text: '🚧 Instagram Story download is currently under development.\nThis feature will be available soon!'
            });

            setRateLimit(userId);

        } catch (error) {
            logger.error('Error in igstory command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error downloading Instagram Story: ' + error.message
            });
        }
    },

    ythdmp4: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a YouTube URL!\nUsage: ${config.prefix}ythdmp4 <url>`
                });
            }

            const userId = msg.key.participant || msg.key.remoteJid;
            if (isRateLimited(userId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ Please wait a minute before downloading another video.'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing YouTube video in HD...'
            });

            let videoId;
            if (ytdl.validateURL(args[0])) {
                videoId = ytdl.getVideoID(args[0]);
            } else {
                throw new Error('Invalid YouTube URL');
            }

            const info = await ytdl.getInfo(videoId);
            const format = ytdl.chooseFormat(info.formats, {
                quality: 'highestvideo',
                filter: 'videoandaudio'
            });

            if (!format) {
                throw new Error('No suitable HD format found');
            }

            const tempFile = path.join(tempDir, `${videoId}_hd.mp4`);
            await downloadWithProgress(format.url, tempFile, msg.key.id);

            await sock.sendMessage(msg.key.remoteJid, {
                video: { url: tempFile },
                caption: `🎥 ${info.videoDetails.title} (HD Quality)`
            });

            setRateLimit(userId);
            await cleanupTempFiles(tempFile);

        } catch (error) {
            logger.error('Error in ythdmp4 command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error downloading HD video: ' + error.message
            });
        }
    }
};

module.exports = downloaderCommands;