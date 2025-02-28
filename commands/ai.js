const config = require('../config');
const logger = require('pino')();
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

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

// Simple response templates for common queries
const responseTemplates = {
    greetings: [
        "Hello! How can I help you today?",
        "Hi there! What can I do for you?",
        "Greetings! How may I assist you?"
    ],
    farewell: [
        "Goodbye! Have a great day!",
        "See you later! Take care!",
        "Bye! Feel free to ask if you need anything else!"
    ],
    thanks: [
        "You're welcome!",
        "Glad I could help!",
        "No problem at all!"
    ],
    unknown: [
        "I'm not sure about that. Could you rephrase your question?",
        "That's interesting, but I might need more context.",
        "I'm still learning about that topic. Could you explain more?"
    ]
};

// Helper function to get a random response
const getRandomResponse = (category) => {
    const responses = responseTemplates[category] || responseTemplates.unknown;
    return responses[Math.floor(Math.random() * responses.length)];
};

// Helper function to identify message intent
const identifyIntent = (message) => {
    message = message.toLowerCase();
    if (message.match(/\b(hi|hello|hey|greetings)\b/)) return 'greetings';
    if (message.match(/\b(bye|goodbye|see you|farewell)\b/)) return 'farewell';
    if (message.match(/\b(thanks|thank you|thx|ty)\b/)) return 'thanks';
    return 'unknown';
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

// Helper function to get topic-specific image
const getTopicImage = async (query) => {
    try {
        // Using Pexels API through proxy URL
        const searchUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`;
        const response = await axios.get(searchUrl, {
            headers: {
                'Authorization': process.env.PEXELS_API_KEY || 'dummy_key'
            }
        });

        // If Pexels fails, fallback to placeholder
        if (!response.data || !response.data.photos || !response.data.photos.length) {
            return `https://via.placeholder.com/800x800.png?text=${encodeURIComponent(query)}`;
        }

        return response.data.photos[0].src.large;
    } catch (error) {
        logger.error('Error fetching topic image:', error);
        // Return a themed placeholder on error
        return `https://via.placeholder.com/800x800.png?text=${encodeURIComponent(query)}`;
    }
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
            const intent = identifyIntent(userInput);
            const response = getRandomResponse(intent);

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

            // Get topic-specific image URL
            const imageUrl = await getTopicImage(args.join(' '));

            // Generate filename with timestamp
            const timestamp = Date.now();
            const filename = `image_${timestamp}.jpg`;

            // Download image to local file
            const localImagePath = await downloadImage(imageUrl, filename);

            setCooldown(userId);

            // Send the image from local file
            await sock.sendMessage(msg.key.remoteJid, {
                image: fs.readFileSync(localImagePath),
                caption: `🖼️ Here's an image of "${args.join(' ')}" for you!`
            });

            // Clean up temporary file
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