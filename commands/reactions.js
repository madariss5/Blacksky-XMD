const config = require('../config');
const logger = require('pino')();
const { sendGifReaction } = require('../utils/mediaHandler');

const reactionCommands = {
    slap: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];
            const caption = `*${msg.pushName}* slapped ${target}! 👋`;

            logger.info('Executing slap command:', { target, mentions });
            await sendGifReaction(sock, msg, 'slap', caption, mentions);
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
            const caption = `*${msg.pushName}* hugged ${target}! 🤗`;

            logger.info('Executing hug command:', { target, mentions });
            await sendGifReaction(sock, msg, 'hug', caption, mentions);
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
            const caption = `*${msg.pushName}* patted ${target}! 🥰`;

            logger.info('Executing pat command:', { target, mentions });
            await sendGifReaction(sock, msg, 'pat', caption, mentions);
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
            const caption = `*${msg.pushName}* kissed ${target}! 💋`;

            logger.info('Executing kiss command:', { target, mentions });
            await sendGifReaction(sock, msg, 'kiss', caption, mentions);
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
            const caption = `*${msg.pushName}* punched ${target}! 👊`;

            logger.info('Executing punch command:', { target, mentions });
            await sendGifReaction(sock, msg, 'punch', caption, mentions);
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
            const caption = `*${msg.pushName}* eliminated ${target}! ☠️`;

            logger.info('Executing kill command:', { target, mentions });
            await sendGifReaction(sock, msg, 'kill', caption, mentions);
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
            const target = args[0] ? `@${args[0].replace('@', '')}` : msg.pushName;
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];
            const caption = `💀 *WASTED*\n${target} has been wasted!`;

            logger.info('Executing wasted command:', { target, mentions });
            await sendGifReaction(sock, msg, 'wasted', caption, mentions);
        } catch (error) {
            logger.error('Error in wasted command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to execute wasted command!'
            });
        }
    }
};

module.exports = reactionCommands;