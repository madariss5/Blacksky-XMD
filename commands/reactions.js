const config = require('../config');
const logger = require('pino')();
const fs = require('fs-extra');
const path = require('path');
const { sendGifReaction } = require('../utils/mediaHandler');

const reactionCommands = {
    slap: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* slapped ${target}! 👋`,
                mentions: mentions
            });

            await sendGifReaction(sock, msg, './media/anime-slap.gif', '👋', mentions);
        } catch (error) {
            logger.error('Error in slap command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute slap command!'
            });
        }
    },

    hug: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* hugged ${target}! 🤗`,
                mentions: mentions
            });

            await sendGifReaction(sock, msg, './media/anime-hug.gif', '🤗', mentions);
        } catch (error) {
            logger.error('Error in hug command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute hug command!'
            });
        }
    },

    // Move all other reaction commands from fun.js
    pat: async (sock, msg, args) => {
        // Implementation from fun.js
    },
    kiss: async (sock, msg, args) => {
        // Implementation from fun.js
    },
    punch: async (sock, msg, args) => {
        // Implementation from fun.js
    },
    kill: async (sock, msg, args) => {
        // Implementation from fun.js
    },
    highfive: async (sock, msg, args) => {
        // Implementation from fun.js
    },
    facepalm: async (sock, msg, args) => {
        // Implementation from fun.js
    },
    poke: async (sock, msg, args) => {
        // Implementation from fun.js
    },
    cuddle: async (sock, msg, args) => {
        // Implementation from fun.js
    },
    yeet: async (sock, msg, args) => {
        // Implementation from fun.js
    },
    boop: async (sock, msg, args) => {
        // Implementation from fun.js
    },
    bonk: async (sock, msg, args) => {
        // Implementation from fun.js
    },
    wave: async (sock, msg, args) => {
        // Implementation from fun.js
    },
    wink: async (sock, msg, args) => {
        // Implementation from fun.js
    },
    wasted: async (sock, msg, args) => {
        // Implementation from fun.js
    }
};

module.exports = reactionCommands;
