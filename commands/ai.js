const logger = require('pino')();
const config = require('../config');
const axios = require('axios');

const aiCommands = {
    ai: async (sock, msg, args) => {
        try {
            if (!sock || !msg?.key?.remoteJid) return;

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a message to chat with AI.\nUsage: ${config.prefix}ai <your message>`
                });
            }

            const userMessage = args.join(' ');
            await sock.sendMessage(msg.key.remoteJid, { text: '🤖 Thinking...' });

            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: userMessage }],
                max_tokens: 500
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
                text: '❌ Error processing AI command'
            });
        }
    },

    gpt: async (sock, msg, args) => {
        try {
            if (!sock || !msg?.key?.remoteJid) return;

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a message for GPT-4.\nUsage: ${config.prefix}gpt <your message>`
                });
            }

            const userMessage = args.join(' ');
            await sock.sendMessage(msg.key.remoteJid, { text: '🤖 Processing with GPT-4...' });

            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: "gpt-4",
                messages: [{ role: "user", content: userMessage }],
                max_tokens: 1000
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            const reply = response.data.choices[0].message.content.trim();
            await sock.sendMessage(msg.key.remoteJid, { text: reply });

        } catch (error) {
            logger.error('GPT command error:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error processing GPT command'
            });
        }
    },

    dalle: async (sock, msg, args) => {
        try {
            if (!sock || !msg?.key?.remoteJid) return;

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
                size: "512x512"
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
                caption: `🎨 Generated: ${prompt}`
            });

        } catch (error) {
            logger.error('DALL-E command error:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error generating image'
            });
        }
    }
};

module.exports = aiCommands;