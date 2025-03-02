const config = require('../config');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const logger = require('pino')();
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const ytdl = require('@distube/ytdl-core');
const yts = require('yt-search');
const sharp = require('sharp');

// Ensure temp directory exists
const tempDir = path.join(__dirname, '../temp');
fs.ensureDirSync(tempDir);

// Helper functions
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

const downloadMediaMessageWithLogging = async (messageInfo, type, options = {}, downloadOptions = {}) => {
    logger.info('Starting media download:', {
        type: type,
        messageType: Object.keys(messageInfo.message)[0],
        messageTimestamp: messageInfo.messageTimestamp
    });

    try {
        const buffer = await downloadMediaMessage(messageInfo, type, options, downloadOptions);
        logger.info('Media download completed successfully', {
            bufferSize: buffer.length
        });
        return buffer;
    } catch (error) {
        logger.error('Media download failed:', error);
        throw error;
    }
};

const executeImageMagick = async (command, inputPath, outputPath) => {
    logger.info('Executing ImageMagick command:', {
        command,
        input: inputPath,
        output: outputPath
    });

    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                logger.error('ImageMagick execution failed:', {
                    error,
                    stdout,
                    stderr
                });
                reject(error);
            } else {
                resolve();
            }
        });
    });
};

async function cleanupTempFiles(...filePaths) {
    for (const filePath of filePaths) {
        try {
            if (await fs.pathExists(filePath)) {
                await fs.remove(filePath);
                logger.info(`Cleaned up temp file: ${filePath}`);
            }
        } catch (error) {
            logger.error(`Failed to cleanup file ${filePath}:`, error);
        }
    }
}

