const config = require('../config');
const logger = require('pino')();
const axios = require('axios');

// Import anime modules
const animeInfo = require('../attached_assets/anime-info');
const animeCouplePP = require('../attached_assets/anime-couplepp');
const animeHentai = require('../attached_assets/anime-hentai');
const animeHNeko = require('../attached_assets/anime-hneko');
const animeHWaifu = require('../attached_assets/anime-hwaifu');
const animeNeko = require('../attached_assets/anime-neko');
const animeTrap = require('../attached_assets/anime-trap');
const animeWaifu = require('../attached_assets/anime-waifu');

// Assuming store is defined elsewhere and exported.  This is a crucial missing piece from the edited snippet.
const store = require('../store'); // Or wherever your store object is located


// Core anime commands
const animeCommands = {
    // Keep existing commands (anime, manga, seasonal, schedule)
    ...require('./anime').coreCommands,

    // Add new commands
    couplepp: async (sock, msg) => {
        try {
            const images = await animeCouplePP.getRandomCouple();
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: images.male },
                caption: '👨 Male'
            });
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: images.female },
                caption: '👩 Female'
            });
        } catch (error) {
            logger.error('Error in couplepp command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error getting couple pictures: ' + error.message
            });
        }
    },

    hentai: async (sock, msg) => {
        try {
            // Check if chat is NSFW enabled
            const isNSFW = await store.isNSFWEnabled(msg.key.remoteJid);
            if (!isNSFW) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '🔞 This command can only be used in NSFW-enabled chats!'
                });
            }

            const image = await animeHentai.getRandomImage();
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: image },
                caption: '🔞 NSFW content'
            });
        } catch (error) {
            logger.error('Error in hentai command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching content: ' + error.message
            });
        }
    },

    hneko: async (sock, msg) => {
        try {
            const isNSFW = await store.isNSFWEnabled(msg.key.remoteJid);
            if (!isNSFW) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '🔞 This command can only be used in NSFW-enabled chats!'
                });
            }

            const image = await animeHNeko.getRandomImage();
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: image },
                caption: '🔞 NSFW Neko'
            });
        } catch (error) {
            logger.error('Error in hneko command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching content: ' + error.message
            });
        }
    },

    hwaifu: async (sock, msg) => {
        try {
            const isNSFW = await store.isNSFWEnabled(msg.key.remoteJid);
            if (!isNSFW) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '🔞 This command can only be used in NSFW-enabled chats!'
                });
            }

            const image = await animeHWaifu.getRandomImage();
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: image },
                caption: '🔞 NSFW Waifu'
            });
        } catch (error) {
            logger.error('Error in hwaifu command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching content: ' + error.message
            });
        }
    },

    neko: async (sock, msg) => {
        try {
            const image = await animeNeko.getRandomImage();
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: image },
                caption: '😺 Random Neko'
            });
        } catch (error) {
            logger.error('Error in neko command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching neko image: ' + error.message
            });
        }
    },

    trap: async (sock, msg) => {
        try {
            const image = await animeTrap.getRandomImage();
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: image },
                caption: '🎭 Random Trap'
            });
        } catch (error) {
            logger.error('Error in trap command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching trap image: ' + error.message
            });
        }
    },

    waifu: async (sock, msg) => {
        try {
            const image = await animeWaifu.getRandomImage();
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: image },
                caption: '👘 Random Waifu'
            });
        } catch (error) {
            logger.error('Error in waifu command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error fetching waifu image: ' + error.message
            });
        }
    }
};

module.exports = animeCommands;