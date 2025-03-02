const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const logger = require('./logger');
const axios = require('axios');

class MediaHandler {
    constructor() {
        this.mediaDir = path.join(process.cwd(), 'media');
        this.tempDir = path.join(process.cwd(), 'temp');
        this.initializeDirs();
    }

    async initializeDirs() {
        try {
            await fs.ensureDir(this.mediaDir);
            await fs.ensureDir(this.tempDir);
            logger.info('Media and temp directories initialized:', {
                mediaDir: this.mediaDir,
                tempDir: this.tempDir
            });
        } catch (error) {
            logger.error('Error creating directories:', error);
            throw error;
        }
    }

    async convertGifToMp4(gifPath) {
        try {
            const mp4Path = path.join(this.tempDir, `${Date.now()}.mp4`);
            logger.info('Converting GIF to MP4:', { input: gifPath, output: mp4Path });

            // Verify input file exists and has content
            if (!fs.existsSync(gifPath)) {
                throw new Error(`GIF file not found: ${gifPath}`);
            }

            const stats = await fs.stat(gifPath);
            if (stats.size === 0) {
                throw new Error(`GIF file is empty: ${gifPath}`);
            }

            return new Promise((resolve, reject) => {
                ffmpeg(gifPath)
                    .toFormat('mp4')
                    .addOutputOptions([
                        '-pix_fmt yuv420p',
                        '-movflags +faststart',
                        '-vf scale=320:-2',
                        '-c:v libx264',
                        '-preset ultrafast',
                        '-b:v 500k'
                    ])
                    .on('start', (commandLine) => {
                        logger.info('Started ffmpeg with command:', commandLine);
                    })
                    .on('progress', (progress) => {
                        logger.debug('Processing:', progress);
                    })
                    .on('end', () => {
                        logger.info('Successfully converted GIF to MP4:', mp4Path);
                        resolve(mp4Path);
                    })
                    .on('error', (err) => {
                        logger.error('Error converting GIF to MP4:', err);
                        reject(err);
                    })
                    .save(mp4Path);
            });
        } catch (error) {
            logger.error('Error in convertGifToMp4:', error);
            throw error;
        }
    }

    async sendGifReaction(sock, msg, gifPath, caption = '', mentions = []) {
        let mp4Path = null;
        try {
            logger.info('Attempting to send GIF reaction:', { gifPath });

            // List available GIFs
            const files = await fs.readdir(this.mediaDir);
            logger.info('Available GIFs:', files);

            // Add .gif extension if not present
            if (!gifPath.endsWith('.gif')) {
                gifPath = `${gifPath}.gif`;
            }

            // Get full path
            const fullGifPath = path.join(this.mediaDir, gifPath);
            if (!fs.existsSync(fullGifPath)) {
                throw new Error(`GIF not found: ${gifPath}`);
            }

            // Convert GIF to MP4
            mp4Path = await this.convertGifToMp4(fullGifPath);

            // Read the converted file
            const buffer = await fs.readFile(mp4Path);

            // Send message
            await sock.sendMessage(msg.key.remoteJid, {
                video: buffer,
                caption: caption,
                mentions: mentions,
                gifPlayback: true,
                mimetype: 'video/mp4'
            });

            logger.info('Successfully sent GIF reaction');
            return true;

        } catch (error) {
            logger.error('Error in sendGifReaction:', error);
            // Send fallback text message
            try {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `${caption} (GIF not available: ${error.message})`,
                    mentions: mentions
                });
            } catch (fallbackError) {
                logger.error('Error sending fallback message:', fallbackError);
            }
            return false;
        } finally {
            // Cleanup temp file
            if (mp4Path) {
                try {
                    await fs.remove(mp4Path);
                    logger.info('Cleaned up temp file:', mp4Path);
                } catch (cleanupError) {
                    logger.error('Error cleaning up temp file:', cleanupError);
                }
            }
        }
    }
}

// Create a singleton instance
const mediaHandler = new MediaHandler();

module.exports = {
    mediaHandler,
    // Helper function for easier usage
    sendGifReaction: async (sock, msg, gifName, caption = '', mentions = []) => {
        try {
            logger.info('Sending GIF reaction:', { gifName });
            return await mediaHandler.sendGifReaction(sock, msg, gifName, caption, mentions);
        } catch (error) {
            logger.error('Error in sendGifReaction helper:', error);
            return false;
        }
    }
};