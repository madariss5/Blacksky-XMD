const config = require('../config');
const logger = require('pino')();
const fs = require('fs-extra');
const path = require('path');
const openai = require('openai');
const gtts = require('node-gtts');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const Replicate = require('replicate');

const tempDir = path.join(__dirname, '../temp');
fs.ensureDirSync(tempDir);

// Conversation memory store
const conversationHistory = new Map();

// Rate limiting configuration 
const userCooldowns = new Map();
const COOLDOWN_PERIODS = {
    default: 10000, // 10 seconds
    image: 30000,   // 30 seconds
    chat: 5000      // 5 seconds
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

// Helper function to get conversation history
const getConversationHistory = (userId, maxTokens = 2000) => {
    if (!conversationHistory.has(userId)) {
        conversationHistory.set(userId, []);
    }
    return conversationHistory.get(userId).slice(-maxTokens);
};

// Helper function to add to conversation history
const addToConversationHistory = (userId, message) => {
    if (!conversationHistory.has(userId)) {
        conversationHistory.set(userId, []);
    }
    const history = conversationHistory.get(userId);
    history.push(message);
    // Keep only last 10 messages
    if (history.length > 10) {
        history.shift();
    }
};

// Helper function to generate TTS audio
const generateTTS = async (text, lang = 'en') => {
    const tts = new gtts(lang);
    const timestamp = Date.now();
    const outputPath = path.join(tempDir, `tts_${timestamp}.mp3`);

    return new Promise((resolve, reject) => {
        tts.save(outputPath, text, (err) => {
            if (err) reject(err);
            else resolve(outputPath);
        });
    });
};

const aiCommands = {
    ask: async (sock, msg, args) => {
        const userId = msg.key.participant || msg.key.remoteJid;
        if (isOnCooldown(userId, 'chat')) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Please wait a few seconds before using this command again.'
            });
        }

        if (!args.length) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: 'Please provide a question!\nUsage: .ask <your question>'
            });
        }

        try {
            // Send typing indicator
            await sock.sendPresenceUpdate('composing', msg.key.remoteJid);

            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: args.join(' ') }],
            });

            setCooldown(userId, 'chat');
            await sock.sendMessage(msg.key.remoteJid, { 
                text: response.choices[0].message.content 
            });

        } catch (error) {
            logger.error('Error in ask command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error processing your request: ' + error.message
            });
        }
    },

    dalle: async (sock, msg, args) => {
        const userId = msg.key.participant || msg.key.remoteJid;
        if (isOnCooldown(userId, 'image')) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Please wait a few seconds before using this command again.'
            });
        }

        if (!args.length) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: 'Please provide an image description!\nUsage: .dalle <description>'
            });
        }

        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '🎨 Generating your image...'
            });

            const response = await openai.images.generate({
                model: "dall-e-3",
                prompt: args.join(' '),
                n: 1,
                size: "1024x1024"
            });

            const imageUrl = response.data[0].url;
            const timestamp = Date.now();
            const outputPath = path.join(tempDir, `dalle_${timestamp}.jpg`);

            // Download and save image
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            await fs.writeFile(outputPath, imageResponse.data);

            setCooldown(userId, 'image');

            await sock.sendMessage(msg.key.remoteJid, {
                image: fs.readFileSync(outputPath),
                caption: `🖼️ Here's your DALL-E generated image for: "${args.join(' ')}"`
            });

            // Cleanup
            await fs.remove(outputPath);

        } catch (error) {
            logger.error('Error in dalle command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error generating image: ' + error.message
            });
        }
    },

    tts: async (sock, msg, args) => {
        const userId = msg.key.participant || msg.key.remoteJid;
        if (isOnCooldown(userId, 'default')) {
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

            // Check if first argument is a language code
            if (args[0].length === 2) {
                lang = args[0].toLowerCase();
                text = args.slice(1).join(' ');
            } else {
                text = args.join(' ');
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '🎙️ Generating audio...'
            });

            const audioPath = await generateTTS(text, lang);

            await sock.sendMessage(msg.key.remoteJid, {
                audio: fs.readFileSync(audioPath),
                mimetype: 'audio/mp4',
                ptt: true // Play as voice note
            });

            setCooldown(userId, 'default');
            await fs.remove(audioPath);

        } catch (error) {
            logger.error('Error in tts command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to generate audio: ' + error.message
            });
        }
    },

    // Alias commands
    gpt: async (sock, msg, args) => {
        const userId = msg.key.participant || msg.key.remoteJid;

        if (isOnCooldown(userId, 'chat')) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Please wait a few seconds before using this command again.'
            });
        }

        if (!args.length) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: 'Please provide a question!\nUsage: .gpt <your question>'
            });
        }

        try {
            await sock.sendPresenceUpdate('composing', msg.key.remoteJid);

            const userInput = args.join(' ');
            const history = getConversationHistory(userId);

            const messages = [
                { role: "system", content: "You are a helpful assistant." },
                ...history,
                { role: "user", content: userInput }
            ];

            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: messages,
                temperature: 0.7,
                max_tokens: 500
            });

            const aiResponse = response.choices[0].message.content;

            addToConversationHistory(userId, { role: "user", content: userInput });
            addToConversationHistory(userId, { role: "assistant", content: aiResponse });

            setCooldown(userId, 'chat');
            await sock.sendMessage(msg.key.remoteJid, { 
                text: aiResponse 
            });

        } catch (error) {
            logger.error('Error in gpt command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error processing your request: ' + error.message
            });
        }
    },

    imagine: async (sock, msg, args) => {
        return aiCommands.dalle(sock, msg, args);
    },

    txt2img: async (sock, msg, args) => {
        return aiCommands.dalle(sock, msg, args);
    },
    remini: async (sock, msg) => {
        const userId = msg.key.participant || msg.key.remoteJid;

        if (isOnCooldown(userId, 'image')) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Please wait a moment before using this command again.'
            });
        }

        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with .remini'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '🎨 Enhancing your image...'
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

            const replicate = new Replicate({
                auth: process.env.REPLICATE_API_TOKEN,
            });

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

            const enhancedImageUrl = output;
            const timestamp = Date.now();
            const outputPath = path.join(tempDir, `enhanced_${timestamp}.png`);

            const response = await axios.get(enhancedImageUrl, { responseType: 'arraybuffer' });
            await fs.writeFile(outputPath, response.data);

            await sock.sendMessage(msg.key.remoteJid, {
                image: fs.readFileSync(outputPath),
                caption: '✨ Here\'s your enhanced image!'
            });

            setCooldown(userId, 'image');
            await fs.remove(outputPath);

        } catch (error) {
            logger.error('Error in remini command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to enhance image: ' + error.message
            });
        }
    },
    cleargpt: async (sock, msg) => {
        const userId = msg.key.participant || msg.key.remoteJid;
        try {
            conversationHistory.delete(userId);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '🗑️ Conversation history cleared successfully!'
            });
        } catch (error) {
            logger.error('Error in cleargpt command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error clearing conversation history: ' + error.message
            });
        }
    },
    blackbox: async (sock, msg, args) => {
        const userId = msg.key.participant || msg.key.remoteJid;

        if (isOnCooldown(userId, 'chat')) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Please wait a few seconds before using this command again.'
            });
        }

        if (!args.length) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Please provide a code-related question!\nUsage: !blackbox <question>'
            });
        }

        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '💻 Generating code solution...'
            });

            const prompt = `You are an expert programmer. Please provide a code solution for the following request: ${args.join(' ')}. 
                          Include clear comments and error handling. Format the response as a code block with the appropriate language.`;

            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a coding assistant focused on providing clear, well-documented code solutions."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            });

            const code = response.choices[0].message.content.trim();
            await sock.sendMessage(msg.key.remoteJid, {
                text: `💡 *Code Solution*\n\n\`\`\`\n${code}\n\`\`\`\n\n⚠️ Remember to test the code and adjust it to your specific needs.`
            });

            setCooldown(userId, 'chat');

        } catch (error) {
            logger.error('Error in blackbox command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to generate code: ' + error.message
            });
        }
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
    },
    styleimg: async (sock, msg, args) => {
        const userId = msg.key.participant || msg.key.remoteJid;

        if (isOnCooldown(userId)) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Please wait a few seconds before using this command again.'
            });
        }

        const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMsg?.imageMessage || !args.length) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Please reply to an image with the desired style!\nUsage: !styleimg <style>\nExample: !styleimg anime'
            });
        }

        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '🎨 Applying style...'
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

            const style = args.join(' ');
            const response = await openai.images.edit({
                image: imageBuffer,
                prompt: `Transform this image in the style of ${style}`,
                n: 1,
                size: "1024x1024"
            });

            const styledImageUrl = response.data[0].url;
            const timestamp = Date.now();
            const outputPath = path.join(tempDir, `styled_${timestamp}.jpg`);

            // Download styled image
            const { data: styledImageBuffer } = await axios.get(styledImageUrl, { responseType: 'arraybuffer' });
            await fs.writeFile(outputPath, styledImageBuffer);

            await sock.sendMessage(msg.key.remoteJid, {
                image: fs.readFileSync(outputPath),
                caption: `✨ Image styled in ${style} style!`
            });

            setCooldown(userId);
            await fs.remove(outputPath);

        } catch (error) {
            logger.error('Error in styleimg command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to style image: ' + error.message
            });
        }
    },
    deepspeech: async (sock, msg) => {
        const userId = msg.key.participant || msg.key.remoteJid;

        if (isOnCooldown(userId)) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Please wait a few seconds before using this command again.'
            });
        }

        const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMsg?.audioMessage && !quotedMsg?.videoMessage) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Please reply to an audio or video message!'
            });
        }

        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '🎙️ Transcribing audio...'
            });

            const mediaBuffer = await downloadMediaMessage(
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

            const timestamp = Date.now();
            const audioPath = path.join(tempDir, `audio_${timestamp}.mp3`);
            await fs.writeFile(audioPath, mediaBuffer);

            const transcription = await openai.audio.transcriptions.create({
                file: fs.createReadStream(audioPath),
                model: "whisper-1"
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: `📝 *Transcription*\n\n${transcription.text}`
            });

            setCooldown(userId);
            await fs.remove(audioPath);

        } catch (error) {
            logger.error('Error in deepspeech command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to transcribe audio: ' + error.message
            });
        }
    },
    stable: async (sock, msg, args) => {
        const userId = msg.key.participant || msg.key.remoteJid;

        if (isOnCooldown(userId, 'image')) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Please wait a few seconds before using this command again.'
            });
        }

        if (!args.length) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Please provide a description!\nUsage: !stable <description>'
            });
        }

        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '🎨 Generating image with Stable Diffusion...'
            });

            const prompt = args.join(' ');

            // Use Stability-AI's SDXL model through Replicate
            const output = await replicate.run(
                "stability-ai/sdxl:a00d0b7dcbb9c3fbb34ba87d2d5b46c56969c84a628bf778a7fdaec30b1b99c5",
                {
                    input: {
                        prompt: prompt,
                        negative_prompt: "ugly, deformed, noisy, blurry, distorted, out of focus, bad anatomy, extra limbs, poorly drawn face, poorly drawn hands, missing fingers",
                        num_outputs: 1,
                        num_inference_steps: 25,
                        scheduler: "K_EULER",
                        guidance_scale: 7.5
                    }
                }
            );

            if (!output || !output[0]) {
                throw new Error('Failed to generate image');
            }

            const imageUrl = output[0];
            const timestamp = Date.now();
            const outputPath = path.join(tempDir, `stable_${timestamp}.png`);

            // Download the generated image
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            await fs.writeFile(outputPath, response.data);

            await sock.sendMessage(msg.key.remoteJid, {
                image: fs.readFileSync(outputPath),
                caption: `✨ Generated image for: "${prompt}"`
            });

            setCooldown(userId, 'image');
            await fs.remove(outputPath);

        } catch (error) {
            logger.error('Error in stable command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to generate image: ' + error.message
            });
        }
    },
    bardai: async (sock, msg, args) => {
        await sock.sendMessage(msg.key.remoteJid, {
            text: "🚧 Google Bard integration is currently under development. Please use !gpt for AI chat functionality."
        });
    },
    claude: async (sock, msg, args) => {
        await sock.sendMessage(msg.key.remoteJid, {
            text: "🚧 Claude AI integration is currently under development. Please use !gpt for AI chat functionality."
        });
    }
};

module.exports = aiCommands;