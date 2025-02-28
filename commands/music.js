const config = require('../config');
const logger = require('pino')();
const ytdl = require('ytdl-core');
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

            // Enhanced search with better error handling
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

            // Enhanced format selection with retries
            let format;
            let videoId;
            let audioUrl;

            try {
                videoId = ytdl.getVideoID(video.url);
                logger.info('Extracted video ID:', videoId);

                const info = await ytdl.getInfo(videoId);
                logger.info('Retrieved video info successfully');

                format = ytdl.chooseFormat(info.formats, { 
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
                    // If head request fails, try to get a fresh URL
                    logger.info('Initial URL validation failed, getting fresh URL...', urlError.message);
                    const freshInfo = await ytdl.getInfo(videoId);
                    format = ytdl.chooseFormat(freshInfo.formats, {
                        quality: 'highestaudio',
                        filter: 'audioonly'
                    });
                    audioUrl = format.url;
                    logger.info('Successfully obtained fresh URL');
                }
            } catch (downloadError) {
                logger.error('Error getting video info:', downloadError);
                throw new Error('Failed to get audio source. Please try another song.');
            }

            // Store in session with comprehensive information
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

            logger.info('Added song to queue:', {
                title: video.title,
                videoId: videoId,
                position: session.queue.length - 1
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

// Helper function to play a song with improved error handling
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
            logger.info('Validating audio URL before playback...');
            const response = await axios.head(audioUrl);
            logger.info('URL validation response:', response.status);

            if (response.status === 404) {
                throw new Error('URL expired');
            }
            logger.info('URL validation successful');
        } catch (urlError) {
            logger.info('URL validation failed, attempting to refresh...', urlError.message);

            try {
                // Use videoId to refresh the URL
                logger.info('Attempting to refresh URL using videoId:', currentSong.videoId);
                const videoInfo = await ytdl.getInfo(currentSong.videoId);
                const format = ytdl.chooseFormat(videoInfo.formats, {
                    quality: 'highestaudio',
                    filter: 'audioonly'
                });

                if (!format) {
                    throw new Error('No suitable audio format found');
                }

                audioUrl = format.url;
                currentSong.audioUrl = audioUrl; // Update the URL in the queue
                logger.info('Successfully refreshed audio URL');
            } catch (refreshError) {
                logger.error('Failed to refresh URL:', refreshError);
                await sock.sendMessage(chatId, {
                    text: '⚠️ Audio source expired. Retrying with new URL...'
                });
                // Try one more time with the original video URL
                try {
                    logger.info('Attempting final URL refresh using original video URL');
                    const videoId = ytdl.getVideoID(currentSong.url);
                    const videoInfo = await ytdl.getInfo(videoId);
                    const format = ytdl.chooseFormat(videoInfo.formats, {
                        quality: 'highestaudio',
                        filter: 'audioonly'
                    });
                    audioUrl = format.url;
                    currentSong.audioUrl = audioUrl;
                    currentSong.videoId = videoId;
                    logger.info('Final URL refresh successful');
                } catch (finalError) {
                    logger.error('Final URL refresh attempt failed:', finalError);
                    throw new Error('Failed to refresh audio source. Skipping to next song...');
                }
            }
        }

        // Send the audio message with the validated/refreshed URL
        logger.info('Sending audio message with URL:', audioUrl);
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
            // Remove the problematic song and try to continue playback
            logger.info('Removing failed song from queue');
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
                await playSong(sock, chatId); // Try playing the next song
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