const config = require('../config');
const logger = require('pino')();
const ytdl = require('@distube/ytdl-core');
const yts = require('yt-search');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

// Create media directory if it doesn't exist
const mediaDir = path.join(__dirname, '../media');
if (!fs.existsSync(mediaDir)) {
    fs.mkdirpSync(mediaDir);
    logger.info('Media directory created');
}

// Store active music sessions
const musicSessions = new Map();

// YouTube API options with rate limit handling
const ytOptions = {
    lang: 'en',
    requestOptions: {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        maxRetries: 3,
        backoff: { inc: 500, max: 10000 }
    }
};

const musicCommands = {
    play: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `🎵 Please provide a song name or URL!\nUsage: ${config.prefix}play <song name or URL>`
                });
            }

            const query = args.join(' ');
            logger.info('Searching for:', query);

            let searchResults;
            try {
                searchResults = await yts(query);
                if (!searchResults.videos.length) {
                    throw new Error('No videos found!');
                }
                logger.info('Search successful, found video:', searchResults.videos[0].title);
            } catch (searchError) {
                logger.error('Search failed:', searchError);
                throw new Error('Failed to search for the song. Please try again.');
            }

            const video = searchResults.videos[0];
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎵 *Now Playing*\n\nTitle: ${video.title}\nDuration: ${video.duration.timestamp}\nViews: ${video.views}\n\n⏳ Downloading...`
            });

            // Get audio stream URL with retries
            let videoId;
            let audioUrl;
            try {
                videoId = ytdl.getVideoID(video.url);
                logger.info('Extracted video ID:', videoId);

                const info = await ytdl.getInfo(videoId, ytOptions);
                logger.info('Retrieved video info successfully');

                // Get all audio formats
                const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
                logger.info(`Found ${audioFormats.length} audio formats`);

                if (!audioFormats.length) {
                    throw new Error('No audio formats available');
                }

                // Select the best audio format with fallback
                let format = audioFormats.reduce((prev, curr) => {
                    if (!prev) return curr;
                    if (!curr) return prev;
                    const prevBitrate = prev.audioBitrate || 0;
                    const currBitrate = curr.audioBitrate || 0;
                    return prevBitrate > currBitrate ? prev : curr;
                });

                audioUrl = format.url;
                logger.info('Selected audio format with bitrate:', format.audioBitrate);

                // Validate URL before using
                try {
                    const response = await axios.head(audioUrl, {
                        timeout: 5000,
                        validateStatus: (status) => status < 500
                    });
                    if (response.status === 404) {
                        throw new Error('Audio URL invalid');
                    }
                } catch (urlError) {
                    // If URL validation fails, try getting a fresh URL
                    logger.info('URL validation failed, getting fresh URL...');
                    const freshInfo = await ytdl.getInfo(videoId, ytOptions);
                    const freshFormats = ytdl.filterFormats(freshInfo.formats, 'audioonly');
                    format = freshFormats.reduce((prev, curr) => {
                        if (!prev) return curr;
                        if (!curr) return prev;
                        const prevBitrate = prev.audioBitrate || 0;
                        const currBitrate = curr.audioBitrate || 0;
                        return prevBitrate > currBitrate ? prev : curr;
                    });
                    audioUrl = format.url;
                    logger.info('Successfully obtained fresh URL');
                }

            } catch (error) {
                logger.error('Error getting audio source:', error);
                // Enhanced error handling
                if (error.message.includes('429')) {
                    throw new Error('YouTube rate limit reached. Please try again in a few minutes.');
                } else if (error.message.includes('Private video') || error.message.includes('private')) {
                    throw new Error('This video is private or unavailable.');
                } else if (error.message.includes('Copyright') || error.message.includes('copyright')) {
                    throw new Error('This video is not available due to copyright restrictions.');
                } else if (error.message.includes('region') || error.message.includes('country')) {
                    throw new Error('This video is not available in your region.');
                } else {
                    throw new Error('Unable to process this song. Please try another one.');
                }
            }

            // Store in session
            const session = musicSessions.get(msg.key.remoteJid) || {
                playing: false,
                queue: [],
                current: 0
            };

            session.queue.push({
                title: video.title,
                url: video.url,
                videoId: videoId,
                audioUrl: audioUrl,
                duration: video.duration.seconds,
                thumbnail: video.thumbnail,
                requestedBy: msg.key.participant,
                addedAt: new Date().toISOString()
            });

            musicSessions.set(msg.key.remoteJid, session);

            // Start playing if not already playing
            if (!session.playing) {
                session.playing = true;
                await playSong(sock, msg.key.remoteJid);
            } else {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `✅ Added to queue: ${video.title}`
                });
            }
        } catch (error) {
            logger.error('Error in play command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ ' + (error.message || 'Error playing music. Please try again.')
            });
        }
    },
    stop: async (sock, msg) => {
        try {
            const session = musicSessions.get(msg.key.remoteJid);
            if (!session?.playing) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No music is currently playing!'
                });
            }

            session.queue = [];
            session.playing = false;
            musicSessions.set(msg.key.remoteJid, session);

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏹️ Music playback stopped'
            });
        } catch (error) {
            logger.error('Error in stop command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error stopping music: ' + error.message
            });
        }
    },
    skip: async (sock, msg) => {
        try {
            const session = musicSessions.get(msg.key.remoteJid);
            if (!session?.playing) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No music is currently playing!'
                });
            }

            if (session.queue.length <= 1) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No more songs in queue!'
                });
            }

            session.current++;
            if (session.current >= session.queue.length) {
                session.current = 0;
            }

            await playSong(sock, msg.key.remoteJid);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏭️ Skipped to next song'
            });
        } catch (error) {
            logger.error('Error in skip command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error skipping song: ' + error.message
            });
        }
    },
    queue: async (sock, msg) => {
        try {
            const session = musicSessions.get(msg.key.remoteJid);
            if (!session?.queue.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '📋 Queue is empty! Use !play to add songs.'
                });
            }

            let queueText = '🎵 *Music Queue*\n\n';
            session.queue.forEach((song, index) => {
                const status = index === session.current ? '▶️ ' : `${index + 1}. `;
                queueText += `${status}${song.title} (${formatDuration(song.duration)})\n`;
                queueText += `👤 Requested by: @${song.requestedBy.split('@')[0]}\n\n`;
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: queueText,
                mentions: session.queue.map(song => song.requestedBy)
            });
        } catch (error) {
            logger.error('Error in queue command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error displaying queue: ' + error.message
            });
        }
    },
    pause: async (sock, msg) => {
        try {
            const session = musicSessions.get(msg.key.remoteJid);
            if (!session?.playing) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No music is currently playing!'
                });
            }

            session.playing = false;
            musicSessions.set(msg.key.remoteJid, session);

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏸️ Music playback paused'
            });
        } catch (error) {
            logger.error('Error in pause command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error pausing music: ' + error.message
            });
        }
    },
    resume: async (sock, msg) => {
        try {
            const session = musicSessions.get(msg.key.remoteJid);
            if (!session?.queue.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No music in queue!'
                });
            }

            if (session.playing) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Music is already playing!'
                });
            }

            session.playing = true;
            musicSessions.set(msg.key.remoteJid, session);
            await playSong(sock, msg.key.remoteJid);

            await sock.sendMessage(msg.key.remoteJid, {
                text: '▶️ Music playback resumed'
            });
        } catch (error) {
            logger.error('Error in resume command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error resuming music: ' + error.message
            });
        }
    },
    lyrics: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Please provide a song name!\nUsage: ${config.prefix}lyrics <song name>`
                });
            }

            // For now, return a simple message as lyrics API integration would be needed
            await sock.sendMessage(msg.key.remoteJid, {
                text: '🎵 Lyrics feature coming soon!'
            });
        } catch (error) {
            logger.error('Error in lyrics command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching lyrics: ' + error.message
            });
        }
    }
};

