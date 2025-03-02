const config = require('../config');
const logger = require('../utils/logger');
const fs = require('fs-extra');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const ytdl = require('@distube/ytdl-core');
const axios = require('axios');

const tempDir = path.join(__dirname, '../temp');
fs.ensureDirSync(tempDir);

// Rate limiting configuration
const userCooldowns = new Map();
const COOLDOWN_PERIOD = 60000; // 1 minute

const isOnCooldown = (userId) => {
    if (!userCooldowns.has(userId)) return false;
    return Date.now() - userCooldowns.get(userId) < COOLDOWN_PERIOD;
};

const setRateLimit = (userId) => {
    userCooldowns.set(userId, Date.now());
};

// Utility function to clean up temp files
const cleanupTempFiles = async (...files) => {
    for (const file of files) {
        try {
            await fs.remove(file);
        } catch (error) {
            logger.error('Error cleaning up temp file:', error);
        }
    }
};

const downloaderCommands = {
    ytmp3: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a YouTube URL!\nUsage: ${config.prefix}ytmp3 <url>`
                });
            }

            const userId = msg.key.participant || msg.key.remoteJid;
            if (isOnCooldown(userId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ Please wait a minute before downloading another audio.'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing your request...'
            });

            const videoInfo = await ytdl.getInfo(args[0]);
            const audioFormat = ytdl.chooseFormat(videoInfo.formats, { quality: 'highestaudio' });
            const tempFile = path.join(tempDir, `yt_${Date.now()}.mp3`);

            await new Promise((resolve, reject) => {
                ytdl(args[0], {
                    format: audioFormat,
                    filter: 'audioonly'
                })
                .pipe(fs.createWriteStream(tempFile))
                .on('finish', resolve)
                .on('error', reject);
            });

            await sock.sendMessage(msg.key.remoteJid, {
                audio: { url: tempFile },
                mimetype: 'audio/mp4',
                fileName: `${videoInfo.videoDetails.title}.mp3`
            });

            setRateLimit(userId);
            await cleanupTempFiles(tempFile);

        } catch (error) {
            logger.error('Error in ytmp3 command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error downloading audio: ' + error.message
            });
        }
    },

    ytmp4: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a YouTube URL!\nUsage: ${config.prefix}ytmp4 <url>`
                });
            }

            const userId = msg.key.participant || msg.key.remoteJid;
            if (isOnCooldown(userId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ Please wait a minute before downloading another video.'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing your request...'
            });

            const videoInfo = await ytdl.getInfo(args[0]);
            const videoFormat = ytdl.chooseFormat(videoInfo.formats, { quality: '18' }); // 360p
            const tempFile = path.join(tempDir, `yt_${Date.now()}.mp4`);

            await new Promise((resolve, reject) => {
                ytdl(args[0], {
                    format: videoFormat
                })
                .pipe(fs.createWriteStream(tempFile))
                .on('finish', resolve)
                .on('error', reject);
            });

            await sock.sendMessage(msg.key.remoteJid, {
                video: { url: tempFile },
                caption: videoInfo.videoDetails.title,
                fileName: `${videoInfo.videoDetails.title}.mp4`
            });

            setRateLimit(userId);
            await cleanupTempFiles(tempFile);

        } catch (error) {
            logger.error('Error in ytmp4 command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error downloading video: ' + error.message
            });
        }
    },

    facebook: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a Facebook URL!\nUsage: ${config.prefix}facebook <url>`
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: 'Facebook video download is temporarily unavailable. Please try again later.'
            });

        } catch (error) {
            logger.error('Error in facebook command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error downloading Facebook video: ' + error.message
            });
        }
    },

    mediafire: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a MediaFire URL!\nUsage: ${config.prefix}mediafire <url>`
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: 'MediaFire download is temporarily unavailable. Please try again later.'
            });

        } catch (error) {
            logger.error('Error in mediafire command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error downloading file: ' + error.message
            });
        }
    }
};

module.exports = downloaderCommands;