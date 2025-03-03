const logger = require('pino')();
const config = require('../config');
const axios = require('axios');
const dbStore = require('../database/store');

// Initialize conversation history storage
const conversationHistory = new Map();

// Rate limiting configuration
const rateLimits = {
    ai: { window: 60000, limit: 10 },    // 10 requests per minute
    gpt: { window: 300000, limit: 15 },  // 15 requests per 5 minutes
    dalle: { window: 300000, limit: 5 }  // 5 requests per 5 minutes
};

// Track request timestamps for rate limiting
const requestTimestamps = new Map();

// Helper function for rate limiting
const checkRateLimit = (userId, command) => {
    if (!requestTimestamps.has(userId)) {
        requestTimestamps.set(userId, {});
    }

    const userTimestamps = requestTimestamps.get(userId);
    if (!userTimestamps[command]) {
        userTimestamps[command] = [];
    }

    const now = Date.now();
    const limit = rateLimits[command];

    // Remove old timestamps
    userTimestamps[command] = userTimestamps[command].filter(
        timestamp => now - timestamp < limit.window
    );

    // Check if limit exceeded
    if (userTimestamps[command].length >= limit.limit) {
        const oldestTimestamp = userTimestamps[command][0];
        const waitTime = Math.ceil((limit.window - (now - oldestTimestamp)) / 1000);
        return { limited: true, waitTime };
    }

    userTimestamps[command].push(now);
    return { limited: false };
};

const aiCommands = {
    ai: async (sock, msg, args) => {
        try {
            if (!sock || !msg?.key?.remoteJid) return;
            const userId = msg.key.participant || msg.key.remoteJid;

            const rateCheck = checkRateLimit(userId, 'ai');
            if (rateCheck.limited) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `⏳ Please wait ${rateCheck.waitTime} seconds before using AI again.`
                });
            }

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a message to chat with AI.\nUsage: ${config.prefix}ai <your message>`
                });
            }

            const userMessage = args.join(' ');
            await sock.sendMessage(msg.key.remoteJid, { text: '🤖 Thinking...' });

            // Simple AI using GPT-3.5 without conversation history
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: userMessage }],
                max_tokens: 500,
                temperature: 0.7
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            const reply = response.data.choices[0].message.content.trim();
            await sock.sendMessage(msg.key.remoteJid, { text: reply });

        } catch (error) {
            logger.error('AI command error:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error: ' + (error.response?.data?.error?.message || error.message)
            });
        }
    },

    gpt: async (sock, msg, args) => {
        try {
            if (!sock || !msg?.key?.remoteJid) return;
            const userId = msg.key.participant || msg.key.remoteJid;

            const rateCheck = checkRateLimit(userId, 'gpt');
            if (rateCheck.limited) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `⏳ Please wait ${rateCheck.waitTime} seconds before using GPT again.`
                });
            }

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a message for GPT-4.\nUsage: ${config.prefix}gpt <your message>`
                });
            }

            // Initialize or get conversation history
            if (!conversationHistory.has(userId)) {
                conversationHistory.set(userId, []);
            }
            const history = conversationHistory.get(userId);

            const userMessage = args.join(' ');
            await sock.sendMessage(msg.key.remoteJid, { text: '🤖 Processing with GPT-4...' });

            // Add user message to history
            history.push({ role: "user", content: userMessage });

            // Keep last 10 messages for context
            const recentHistory = history.slice(-10);

            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: "gpt-4",
                messages: [...recentHistory],
                max_tokens: 1000,
                temperature: 0.7
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            const reply = response.data.choices[0].message.content.trim();

            // Add assistant's reply to history
            history.push({ role: "assistant", content: reply });

            await sock.sendMessage(msg.key.remoteJid, { text: reply });

        } catch (error) {
            logger.error('GPT command error:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error: ' + (error.response?.data?.error?.message || error.message)
            });
        }
    },

    dalle: async (sock, msg, args) => {
        try {
            if (!sock || !msg?.key?.remoteJid) return;
            const userId = msg.key.participant || msg.key.remoteJid;

            const rateCheck = checkRateLimit(userId, 'dalle');
            if (rateCheck.limited) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `⏳ Please wait ${rateCheck.waitTime} seconds before using DALL-E again.`
                });
            }

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a description for image generation.\nUsage: ${config.prefix}dalle <image description>`
                });
            }

            const prompt = args.join(' ');
            await sock.sendMessage(msg.key.remoteJid, { text: '🎨 Generating image...' });

            const response = await axios.post('https://api.openai.com/v1/images/generations', {
                prompt: prompt,
                n: 1,
                size: "1024x1024", // Upgraded to higher resolution
                quality: "standard",
                response_format: "url"
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            const imageUrl = response.data.data[0].url;
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const buffer = imageResponse.data;

            await sock.sendMessage(msg.key.remoteJid, { 
                image: buffer,
                caption: `🎨 Generated: ${prompt}\n\nUse ${config.prefix}dalle-edit to edit this image`
            });

        } catch (error) {
            logger.error('DALL-E command error:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error: ' + (error.response?.data?.error?.message || error.message)
            });
        }
    },

    dalleEdit: async (sock, msg, args) => {
        try {
            if (!sock || !msg?.key?.remoteJid) return;
            const userId = msg.key.participant || msg.key.remoteJid;

            const rateCheck = checkRateLimit(userId, 'dalle');
            if (rateCheck.limited) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `⏳ Please wait ${rateCheck.waitTime} seconds before using DALL-E again.`
                });
            }

            // Check if message is a reply with image
            if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with your edit instructions!'
                });
            }

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide edit instructions.\nUsage: Reply to an image with ${config.prefix}dalle-edit <instructions>`
                });
            }

            const instructions = args.join(' ');
            await sock.sendMessage(msg.key.remoteJid, { text: '🎨 Editing image...' });

            // Get the quoted image
            const quotedMessage = msg.message.extendedTextMessage.contextInfo.quotedMessage;
            const imageBuffer = quotedMessage.imageMessage.jpegThumbnail;

            // Create FormData for the image upload
            const formData = new FormData();
            formData.append('image', imageBuffer, 'image.jpg');
            formData.append('prompt', instructions);

            const response = await axios.post('https://api.openai.com/v1/images/edits', formData, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            const editedImageUrl = response.data.data[0].url;
            const imageResponse = await axios.get(editedImageUrl, { responseType: 'arraybuffer' });
            const editedBuffer = imageResponse.data;

            await sock.sendMessage(msg.key.remoteJid, { 
                image: editedBuffer,
                caption: `🎨 Edited with prompt: ${instructions}`
            });

        } catch (error) {
            logger.error('DALL-E edit command error:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error: ' + (error.response?.data?.error?.message || error.message)
            });
        }
    },

    clearChat: async (sock, msg) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;

            if (conversationHistory.has(userId)) {
                conversationHistory.delete(userId);
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '🧹 Conversation history cleared!'
                });
            } else {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '✨ No conversation history to clear.'
                });
            }
        } catch (error) {
            logger.error('Clear chat command error:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error clearing chat history'
            });
        }
    }
};

module.exports = aiCommands;