// Media Commands Object
const mediaCommands = {
    meme: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '🎭 Fetching a random meme...'
            });

            const subreddits = ['memes', 'dankmemes', 'wholesomememes', 'me_irl'];
            const randomSubreddit = subreddits[Math.floor(Math.random() * subreddits.length)];

            const response = await axios.get(`https://www.reddit.com/r/${randomSubreddit}/random.json`);

            if (!response.data || !response.data[0]?.data?.children?.length) {
                throw new Error('Failed to fetch meme from Reddit');
            }

            const post = response.data[0].data.children[0].data;

            if (post.over_18 || !post.url) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Failed to get appropriate meme, please try again.'
                });
            }

            const mediaUrl = post.url;
            const isGif = mediaUrl.endsWith('.gif') || post.is_video;
            const title = post.title || 'Random Meme';

            if (isGif) {
                const timestamp = Date.now();
                const outputPath = path.join(tempDir, `meme_${timestamp}.mp4`);

                const mediaResponse = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
                await fs.writeFile(outputPath, mediaResponse.data);

                await sock.sendMessage(msg.key.remoteJid, {
                    video: fs.readFileSync(outputPath),
                    caption: `🎭 ${title}`,
                    gifPlayback: true
                });

                await fs.remove(outputPath);
            } else {
                await sock.sendMessage(msg.key.remoteJid, {
                    image: { url: mediaUrl },
                    caption: `🎭 ${title}`
                });
            }

        } catch (error) {
            logger.error('Error in meme command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to fetch meme: ' + error.message
            });
        }
    },

    sticker: async (sock, msg) => {
        const tempFiles = [];
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg || (!quotedMsg.imageMessage && !quotedMsg.videoMessage)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image or video with !sticker'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Creating sticker...'
            });

            const buffer = await downloadMediaMessageWithLogging(
                {
                    key: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMsg,
                    messageTimestamp: msg.messageTimestamp
                },
                'buffer'
            );

            const inputPath = path.join(tempDir, `input.${quotedMsg.videoMessage ? 'mp4' : 'jpg'}`);
            const outputPath = path.join(tempDir, 'output.webp');
            tempFiles.push(inputPath, outputPath);

            await fs.writeFile(inputPath, buffer);

            if (quotedMsg.videoMessage) {
                const framePath = path.join(tempDir, 'frame.jpg');
                tempFiles.push(framePath);

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

                await fs.move(framePath, inputPath, { overwrite: true });
            }

            await convertToWebp(inputPath, outputPath);

            const webpBuffer = await fs.readFile(outputPath);
            await sock.sendMessage(msg.key.remoteJid, {
                sticker: webpBuffer,
                mimetype: 'image/webp'
            });

        } catch (error) {
            logger.error('Error in sticker command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to create sticker: ' + error.message
            });
        } finally {
            await cleanupTempFiles(...tempFiles);
        }
    },

    toimg: async (sock, msg) => {
        const tempFiles = [];
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

            const buffer = await downloadMediaMessageWithLogging(
                {
                    key: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMsg,
                    messageTimestamp: msg.messageTimestamp
                },
                'buffer'
            );

            const inputPath = path.join(tempDir, 'input.webp');
            const outputPath = path.join(tempDir, 'output.png');
            tempFiles.push(inputPath, outputPath);

            await fs.writeFile(inputPath, buffer);

            await executeImageMagick(
                `convert "${inputPath}" "${outputPath}"`,
                inputPath,
                outputPath
            );

            const pngBuffer = await fs.readFile(outputPath);
            await sock.sendMessage(msg.key.remoteJid, {
                image: pngBuffer,
                caption: '✅ Here\'s your image!'
            });

        } catch (error) {
            logger.error('Error in toimg command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to convert sticker: ' + error.message
            });
        } finally {
            await cleanupTempFiles(...tempFiles);
        }
    },

    tomp3: async (sock, msg) => {
        const tempFiles = [];
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

            const buffer = await downloadMediaMessageWithLogging(
                {
                    key: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMsg,
                    messageTimestamp: msg.messageTimestamp
                },
                'buffer'
            );

            const inputPath = path.join(tempDir, 'input.mp4');
            const outputPath = path.join(tempDir, 'output.mp3');
            tempFiles.push(inputPath, outputPath);

            await fs.writeFile(inputPath, buffer);

            await new Promise((resolve, reject) => {
                ffmpeg(inputPath)
                    .toFormat('mp3')
                    .on('end', resolve)
                    .on('error', reject)
                    .save(outputPath);
            });

            const audioBuffer = await fs.readFile(outputPath);
            await sock.sendMessage(msg.key.remoteJid, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg'
            });

        } catch (error) {
            logger.error('Error in tomp3 command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to convert video: ' + error.message
            });
        } finally {
            await cleanupTempFiles(...tempFiles);
        }
    },

    tovn: async (sock, msg) => {
        const tempFiles = [];
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

            const buffer = await downloadMediaMessageWithLogging(
                {
                    key: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMsg,
                    messageTimestamp: msg.messageTimestamp
                },
                'buffer'
            );

            const inputPath = path.join(tempDir, 'input.mp3');
            const outputPath = path.join(tempDir, 'output.opus');
            tempFiles.push(inputPath, outputPath);

            await fs.writeFile(inputPath, buffer);

            await new Promise((resolve, reject) => {
                ffmpeg(inputPath)
                    .toFormat('opus')
                    .on('end', resolve)
                    .on('error', reject)
                    .save(outputPath);
            });

            const audioBuffer = await fs.readFile(outputPath);
            await sock.sendMessage(msg.key.remoteJid, {
                audio: audioBuffer,
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true
            });

        } catch (error) {
            logger.error('Error in tovn command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to convert to voice note: ' + error.message
            });
        } finally {
            await cleanupTempFiles(...tempFiles);
        }
    },

    video: async (sock, msg, args) => {
        const tempFiles = [];
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a video name or YouTube URL!\nUsage: !video <video name/URL>'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '🔍 Searching for your video...'
            });

            const query = args.join(' ');
            let videoUrl;

            if (query.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/)) {
                videoUrl = query;
            } else {
                const searchResults = await yts(query);
                if (!searchResults.videos.length) {
                    throw new Error('No videos found');
                }
                videoUrl = searchResults.videos[0].url;
            }

            const info = await ytdl.getInfo(videoUrl);
            const title = info.videoDetails.title;
            const thumbnail = info.videoDetails.thumbnails[0].url;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: thumbnail },
                caption: `🎥 Downloading: ${title}`
            });

            const outputPath = path.join(tempDir, `video_${Date.now()}.mp4`);
            tempFiles.push(outputPath);

            await new Promise((resolve, reject) => {
                ytdl(videoUrl, {
                    quality: 'highest',
                    filter: 'audioandvideo'
                })
                    .pipe(fs.createWriteStream(outputPath))
                    .on('finish', resolve)
                    .on('error', reject);
            });

            await sock.sendMessage(msg.key.remoteJid, {
                video: fs.readFileSync(outputPath),
                caption: `✅ ${title}`,
                mimetype: 'video/mp4'
            });

        } catch (error) {
            logger.error('Error in video command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to download video: ' + error.message
            });
        } finally {
            await cleanupTempFiles(...tempFiles);
        }
    },

    togif: async (sock, msg) => {
        const tempFiles = [];
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.stickerMessage || !quotedMsg.stickerMessage.isAnimated) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an animated sticker with !togif'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Converting to GIF...'
            });

            const buffer = await downloadMediaMessageWithLogging(
                {
                    key: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMsg,
                    messageTimestamp: msg.messageTimestamp
                },
                'buffer'
            );

            const inputPath = path.join(tempDir, 'input.webp');
            const outputPath = path.join(tempDir, 'output.gif');
            tempFiles.push(inputPath, outputPath);

            await fs.writeFile(inputPath, buffer);

            await executeImageMagick(
                `convert "${inputPath}" "${outputPath}"`,
                inputPath,
                outputPath
            );

            const gifBuffer = await fs.readFile(outputPath);
            await sock.sendMessage(msg.key.remoteJid, {
                video: gifBuffer,
                gifPlayback: true,
                caption: '✅ Here\'s your GIF!'
            });

        } catch (error) {
            logger.error('Error in togif command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to convert to GIF: ' + error.message
            });
        } finally {
            await cleanupTempFiles(...tempFiles);
        }
    },

    tourl: async (sock, msg) => {
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage && !quotedMsg?.videoMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image or video with !tourl'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Uploading media...'
            });

            const buffer = await downloadMediaMessageWithLogging(
                {
                    key: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMsg,
                    messageTimestamp: msg.messageTimestamp
                },
                'buffer'
            );

            // Upload to imgur
            const response = await axios.post('https://api.imgur.com/3/image', buffer, {
                headers: {
                    'Authorization': `Client-ID ${process.env.IMGUR_CLIENT_ID}`,
                    'Content-Type': 'application/octet-stream'
                }
            });

            if (!response.data?.data?.link) {
                throw new Error('Failed to upload to Imgur');
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ Media URL: ${response.data.data.link}`
            });

        } catch (error) {
            logger.error('Error in tourl command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to upload media: ' + error.message
            });
        }
    },

    cropimg: async (sock, msg) => {
        const tempFiles = [];
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !cropimg'
                });
            }

            const buffer = await downloadMediaMessageWithLogging(
                {
                    key: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMsg,
                    messageTimestamp: msg.messageTimestamp
                },
                'buffer'
            );

            const inputPath = path.join(tempDir, 'input.jpg');
            const outputPath = path.join(tempDir, 'output.jpg');
            tempFiles.push(inputPath, outputPath);

            await fs.writeFile(inputPath, buffer);

            // Use sharp to crop to square
            await sharp(inputPath)
                .resize(512, 512, {
                    fit: 'cover',
                    position: 'center'
                })
                .toFile(outputPath);

            const croppedBuffer = await fs.readFile(outputPath);
            await sock.sendMessage(msg.key.remoteJid, {
                image: croppedBuffer,
                caption: '✅ Here\'s your cropped image!'
            });

        } catch (error) {
            logger.error('Error in cropimg command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to crop image: ' + error.message
            });
        } finally {
            await cleanupTempFiles(...tempFiles);
        }
    },

    invert: async (sock, msg) => {
        const tempFiles = [];
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !invert'
                });
            }

            const buffer = await downloadMediaMessageWithLogging(
                {
                    key: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMsg,
                    messageTimestamp: msg.messageTimestamp
                },
                'buffer'
            );

            const inputPath = path.join(tempDir, 'input.jpg');
            const outputPath = path.join(tempDir, 'output.jpg');
            tempFiles.push(inputPath, outputPath);

            await fs.writeFile(inputPath, buffer);

            // Use sharp to invert colors
            await sharp(inputPath)
                .negate()
                .toFile(outputPath);

            const invertedBuffer = await fs.readFile(outputPath);
            await sock.sendMessage(msg.key.remoteJid, {
                image: invertedBuffer,
                caption: '✅ Here\'s your inverted image!'
            });

        } catch (error) {
            logger.error('Error in invert command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to invert image: ' + error.message
            });
        } finally {
            await cleanupTempFiles(...tempFiles);
        }
    },

    grayscale: async (sock, msg) => {
        const tempFiles = [];
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !grayscale'
                });
            }

            const buffer = await downloadMediaMessageWithLogging(
                {
                    key: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMsg,
                    messageTimestamp: msg.messageTimestamp
                },
                'buffer'
            );

            const inputPath = path.join(tempDir, 'input.jpg');
            const outputPath = path.join(tempDir, 'output.jpg');
            tempFiles.push(inputPath, outputPath);

            await fs.writeFile(inputPath, buffer);

            // Use sharp to convert to grayscale
            await sharp(inputPath)
                .grayscale()
                .toFile(outputPath);

            const grayBuffer = await fs.readFile(outputPath);
            await sock.sendMessage(msg.key.remoteJid, {
                image: grayBuffer,
                caption: '✅ Here\'s your grayscale image!'
            });

        } catch (error) {
            logger.error('Error in grayscale command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to convert to grayscale: ' + error.message
            });
        } finally {
            await cleanupTempFiles(...tempFiles);
        }
    },

    pixelate: async (sock, msg) => {
        const tempFiles = [];
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !pixelate'
                });
            }

            const buffer = await downloadMediaMessageWithLogging(
                {
                    key: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMsg,
                    messageTimestamp: msg.messageTimestamp
                },
                'buffer'
            );

            const inputPath = path.join(tempDir, 'input.jpg');
            const outputPath = path.join(tempDir, 'output.jpg');
            tempFiles.push(inputPath, outputPath);

            await fs.writeFile(inputPath, buffer);

            // Use sharp to pixelate
            await sharp(inputPath)
                .resize({ width: 32, height: 32, kernel: 'nearest' })
                .toFile(outputPath);

            const pixelatedBuffer = await fs.readFile(outputPath);
            await sock.sendMessage(msg.key.remoteJid, {
                image: pixelatedBuffer,
                caption: '✅ Here\'s your pixelated image!'
            });

        } catch (error) {
            logger.error('Error in pixelate command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to pixelate image: ' + error.message
            });
        } finally {
            await cleanupTempFiles(...tempFiles);
        }
    },

    rotate: async (sock, msg) => {
        const tempFiles = [];
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !rotate'
                });
            }

            const buffer = await downloadMediaMessageWithLogging(
                {
                    key: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMsg,
                    messageTimestamp: msg.messageTimestamp
                },
                'buffer'
            );

            const inputPath = path.join(tempDir, 'input.jpg');
            const outputPath = path.join(tempDir, 'output.jpg');
            tempFiles.push(inputPath, outputPath);

            await fs.writeFile(inputPath, buffer);

            // Use sharp to rotate 90 degrees
            await sharp(inputPath)
                .rotate(90)
                .toFile(outputPath);

            const rotatedBuffer = await fs.readFile(outputPath);
            await sock.sendMessage(msg.key.remoteJid, {
                image: rotatedBuffer,
                caption: '✅ Here\'s your rotated image!'
            });

        } catch (error) {
            logger.error('Error in rotate command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to rotate image: ' + error.message
            });
        } finally {
            await cleanupTempFiles(...tempFiles);
        }
    },

    blur: async (sock, msg) => {
        const tempFiles = [];
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !blur'
                });
            }

            const buffer = await downloadMediaMessageWithLogging(
                {
                    key: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMsg,
                    messageTimestamp: msg.messageTimestamp
                },
                'buffer'
            );

            const inputPath = path.join(tempDir, 'input.jpg');
            const outputPath = path.join(tempDir, 'output.jpg');
            tempFiles.push(inputPath, outputPath);

            await fs.writeFile(inputPath, buffer);

            // Use sharp to blur
            await sharp(inputPath)
                .blur(5)
                .toFile(outputPath);

            const blurredBuffer = await fs.readFile(outputPath);
            await sock.sendMessage(msg.key.remoteJid, {
                image: blurredBuffer,
                caption: '✅ Here\'s your blurred image!'
            });

        } catch (error) {
            logger.error('Error in blur command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to blur image: ' + error.message
            });
        } finally {
            await cleanupTempFiles(...tempFiles);
        }
    },

    circle: async (sock, msg) => {
        const tempFiles = [];
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.imageMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an image with !circle'
                });
            }

            const buffer = await downloadMediaMessageWithLogging(
                {
                    key: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMsg,
                    messageTimestamp: msg.messageTimestamp
                },
                'buffer'
            );

            const inputPath = path.join(tempDir, 'input.jpg');
            const outputPath = path.join(tempDir, 'output.png');
            tempFiles.push(inputPath, outputPath);

            await fs.writeFile(inputPath, buffer);

            // Use sharp to make circular
            await sharp(inputPath)
                .resize({ width: 512, height: 512 })
                .toFormat('png')
                .flatten({ background: '#ffffff' })
                .composite([{
                    input: inputPath,
                    blend: 'dest-in',
                    gravity: 'center',
                    left: 0,
                    top: 0,
                    radius: 256,
                }])
                .toFile(outputPath);

            const circularBuffer = await fs.readFile(outputPath);
            await sock.sendMessage(msg.key.remoteJid, {
                image: circularBuffer,
                caption: '✅ Here\'s your circular image!'
            });

        } catch (error) {
            logger.error('Error in circle command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to make image circular: ' + error.message
            });
        } finally {
            await cleanupTempFiles(...tempFiles);
        }
    },


    bass: async (sock, msg) => {
        const tempFiles = [];
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.audioMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an audio with !bass'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Enhancing bass...'
            });

            const buffer = await downloadMediaMessageWithLogging(
                {
                    key: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMsg,
                    messageTimestamp: msg.messageTimestamp
                },
                'buffer'
            );

            const inputPath = path.join(tempDir, 'input.mp3');
            const outputPath = path.join(tempDir, 'output.mp3');
            tempFiles.push(inputPath, outputPath);

            await fs.writeFile(inputPath, buffer);

            await new Promise((resolve, reject) => {
                ffmpeg(inputPath)
                    .audioFilters('bass=g=20')
                    .toFormat('mp3')
                    .on('end', resolve)
                    .on('error', reject)
                    .save(outputPath);
            });

            const audioBuffer = await fs.readFile(outputPath);
            await sock.sendMessage(msg.key.remoteJid, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg'
            });

        } catch (error) {
            logger.error('Error in bass command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to enhance bass: ' + error.message
            });
        } finally {
            await cleanupTempFiles(...tempFiles);
        }
    },

    nightcore: async (sock, msg) => {
        const tempFiles = [];
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.audioMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an audio with !nightcore'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Applying nightcore effect...'
            });

            const buffer = await downloadMediaMessageWithLogging(
                {
                    key: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMsg,
                    messageTimestamp: msg.messageTimestamp
                },
                'buffer'
            );

            const inputPath = path.join(tempDir, 'input.mp3');
            const outputPath = path.join(tempDir, 'output.mp3');
            tempFiles.push(inputPath, outputPath);

            await fs.writeFile(inputPath, buffer);

            await new Promise((resolve, reject) => {
                ffmpeg(inputPath)
                    .audioFilters('asetrate=44100*1.25,aresample=44100')
                    .toFormat('mp3')
                    .on('end', resolve)
                    .on('error', reject)
                    .save(outputPath);
            });

            const audioBuffer = await fs.readFile(outputPath);
            await sock.sendMessage(msg.key.remoteJid, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg'
            });

        } catch (error) {
            logger.error('Error in nightcore command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to apply nightcore effect: ' + error.message
            });
        } finally {
            await cleanupTempFiles(...tempFiles);
        }
    },

    slow: async (sock, msg) => {
        const tempFiles = [];
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.audioMessage) {
                returnawait sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an audio with !slow'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Slowing down audio...'
            });

            const buffer = await downloadMediaMessageWithLogging(
                {
                    key: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMsg,
                    messageTimestamp: msg.messageTimestamp
                },
                'buffer'
            );

            const inputPath = path.join(tempDir, 'input.mp3');
            const outputPath = path.join(tempDir, 'output.mp3');
            tempFiles.push(inputPath, outputPath);

            await fs.writeFile(inputPath, buffer);

            await new Promise((resolve, reject) => {
                ffmpeg(inputPath)
                    .audioFilters('atempo=0.8')
                    .toFormat('mp3')
                    .on('end', resolve)
                    .on('error', reject)
                    .save(outputPath);
            });

            const audioBuffer = await fs.readFile(outputPath);
            await sock.sendMessage(msg.key.remoteJid, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg'
            });

        } catch (error) {
            logger.error('Error in slow command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to slow down audio: ' + error.message
            });
        } finally {
            await cleanupTempFiles(...tempFiles);
        }
    },

    fast: async (sock, msg) => {
        const tempFiles = [];
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.audioMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an audio with !fast'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Speeding up audio...'
            });

            const buffer = await downloadMediaMessageWithLogging(
                {
                    key: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMsg,
                    messageTimestamp: msg.messageTimestamp
                },
                'buffer'
            );

            const inputPath = path.join(tempDir, 'input.mp3');
            const outputPath = path.join(tempDir, 'output.mp3');
            tempFiles.push(inputPath, outputPath);

            await fs.writeFile(inputPath, buffer);

            await new Promise((resolve, reject) => {
                ffmpeg(inputPath)
                    .audioFilters('atempo=1.5')
                    .toFormat('mp3')
                    .on('end', resolve)
                    .on('error', reject)
                    .save(outputPath);
            });

            const audioBuffer = await fs.readFile(outputPath);
            await sock.sendMessage(msg.key.remoteJid, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg'
            });

        } catch (error) {
            logger.error('Error in fast command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to speed up audio: ' + error.message
            });
        } finally {
            await cleanupTempFiles(...tempFiles);
        }
    },

    reverse: async (sock, msg) => {
        const tempFiles = [];
        try {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg?.audioMessage && !quotedMsg?.videoMessage) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please reply to an audio or video with !reverse'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Reversing media...'
            });

            const buffer = await downloadMediaMessageWithLogging(
                {
                    key: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMsg,
                    messageTimestamp: msg.messageTimestamp
                },
                'buffer'
            );

            const inputPath = path.join(tempDir, 'input.mp3');
            const outputPath = path.join(tempDir, 'output.mp3');
            tempFiles.push(inputPath, outputPath);

            await fs.writeFile(inputPath, buffer);

            await new Promise((resolve, reject) => {
                ffmpeg(inputPath)
                    .complexFilter('[0:a]areverse[a]')
                    .map('[a]')
                    .toFormat('mp3')
                    .on('end', resolve)
                    .on('error', reject)
                    .save(outputPath);
            });

            const audioBuffer = await fs.readFile(outputPath);
            await sock.sendMessage(msg.key.remoteJid, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg'
            });

        } catch (error) {
            logger.error('Error in reverse command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to reverse media: ' + error.message
            });
        } finally {
            await cleanupTempFiles(...tempFiles);
        }
    }
};

module.exports = mediaCommands;