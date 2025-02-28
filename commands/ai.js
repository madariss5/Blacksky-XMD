const config = require('../config');
const logger = require('pino')();
const fs = require('fs-extra');
const path = require('path');
const OpenAI = require('openai');
const Replicate = require('replicate');

// Initialize AI clients
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
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

// Helper function to handle OpenAI quota errors
const handleAIResponse = async (primaryFunc, fallbackFunc) => {
    try {
        return await primaryFunc();
    } catch (error) {
        if (error.message.includes('quota') || error.message.includes('429')) {
            logger.info('OpenAI quota exceeded, falling back to Replicate');
            return await fallbackFunc();
        }
        throw error;
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

            // Send processing message
            await sock.sendMessage(msg.key.remoteJid, {
                text: '🤖 Processing your request...'
            });

            const prompt = args.join(' ');

            const response = await handleAIResponse(
                // OpenAI Implementation
                async () => {
                    const completion = await openai.chat.completions.create({
                        model: "gpt-3.5-turbo",
                        messages: [
                            {
                                role: "system",
                                content: "You are a helpful assistant in a WhatsApp chat. Be concise but informative."
                            },
                            {
                                role: "user",
                                content: prompt
                            }
                        ],
                        max_tokens: 500
                    });
                    return completion.choices[0].message.content;
                },
                // Replicate Fallback
                async () => {
                    const output = await replicate.run(
                        "meta/llama-2-70b-chat:02e509c789964a7ea8736978a43525956ef40397be9033abf9fd2badfe68c9e3",
                        {
                            input: {
                                prompt: prompt,
                                max_tokens: 500,
                                temperature: 0.75,
                                system_prompt: "You are a helpful assistant in a WhatsApp chat. Be concise but informative."
                            }
                        }
                    );
                    return output.join('');
                }
            );

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

            const prompt = args.join(' ');

            const imageUrl = await handleAIResponse(
                // OpenAI Implementation
                async () => {
                    const response = await openai.images.generate({
                        model: "dall-e-3",
                        prompt: prompt,
                        n: 1,
                        size: "1024x1024",
                    });
                    return response.data[0].url;
                },
                // Replicate Fallback
                async () => {
                    const output = await replicate.run(
                        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
                        {
                            input: {
                                prompt: prompt,
                                width: 1024,
                                height: 1024,
                                num_outputs: 1
                            }
                        }
                    );
                    return output[0];
                }
            );

            setCooldown(userId);

            // Send the generated image
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: imageUrl },
                caption: '🖼️ Generated using AI'
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