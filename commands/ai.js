const config = require('../config');
const logger = require('pino')();
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const OpenAI = require('openai');

// Initialize OpenAI with API key
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

// Helper function to download and save image temporarily
const downloadImage = async (imageUrl, filename) => {
    const response = await axios({
        method: 'get',
        url: imageUrl,
        responseType: 'stream'
    });

    const tempFilePath = path.join(tempDir, filename);
    const writer = fs.createWriteStream(tempFilePath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(tempFilePath));
        writer.on('error', reject);
    });
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

            const userInput = args.join(' ');

            // Get response from OpenAI
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: userInput }],
                max_tokens: 200
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

    gpt4: async (sock, msg, args) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;

            if (isOnCooldown(userId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ Please wait a few seconds before using this command again.'
                });
            }

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: 'Please provide a question!\nUsage: .gpt4 <your question>'
                });
            }

            await sock.sendPresenceUpdate('composing', msg.key.remoteJid);

            const userInput = args.join(' ');

            // Use GPT-4 model
            const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [{ role: "user", content: userInput }],
                max_tokens: 300
            });

            const response = completion.choices[0].message.content;

            setCooldown(userId);
            await sock.sendMessage(msg.key.remoteJid, { text: response });

        } catch (error) {
            logger.error('Error in gpt4 command:', error);
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

            const prompt = args.join(' ');

            // Generate image using DALL-E
            const response = await openai.images.generate({
                model: "dall-e-3",
                prompt: prompt,
                n: 1,
                size: "1024x1024"
            });

            const imageUrl = response.data[0].url;

            // Generate filename with timestamp
            const timestamp = Date.now();
            const filename = `dalle_${timestamp}.jpg`;

            // Download image
            const localImagePath = await downloadImage(imageUrl, filename);

            setCooldown(userId);

            // Send the image
            await sock.sendMessage(msg.key.remoteJid, {
                image: fs.readFileSync(localImagePath),
                caption: `🖼️ Here's your DALL-E generated image for: "${prompt}"`
            });

            // Clean up
            await fs.unlink(localImagePath);

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

    translate: async (sock, msg, args) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;

            if (isOnCooldown(userId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ Please wait a few seconds before using this command again.'
                });
            }

            if (args.length < 2) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: 'Please provide the target language and text!\nUsage: .translate <language> <text>'
                });
            }

            const targetLang = args[0].toLowerCase();
            const textToTranslate = args.slice(1).join(' ');

            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { 
                        role: "system", 
                        content: `You are a translator. Translate the following text to ${targetLang}. Only respond with the translation, no explanations.` 
                    },
                    { 
                        role: "user", 
                        content: textToTranslate 
                    }
                ],
                max_tokens: 200
            });

            const translation = completion.choices[0].message.content;

            setCooldown(userId);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `Translation (${targetLang}):\n${translation}`
            });

        } catch (error) {
            logger.error('Error in translate command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error translating text: ' + error.message
            });
        }
    },

    // Placeholder for future implementation
    remini: async (sock, msg) => {
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "🚧 The remini command is currently under development."
        });
    },

    colorize: async (sock, msg) => {
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "🚧 The colorize command is currently under development."
        });
    },

    upscale: async (sock, msg) => {
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "🚧 The upscale command is currently under development."
        });
    },

    anime2d: async (sock, msg) => {
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "🚧 The anime2d command is currently under development."
        });
    },

    img2txt: async (sock, msg) => {
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "🚧 The img2txt command is currently under development."
        });
    },

    // Additional AI characters with placeholder messages
    lisa: async (sock, msg) => {
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "👩 Lisa AI is currently taking a break. Try using .gpt instead!"
        });
    },

    rias: async (sock, msg) => {
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "👩 Rias AI is currently unavailable. Try using .gpt instead!"
        });
    },

    toxxic: async (sock, msg) => {
        await sock.sendMessage(msg.key.remoteJid, { 
            text: "🤖 Toxxic AI is currently offline. Try using .gpt instead!"
        });
    },
    aiuser: async (sock, msg, args) => {
        await sock.sendMessage(msg.key.remoteJid, { text: "This command is not yet implemented." });
    },
    bugandro: async (sock, msg, args) => {
        await sock.sendMessage(msg.key.remoteJid, { text: "This command is not yet implemented." });
    },
    bugios: async (sock, msg, args) => {
        await sock.sendMessage(msg.key.remoteJid, { text: "This command is not yet implemented." });
    }
};

module.exports = aiCommands;