const config = require('../config');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const logger = require('pino')();
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');

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

            await sock.sendMessage(msg.key.remoteJid, {
                image: buffer,
                caption: '✅ Here\'s your image!'
            });

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
                mimetype: 'audio/mp4',
                caption: '✅ Here\'s your audio!'
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
    }
};

module.exports = mediaCommands;