const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const logger = require('pino')();
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
            logger.info('Media and temp directories created successfully');
        } catch (error) {
            logger.error('Error creating directories:', error);
            throw error;
        }
    }

    async downloadAndSaveGif(url, filename) {
        try {
            logger.info(`Attempting to download GIF from ${url}`);
            const response = await axios({
                method: 'GET',
                url: url,
                responseType: 'arraybuffer',
                timeout: 10000
            });

            const outputPath = path.join(this.mediaDir, filename);
            await fs.writeFile(outputPath, response.data);
            logger.info(`Successfully saved GIF to: ${outputPath}`);
            return outputPath;
        } catch (error) {
            logger.error(`Error downloading/saving GIF: ${error.message}`);
            throw error;
        }
    }

    async sendGifReaction(sock, msg, gifPath, caption = '', mentions = []) {
        try {
            // Verify file exists
            if (!fs.existsSync(gifPath)) {
                throw new Error(`GIF not found at path: ${gifPath}`);
            }

            // Convert GIF to MP4
            const mp4Path = await this.convertGifToMp4(gifPath);
            const buffer = await fs.readFile(mp4Path);

            // Send as message
            await sock.sendMessage(msg.key.remoteJid, {
                video: buffer,
                caption: caption,
                mentions: mentions,
                gifPlayback: true,
                mimetype: 'video/mp4'
            });

            // Cleanup
            await this.cleanupTemp(mp4Path);
            return true;
        } catch (error) {
            logger.error('Error in sendGifReaction:', error);
            // Send fallback text message
            try {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: caption,
                    mentions: mentions
                });
            } catch (fallbackError) {
                logger.error('Error sending fallback message:', fallbackError);
            }
            return false;
        }
    }

    async convertGifToMp4(gifPath) {
        try {
            const mp4Path = path.join(this.tempDir, `${path.basename(gifPath, '.gif')}.mp4`);

            return new Promise((resolve, reject) => {
                ffmpeg(gifPath)
                    .toFormat('mp4')
                    .addOutputOptions([
                        '-pix_fmt yuv420p',
                        '-movflags +faststart',
                        '-vf scale=trunc(iw/2)*2:trunc(ih/2)*2',
                        '-c:v libx264',
                        '-preset ultrafast',
                        '-b:v 1M'
                    ])
                    .on('end', () => {
                        logger.info(`Successfully converted GIF to MP4: ${mp4Path}`);
                        resolve(mp4Path);
                    })
                    .on('error', (err) => {
                        logger.error(`Error converting GIF to MP4: ${err.message}`);
                        reject(err);
                    })
                    .save(mp4Path);
            });
        } catch (error) {
            logger.error('Error in convertGifToMp4:', error);
            throw error;
        }
    }

    async cleanupTemp(filePath) {
        try {
            await fs.remove(filePath);
            logger.info(`Cleaned up temp file: ${filePath}`);
        } catch (error) {
            logger.error('Error cleaning temp file:', error);
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
            const gifPath = path.join(mediaHandler.mediaDir, `${gifName}.gif`);
            return await mediaHandler.sendGifReaction(sock, msg, gifPath, caption, mentions);
        } catch (error) {
            logger.error(`Error in sendGifReaction helper: ${error.message}`);
            return false;
        }
    }
};