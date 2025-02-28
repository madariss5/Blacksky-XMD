const config = require('../config');
const logger = require('pino')();
const axios = require('axios');
const store = require('../database/store');

const animeCommands = {
    manga: async (sock, msg, args) => {
        try {
            logger.info('Starting manga search command', { args });

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a manga name!\nUsage: ${config.prefix}manga <name>`
                });
            }

            logger.debug('Making API request to Jikan', { query: args.join(' ') });
            const response = await axios.get(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(args.join(' '))}&limit=1`);
            const manga = response.data.data[0];

            if (!manga) {
                logger.info('No manga found for query', { query: args.join(' ') });
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No manga found with that name!'
                });
            }

            logger.debug('Manga data received', { title: manga.title });
            const text = `📚 *${manga.title}*\n\n` +
                        `📊 Rating: ${manga.score || 'N/A'}\n` +
                        `🎯 Type: ${manga.type || 'N/A'}\n` +
                        `📖 Chapters: ${manga.chapters || 'Ongoing'}\n` +
                        `📚 Volumes: ${manga.volumes || 'N/A'}\n` +
                        `📺 Status: ${manga.status || 'N/A'}\n\n` +
                        `📝 Synopsis:\n${manga.synopsis || 'No synopsis available.'}\n\n` +
                        `🔗 More info: ${manga.url}`;

            if (manga.images?.jpg?.image_url) {
                logger.debug('Sending manga info with image');
                await sock.sendMessage(msg.key.remoteJid, {
                    image: { url: manga.images.jpg.image_url },
                    caption: text
                });
            } else {
                logger.debug('Sending manga info without image');
                await sock.sendMessage(msg.key.remoteJid, { text });
            }
            logger.info('Manga command completed successfully');
        } catch (error) {
            logger.error('Error in manga command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error searching manga: ' + error.message
            });
        }
    },

    character: async (sock, msg, args) => {
        try {
            logger.info('Starting character search command', { args });

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a character name!\nUsage: ${config.prefix}character <name>`
                });
            }

            logger.debug('Making API request to Jikan', { query: args.join(' ') });
            const response = await axios.get(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(args.join(' '))}&limit=1`);
            const character = response.data.data[0];

            if (!character) {
                logger.info('No character found for query', { query: args.join(' ') });
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No character found with that name!'
                });
            }

            logger.debug('Character data received', { name: character.name });
            const text = `👤 *${character.name}*\n\n` +
                        `✨ Nicknames: ${character.nicknames.join(', ') || 'N/A'}\n` +
                        `📝 About:\n${character.about || 'No information available.'}\n\n` +
                        `🔗 More info: ${character.url}`;

            if (character.images?.jpg?.image_url) {
                logger.debug('Sending character info with image');
                await sock.sendMessage(msg.key.remoteJid, {
                    image: { url: character.images.jpg.image_url },
                    caption: text
                });
            } else {
                logger.debug('Sending character info without image');
                await sock.sendMessage(msg.key.remoteJid, { text });
            }
            logger.info('Character command completed successfully');
        } catch (error) {
            logger.error('Error in character command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error searching character: ' + error.message
            });
        }
    },

    schedule: async (sock, msg, args) => {
        try {
            logger.info('Starting schedule command');

            const day = args[0]?.toLowerCase() || new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
            const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

            if (!validDays.includes(day)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please specify a valid day!\nUsage: !schedule [day]'
                });
            }

            logger.debug('Making API request to Jikan', { day });
            const response = await axios.get(`https://api.jikan.moe/v4/schedules?filter=${day}`);
            const schedule = response.data.data;

            if (!schedule.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `📺 No anime scheduled for ${day.charAt(0).toUpperCase() + day.slice(1)}!`
                });
            }

            const scheduleText = schedule.slice(0, 10).map(anime => 
                `📺 *${anime.title}*\n⏰ ${anime.broadcast?.time || 'Time TBA'}\n`
            ).join('\n');

            await sock.sendMessage(msg.key.remoteJid, {
                text: `📅 *Anime Schedule - ${day.charAt(0).toUpperCase() + day.slice(1)}*\n\n${scheduleText}`
            });

            logger.info('Schedule command completed successfully');
        } catch (error) {
            logger.error('Error in schedule command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching schedule: ' + error.message
            });
        }
    },

    airing: async (sock, msg) => {
        try {
            logger.info('Starting airing command');

            logger.debug('Making API request to Jikan');
            const response = await axios.get('https://api.jikan.moe/v4/seasons/now?limit=10');
            const airing = response.data.data;

            if (!airing.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No currently airing anime found!'
                });
            }

            const airingText = airing.map(anime => 
                `📺 *${anime.title}*\n` +
                `⭐ Rating: ${anime.score || 'N/A'}\n` +
                `🎯 Episodes: ${anime.episodes || 'Ongoing'}\n`
            ).join('\n');

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎬 *Currently Airing Anime*\n\n${airingText}`
            });

            logger.info('Airing command completed successfully');
        } catch (error) {
            logger.error('Error in airing command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching airing anime: ' + error.message
            });
        }
    },

    upcoming: async (sock, msg) => {
        try {
            logger.info('Starting upcoming command');

            logger.debug('Making API request to Jikan');
            const response = await axios.get('https://api.jikan.moe/v4/seasons/upcoming?limit=10');
            const upcoming = response.data.data;

            if (!upcoming.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No upcoming anime found!'
                });
            }

            const upcomingText = upcoming.map(anime => 
                `📺 *${anime.title}*\n` +
                `📅 Season: ${anime.season || 'TBA'} ${anime.year || ''}\n` +
                `🎯 Type: ${anime.type || 'N/A'}\n`
            ).join('\n');

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🔜 *Upcoming Anime*\n\n${upcomingText}`
            });

            logger.info('Upcoming command completed successfully');
        } catch (error) {
            logger.error('Error in upcoming command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching upcoming anime: ' + error.message
            });
        }
    },

    recommended: async (sock, msg) => {
        try {
            logger.info('Starting recommended command');

            logger.debug('Making API request to Jikan');
            const response = await axios.get('https://api.jikan.moe/v4/recommendations/anime?page=1');
            const recommendations = response.data.data;

            if (!recommendations.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No recommendations found!'
                });
            }

            // Get first entry's recommendations
            const entry = recommendations[0];
            const recsText = entry.entry.map(anime => 
                `📺 *${anime.title}*\n` +
                `🔗 ${anime.url}\n`
            ).join('\n');

            await sock.sendMessage(msg.key.remoteJid, {
                text: `👍 *Anime Recommendations*\n\n${recsText}`
            });

            logger.info('Recommended command completed successfully');
        } catch (error) {
            logger.error('Error in recommended command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching recommendations: ' + error.message
            });
        }
    },

    genre: async (sock, msg, args) => {
        try {
            logger.info('Starting genre command', { args });

            // First get genres list if no args
            if (!args.length) {
                const response = await axios.get('https://api.jikan.moe/v4/genres/anime');
                const genres = response.data.data;
                const genresList = genres.map(g => `${g.mal_id}. ${g.name}`).join('\n');
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `🎭 *Available Genres*\n\nUse !genre <id> to see anime in that genre\n\n${genresList}`
                });
            }

            // Get anime by genre ID
            const genreId = parseInt(args[0]);
            if (isNaN(genreId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a valid genre ID!'
                });
            }

            logger.debug('Making API request to Jikan', { genreId });
            const response = await axios.get(`https://api.jikan.moe/v4/anime?genres=${genreId}&order_by=score&sort=desc&limit=10`);
            const animeList = response.data.data;

            if (!animeList.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No anime found for this genre!'
                });
            }

            const text = animeList.map(anime => 
                `📺 *${anime.title}*\n` +
                `⭐ Rating: ${anime.score || 'N/A'}\n`
            ).join('\n');

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎭 *Top Anime in Selected Genre*\n\n${text}`
            });

            logger.info('Genre command completed successfully');
        } catch (error) {
            logger.error('Error in genre command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching genre: ' + error.message
            });
        }
    },

    studio: async (sock, msg, args) => {
        try {
            logger.info('Starting studio command', { args });

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a studio name!\nUsage: ${config.prefix}studio <name>`
                });
            }

            logger.debug('Making API request to Jikan', { query: args.join(' ') });
            const response = await axios.get(`https://api.jikan.moe/v4/producers?q=${encodeURIComponent(args.join(' '))}&limit=1`);
            const studio = response.data.data[0];

            if (!studio) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Studio not found!'
                });
            }

            // Get anime by this studio
            const animeResponse = await axios.get(`https://api.jikan.moe/v4/anime?producers=${studio.mal_id}&order_by=score&sort=desc&limit=10`);
            const animeList = animeResponse.data.data;

            const text = `🎬 *${studio.titles[0].title}*\n\n` +
                        `Top anime from this studio:\n\n` +
                        animeList.map(anime => 
                            `📺 *${anime.title}*\n` +
                            `⭐ Rating: ${anime.score || 'N/A'}\n`
                        ).join('\n');

            await sock.sendMessage(msg.key.remoteJid, { text });
            logger.info('Studio command completed successfully');
        } catch (error) {
            logger.error('Error in studio command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error searching studio: ' + error.message
            });
        }
    },

    seasonal: async (sock, msg, args) => {
        try {
            logger.info('Starting seasonal command');

            const year = args[0] || new Date().getFullYear();
            const season = args[1]?.toLowerCase() || (() => {
                const month = new Date().getMonth();
                if (month < 3) return 'winter';
                if (month < 6) return 'spring';
                if (month < 9) return 'summer';
                return 'fall';
            })();

            if (!['winter', 'spring', 'summer', 'fall'].includes(season)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Invalid season! Use: winter, spring, summer, or fall'
                });
            }

            logger.debug('Making API request to Jikan', { year, season });
            const response = await axios.get(`https://api.jikan.moe/v4/seasons/${year}/${season}?limit=10`);
            const animeList = response.data.data;

            if (!animeList.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No anime found for this season!'
                });
            }

            const text = `🗓️ *${season.charAt(0).toUpperCase() + season.slice(1)} ${year} Anime*\n\n` +
                        animeList.map(anime => 
                            `📺 *${anime.title}*\n` +
                            `⭐ Rating: ${anime.score || 'N/A'}\n` +
                            `📅 Status: ${anime.status}\n`
                        ).join('\n');

            await sock.sendMessage(msg.key.remoteJid, { text });
            logger.info('Seasonal command completed successfully');
        } catch (error) {
            logger.error('Error in seasonal command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching seasonal anime: ' + error.message
            });
        }
    },

    top: async (sock, msg, args) => {
        try {
            logger.info('Starting top command');

            const type = args[0]?.toLowerCase() || 'anime';
            if (!['anime', 'manga'].includes(type)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please specify either anime or manga!\nUsage: !top <anime/manga>'
                });
            }

            logger.debug('Making API request to Jikan', { type });
            const response = await axios.get(`https://api.jikan.moe/v4/top/${type}?limit=10`);
            const items = response.data.data;

            const text = `🏆 *Top ${type.charAt(0).toUpperCase() + type.slice(1)}*\n\n` +
                        items.map((item, index) => 
                            `${index + 1}. *${item.title}*\n` +
                            `⭐ Rating: ${item.score || 'N/A'}\n`
                        ).join('\n');

            await sock.sendMessage(msg.key.remoteJid, { text });
            logger.info('Top command completed successfully');
        } catch (error) {
            logger.error('Error in top command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching top list: ' + error.message
            });
        }
    },

    trending: async (sock, msg, args) => {
        try {
            logger.info('Starting trending command');

            const type = args[0]?.toLowerCase() || 'anime';
            if (!['anime', 'manga'].includes(type)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please specify either anime or manga!\nUsage: !trending <anime/manga>'
                });
            }

            logger.debug('Making API request to Jikan', { type });
            const response = await axios.get(`https://api.jikan.moe/v4/${type}?order_by=popularity&sort=asc&limit=10`);
            const items = response.data.data;

            const text = `📈 *Trending ${type.charAt(0).toUpperCase() + type.slice(1)}*\n\n` +
                        items.map((item, index) => 
                            `${index + 1}. *${item.title}*\n` +
                            `👥 Members: ${item.members || 'N/A'}\n` +
                            `⭐ Rating: ${item.score || 'N/A'}\n`
                        ).join('\n');

            await sock.sendMessage(msg.key.remoteJid, { text });
            logger.info('Trending command completed successfully');
        } catch (error) {
            logger.error('Error in trending command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching trending list: ' + error.message
            });
        }
    },
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
    },
    wallpaper: async (sock, msg) => {
        try {
            logger.info('Starting wallpaper command');

            const response = await axios.get('https://api.pexels.com/v1/search', {
                headers: {
                    'Authorization': process.env.PEXELS_API_KEY
                },
                params: {
                    query: 'anime wallpaper',
                    per_page: 1,
                    page: Math.floor(Math.random() * 10) + 1
                }
            });

            if (!response.data?.photos?.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No wallpapers found!'
                });
            }

            const photo = response.data.photos[0];
            logger.debug('Sending wallpaper', { url: photo.src.original });

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: photo.src.large2x },
                caption: `🎨 Anime Wallpaper\n📸 By: ${photo.photographer}`
            });

            logger.info('Wallpaper command completed successfully');
        } catch (error) {
            logger.error('Error in wallpaper command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching wallpaper: ' + error.message
            });
        }
    },

    cosplay: async (sock, msg) => {
        try {
            logger.info('Starting cosplay command');

            const response = await axios.get('https://api.pexels.com/v1/search', {
                headers: {
                    'Authorization': process.env.PEXELS_API_KEY
                },
                params: {
                    query: 'anime cosplay',
                    per_page: 1,
                    page: Math.floor(Math.random() * 10) + 1
                }
            });

            if (!response.data?.photos?.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No cosplay images found!'
                });
            }

            const photo = response.data.photos[0];
            logger.debug('Sending cosplay image', { url: photo.src.original });

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: photo.src.large2x },
                caption: `👗 Anime Cosplay\n📸 By: ${photo.photographer}`
            });

            logger.info('Cosplay command completed successfully');
        } catch (error) {
            logger.error('Error in cosplay command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching cosplay image: ' + error.message
            });
        }
    },

    fanart: async (sock, msg) => {
        try {
            logger.info('Starting fanart command');

            const response = await axios.get('https://api.pexels.com/v1/search', {
                headers: {
                    'Authorization': process.env.PEXELS_API_KEY
                },
                params: {
                    query: 'anime fanart',
                    per_page: 1,
                    page: Math.floor(Math.random() * 10) + 1
                }
            });

            if (!response.data?.photos?.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No fanart images found!'
                });
            }

            const photo = response.data.photos[0];
            logger.debug('Sending fanart image', { url: photo.src.original });

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: photo.src.large2x },
                caption: `🎨 Anime Fanart\n📸 By: ${photo.photographer}`
            });

            logger.info('Fanart command completed successfully');
        } catch (error) {
            logger.error('Error in fanart command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching fanart: ' + error.message
            });
        }
    }
};

module.exports = animeCommands;