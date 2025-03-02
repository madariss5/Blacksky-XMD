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
            await sendGifReaction(sock, msg, 'anime-slap', caption, mentions);
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
            await sendGifReaction(sock, msg, 'anime-hug', caption, mentions);
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
            await sendGifReaction(sock, msg, 'anime-pat', caption, mentions);
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
            await sendGifReaction(sock, msg, 'anime-kiss', caption, mentions);
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
            await sendGifReaction(sock, msg, 'anime-punch', caption, mentions);
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
            await sendGifReaction(sock, msg, 'anime-kill', caption, mentions);
        } catch (error) {
            logger.error('Error in kill command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute kill command!'
            });
        }
    },

    wasted: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : msg.pushName;
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];
            const caption = `💀 *WASTED*\n${target} has been wasted!`;

            logger.info('Executing wasted command:', { target, mentions });
            await sendGifReaction(sock, msg, 'anime-wasted', caption, mentions);
        } catch (error) {
            logger.error('Error in wasted command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to execute wasted command!'
            });
        }
    }
};

module.exports = reactionCommands;