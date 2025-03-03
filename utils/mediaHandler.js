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
                    '-tune animation',
                    '-vf scale=320:-2',
                    '-r 30',
                    '-t 8',
                    '-an',
                    '-f mp4'
                ])
                .on('start', (commandLine) => {
                    logger.info('FFmpeg command:', commandLine);
                })
                .on('progress', (progress) => {
                    logger.info('Processing: ', progress.percent, '% done');
                })
                .on('end', () => {
                    logger.info('FFmpeg conversion completed');
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    logger.error('FFmpeg conversion error:', err);
                    reject(err);
                })
                .save(outputPath);
        });
    }

    async sendGifReaction(sock, msg, gifName, caption = '', mentions = []) {
        let tempFile = null;
        try {
            // Clean up the gif name
            const cleanGifName = gifName.replace(/^anime-/, '').replace(/\.gif$/, '') + '.gif';
            const gifPath = path.join(this.mediaDir, cleanGifName);

            logger.info(`Attempting to send GIF reaction: ${cleanGifName}`);
            logger.info(`Full GIF path: ${gifPath}`);

            // Verify file exists
            if (!await fs.pathExists(gifPath)) {
                logger.error(`GIF not found at path: ${gifPath}`);
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `${caption} (GIF not available)`,
                    mentions
                });
                return false;
            }

            // Read and verify file content
            const buffer = await fs.readFile(gifPath);
            if (!buffer || buffer.length === 0) {
                logger.error(`Invalid GIF file (zero length) at: ${gifPath}`);
                throw new Error('Invalid GIF file');
            }

            logger.info(`Successfully read GIF file: ${gifPath} (${buffer.length} bytes)`);

            // Create temp file with unique name
            tempFile = path.join(this.tempDir, `reaction_${Date.now()}.mp4`);
            await this.convertGifToVideo(gifPath, tempFile);

            logger.info(`Successfully converted GIF to video: ${tempFile}`);

            // Read the converted video
            const videoBuffer = await fs.readFile(tempFile);
            logger.info(`Video buffer size: ${videoBuffer.length} bytes`);

            // Send the message
            await sock.sendMessage(msg.key.remoteJid, {
                video: videoBuffer,
                caption,
                gifPlayback: true,
                mentions,
                mimetype: 'video/mp4'
            });

            logger.info('Successfully sent GIF reaction message');
            return true;

        } catch (error) {
            logger.error('Error in sendGifReaction:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `${caption} (Error sending GIF: ${error.message})`,
                mentions
            });
            return false;
        } finally {
            // Cleanup temp file
            if (tempFile) {
                try {
                    await fs.remove(tempFile);
                    logger.info(`Cleaned up temp file: ${tempFile}`);
                } catch (error) {
                    logger.error('Error cleaning up temp file:', error);
                }
            }
        }
    }
}

const mediaHandler = new MediaHandler();

module.exports = {
    mediaHandler,
    sendGifReaction: (sock, msg, gifName, caption = '', mentions = []) =>
        mediaHandler.sendGifReaction(sock, msg, gifName, caption, mentions)
};