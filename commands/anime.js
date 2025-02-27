const config = require('../config');
const logger = require('pino')();
const axios = require('axios');

// Import anime modules - check if they exist first
const modules = {
    animeInfo: '../attached_assets/anime-info',
    animeCouplePP: '../attached_assets/anime-couplepp',
    animeHentai: '../attached_assets/anime-hentai',
    animeHNeko: '../attached_assets/anime-hneko',
    animeHWaifu: '../attached_assets/anime-hwaifu',
    animeNeko: '../attached_assets/anime-neko',
    animeTrap: '../attached_assets/anime-trap',
    animeWaifu: '../attached_assets/anime-waifu'
};

// Safely import modules
const safeRequire = (path) => {
    try {
        return require(path);
    } catch (error) {
        logger.warn(`Failed to load module ${path}: ${error.message}`);
        return {
            search: () => Promise.reject(new Error(`Module ${path} not available`)),
            getRandomImage: () => Promise.reject(new Error(`Module ${path} not available`)),
            getRandomCouple: () => Promise.reject(new Error(`Module ${path} not available`))
        };
    }
};

// Import modules safely
const {
    animeInfo,
    animeCouplePP,
    animeHentai,
    animeHNeko,
    animeHWaifu,
    animeNeko,
    animeTrap,
    animeWaifu
} = Object.entries(modules).reduce((acc, [key, path]) => {
    acc[key] = safeRequire(path);
    return acc;
}, {});

const animeCommands = {
    anime: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide an anime name!\nUsage: ${config.prefix}anime <name>`
                });
            }
            const info = await animeInfo.search(args.join(' '));
            await sock.sendMessage(msg.key.remoteJid, {
                text: info
            });
        } catch (error) {
            logger.error('Error in anime command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error searching anime: ' + error.message
            });
        }
    },

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

// Add store import
const store = require('../database/store');

module.exports = animeCommands;