// Helper function to play a song
async function playSong(sock, chatId) {
    try {
        const session = musicSessions.get(chatId);
        if (!session?.queue.length || !session.playing) return;

        const currentSong = session.queue[session.current];
        let audioUrl = currentSong.audioUrl;

        logger.info('Starting playback of:', {
            title: currentSong.title,
            videoId: currentSong.videoId
        });

        // Verify URL is still valid
        try {
            const response = await axios.head(audioUrl);
            if (response.status === 404) {
                throw new Error('URL expired');
            }
        } catch (urlError) {
            logger.info('URL validation failed, refreshing...');

            try {
                const info = await ytdl.getInfo(currentSong.videoId, ytOptions);

                const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
                if (!audioFormats.length) {
                    throw new Error('No audio formats available');
                }

                const format = audioFormats.reduce((prev, curr) => {
                    const prevBitrate = prev.audioBitrate || 0;
                    const currBitrate = curr.audioBitrate || 0;
                    return prevBitrate > currBitrate ? prev : curr;
                });

                audioUrl = format.url;
                currentSong.audioUrl = audioUrl;
                logger.info('Successfully refreshed audio URL');
            } catch (refreshError) {
                logger.error('Failed to refresh URL:', refreshError);
                throw new Error('Failed to refresh audio source. Skipping to next song...');
            }
        }

        // Send the audio message
        await sock.sendMessage(chatId, {
            audio: { url: audioUrl },
            mimetype: 'audio/mp4',
            ptt: false,
            contextInfo: {
                externalAdReply: {
                    title: currentSong.title,
                    body: `Duration: ${formatDuration(currentSong.duration)}`,
                    thumbnail: Buffer.from(currentSong.thumbnail, 'base64'),
                    mediaType: 1,
                    showAdAttribution: false
                }
            }
        });

        logger.info('Audio message sent successfully');

    } catch (error) {
        logger.error('Error playing song:', error);

        // Handle the failed song
        const session = musicSessions.get(chatId);
        if (session) {
            session.queue.splice(session.current, 1);
            if (session.queue.length === 0) {
                session.playing = false;
                await sock.sendMessage(chatId, {
                    text: '❌ Queue is now empty. Use !play to add more songs.'
                });
            } else {
                if (session.current >= session.queue.length) {
                    session.current = 0;
                }
                await sock.sendMessage(chatId, {
                    text: '❌ ' + (error.message || 'Error playing current song. Trying next song...')
                });
                musicSessions.set(chatId, session);
                await playSong(sock, chatId);
            }
        }
    }
}

// Helper function to format duration
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

module.exports = musicCommands;