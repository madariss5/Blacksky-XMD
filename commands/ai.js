const config = require('../config');
const logger = require('pino')();
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const OpenAI = require('openai');
const gtts = require('node-gtts');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const axios = require('axios'); // Added axios import for image download
const Replicate = require('replicate');
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

const tempDir = path.join(__dirname, '../temp');
fs.ensureDirSync(tempDir);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Rate limiting configuration 
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
        try {
            const userId = msg.key.participant || msg.key.remoteJid;

            if (isOnCooldown(userId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ Please wait a few seconds before using this command again.'
                });
            }

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: 'Please provide a question!\nUsage: .ask <your question>'
                });
            }

            // Send typing indicator
            await sock.sendPresenceUpdate('composing', msg.key.remoteJid);

            const userInput = args.join(' ');
            const response = await chatWithGPT(userId, userInput);

            setCooldown(userId);
            await sock.sendMessage(msg.key.remoteJid, { text: response });

        } catch (error) {
            logger.error('Error in ask command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error processing your request: ' + error.message
            });
        }
    },

    gpt: async (sock, msg, args) => {
        // Alias for ask command
        return aiCommands.ask(sock, msg, args);
    },

    cleargpt: async (sock, msg) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;
            const response = clearConversation(userId);
            await sock.sendMessage(msg.key.remoteJid, { text: response });
        } catch (error) {
            logger.error('Error in cleargpt command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error clearing conversation: ' + error.message
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

            // Use chatWithGPT for translation
            const prompt = `Translate the following text to ${targetLang}. Only respond with the translation, no explanations: ${textToTranslate}`;
            const translation = await chatWithGPT(userId, prompt);

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
    },
    tts: async (sock, msg, args) => {
        try {
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
                mimetype: 'audio/mp3',
                ptt: true // Play as voice note
            });

            setCooldown(userId);
            await fs.remove(audioPath);

        } catch (error) {
            logger.error('Error in tts command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to generate audio: ' + error.message
            });
        }
    },

    styleimg: async (sock, msg, args) => {
        try {
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
        try {
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
        try {
            const userId = msg.key.participant || msg.key.remoteJid;

            if (isOnCooldown(userId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ Please wait a few seconds before using this command again.'
                });
            }

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a description!\nUsage: !stable <description>'
                });
            }

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

            setCooldown(userId);
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
    },

    blackbox: async (sock, msg, args) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;

            if (isOnCooldown(userId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ Please wait a few seconds before using this command again.'
                });
            }

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a code-related question!\nUsage: !blackbox <question>'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '💻 Generating code solution...'
            });

            const prompt = `You are a coding assistant. Please provide a code solution for the following request: ${args.join(' ')}. 
                          Make the code concise and include brief comments. Only return code, no explanations.`;

            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            });

            const code = response.choices[0].message.content.trim();
            await sock.sendMessage(msg.key.remoteJid, {
                text: `💡 *Code Solution*\n\n\`\`\`\n${code}\n\`\`\``
            });

            setCooldown(userId);

        } catch (error) {
            logger.error('Error in blackbox command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to generate code: ' + error.message
            });
        }
    }
};

module.exports = aiCommands;