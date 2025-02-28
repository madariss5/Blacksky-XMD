const config = require('../config');
const logger = require('pino')();
const axios = require('axios');
const store = require('../database/store');

const animeCommands = {
    anime: async (sock, msg, args) => {
        try {
            logger.info('Starting anime search command', { args });

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide an anime name!\nUsage: ${config.prefix}anime <name>`
                });
            }

            logger.debug('Making API request to Jikan', { query: args.join(' ') });
            const response = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(args.join(' '))}&limit=1`);
            const anime = response.data.data[0];

            if (!anime) {
                logger.info('No anime found for query', { query: args.join(' ') });
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No anime found with that name!'
                });
            }

            logger.debug('Anime data received', { title: anime.title });
            const text = `🎬 *${anime.title}*\n\n` +
                        `📊 Rating: ${anime.score || 'N/A'}\n` +
                        `🎯 Type: ${anime.type || 'N/A'}\n` +
                        `📅 Episodes: ${anime.episodes || 'N/A'}\n` +
                        `📺 Status: ${anime.status || 'N/A'}\n\n` +
                        `📝 Synopsis:\n${anime.synopsis || 'No synopsis available.'}\n\n` +
                        `🔗 More info: ${anime.url}`;

            if (anime.images?.jpg?.image_url) {
                logger.debug('Sending anime info with image');
                await sock.sendMessage(msg.key.remoteJid, {
                    image: { url: anime.images.jpg.image_url },
                    caption: text
                });
            } else {
                logger.debug('Sending anime info without image');
                await sock.sendMessage(msg.key.remoteJid, { text });
            }
            logger.info('Anime command completed successfully');
        } catch (error) {
            logger.error('Error in anime command:', {
                error: error.message,
                stack: error.stack,
                response: error.response?.data,
                status: error.response?.status
            });
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error searching anime: ' + error.message
            });
        }
    },

    waifu: async (sock, msg) => {
        try {
            logger.info('Starting waifu command');
            logger.debug('Making API request to waifu.pics');
            const response = await axios.get('https://api.waifu.pics/sfw/waifu');

            logger.debug('Sending waifu image', { url: response.data.url });
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: response.data.url },
                caption: '👘 Random Waifu'
            });
            logger.info('Waifu command completed successfully');
        } catch (error) {
            logger.error('Error in waifu command:', {
                error: error.message,
                stack: error.stack,
                response: error.response?.data,
                status: error.response?.status
            });
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching waifu image: ' + error.message
            });
        }
    },

    neko: async (sock, msg) => {
        try {
            logger.info('Starting neko command');
            logger.debug('Making API request to waifu.pics');
            const response = await axios.get('https://api.waifu.pics/sfw/neko');

            logger.debug('Sending neko image', { url: response.data.url });
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: response.data.url },
                caption: '😺 Random Neko'
            });
            logger.info('Neko command completed successfully');
        } catch (error) {
            logger.error('Error in neko command:', {
                error: error.message,
                stack: error.stack,
                response: error.response?.data,
                status: error.response?.status
            });
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching neko image: ' + error.message
            });
        }
    },

    hentai: async (sock, msg) => {
        try {
            logger.info('Starting hentai command');
            const isNSFW = await store.isNSFWEnabled(msg.key.remoteJid);
            if (!isNSFW) {
                logger.info('NSFW not enabled for chat');
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '🔞 This command can only be used in NSFW-enabled chats!'
                });
            }

            logger.debug('Making API request to waifu.pics NSFW endpoint');
            const response = await axios.get('https://api.waifu.pics/nsfw/waifu');

            logger.debug('Sending NSFW image');
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: response.data.url },
                caption: '🔞 NSFW content'
            });
            logger.info('Hentai command completed successfully');
        } catch (error) {
            logger.error('Error in hentai command:', {
                error: error.message,
                stack: error.stack,
                response: error.response?.data,
                status: error.response?.status
            });
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching content: ' + error.message
            });
        }
    },

    couplepp: async (sock, msg) => {
        try {
            logger.info('Starting couplepp command');
            logger.debug('Making API requests to waifu.pics');
            const responses = await Promise.all([
                axios.get('https://api.waifu.pics/sfw/shinobu'),
                axios.get('https://api.waifu.pics/sfw/shinobu')
            ]);

            logger.debug('Sending male image', { url: responses[0].data.url });
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: responses[0].data.url },
                caption: '👨 Male'
            });

            logger.debug('Sending female image', { url: responses[1].data.url });
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: responses[1].data.url },
                caption: '👩 Female'
            });
            logger.info('Couplepp command completed successfully');
        } catch (error) {
            logger.error('Error in couplepp command:', {
                error: error.message,
                stack: error.stack,
                response: error.response?.data,
                status: error.response?.status
            });
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error getting couple pictures: ' + error.message
            });
        }
    }
};

module.exports = animeCommands;