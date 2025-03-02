const config = require('../config');
const logger = require('pino')();
const { OpenAI } = require('openai');
const axios = require('axios');

// Initialize OpenAI with error handling
let openai;
try {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
} catch (error) {
    logger.error('Failed to initialize OpenAI:', error);
}

// Rate limiting setup
const userCooldowns = new Map();
const COOLDOWN_PERIOD = 10000; // 10 seconds

const isOnCooldown = (userId) => {
    if (!userCooldowns.has(userId)) return false;
    return Date.now() - userCooldowns.get(userId) < COOLDOWN_PERIOD;
};

const setCooldown = (userId) => {
    userCooldowns.set(userId, Date.now());
};

const aiCommands = {
    ai: async (sock, msg, args) => {
        try {
            if (!openai) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ AI service not available.'
                });
            }

            const userId = msg.key.participant || msg.key.remoteJid;

            if (isOnCooldown(userId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ Please wait before sending another message.'
                });
            }

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a message to chat about!'
                });
            }

            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: args.join(' ') }
                ]
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: response.choices[0].message.content
            });

            setCooldown(userId);
        } catch (error) {
            logger.error('Error in ai command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error processing your request.'
            });
        }
    },

    gpt: async (sock, msg, args) => {
        try {
            if (!openai) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ AI service not available.'
                });
            }

            const userId = msg.key.participant || msg.key.remoteJid;

            if (isOnCooldown(userId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ Please wait before sending another message.'
                });
            }

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a message to chat about!'
                });
            }

            const response = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: args.join(' ') }
                ]
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: response.choices[0].message.content
            });

            setCooldown(userId);
        } catch (error) {
            logger.error('Error in gpt command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error processing your request.'
            });
        }
    },

    dalle: async (sock, msg, args) => {
        try {
            if (!openai) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ AI service not available.'
                });
            }

            const userId = msg.key.participant || msg.key.remoteJid;

            if (isOnCooldown(userId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ Please wait before generating another image.'
                });
            }

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide an image description!'
                });
            }

            const response = await openai.images.generate({
                model: "dall-e-2",
                prompt: args.join(' '),
                n: 1,
                size: "1024x1024"
            });

            const imageUrl = response.data[0].url;
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(imageResponse.data),
                caption: '✨ Here\'s your AI-generated image!'
            });

            setCooldown(userId);
        } catch (error) {
            logger.error('Error in dalle command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to generate image.'
            });
        }
    }
};

module.exports = aiCommands;