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

const musicCommands = {
    play: async (sock, msg, args) => {
        try {
            logger.info('Play command received:', { args });

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a song name or URL!\nUsage: ${config.prefix}play <song name>`
                });
            }

            // Search for video
            try {
                logger.info('Searching for:', args.join(' '));
                const video = (await yts({ query: args.join(' '), pages: 1 })).videos[0];
                if (!video) throw new Error('No videos found!');

                // Send initial message
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `🎵 Found: ${video.title}\nDuration: ${video.duration.timestamp}`
                });

                // Get audio URL
                const videoId = ytdl.getVideoID(video.url);
                const info = await ytdl.getInfo(videoId);
                const format = ytdl.filterFormats(info.formats, 'audioonly')[0];

                if (!format) {
                    throw new Error('No audio format available');
                }

                const audioUrl = format.url;

                // Update session
                const session = musicSessions.get(msg.key.remoteJid) || {
                    playing: false,
                    queue: [],
                    current: 0
                };

                session.queue.push({
                    title: video.title,
                    url: video.url,
                    videoId,
                    audioUrl,
                    duration: video.duration.seconds
                });

                logger.info('Added to queue:', { title: video.title });

                // Send audio
                await sock.sendMessage(msg.key.remoteJid, {
                    audio: { url: audioUrl },
                    mimetype: 'audio/mp4'
                });

                logger.info('Audio sent successfully');

            } catch (error) {
                logger.error('Error processing song:', error);
                throw new Error('Failed to process song. Please try another one.');
            }

        } catch (error) {
            logger.error('Error in play command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ ' + error.message
            });
        }
    },

    stop: async (sock, msg) => {
        try {
            logger.info('Stop command received');
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
                // queueText += `👤 Requested by: @${song.requestedBy.split('@')[0]}\n\n`; //removed as requestedBy is not defined
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: queueText
                // mentions: session.queue.map(song => song.requestedBy) //removed as requestedBy is not defined
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

// Helper function to play song
async function playSong(sock, chatId) {
    try {
        const session = musicSessions.get(chatId);
        if (!session?.queue.length || !session.playing) return;

        const currentSong = session.queue[session.current];

        try {
            // Try sending audio directly first
            await sock.sendMessage(chatId, {
                audio: { url: currentSong.audioUrl },
                mimetype: 'audio/mp4'
            });

        } catch (error) {
            // On failure, get fresh URL
            const info = await ytdl.getInfo(currentSong.videoId, ytOptions);
            const format = ytdl.filterFormats(info.formats, 'audioonly')[0];

            if (!format) throw new Error('No audio format available');

            currentSong.audioUrl = format.url;
            await sock.sendMessage(chatId, {
                audio: { url: currentSong.audioUrl },
                mimetype: 'audio/mp4'
            });
        }

    } catch (error) {
        logger.error('Error playing song:', error);
        const session = musicSessions.get(chatId);
        if (session) {
            session.queue.splice(session.current, 1);
            if (session.queue.length === 0) {
                session.playing = false;
            } else {
                if (session.current >= session.queue.length) {
                    session.current = 0;
                }
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