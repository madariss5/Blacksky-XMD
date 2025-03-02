const config = require('../config');
const logger = require('../utils/logger');
const { sendGifReaction } = require('../utils/mediaHandler');

const reactionCommands = {
    slap: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];
            const caption = `*${msg.pushName}* slapped ${target}! 👋`;

            logger.info('Executing slap command:', { target, mentions });
            await sendGifReaction(sock, msg, 'slap.gif', caption, mentions);
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
            await sendGifReaction(sock, msg, 'hug.gif', caption, mentions);
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
            await sendGifReaction(sock, msg, 'pat.gif', caption, mentions);
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
            await sendGifReaction(sock, msg, 'kiss.gif', caption, mentions);
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
            await sendGifReaction(sock, msg, 'punch.gif', caption, mentions);
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
            await sendGifReaction(sock, msg, 'kill.gif', caption, mentions);
        } catch (error) {
            logger.error('Error in kill command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute kill command!'
            });
        }
    },

    roast: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];
            const caption = `*${msg.pushName}* roasted ${target}! 🔥`;

            logger.info('Executing roast command:', { target, mentions });
            await sendGifReaction(sock, msg, 'roast.gif', caption, mentions);
        } catch (error) {
            logger.error('Error in roast command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute roast command!'
            });
        }
    },

    wasted: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : msg.pushName;
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];
            const caption = `💀 *WASTED*\n${target} has been wasted!`;

            logger.info('Executing wasted command:', { target, mentions });
            await sendGifReaction(sock, msg, 'wasted.gif', caption, mentions);
        } catch (error) {
            logger.error('Error in wasted command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to execute wasted command!'
            });
        }
    }
};

module.exports = reactionCommands;