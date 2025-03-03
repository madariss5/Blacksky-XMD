const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const logger = require('./logger');

class MediaHandler {
    constructor() {
        this.mediaDir = path.join(__dirname, '../media');
        this.tempDir = path.join(__dirname, '../temp');
        this.initializeDirs();
    }

    async initializeDirs() {
        await fs.ensureDir(this.mediaDir);
        await fs.ensureDir(this.tempDir);
    }

    async convertGifToVideo(inputPath, outputPath) {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .outputOptions([
                    '-movflags faststart',
                    '-pix_fmt yuv420p',
                    '-c:v libx264',
                    '-profile:v baseline',
                    '-preset ultrafast',
                    '-tune zerolatency',
                    '-vf scale=w=320:h=-2',
                    '-r 24',
                    '-t 8',
                    '-an',
                    '-f mp4'
                ])
                .on('end', () => resolve(outputPath))
                .on('error', (err) => {
                    logger.error('Error converting GIF:', err);
                    reject(err);
                })
                .save(outputPath);
        });
    }

    async sendGifReaction(sock, msg, gifName, caption = '', mentions = []) {
        let tempFile = null;
        try {
            // Remove 'anime-' prefix if present and ensure .gif extension
            const cleanGifName = gifName.replace('anime-', '').replace(/\.gif$/, '') + '.gif';
            const gifPath = path.join(this.mediaDir, cleanGifName);

            // Log the path being checked
            logger.info(`Checking for GIF at path: ${gifPath}`);

            // Check if GIF exists and has content
            if (!await fs.pathExists(gifPath)) {
                logger.warn(`GIF not found: ${gifPath}`);
                await sock.sendMessage(msg.key.remoteJid, {
                    text: caption,
                    mentions
                });
                return false;
            }

            // Quick file check
            const buffer = await fs.readFile(gifPath);
            if (!buffer.length) {
                logger.error('Invalid GIF file - zero length');
                throw new Error('Invalid GIF file');
            }

            // Create temp file with timestamp to avoid conflicts
            tempFile = path.join(this.tempDir, `${Date.now()}.mp4`);
            await this.convertGifToVideo(gifPath, tempFile);

            // Log success of conversion
            logger.info(`Successfully converted GIF to video: ${tempFile}`);

            // Send message
            await sock.sendMessage(msg.key.remoteJid, {
                video: await fs.readFile(tempFile),
                caption,
                gifPlayback: true,
                mentions,
                mimetype: 'video/mp4'
            });

            return true;
        } catch (error) {
            logger.error('Error in sendGifReaction:', error);
            // Improved error handling - always send the caption
            if (tempFile) await fs.remove(tempFile).catch(() => {});
            await sock.sendMessage(msg.key.remoteJid, {
                text: caption,
                mentions
            });
            return false;
        } finally {
            // Cleanup temp file
            if (tempFile) await fs.remove(tempFile).catch(() => {});
        }
    }
}

const mediaHandler = new MediaHandler();

module.exports = {
    mediaHandler,
    sendGifReaction: (sock, msg, gifName, caption = '', mentions = []) =>
        mediaHandler.sendGifReaction(sock, msg, gifName, caption, mentions)
};