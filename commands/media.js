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
    }
};

module.exports = mediaCommands;