const config = require('../config');
const logger = require('pino')();
const fs = require('fs-extra');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { ytmp3 } = require('../attached_assets/downloader-ytmp3');
const { ytmp4 } = require('../attached_assets/downloader-ytmp4');
const { fbdl } = require('../attached_assets/downloader-fbdl');
const { mediafire } = require('../attached_assets/downloader-mediafire');
const fetch = require('node-fetch');


const tempDir = path.join(__dirname, '../temp');
fs.ensureDirSync(tempDir);

// Download progress tracking
const downloadProgress = new Map();

// Rate limiting
const rateLimiter = new Map();
const RATE_LIMIT = 60000; // 1 minute

const isRateLimited = (userId) => {
    if (!rateLimiter.has(userId)) return false;
    return Date.now() - rateLimiter.get(userId) < RATE_LIMIT;
};

const setRateLimit = (userId) => {
    rateLimiter.set(userId, Date.now());
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
            if (isRateLimited(userId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ Please wait a minute before downloading another audio.'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing your request...'
            });

            const result = await ytmp3.download(args[0]);
            const tempFile = path.join(tempDir, `yt_${Date.now()}.mp3`);

            const fileStream = fs.createWriteStream(tempFile);
            const response = await fetch(result.url);
            await new Promise((resolve, reject) => {
                response.body.pipe(fileStream)
                    .on('finish', resolve)
                    .on('error', reject);
            });

            await sock.sendMessage(msg.key.remoteJid, {
                audio: { url: tempFile },
                mimetype: 'audio/mp4',
                fileName: `${result.title}.mp3`
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
            if (isRateLimited(userId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ Please wait a minute before downloading another video.'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing your request...'
            });

            const result = await ytmp4.download(args[0]);
            const tempFile = path.join(tempDir, `yt_${Date.now()}.mp4`);

            const fileStream = fs.createWriteStream(tempFile);
            const response = await fetch(result.url);
            await new Promise((resolve, reject) => {
                response.body.pipe(fileStream)
                    .on('finish', resolve)
                    .on('error', reject);
            });

            await sock.sendMessage(msg.key.remoteJid, {
                video: { url: tempFile },
                caption: result.title,
                fileName: `${result.title}.mp4`
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

            const userId = msg.key.participant || msg.key.remoteJid;
            if (isRateLimited(userId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ Please wait a minute before downloading another video.'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing your request...'
            });

            const result = await fbdl.download(args[0]);
            const tempFile = path.join(tempDir, `fb_${Date.now()}.mp4`);

            const fileStream = fs.createWriteStream(tempFile);
            const response = await fetch(result.url);
            await new Promise((resolve, reject) => {
                response.body.pipe(fileStream)
                    .on('finish', resolve)
                    .on('error', reject);
            });

            await sock.sendMessage(msg.key.remoteJid, {
                video: { url: tempFile },
                caption: result.title || '📱 Facebook Video'
            });

            setRateLimit(userId);
            await cleanupTempFiles(tempFile);

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

            const userId = msg.key.participant || msg.key.remoteJid;
            if (isRateLimited(userId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ Please wait a minute before downloading another file.'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing your request...'
            });

            const result = await mediafire.download(args[0]);
            const tempFile = path.join(tempDir, result.filename);

            const fileStream = fs.createWriteStream(tempFile);
            const response = await fetch(result.url);
            await new Promise((resolve, reject) => {
                response.body.pipe(fileStream)
                    .on('finish', resolve)
                    .on('error', reject);
            });

            await sock.sendMessage(msg.key.remoteJid, {
                document: { url: tempFile },
                mimetype: result.mime,
                fileName: result.filename
            });

            setRateLimit(userId);
            await cleanupTempFiles(tempFile);

        } catch (error) {
            logger.error('Error in mediafire command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error downloading file: ' + error.message
            });
        }
    }
};

module.exports = downloaderCommands;