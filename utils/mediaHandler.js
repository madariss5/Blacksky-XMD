const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const logger = require('./logger');
const { exec } = require('child_process');

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
            logger.info('Media and temp directories initialized:', {
                mediaDir: this.mediaDir,
                tempDir: this.tempDir
            });
        } catch (error) {
            logger.error('Error creating directories:', error);
            throw error;
        }
    }

    // Direct ffmpeg command execution
    async convertGifToVideo(inputPath, outputPath) {
        return new Promise((resolve, reject) => {
            exec(`ffmpeg -i "${inputPath}" -movflags faststart -pix_fmt yuv420p -vf "scale=320:-2" "${outputPath}"`, (error, stdout, stderr) => {
                if (error) {
                    logger.error('FFmpeg error:', { error, stderr });
                    reject(error);
                } else {
                    logger.info('FFmpeg conversion successful');
                    resolve(outputPath);
                }
            });
        });
    }

    async sendGifReaction(sock, msg, gifName, caption = '', mentions = []) {
        let tempFile = null;
        try {
            // Ensure gif name has .gif extension
            if (!gifName.endsWith('.gif')) {
                gifName = `${gifName}.gif`;
            }

            // Get full path and verify file exists
            const gifPath = path.join(this.mediaDir, gifName);
            logger.info('Looking for GIF at:', { path: gifPath });

            if (!fs.existsSync(gifPath)) {
                throw new Error(`GIF not found: ${gifName}`);
            }

            // Create temp MP4 file
            tempFile = path.join(this.tempDir, `${Date.now()}.mp4`);

            // Convert GIF to MP4
            await this.convertGifToVideo(gifPath, tempFile);

            // Read the converted file
            const buffer = await fs.readFile(tempFile);

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
            try {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `${caption} (GIF not available)`,
                    mentions: mentions
                });
            } catch (sendError) {
                logger.error('Error sending fallback message:', sendError);
            }
            return false;
        } finally {
            // Cleanup temp file
            if (tempFile && await fs.pathExists(tempFile)) {
                try {
                    await fs.remove(tempFile);
                    logger.info('Cleaned up temp file:', tempFile);
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