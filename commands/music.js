const config = require('../config');
const logger = require('pino')();
const ytdl = require('ytdl-core');
const yts = require('yt-search');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios'); // Added axios import

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

            const searchResults = await yts(query);
            if (!searchResults.videos.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No videos found!'
                });
            }

            const video = searchResults.videos[0];
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎵 *Now Playing*\n\nTitle: ${video.title}\nDuration: ${video.duration.timestamp}\nViews: ${video.views}\n\n⏳ Downloading...`
            });

            // Get downloadable URL with better error handling
            let format;
            try {
                const info = await ytdl.getInfo(video.url);
                format = ytdl.chooseFormat(info.formats, { 
                    quality: 'highestaudio',
                    filter: 'audioonly'
                });

                if (!format) {
                    throw new Error('No suitable audio format found');
                }
            } catch (downloadError) {
                logger.error('Error getting video info:', downloadError);
                throw new Error('Failed to get audio source. Please try another song.');
            }

            // Store in session
            const session = musicSessions.get(msg.key.remoteJid) || {
                playing: false,
                queue: [],
                current: 0
            };

            session.queue.push({
                title: video.title,
                url: format.url,
                duration: video.duration.seconds,
                thumbnail: video.thumbnail,
                requestedBy: msg.key.participant
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

        // Verify URL is still valid before sending
        try {
            await axios.head(currentSong.url);
        } catch (urlError) {
            logger.error('URL no longer valid, attempting to refresh...');

            // Try to refresh the URL
            try {
                const newInfo = await ytdl.getInfo(currentSong.url); //Fixed to use currentSong.url, assuming videoId is not available in original data structure.
                const newFormat = ytdl.chooseFormat(newInfo.formats, { 
                    quality: 'highestaudio',
                    filter: 'audioonly'
                });
                currentSong.url = newFormat.url;
            } catch (refreshError) {
                throw new Error('Song URL expired. Please try playing the song again.');
            }
        }

        await sock.sendMessage(chatId, {
            audio: { url: currentSong.url },
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
    } catch (error) {
        logger.error('Error playing song:', error);

        // Remove the problematic song from queue
        const session = musicSessions.get(chatId);
        if (session) {
            session.queue.splice(session.current, 1);
            if (session.queue.length === 0) {
                session.playing = false;
            } else if (session.current >= session.queue.length) {
                session.current = 0;
            }
            musicSessions.set(chatId, session);
        }

        await sock.sendMessage(chatId, {
            text: '❌ ' + (error.message || 'Error playing current song. Skipping to next song...')
        });

        // Try to play next song if available
        if (session?.queue.length > 0) {
            await playSong(sock, chatId);
        }
    }
}

// Helper function to format duration remains unchanged
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

module.exports = musicCommands;