const config = require('../config');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const logger = require('pino')();
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const gtts = require('node-gtts');

// Ensure temp directory exists
const tempDir = path.join(__dirname, '../temp');
fs.ensureDirSync(tempDir);

// Helper function to convert image to WebP using Python script
const convertToWebp = async (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        const pythonScript = path.join(__dirname, '../scripts/convert_sticker.py');
        exec(`python3 "${pythonScript}" "${inputPath}" "${outputPath}"`, (error, stdout, stderr) => {
            if (error) {
                logger.error('Python conversion error:', error);
                logger.error('stderr:', stderr);
                reject(error);
            } else {
                resolve();
            }
        });
    });
};

const mediaCommands = {
    sticker: async (sock, msg, args) => {
        try {
            // Check if media is attached
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg || (!quotedMsg.imageMessage && !quotedMsg.videoMessage)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image or video with !sticker'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Creating sticker...'
            });

            // Get the message type and quoted message
            const isVideo = !!quotedMsg.videoMessage;
            const messageType = isVideo ? 'videoMessage' : 'imageMessage';

            // Download media using Baileys downloadMediaMessage
            const buffer = await downloadMediaMessage(
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

            // Create temp file paths
            const inputPath = path.join(tempDir, `input.${isVideo ? 'mp4' : 'jpg'}`);
            const outputPath = path.join(tempDir, 'output.webp');

            // Write buffer to file
            await fs.writeFile(inputPath, buffer);

            // If it's a video, extract first frame
            if (isVideo) {
                await new Promise((resolve, reject) => {
                    ffmpeg(inputPath)
                        .screenshots({
                            timestamps: ['00:00:00'],
                            filename: 'frame.jpg',
                            folder: tempDir
                        })
                        .on('end', resolve)
                        .on('error', reject);
                });
                await fs.unlink(inputPath);
                await fs.move(path.join(tempDir, 'frame.jpg'), inputPath);
            }

            // Convert to WebP using Python script
            await convertToWebp(inputPath, outputPath);

            // Read the WebP file
            const webpBuffer = await fs.readFile(outputPath);

            // Send the sticker
            await sock.sendMessage(msg.key.remoteJid, {
                sticker: webpBuffer,
                mimetype: 'image/webp'
            });

            // Cleanup temp files
            await fs.remove(inputPath);
            await fs.remove(outputPath);

        } catch (error) {
            logger.error('Error in sticker command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to create sticker: ' + error.message
            });
        }
    },

    toimg: async (sock, msg) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.stickerMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to a sticker with !toimg'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Converting sticker to image...'
            });

            const buffer = await downloadMediaMessage(
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

            // Create temp file paths
            const inputPath = path.join(tempDir, 'input.webp');
            const outputPath = path.join(tempDir, 'output.png');

            // Write buffer to file
            await fs.writeFile(inputPath, buffer);

            // Convert WebP to PNG using Python script
            await new Promise((resolve, reject) => {
                exec(`python3 -c "from PIL import Image; Image.open('${inputPath}').convert('RGBA').save('${outputPath}', 'PNG')"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            // Read and send the PNG file
            const pngBuffer = await fs.readFile(outputPath);
            await sock.sendMessage(msg.key.remoteJid, {
                image: pngBuffer,
                caption: '✅ Here\'s your image!'
            });

            // Cleanup temp files
            await fs.remove(inputPath);
            await fs.remove(outputPath);

        } catch (error) {
            logger.error('Error in toimg command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to convert sticker: ' + error.message
            });
        }
    },

    tomp3: async (sock, msg) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.videoMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to a video with !tomp3'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Converting video to audio...'
            });

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.mp4');
            const tempOutput = path.join(tempDir, 'output.mp3');

            await fs.writeFile(tempInput, buffer);

            await new Promise((resolve, reject) => {
                ffmpeg(tempInput)
                    .toFormat('mp3')
                    .on('end', resolve)
                    .on('error', reject)
                    .save(tempOutput);
            });

            const audioBuffer = await fs.readFile(tempOutput);

            await sock.sendMessage(msg.key.remoteJid, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                ptt: false
            });

            // Cleanup temp files
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in tomp3 command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to convert video: ' + error.message
            });
        }
    },

    tovn: async (sock, msg) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.audioMessage && !quotedMsg?.videoMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an audio or video with !tovn'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Converting to voice note...'
            });

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.mp3');
            const tempOutput = path.join(tempDir, 'output.opus');

            await fs.writeFile(tempInput, buffer);

            // Convert to opus format
            await new Promise((resolve, reject) => {
                ffmpeg(tempInput)
                    .toFormat('opus')
                    .on('end', resolve)
                    .on('error', reject)
                    .save(tempOutput);
            });

            const audioBuffer = await fs.readFile(tempOutput);

            await sock.sendMessage(msg.key.remoteJid, {
                audio: audioBuffer,
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in tovn command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to convert to voice note: ' + error.message
            });
        }
    },

    tts: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide text to convert to speech!\nUsage: !tts [text]'
                });
            }

            const text = args.join(' ');
            const outputPath = path.join(tempDir, 'tts.mp3');

            // Create TTS in specified language (default to English)
            const tts = new gtts('en');
            await new Promise((resolve, reject) => {
                tts.save(outputPath, text, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            const audioBuffer = await fs.readFile(outputPath);
            await sock.sendMessage(msg.key.remoteJid, {
                audio: audioBuffer,
                mimetype: 'audio/mp3',
                ptt: true
            });

            await fs.remove(outputPath);

        } catch (error) {
            logger.error('Error in tts command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to convert text to speech: ' + error.message
            });
        }
    },

    quotely: async (sock, msg) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.conversation && !quotedMsg?.extendedTextMessage?.text) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to a text message with !quotely'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Creating quote sticker...'
            });

            const text = quotedMsg.conversation || quotedMsg.extendedTextMessage.text;
            const sender = msg.message.extendedTextMessage.contextInfo.participant || msg.key.remoteJid;

            // Create quote image using Python
            const pythonScript = path.join(__dirname, '../scripts/create_quote.py');
            const outputPath = path.join(tempDir, 'quote.webp');

            await new Promise((resolve, reject) => {
                exec(`python3 "${pythonScript}" "${text}" "${sender}" "${outputPath}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const stickerBuffer = await fs.readFile(outputPath);
            await sock.sendMessage(msg.key.remoteJid, {
                sticker: stickerBuffer
            });

            await fs.remove(outputPath);

        } catch (error) {
            logger.error('Error in quotely command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to create quote sticker: ' + error.message
            });
        }
    },

    emojimix: async (sock, msg, args) => {
        try {
            if (args.length !== 2) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide exactly 2 emojis!\nUsage: !emojimix 😎 🤔'
                });
            }

            const [emoji1, emoji2] = args;

            // Check if inputs are actually emojis
            const emojiRegex = /\p{Emoji}/u;
            if (!emojiRegex.test(emoji1) || !emojiRegex.test(emoji2)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide valid emojis!'
                });
            }

            const tempOutput = path.join(tempDir, 'emoji_mix.png');

            // Convert emojis to images and blend them using ImageMagick
            await new Promise((resolve, reject) => {
                const command = `convert -size 512x512 -background none -gravity center -fill black ` +
                    `label:"${emoji1}" \\( label:"${emoji2}" -compose over -composite \\) -colorspace RGB "${tempOutput}"`;
                exec(command, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                image: outputBuffer,
                caption: `✨ Mixed ${emoji1} with ${emoji2}`
            });

            // Cleanup
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in emojimix command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to mix emojis: ' + error.message
            });
        }
    },

    emoji2img: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide an emoji!\nUsage: !emoji2img 😎'
                });
            }

            const emoji = args[0];

            // Check if input is actually an emoji
            const emojiRegex = /\p{Emoji}/u;
            if (!emojiRegex.test(emoji)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a valid emoji!'
                });
            }

            const tempOutput = path.join(tempDir, 'emoji.png');

            // Convert emoji to large image using ImageMagick
            await new Promise((resolve, reject) => {
                exec(`convert -size 512x512 -background none -gravity center label:"${emoji}" -resize 512x512 "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                image: outputBuffer,
                caption: `🖼️ Converted ${emoji} to image`
            });

            // Cleanup
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in emoji2img command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to convert emoji: ' + error.message
            });
        }
    },

    colong: async (sock, msg) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.stickerMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to a sticker with !colong'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing sticker...'
            });

            const buffer = await downloadMediaMessage(
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

            // Send the sticker with default metadata
            await sock.sendMessage(msg.key.remoteJid, {
                sticker: buffer,
                mimetype: 'image/webp'
            });

        } catch (error) {
            logger.error('Error in colong command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to process sticker: ' + error.message
            });
        }
    },

    take: async (sock, msg, args) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.stickerMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to a sticker with !take [name] [author]'
                });
            }

            const packname = args[0] || config.botName;
            const author = args[1] || config.ownerName;

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing sticker...'
            });

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.webp');
            const tempOutput = path.join(tempDir, 'output.webp');
            await fs.writeFile(tempInput, buffer);

            // Add metadata using exiftool
            await new Promise((resolve, reject) => {
                exec(`exiftool -overwrite_original -PackageName="${packname}" -Author="${author}" "${tempInput}" -o "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                sticker: outputBuffer,
                mimetype: 'image/webp'
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in take command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to process sticker: ' + error.message
            });
        }
    },

    smeme: async (sock, msg, args) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage || !args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !smeme text1|text2'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Creating meme sticker...'
            });

            const [topText, bottomText = ''] = args.join(' ').split('|');

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.jpg');
            const tempOutput = path.join(tempDir, 'output.webp');
            await fs.writeFile(tempInput, buffer);

            // Generate meme using ImageMagick
            await new Promise((resolve, reject) => {
                exec(`convert "${tempInput}" -font Impact -pointsize 50 -gravity north -annotate +0+20 "${topText}" -gravity south -annotate +0+20 "${bottomText}" "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                sticker: outputBuffer,
                mimetype: 'image/webp'
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in smeme command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to create meme sticker: ' + error.message
            });
        }
    },

    ttp: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide text!\nUsage: !ttp text'
                });
            }

            const text = args.join(' ');
            const tempOutput = path.join(tempDir, 'output.webp');

            // Generate text image using ImageMagick
            await new Promise((resolve, reject) => {
                exec(`convert -size 512x512 xc:transparent -font Arial -pointsize 72 -gravity center -fill white -annotate +0+0 "${text}" "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                sticker: outputBuffer,
                mimetype: 'image/webp'
            });

            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in ttp command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to create text sticker: ' + error.message
            });
        }
    },

    attp: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide text!\nUsage: !attp text'
                });
            }

            const text = args.join(' ');
            const tempDir = path.join(__dirname, '../temp');
            const framesDir = path.join(tempDir, 'frames');
            await fs.ensureDir(framesDir);

            // Generate animated text frames using ImageMagick
            await new Promise((resolve, reject) => {
                exec(`convert -size 512x512 -font Arial -pointsize 72 -gravity center -fill white ( +clone -background none -fill white -annotate +0+0 "${text}" ) -compose over -composite -dispose previous -delay 10 -loop 0 "${path.join(framesDir, 'frame%d.gif')}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            // Combine frames into animated WebP
            const outputPath = path.join(tempDir, 'output.webp');
            await new Promise((resolve, reject) => {
                exec(`ffmpeg -i "${path.join(framesDir, 'frame%d.gif')}" -vf "scale=512:512" -c:v libwebp -lossless 1 -q:v 60 -preset default -loop 0 -an -vsync 0 "${outputPath}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(outputPath);
            await sock.sendMessage(msg.key.remoteJid, {
                sticker: outputBuffer,
                mimetype: 'image/webp'
            });

            // Cleanup
            await fs.remove(framesDir);
            await fs.remove(outputPath);

        } catch (error) {
            logger.error('Error in attp command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to create animated text sticker: ' + error.message
            });
        }
    },

    blur: async (sock, msg) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !blur'
                });
            }

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.jpg');
            const tempOutput = path.join(tempDir, 'output.jpg');
            await fs.writeFile(tempInput, buffer);

            // Apply blur effect using ImageMagick
            await new Promise((resolve, reject) => {
                exec(`convert "${tempInput}" -blur 0x8 "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                image: outputBuffer,
                caption: '✨ Image blurred!'
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in blur command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to blur image: ' + error.message
            });
        }
    },

    circle: async (sock, msg) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !circle'
                });
            }

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.png');
            const tempOutput = path.join(tempDir, 'output.png');
            await fs.writeFile(tempInput, buffer);

            // Create circular mask using ImageMagick
            await new Promise((resolve, reject) => {
                exec(`convert "${tempInput}" ( +clone -alpha extract -draw 'circle 50%,50% 50%,0' ) -alpha off -compose CopyOpacity -composite "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                image: outputBuffer,
                caption: '✨ Image circled!'
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in circle command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to circle image: ' + error.message
            });
        }
    },

    gif: async (sock, msg, args) => {
        try {
            const validGifs = [
                'slap', 'hug', 'pat', 'dance', 'kill', 'highfive', 'facepalm',
                'poke', 'cuddle', 'yeet', 'boop', 'bonk', 'trash', 'wave',
                'kiss', 'wink', 'punch'
            ];

            if (!args.length || !validGifs.includes(args[0].toLowerCase())) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Please specify a valid GIF type!\nAvailable types: ${validGifs.join(', ')}\nUsage: !gif <type> [mention]`
                });
            }

            const gifType = args[0].toLowerCase();
            const mentionedJid = msg.message.extendedTextMessage?.contextInfo?.participant ||
                                msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

            const gifPath = path.join(__dirname, `../media/anime-${gifType}.gif`);
            if (!fs.existsSync(gifPath)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ GIF not found!'
                });
            }

            // Generate caption based on mention
            let caption = '';
            if (mentionedJid) {
                const senderName = msg.pushName || 'Someone';
                caption = `*${senderName}* ${gifType}s @${mentionedJid.split('@')[0]}`;
            }

            await sock.sendMessage(msg.key.remoteJid, {
                video: fs.readFileSync(gifPath),
                caption: caption,
                gifPlayback: true,
                mentions: mentionedJid ? [mentionedJid] : undefined
            });

        } catch (error) {
            logger.error('Error in gif command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to send GIF: ' + error.message
            });
        }
    },

    jail: async (sock, msg) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !jail'
                });
            }

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.jpg');
            const tempOutput = path.join(tempDir, 'output.jpg');
            const jailOverlay = path.join(__dirname, '../media/jail.gif');
            await fs.writeFile(tempInput, buffer);

            // Apply jail effect using ImageMagick
            await new Promise((resolve, reject) => {
                exec(`convert "${tempInput}" -colorspace gray \\( "${jailOverlay}" -resize $(identify -format "%wx%h" "${tempInput}") \\) -composite "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                image: outputBuffer,
                caption: '🏢 Jailed!'
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in jail command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to jail image: ' + error.message
            });
        }
    },

    triggered: async (sock, msg) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !triggered'
                });
            }

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.jpg');
            const tempOutput = path.join(tempDir, 'output.gif');
            const triggeredGif = path.join(__dirname, '../media/triggered.gif');
            await fs.writeFile(tempInput, buffer);

            // Create triggered animation using ImageMagick
            await new Promise((resolve, reject) => {
                const command = `convert -size $(identify -format "%wx%h" "${tempInput}") xc:red -fill white -gravity center ` +
                              `-pointsize 72 -annotate 0 "TRIGGERED" miff:- | ` +
                              `convert "${tempInput}" -colorsspace gray-contrast -contrast \\( -clone 0 -fill "#ff000088" -colorize 100 \\) ` +
                              `\\( -clone 0 -roll +5+5 \\) -delete 0 -reverse -set delay 5 -loop 0 "${tempOutput}"`;
                exec(command, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                video: outputBuffer,
                caption: '😠 TRIGGERED!',
                gifPlayback: true
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in triggered command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to create triggered GIF: ' + error.message
            });
        }
    },

    wasted: async (sock, msg) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !wasted'
                });
            }

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.jpg');
            const tempOutput = path.join(tempDir, 'output.gif');
            const wastedGif = path.join(__dirname, '../media/wasted.gif');
            await fs.writeFile(tempInput, buffer);

            // Create wasted effect using ImageMagick
            await new Promise((resolve, reject) => {
                const command = `convert "${tempInput}" -colorspace gray -contrast-stretch 0 ` +
                              `\\( "${wastedGif}" -resize $(identify -format "%wx%h" "${tempInput}") \\) ` +
                              `-gravity center -composite "${tempOutput}"`;
                exec(command, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                video: outputBuffer,
                caption: '💀 WASTED!',
                gifPlayback: true
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in wasted command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to create wasted GIF: ' + error.message
            });
        }
    },

    filter: async (sock, msg, args) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !filter <type>\nAvailable filters: sepia, grayscale, negative, vintage'
                });
            }

            const filterType = args[0]?.toLowerCase() || 'sepia';
            const validFilters = ['sepia', 'grayscale', 'negative', 'vintage'];
            if (!validFilters.includes(filterType)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Invalid filter type! Available filters: sepia, grayscale, negative, vintage'
                });
            }

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.jpg');
            const tempOutput = path.join(tempDir, 'output.jpg');
            await fs.writeFile(tempInput, buffer);

            // Apply filter effect using ImageMagick
            const filterCommands = {
                sepia: `-sepia-tone 80%`,
                grayscale: `-colorspace gray`,
                negative: `-negate`,
                vintage: `-modulate 100,50,100 -colorize 20,0,20`
            };

            await new Promise((resolve, reject) => {
                exec(`convert "${tempInput}" ${filterCommands[filterType]} "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                image: outputBuffer,
                caption: `🎨 ${filterType.charAt(0).toUpperCase() + filterType.slice(1)} filter applied!`
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in filter command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to apply filter: ' + error.message
            });
        }
    },

    invert: async (sock, msg) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !invert'
                });
            }

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.jpg');
            const tempOutput = path.join(tempDir, 'output.jpg');
            await fs.writeFile(tempInput, buffer);

            // Apply color inversion using ImageMagick
            await new Promise((resolve, reject) => {
                exec(`convert "${tempInput}" -negate "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                image: outputBuffer,
                caption: '🔄 Colors inverted!'
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in invert command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to invert colors: ' + error.message
            });
        }
    },
    gay: async (sock, msg) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !gay'
                });
            }

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.png');
            const tempOutput = path.join(tempDir, 'output.png');
            await fs.writeFile(tempInput, buffer);

            // Create rainbow overlay effect usingImageMagick
            await new Promise((resolve, reject) => {
                exec(`convert "${tempInput}" \( +clone -colorspace HSB -separate +channel \) -background rainbow -compose overlay -composite "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                image: outputBuffer,
                caption: '🌈 Rainbow effect applied!'
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in gay command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to apply effect: ' + error.message
            });
        }
    },

    trash: async (sock, msg) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !trash'
                });
            }

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.png');
            const tempOutput = path.join(tempDir, 'output.png');
            const trashOverlay = path.join(__dirname, '../assets/trash_overlay.png');
            await fs.writeFile(tempInput, buffer);

            // Create trash effect using ImageMagick
            await new Promise((resolve, reject) => {
                exec(`convert "${tempInput}" -modulate 100,50,100 \\( "${trashOverlay}" -resize $(identify -format "%wx%h" "${tempInput}") \\) -gravity center -composite "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                image: outputBuffer,
                caption: '🗑️ Trash effect applied!'
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in trash command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to apply effect: ' + error.message
            });
        }
    },

    rip: async (sock, msg) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !rip'
                });
            }

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.png');
            const tempOutput = path.join(tempDir, 'output.png');
            const ripOverlay = path.join(__dirname, '../assets/rip_overlay.png');
            await fs.writeFile(tempInput, buffer);

            // Create RIP effect using ImageMagick
            await new Promise((resolve, reject) => {
                exec(`convert "${tempInput}" -colorspace gray \\( "${ripOverlay}" -resize $(identify -format "%wx%h" "${tempInput}") \\) -composite "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                image: outputBuffer,
                caption: '⚰️ RIP effect applied!'
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in rip command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to apply effect: ' + error.message
            });
        }
    },

    beautiful: async (sock, msg) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !beautiful'
                });
            }

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.png');
            const tempOutput = path.join(tempDir, 'output.png');
            const template = path.join(__dirname, '../assets/beautiful_template.png');
            await fs.writeFile(tempInput, buffer);

            // Create beautiful meme effect using ImageMagick
            await new Promise((resolve, reject) => {
                exec(`convert "${template}" \\( "${tempInput}" -resize 400x400^ -gravity center -extent 400x400 \\) -geometry +0+0 -composite "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                image: outputBuffer,
                caption: '✨ Beautiful meme created!'
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in beautiful command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to create meme: ' + error.message
            });
        }
    },
    invert: async (sock, msg) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !invert'
                });
            }

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.jpg');
            const tempOutput = path.join(tempDir, 'output.jpg');
            await fs.writeFile(tempInput, buffer);

            // Apply color inversion using ImageMagick
            await new Promise((resolve, reject) => {
                exec(`convert "${tempInput}" -negate "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                image: outputBuffer,
                caption: '🔄 Colors inverted!'
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in invert command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to invert colors: ' + error.message
            });
        }
    },

    pixelate: async (sock, msg) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !pixelate'
                });
            }

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.png');
            const tempOutput = path.join(tempDir, 'output.png');
            await fs.writeFile(tempInput, buffer);

            // Create pixelated effect using ImageMagick
            await new Promise((resolve, reject) => {
                exec(`convert "${tempInput}" -scale 10% -scale 1000% "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                image: outputBuffer,
                caption: '🔲 Image pixelated!'
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in pixelate command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to pixelate image: ' + error.message
            });
        }
    },

    sepia: async (sock, msg) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !sepia'
                });
            }

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.png');
            const tempOutput = path.join(tempDir, 'output.png');
            await fs.writeFile(tempInput, buffer);

            // Create sepia effect using ImageMagick
            await new Promise((resolve, reject) => {
                exec(`convert "${tempInput}" -sepia-tone 80% "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                image: outputBuffer,
                caption: '🌅 Sepia effect applied!'
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in sepia command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to apply sepia effect: ' + error.message
            });
        }
    },

    wanted: async (sock, msg) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !wanted'
                });
            }

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.png');
            const tempOutput = path.join(tempDir, 'output.png');
            const wantedTemplate = path.join(__dirname, '../assets/wanted_template.png');
            await fs.writeFile(tempInput, buffer);

            // Create wanted poster effect using ImageMagick
            await new Promise((resolve, reject) => {
                exec(`convert "${tempInput}" -sepia-tone 80% \\( "${wantedTemplate}" -resize $(identify -format "%wx%h" "${tempInput}") \\) -gravity center -composite "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                image: outputBuffer,
                caption: '🤠 WANTED poster created!'
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in wanted command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to create wanted poster: ' + error.message
            });
        }
    },
    distort: async (sock, msg) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !distort'
                });
            }

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.png');
            const tempOutput = path.join(tempDir, 'output.png');
            await fs.writeFile(tempInput, buffer);

            // Create wave distortion effect using ImageMagick
            await new Promise((resolve, reject) => {
                exec(`convert "${tempInput}" -wave 20x150 "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                image: outputBuffer,
                caption: '🌊 Wave distortion applied!'
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in distort command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to apply distortion: ' + error.message
            });
        }
    },

    glitch: async (sock, msg) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !glitch'
                });
            }

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.png');
            const tempOutput = path.join(tempDir, 'output.png');
            await fs.writeFile(tempInput, buffer);

            // Create glitch effect using ImageMagick
            await new Promise((resolve, reject) => {
                exec(`convert "${tempInput}" -channel RGB -separate -insert 0 -evaluate-sequence add -colorspace sRGB "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                image: outputBuffer,
                caption: '🌈 Glitch effect applied!'
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in glitch command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to apply glitch effect: ' + error.message
            });
        }
    },

    artblur: async (sock, msg, args) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !artblur [intensity]\nExample: !artblur 10'
                });
            }

            const intensity = parseInt(args[0]) || 5;
            if (intensity < 1 || intensity > 20) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please use an intensity between 1 and 20'
                });
            }

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.png');
            const tempOutput = path.join(tempDir, 'output.png');
            await fs.writeFile(tempInput, buffer);

            // Create artistic blur effect using ImageMagick
            await new Promise((resolve, reject) => {
                exec(`convert "${tempInput}" -gaussian-blur 0x${intensity} "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                image: outputBuffer,
                caption: `🎨 Artistic blur applied (intensity: ${intensity})`
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in artblur command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to apply blur effect: ' + error.message
            });
        }
    },
    rotate: async (sock, msg, args) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !rotate <degrees>\nExample: !rotate 90'
                });
            }

            const degrees = parseInt(args[0]) || 90;
            if (degrees < -360 || degrees > 360) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please specify rotation between -360 and 360 degrees'
                });
            }

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.jpg');
            const tempOutput = path.join(tempDir, 'output.jpg');
            await fs.writeFile(tempInput, buffer);

            // Rotate image using ImageMagick
            await new Promise((resolve, reject) => {
                exec(`convert "${tempInput}" -rotate ${degrees} "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                image: outputBuffer,
                caption: `🔄 Image rotated ${degrees}°`
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in rotate command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to rotate image: ' + error.message
            });
        }
    },

    mirror: async (sock, msg, args) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !mirror <type>\nTypes: h (horizontal), v (vertical)'
                });
            }

            const type = args[0]?.toLowerCase() || 'h';
            if (!['h', 'v'].includes(type)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please specify mirror type: h (horizontal) or v (vertical)'
                });
            }

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.jpg');
            const tempOutput = path.join(tempDir, 'output.jpg');
            await fs.writeFile(tempInput, buffer);

            // Create mirror effect using ImageMagick
            const flipCommand = type === 'h' ? '-flop' : '-flip';
            await new Promise((resolve, reject) => {
                exec(`convert "${tempInput}" ${flipCommand} "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                image: outputBuffer,
                caption: `🪞 Image mirrored ${type === 'h' ? 'horizontally' : 'vertically'}`
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in mirror command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to mirror image: ' + error.message
            });
        }
    },

    crop: async (sock, msg, args) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !crop <width>x<height>\nExample: !crop 500x500'
                });
            }

            const dimensions = args[0]?.toLowerCase() || '500x500';
            const [width, height] = dimensions.split('x').map(Number);

            if (isNaN(width) || isNaN(height) || width < 1 || height < 1) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please specify valid dimensions (e.g., 500x500)'
                });
            }

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.jpg');
            const tempOutput = path.join(tempDir, 'output.jpg');
            await fs.writeFile(tempInput, buffer);

            // Crop image using ImageMagick
            await new Promise((resolve, reject) => {
                exec(`convert "${tempInput}" -gravity center -resize ${width}x${height}^ -extent ${width}x${height} "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                image: outputBuffer,
                caption: `✂️ Image cropped to ${width}x${height}`
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in crop command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to crop image: ' + error.message
            });
        }
    },
    sepia: async (sock, msg) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !sepia'
                });
            }

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.png');
            const tempOutput = path.join(tempDir, 'output.png');
            await fs.writeFile(tempInput, buffer);

            // Create sepia effect using ImageMagick
            await new Promise((resolve, reject) => {
                exec(`convert "${tempInput}" -sepia-tone 80% "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                image: outputBuffer,
                caption: '🌅 Sepia effect applied!'
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in sepia command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to apply sepia effect: ' + error.message
            });
        }
    },

    wanted: async (sock, msg) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !wanted'
                });
            }

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.png');
            const tempOutput = path.join(tempDir, 'output.png');
            const wantedTemplate = path.join(__dirname, '../assets/wanted_template.png');
            await fs.writeFile(tempInput, buffer);

            // Create wanted poster effect using ImageMagick
            await new Promise((resolve, reject) => {
                exec(`convert "${tempInput}" -sepia-tone 80% \\( "${wantedTemplate}" -resize $(identify -format "%wx%h" "${tempInput}") \\) -gravity center -composite "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                image: outputBuffer,
                caption: '🤠 WANTED poster created!'
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in wanted command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to create wanted poster: ' + error.message
            });
        }
    },
    distort: async (sock, msg) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !distort'
                });
            }

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.png');
            const tempOutput = path.join(tempDir, 'output.png');
            await fs.writeFile(tempInput, buffer);

            // Create wave distortion effect using ImageMagick
            await new Promise((resolve, reject) => {
                exec(`convert "${tempInput}" -wave 20x150 "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                image: outputBuffer,
                caption: '🌊 Wave distortion applied!'
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in distort command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to apply distortion: ' + error.message
            });
        }
    },

    glitch: async (sock, msg) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !glitch'
                });
            }

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.png');
            const tempOutput = path.join(tempDir, 'output.png');
            await fs.writeFile(tempInput, buffer);

            // Create glitch effect using ImageMagick
            await new Promise((resolve, reject) => {
                exec(`convert "${tempInput}" -channel RGB -separate -insert 0 -evaluate-sequence add -colorspace sRGB "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                image: outputBuffer,
                caption: '🌈 Glitch effect applied!'
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in glitch command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to apply glitch effect: ' + error.message
            });
        }
    },

    artblur: async (sock, msg, args) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !artblur [intensity]\nExample: !artblur 10'
                });
            }

            const intensity = parseInt(args[0]) || 5;
            if (intensity < 1 || intensity > 20) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please use an intensity between 1 and 20'
                });
            }

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.png');
            const tempOutput = path.join(tempDir, 'output.png');
            await fs.writeFile(tempInput, buffer);

            // Create artistic blur effect using ImageMagick
            await new Promise((resolve, reject) => {
                exec(`convert "${tempInput}" -gaussian-blur 0x${intensity} "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                image: outputBuffer,
                caption: `🎨 Artistic blur applied (intensity: ${intensity})`
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in artblur command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to apply blur effect: ' + error.message
            });
        }
    },
    rotate: async (sock, msg, args) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !rotate <degrees>\nExample: !rotate 90'
                });
            }

            const degrees = parseInt(args[0]) || 90;
            if (degrees < -360 || degrees > 360) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please specify rotation between -360 and 360 degrees'
                });
            }

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.jpg');
            const tempOutput = path.join(tempDir, 'output.jpg');
            await fs.writeFile(tempInput, buffer);

            // Rotate image using ImageMagick
            await new Promise((resolve, reject) => {
                exec(`convert "${tempInput}" -rotate ${degrees} "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                image: outputBuffer,
                caption: `🔄 Image rotated ${degrees}°`
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in rotate command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to rotate image: ' + error.message
            });
        }
    },

    mirror: async (sock, msg, args) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !mirror <type>\nTypes: h (horizontal), v (vertical)'
                });
            }

            const type = args[0]?.toLowerCase() || 'h';
            if (!['h', 'v'].includes(type)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please specify mirror type: h (horizontal) or v (vertical)'
                });
            }

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.jpg');
            const tempOutput = path.join(tempDir, 'output.jpg');
            await fs.writeFile(tempInput, buffer);

            // Create mirror effect using ImageMagick
            const flipCommand = type === 'h' ? '-flop' : '-flip';
            await new Promise((resolve, reject) => {
                exec(`convert "${tempInput}" ${flipCommand} "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                image: outputBuffer,
                caption: `🪞 Image mirrored ${type === 'h' ? 'horizontally' : 'vertically'}`
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in mirror command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to mirror image: ' + error.message
            });
        }
    },

    crop: async (sock, msg, args) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !crop <width>x<height>\nExample: !crop 500x500'
                });
            }

            const dimensions = args[0]?.toLowerCase() || '500x500';
            const [width, height] = dimensions.split('x').map(Number);

            if (isNaN(width) || isNaN(height) || width < 1 || height < 1) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please specify valid dimensions (e.g., 500x500)'
                });
            }

            const buffer = await downloadMediaMessage(
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

            const tempInput = path.join(tempDir, 'input.jpg');
            const tempOutput = path.join(tempDir, 'output.jpg');
            await fs.writeFile(tempInput, buffer);

            // Crop image using ImageMagick
            await new Promise((resolve, reject) => {
                exec(`convert "${tempInput}" -gravity center -resize ${width}x${height}^ -extent ${width}x${height} "${tempOutput}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            const outputBuffer = await fs.readFile(tempOutput);
            await sock.sendMessage(msg.key.remoteJid, {
                image: outputBuffer,
                caption: `✂️ Image cropped to ${width}x${height}`
            });

            // Cleanup
            await fs.remove(tempInput);
            await fs.remove(tempOutput);

        } catch (error) {
            logger.error('Error in crop command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to crop image: ' + error.message
            });
        }
    },

};

module.exports = mediaCommands;