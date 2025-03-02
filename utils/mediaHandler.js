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
            const mp4Path = path.join(this.tempDir, `${path.basename(gifPath, '.gif')}.mp4`);
            logger.info('Converting GIF to MP4:', { input: gifPath, output: mp4Path });

            // Verify input file exists and has content
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
                        '-vf scale=trunc(iw/2)*2:trunc(ih/2)*2',
                        '-c:v libx264',
                        '-preset ultrafast',
                        '-b:v 1M'
                    ])
                    .on('start', (commandLine) => {
                        logger.info('Started ffmpeg with command:', commandLine);
                    })
                    .on('progress', (progress) => {
                        logger.info('Processing:', progress);
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
        try {
            logger.info('Attempting to send GIF reaction:', { gifPath });

            // List available GIFs
            const files = await fs.readdir(this.mediaDir);
            logger.info('Available GIFs in media directory:', files);

            // Verify file exists
            if (!fs.existsSync(gifPath)) {
                throw new Error(`GIF not found at path: ${gifPath}`);
            }

            // Get file stats
            const stats = await fs.stat(gifPath);
            if (stats.size === 0) {
                throw new Error('GIF file is empty');
            }

            // Convert GIF to MP4
            const mp4Path = await this.convertGifToMp4(gifPath);

            // Read the converted file
            logger.info('Reading converted MP4 file:', mp4Path);
            const buffer = await fs.readFile(mp4Path);

            logger.info('Sending video message with GIF playback', {
                bufferSize: buffer.length,
                remoteJid: msg.key.remoteJid,
                mimetype: 'video/mp4'
            });

            // Send message
            await sock.sendMessage(msg.key.remoteJid, {
                video: buffer,
                caption: caption,
                mentions: mentions,
                gifPlayback: true,
                mimetype: 'video/mp4',
                jpegThumbnail: null
            });

            // Cleanup
            await fs.remove(mp4Path);
            logger.info('Successfully sent GIF reaction and cleaned up temp file');
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
            logger.info('Full GIF path:', gifPath);
            return await mediaHandler.sendGifReaction(sock, msg, gifPath, caption, mentions);
        } catch (error) {
            logger.error(`Error in sendGifReaction helper: ${error.message}`);
            return false;
        }
    }
};