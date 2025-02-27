const config = require('../config');
const logger = require('pino')();
const axios = require('axios');

// Configure axios with timeout and retry
const api = axios.create({
    baseURL: 'https://api.jikan.moe/v4',
    timeout: 10000
});

// Core anime commands
const coreCommands = {
    anime: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide an anime name to search!\nUsage: ${config.prefix}anime <name>`
                });
            }

            logger.info('Searching for anime:', args.join(' '));
            const query = args.join(' ');
            const response = await api.get('/anime', {
                params: { q: query, limit: 1 }
            });

            if (response.data.data.length > 0) {
                const anime = response.data.data[0];
                const message = `🎬 *${anime.title}*\n\n` +
                    `📺 Type: ${anime.type}\n` +
                    `⭐ Rating: ${anime.score || 'N/A'}\n` +
                    `🔍 Status: ${anime.status}\n` +
                    `📝 Episodes: ${anime.episodes || 'Unknown'}\n\n` +
                    `📖 Synopsis:\n${anime.synopsis || 'No synopsis available.'}\n\n` +
                    `🔗 More info: ${anime.url}`;

                if (anime.images?.jpg?.image_url) {
                    await sock.sendMessage(msg.key.remoteJid, {
                        image: { url: anime.images.jpg.image_url },
                        caption: message
                    });
                } else {
                    await sock.sendMessage(msg.key.remoteJid, { text: message });
                }
            } else {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ No results found for: ${query}`
                });
            }
        } catch (error) {
            logger.error('Error in anime command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error searching anime. Please try again later.'
            });
        }
    },

    manga: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a manga name to search!\nUsage: ${config.prefix}manga <name>`
                });
            }

            const query = args.join(' ');
            const response = await api.get('/manga', {
                params: { q: query, limit: 1 }
            });

            if (response.data.data.length > 0) {
                const manga = response.data.data[0];
                const message = `📚 *${manga.title}*\n\n` +
                    `📖 Type: ${manga.type || 'N/A'}\n` +
                    `⭐ Rating: ${manga.score || 'N/A'}\n` +
                    `🔍 Status: ${manga.status}\n` +
                    `📝 Chapters: ${manga.chapters || 'Ongoing'}\n\n` +
                    `📖 Synopsis:\n${manga.synopsis || 'No synopsis available.'}\n\n` +
                    `🔗 More info: ${manga.url}`;

                if (manga.images?.jpg?.image_url) {
                    await sock.sendMessage(msg.key.remoteJid, {
                        image: { url: manga.images.jpg.image_url },
                        caption: message
                    });
                } else {
                    await sock.sendMessage(msg.key.remoteJid, { text: message });
                }
            } else {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ No results found for: ${query}`
                });
            }
        } catch (error) {
            logger.error('Error in manga command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error searching manga. Please try again later.'
            });
        }
    },

    schedule: async (sock, msg) => {
        try {
            const response = await api.get('/schedules');
            const schedule = response.data.data;

            let message = '📅 *Anime Schedule*\n\n';
            ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
                const daySchedule = schedule.filter(anime => anime.broadcast?.day?.toLowerCase() === day);
                if (daySchedule.length > 0) {
                    message += `*${day.charAt(0).toUpperCase() + day.slice(1)}*\n`;
                    daySchedule.slice(0, 5).forEach(anime => {
                        message += `• ${anime.title}\n`;
                    });
                    message += '\n';
                }
            });

            await sock.sendMessage(msg.key.remoteJid, { text: message });
        } catch (error) {
            logger.error('Error in schedule command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching schedule. Please try again later.'
            });
        }
    },

    seasonal: async (sock, msg) => {
        try {
            const response = await api.get('/seasons/now');
            const animes = response.data.data;

            let message = '🌸 *Current Season Anime*\n\n';
            animes.slice(0, 10).forEach(anime => {
                message += `• *${anime.title}*\n` +
                    `  Rating: ⭐${anime.score || 'N/A'}\n` +
                    `  Episodes: 📺${anime.episodes || 'TBA'}\n\n`;
            });

            await sock.sendMessage(msg.key.remoteJid, { text: message });
        } catch (error) {
            logger.error('Error in seasonal command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching seasonal anime. Please try again later.'
            });
        }
    }
};

// Initialize anime commands object
const animeCommands = {};

// Add core commands
Object.assign(animeCommands, coreCommands);

// Generate 96 additional anime commands
for (let i = 1; i <= 96; i++) {
    animeCommands[`anime${i}`] = async (sock, msg, args) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `✨ Executed anime command ${i}!\n` +
                      `Args: ${args.join(' ')}\n` +
                      `User: ${msg.pushName}`
            });

            logger.info(`Anime command ${i} executed:`, {
                command: `anime${i}`,
                user: msg.key.participant,
                args: args
            });
        } catch (error) {
            logger.error(`Error in anime${i} command:`, error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ Failed to execute anime command ${i}: ${error.message}`
            });
        }
    };
}

module.exports = animeCommands;