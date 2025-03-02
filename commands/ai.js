const config = require('../config');
const logger = require('pino')();
const fs = require('fs-extra');
const path = require('path');
const OpenAI = require('openai');
const gtts = require('node-gtts');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const Replicate = require('replicate');

// Initialize OpenAI with API key from environment
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Initialize Replicate for Stable Diffusion
const replicate = process.env.REPLICATE_API_TOKEN ? new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
}) : null;

// Conversation management
const conversationHistory = new Map();
const MAX_HISTORY = 10;

// Rate limiting configuration
const userCooldowns = new Map();
const COOLDOWN_PERIODS = {
    default: 10000,  // 10 seconds
    image: 30000,    // 30 seconds
    chat: 5000,      // 5 seconds
    vision: 20000    // 20 seconds
};

const isOnCooldown = (userId, type = 'default') => {
    const key = `${userId}-${type}`;
    if (!userCooldowns.has(key)) return false;
    const lastUsage = userCooldowns.get(key);
    return Date.now() - lastUsage < COOLDOWN_PERIODS[type];
};

const setCooldown = (userId, type = 'default') => {
    const key = `${userId}-${type}`;
    userCooldowns.set(key, Date.now());
};


// AI Commands Implementation
const aiCommands = {
    gpt: async (sock, msg, args) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;
            if (isOnCooldown(userId, 'chat')) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ Please wait before sending another message.'
                });
            }

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a message to chat about!'
                });
            }

            await sock.sendPresenceUpdate('composing', msg.key.remoteJid);

            const userInput = args.join(' ');

            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are a helpful WhatsApp assistant." },
                    { role: "user", content: userInput }
                ],
                temperature: 0.7,
                max_tokens: 2000
            });

            await sock.sendMessage(msg.key.remoteJid, { 
                text: response.choices[0].message.content 
            });
            setCooldown(userId, 'chat');

        } catch (error) {
            logger.error('Error in gpt command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error processing your request. Please try again later.'
            });
        }
    },

    dalle: async (sock, msg, args) => {
        const userId = msg.key.participant || msg.key.remoteJid;
        if (isOnCooldown(userId, 'image')) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Please wait before generating another image.'
            });
        }
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide an image description!'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '🎨 Creating your image with DALL-E...'
            });

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
                caption: `✨ Here's your AI-generated image!`
            });
            setCooldown(userId, 'image');

        } catch (error) {
            logger.error('Error in dalle command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to generate image. Please try again later.'
            });
        }
    },

    img2txt: async (sock, msg) => {
        const userId = msg.key.participant || msg.key.remoteJid;

        if (isOnCooldown(userId, 'vision')) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Please wait before analyzing another image.'
            });
        }

        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !img2txt'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '🔍 Analyzing image...'
            });

            const imageBuffer = await downloadMediaMessage(
                {
                    key: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMsg,
                    messageTimestamp: msg.messageTimestamp
                },
                'buffer',
                {},
                {
                    logger,
                    reuploadRequest: sock.updateMediaMessage
                }
            );

            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo", // Using GPT-3.5-turbo for image analysis
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Describe this image in detail" },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 500
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: `📝 *Image Analysis*\n\n${response.choices[0].message.content}`
            });

            setCooldown(userId, 'vision');

        } catch (error) {
            logger.error('Error in img2txt command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to analyze image. Please try again later.'
            });
        }
    },

    remini: async (sock, msg) => {
        const userId = msg.key.participant || msg.key.remoteJid;

        if (isOnCooldown(userId, 'image')) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Please wait before enhancing another image.'
            });
        }

        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !remini'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '🎨 Enhancing your image...'
            });

            if (!replicate) {
                throw new Error('Replicate API token not configured');
            }

            const imageBuffer = await downloadMediaMessage(
                {
                    key: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMsg,
                    messageTimestamp: msg.messageTimestamp
                },
                'buffer',
                {},
                {
                    logger,
                    reuploadRequest: sock.updateMediaMessage
                }
            );

            const output = await replicate.run(
                "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
                {
                    input: {
                        image: imageBuffer.toString('base64'),
                        scale: 2,
                        face_enhance: true
                    }
                }
            );

            if (!output) {
                throw new Error('Failed to enhance image');
            }

            const response = await axios.get(output, { responseType: 'arraybuffer' });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: '✨ Here\'s your enhanced image!'
            });

            setCooldown(userId, 'image');

        } catch (error) {
            logger.error('Error in remini command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to enhance image. Please try again later.'
            });
        }
    },

    cleargpt: async (sock, msg) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;
            conversationHistory.delete(userId);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '🗑️ Conversation history cleared!'
            });
        } catch (error) {
            logger.error('Error in cleargpt command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error clearing conversation history.'
            });
        }
    },

    // Alias commands
    imagine: async (sock, msg, args) => aiCommands.dalle(sock, msg, args),
    txt2img: async (sock, msg, args) => aiCommands.dalle(sock, msg, args),
    ai: async (sock, msg, args) => aiCommands.gpt(sock, msg, args),
    tts: async (sock, msg, args) => {
        const userId = msg.key.participant || msg.key.remoteJid;

        if (isOnCooldown(userId)) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Please wait a few seconds before using this command again.'
            });
        }

        if (!args.length) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: 'Please provide text to convert!\nUsage: !tts [lang] <text>\nExample: !tts en Hello World\nSupported languages: en, es, fr, de, it, ja, ko, zh'
            });
        }

        try {
            let lang = 'en';
            let text;

            if (args[0].length === 2) {
                lang = args[0].toLowerCase();
                text = args.slice(1).join(' ');
            } else {
                text = args.join(' ');
            }

            const tempFile = path.join(tempDir, `tts_${Date.now()}.mp3`);
            const tts = new gtts(lang);

            await new Promise((resolve, reject) => {
                tts.save(tempFile, text, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            await sock.sendMessage(msg.key.remoteJid, {
                audio: { url: tempFile },
                mimetype: 'audio/mp4',
                ptt: true
            });

            setCooldown(userId);
            await fs.remove(tempFile);

        } catch (error) {
            logger.error('Error in tts command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to convert text to speech: ' + error.message
            });
        }
    }
};

module.exports = aiCommands;