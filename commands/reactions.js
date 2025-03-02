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
    },

    poke: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];
            const caption = `*${msg.pushName}* poked ${target}! 👉`;

            logger.info('Executing poke command:', { target, mentions });
            await sendGifReaction(sock, msg, 'poke.gif', caption, mentions);
        } catch (error) {
            logger.error('Error in poke command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute poke command! (GIF not available)'
            });
        }
    },

    cuddle: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];
            const caption = `*${msg.pushName}* cuddled with ${target}! 🥰`;

            logger.info('Executing cuddle command:', { target, mentions });
            await sendGifReaction(sock, msg, 'cuddle.gif', caption, mentions);
        } catch (error) {
            logger.error('Error in cuddle command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute cuddle command! (GIF not available)'
            });
        }
    },

    boop: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];
            const caption = `*${msg.pushName}* booped ${target}! 👆`;

            logger.info('Executing boop command:', { target, mentions });
            await sendGifReaction(sock, msg, 'boop.gif', caption, mentions);
        } catch (error) {
            logger.error('Error in boop command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute boop command! (GIF not available)'
            });
        }
    },

    bonk: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];
            const caption = `*${msg.pushName}* bonked ${target}! 🔨`;

            logger.info('Executing bonk command:', { target, mentions });
            await sendGifReaction(sock, msg, 'bonk.gif', caption, mentions);
        } catch (error) {
            logger.error('Error in bonk command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute bonk command! (GIF not available)'
            });
        }
    },

    rip: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : msg.pushName;
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];
            const caption = `💐 *RIP*\n${target} will be remembered...`;

            logger.info('Executing rip command:', { target, mentions });
            await sendGifReaction(sock, msg, 'rip.gif', caption, mentions);
        } catch (error) {
            logger.error('Error in rip command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to execute rip command! (GIF not available)'
            });
        }
    },

    wave: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'everyone';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];
            const caption = `*${msg.pushName}* waves at ${target}! 👋`;

            logger.info('Executing wave command:', { target, mentions });
            await sendGifReaction(sock, msg, 'wave.gif', caption, mentions);
        } catch (error) {
            logger.error('Error in wave command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute wave command! (GIF not available)'
            });
        }
    },

    yeet: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];
            const caption = `*${msg.pushName}* yeeted ${target}! 🚀`;

            logger.info('Executing yeet command:', { target, mentions });
            await sendGifReaction(sock, msg, 'yeet.gif', caption, mentions);
        } catch (error) {
            logger.error('Error in yeet command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute yeet command! (GIF not available)'
            });
        }
    },

    smile: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : null;
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];
            const caption = target ? 
                `*${msg.pushName}* smiles at ${target}! 😊` :
                `*${msg.pushName}* smiles brightly! 😊`;

            logger.info('Executing smile command:', { target, mentions });
            await sendGifReaction(sock, msg, 'smile.gif', caption, mentions);
        } catch (error) {
            logger.error('Error in smile command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute smile command! (GIF not available)'
            });
        }
    },

    dance: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : null;
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];
            const caption = target ? 
                `*${msg.pushName}* dances with ${target}! 💃` :
                `*${msg.pushName}* starts dancing! 💃`;

            logger.info('Executing dance command:', { target, mentions });
            await sendGifReaction(sock, msg, 'dance.gif', caption, mentions);
        } catch (error) {
            logger.error('Error in dance command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute dance command! (GIF not available)'
            });
        }
    },

    highfive: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];
            const caption = `*${msg.pushName}* high-fived ${target}! ✋`;

            logger.info('Executing highfive command:', { target, mentions });
            await sendGifReaction(sock, msg, 'highfive.gif', caption, mentions);
        } catch (error) {
            logger.error('Error in highfive command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute highfive command! (GIF not available)'
            });
        }
    }
};

module.exports = reactionCommands;