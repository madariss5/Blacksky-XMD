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

    pat: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* patted ${target}! 🥰`,
                mentions: mentions
            });

            await sendGifReaction(sock, msg, './media/anime-pat.gif', '🥰', mentions);
        } catch (error) {
            logger.error('Error in pat command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute pat command!'
            });
        }
    },

    kiss: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* kissed ${target}! 💋`,
                mentions: mentions
            });

            await sendGifReaction(sock, msg, './media/anime-kiss.gif', '💋', mentions);
        } catch (error) {
            logger.error('Error in kiss command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute kiss command!'
            });
        }
    },

    punch: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* punched ${target}! 👊`,
                mentions: mentions
            });

            await sendGifReaction(sock, msg, './media/anime-punch.gif', '👊', mentions);
        } catch (error) {
            logger.error('Error in punch command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute punch command!'
            });
        }
    },

    kill: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* eliminated ${target}! ☠️`,
                mentions: mentions
            });

            await sendGifReaction(sock, msg, './media/anime-kill.gif', '☠️', mentions);
        } catch (error) {
            logger.error('Error in kill command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute kill command!'
            });
        }
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
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* wasted ${target}! 💀`,
                mentions: mentions
            });

            await sendGifReaction(sock, msg, './media/anime-wasted.gif', '💀', mentions);
        } catch (error) {
            logger.error('Error in wasted command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute wasted command!'
            });
        }
    }
};

module.exports = reactionCommands;