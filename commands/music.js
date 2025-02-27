const config = require('../config');
const logger = require('pino')();
const ytdl = require('ytdl-core');
const yts = require('yt-search');
const fs = require('fs-extra');

// Store active music sessions
const musicSessions = new Map();

const musicCommands = {
    play: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a song name to play!\nUsage: ${config.prefix}play <song name or URL>`
                });
            }

            const query = args.join(' ');
            const searchResults = await yts(query);
            if (!searchResults.videos.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No videos found!'
                });
            }

            const video = searchResults.videos[0];
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎵 Found: ${video.title}\n⏱️ Duration: ${video.duration.timestamp}\n👁️ Views: ${video.views}\n▶️ Now playing...`
            });

            // Store session info
            musicSessions.set(msg.key.remoteJid, {
                playing: true,
                queue: [video, ...searchResults.videos.slice(1, 5)],
                current: 0
            });

        } catch (error) {
            logger.error('Error in play command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: 'Error playing music. Please try again later.'
            });
        }
    },

    queue: async (sock, msg) => {
        try {
            const session = musicSessions.get(msg.key.remoteJid);
            if (!session || !session.queue.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '📋 Queue is empty! Use !play to add songs.'
                });
            }

            let queueText = '🎵 *Music Queue*\n\n';
            session.queue.forEach((video, index) => {
                queueText += `${index === session.current ? '▶️' : '⏸️'} ${index + 1}. ${video.title} (${video.duration.timestamp})\n`;
            });

            await sock.sendMessage(msg.key.remoteJid, { text: queueText });
        } catch (error) {
            logger.error('Error in queue command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: 'Error displaying queue. Please try again later.'
            });
        }
    },

    skip: async (sock, msg) => {
        try {
            const session = musicSessions.get(msg.key.remoteJid);
            if (!session || !session.queue.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No music is playing!'
                });
            }

            session.current = (session.current + 1) % session.queue.length;
            const nextSong = session.queue[session.current];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `⏭️ Skipped! Now playing: ${nextSong.title}`
            });
        } catch (error) {
            logger.error('Error in skip command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: 'Error skipping song. Please try again later.'
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

            const query = args.join(' ');
            // TODO: Implement lyrics API integration
            await sock.sendMessage(msg.key.remoteJid, {
                text: `📝 Lyrics feature coming soon!\nRequested lyrics for: ${query}`
            });
        } catch (error) {
            logger.error('Error in lyrics command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: 'Error fetching lyrics. Please try again later.'
            });
        }
    },

    playlist: async (sock, msg, args) => {
        try {
            if (!args.length) {
                // Show available playlists
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '📋 Playlist management feature coming soon!'
                });
                return;
            }

            const [action, ...playlistArgs] = args;
            switch (action.toLowerCase()) {
                case 'create':
                    // TODO: Implement playlist creation
                    await sock.sendMessage(msg.key.remoteJid, {
                        text: '📝 Playlist creation coming soon!'
                    });
                    break;
                case 'add':
                    // TODO: Implement adding songs to playlist
                    await sock.sendMessage(msg.key.remoteJid, {
                        text: '➕ Adding songs to playlist coming soon!'
                    });
                    break;
                case 'remove':
                    // TODO: Implement removing songs from playlist
                    await sock.sendMessage(msg.key.remoteJid, {
                        text: '➖ Removing songs from playlist coming soon!'
                    });
                    break;
                default:
                    await sock.sendMessage(msg.key.remoteJid, {
                        text: `Invalid action! Use: ${config.prefix}playlist <create/add/remove>`
                    });
            }
        } catch (error) {
            logger.error('Error in playlist command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: 'Error managing playlist. Please try again later.'
            });
        }
    }
};

module.exports = musicCommands;