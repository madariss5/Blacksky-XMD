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
        try {
            await fs.ensureDir(this.mediaDir);
            await fs.ensureDir(this.tempDir);
            logger.info('Media and temp directories initialized');
        } catch (error) {
            logger.error('Error creating directories:', error);
            throw error;
        }
    }

    async convertGifToVideo(inputPath, outputPath) {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .outputOptions([
                    '-movflags faststart',
                    '-pix_fmt yuv420p',
                    '-c:v libx264',
                    '-profile:v baseline',
                    '-level 3.0',
                    '-preset ultrafast',
                    '-vf scale=w=320:h=-2,fps=24',
                    '-t 8',
                    '-an',
                    '-f mp4'
                ])
                .on('start', (commandLine) => {
                    logger.info('Starting FFmpeg:', { command: commandLine });
                })
                .on('progress', (progress) => {
                    logger.debug('Processing:', progress);
                })
                .on('end', () => {
                    logger.info('Conversion complete:', { output: outputPath });
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    logger.error('Conversion failed:', err);
                    reject(err);
                })
                .save(outputPath);
        });
    }

    async sendGifReaction(sock, msg, gifName, caption = '', mentions = []) {
        let tempFile = null;

        try {
            if (!gifName.endsWith('.gif')) {
                gifName = `${gifName}.gif`;
            }

            const gifPath = path.join(this.mediaDir, gifName);

            // Verify GIF exists and is valid
            const stats = await fs.stat(gifPath);
            if (stats.size === 0) {
                throw new Error(`GIF is empty: ${gifName}`);
            }

            logger.info('Processing GIF:', {
                name: gifName,
                size: stats.size,
                path: gifPath
            });

            // Create unique temp file
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(7);
            tempFile = path.join(this.tempDir, `${timestamp}_${random}.mp4`);

            // Convert and verify
            await this.convertGifToVideo(gifPath, tempFile);

            const videoStats = await fs.stat(tempFile);
            if (videoStats.size === 0) {
                throw new Error('Converted file is empty');
            }

            // Send as video message
            const buffer = await fs.readFile(tempFile);
            await sock.sendMessage(msg.key.remoteJid, {
                video: buffer,
                caption: caption,
                gifPlayback: true,
                mentions: mentions,
                mimetype: 'video/mp4'
            });

            return true;

        } catch (error) {
            logger.error('GIF reaction failed:', {
                error: error.message,
                gif: gifName
            });

            // Send fallback message
            await sock.sendMessage(msg.key.remoteJid, {
                text: `${caption} (GIF not available - ${error.message})`,
                mentions: mentions
            });
            return false;

        } finally {
            // Cleanup
            if (tempFile) {
                try {
                    await fs.remove(tempFile);
                } catch (err) {
                    logger.error('Cleanup failed:', err);
                }
            }
        }
    }
}

// Singleton instance
const mediaHandler = new MediaHandler();

module.exports = {
    mediaHandler,
    sendGifReaction: async (sock, msg, gifName, caption = '', mentions = []) => {
        return await mediaHandler.sendGifReaction(sock, msg, gifName, caption, mentions);
    }
};