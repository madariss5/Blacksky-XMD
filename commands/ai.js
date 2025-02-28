const config = require('../config');
const logger = require('pino')();
const fs = require('fs-extra');
const path = require('path');
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, '../temp');
fs.ensureDirSync(tempDir);

// Rate limiting map
const userCooldowns = new Map();
const COOLDOWN_PERIOD = 10000; // 10 seconds

const isOnCooldown = (userId) => {
    if (!userCooldowns.has(userId)) return false;
    const lastUsage = userCooldowns.get(userId);
    return Date.now() - lastUsage < COOLDOWN_PERIOD;
};

const setCooldown = (userId) => {
    userCooldowns.set(userId, Date.now());
};

const aiCommands = {
    gpt: async (sock, msg, args) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;

            if (isOnCooldown(userId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ Please wait a few seconds before using this command again.'
                });
            }

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: 'Please provide a question!\nUsage: .gpt <your question>'
                });
            }

            // Send typing indicator
            await sock.sendPresenceUpdate('composing', msg.key.remoteJid);

            // Send processing message
            await sock.sendMessage(msg.key.remoteJid, {
                text: '🤖 Processing your request...'
            });

            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant in a WhatsApp chat. Be concise but informative."
                    },
                    {
                        role: "user",
                        content: args.join(' ')
                    }
                ],
                max_tokens: 500
            });

            const response = completion.choices[0].message.content;
            setCooldown(userId);

            await sock.sendMessage(msg.key.remoteJid, { text: response });

        } catch (error) {
            logger.error('Error in gpt command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error processing your request: ' + error.message
            });
        }
    },

    dalle: async (sock, msg, args) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;

            if (isOnCooldown(userId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ Please wait a few seconds before using this command again.'
                });
            }

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: 'Please provide an image description!\nUsage: .dalle <description>'
                });
            }

            // Send processing message
            await sock.sendMessage(msg.key.remoteJid, {
                text: '🎨 Generating your image...'
            });

            const response = await openai.images.generate({
                model: "dall-e-3",
                prompt: args.join(' '),
                n: 1,
                size: "1024x1024",
            });

            const imageUrl = response.data[0].url;
            setCooldown(userId);

            // Download and send the image
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: imageUrl },
                caption: '🖼️ Generated using DALL-E'
            });

        } catch (error) {
            logger.error('Error in dalle command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error generating image: ' + error.message
            });
        }
    },

    imagine: async (sock, msg, args) => {
        // Alias for dalle command
        return aiCommands.dalle(sock, msg, args);
    },

    txt2img: async (sock, msg, args) => {
        // Another alias for dalle command
        return aiCommands.dalle(sock, msg, args);
    },
    
    //Retained commands with error handling, but no functionality
    lisa: async (sock, msg, args) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, { text: "This command is not yet implemented." });
        } catch (error) {
            logger.error('Error in lisa command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error: ' + error.message
            });
        }
    },
    rias: async (sock, msg, args) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, { text: "This command is not yet implemented." });
        } catch (error) {
            logger.error('Error in rias command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error: ' + error.message
            });
        }
    },
    toxxic: async (sock, msg, args) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, { text: "This command is not yet implemented." });
        } catch (error) {
            logger.error('Error in toxxic command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error: ' + error.message
            });
        }
    },
    aiuser: async (sock, msg, args) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, { text: "This command is not yet implemented." });
        } catch (error) {
            logger.error('Error in aiuser command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error: ' + error.message
            });
        }
    },
    bugandro: async (sock, msg, args) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, { text: "This command is not yet implemented." });
        } catch (error) {
            logger.error('Error in bugandro command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error: ' + error.message
            });
        }
    },
    bugios: async (sock, msg, args) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, { text: "This command is not yet implemented." });
        } catch (error) {
            logger.error('Error in bugios command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error: ' + error.message
            });
        }
    }
};

module.exports = aiCommands;