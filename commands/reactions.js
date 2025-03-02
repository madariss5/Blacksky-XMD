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

    dance: async (sock, msg) => {
        try {
            const caption = `*${msg.pushName}* is dancing! 💃`;
            logger.info('Executing dance command');
            await sendGifReaction(sock, msg, 'anime-dance.gif', caption);
        } catch (error) {
            logger.error('Error in dance command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute dance command!'
            });
        }
    },

    highfive: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];
            const caption = `*${msg.pushName}* high-fived ${target}! 🙌`;

            logger.info('Executing highfive command:', { target, mentions });
            await sendGifReaction(sock, msg, 'anime-highfive.gif', caption, mentions);
        } catch (error) {
            logger.error('Error in highfive command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute highfive command!'
            });
        }
    },

    facepalm: async (sock, msg) => {
        try {
            const caption = `*${msg.pushName}* facepalmed! 🤦‍♂️`;
            logger.info('Executing facepalm command');
            await sendGifReaction(sock, msg, 'anime-facepalm.gif', caption);
        } catch (error) {
            logger.error('Error in facepalm command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute facepalm command!'
            });
        }
    },

    poke: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];
            const caption = `*${msg.pushName}* poked ${target}! 👉`;

            logger.info('Executing poke command:', { target, mentions });
            await sendGifReaction(sock, msg, 'anime-poke.gif', caption, mentions);
        } catch (error) {
            logger.error('Error in poke command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute poke command!'
            });
        }
    },

    cuddle: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];
            const caption = `*${msg.pushName}* cuddles ${target}! 🤗`;

            logger.info('Executing cuddle command:', { target, mentions });
            await sendGifReaction(sock, msg, 'anime-cuddle.gif', caption, mentions);
        } catch (error) {
            logger.error('Error in cuddle command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute cuddle command!'
            });
        }
    },

    wink: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'everyone';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];
            const caption = `*${msg.pushName}* winks at ${target}! 😉`;

            logger.info('Executing wink command:', { target, mentions });
            await sendGifReaction(sock, msg, 'anime-wink.gif', caption, mentions);
        } catch (error) {
            logger.error('Error in wink command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute wink command!'
            });
        }
    },

    wasted: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : msg.pushName;
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];
            const caption = `💀 *WASTED*\n${target} has been wasted!`;

            logger.info('Executing wasted command:', { target, mentions });
            await sendGifReaction(sock, msg, 'anime-wasted.gif', caption, mentions);
        } catch (error) {
            logger.error('Error in wasted command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to execute wasted command!'
            });
        }
    },

    // Add other effect commands
    jail: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : msg.pushName;
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];
            const caption = `🏢 *JAIL*\n${target} is now behind bars!`;

            logger.info('Executing jail command:', { target, mentions });
            await sendGifReaction(sock, msg, 'anime-jail.gif', caption, mentions);
        } catch (error) {
            logger.error('Error in jail command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to execute jail command!'
            });
        }
    },

    triggered: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : msg.pushName;
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];
            const caption = `💢 *TRIGGERED*\n${target} is triggered!`;

            logger.info('Executing triggered command:', { target, mentions });
            await sendGifReaction(sock, msg, 'anime-triggered.gif', caption, mentions);
        } catch (error) {
            logger.error('Error in triggered command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to execute triggered command!'
            });
        }
    }
};

module.exports = reactionCommands;