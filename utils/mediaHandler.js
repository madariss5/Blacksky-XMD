const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const logger = require('pino')();

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

    async downloadMedia(message, type = 'buffer') {
        try {
            return await downloadMediaMessage(message, type, {}, { logger });
        } catch (error) {
            logger.error('Error downloading media:', error);
            throw new Error('Failed to download media: ' + error.message);
        }
    }

    async saveMedia(buffer, filename) {
        try {
            const filePath = path.join(this.mediaDir, filename);
            await fs.writeFile(filePath, buffer);
            return filePath;
        } catch (error) {
            logger.error('Error saving media:', error);
            throw new Error('Failed to save media: ' + error.message);
        }
    }

    async cleanupTempFiles() {
        try {
            const files = await fs.readdir(this.tempDir);
            for (const file of files) {
                await fs.remove(path.join(this.tempDir, file));
            }
        } catch (error) {
            logger.error('Error cleaning temp files:', error);
        }
    }
}


const convertGifToMp4 = async (inputPath) => {
    try {
        const outputPath = path.join(this.tempDir, `${path.basename(inputPath, '.gif')}.mp4`);

        // Check if converted file already exists
        if (fs.existsSync(outputPath)) {
            logger.info(`Using existing MP4: ${outputPath}`);
            return outputPath;
        }

        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
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
                    logger.info(`Successfully converted GIF to MP4: ${outputPath}`);
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    logger.error(`Error converting GIF to MP4: ${err.message}`);
                    reject(err);
                })
                .save(outputPath);
        });
    } catch (error) {
        logger.error('Error in convertGifToMp4:', error);
        throw error;
    }
};

const sendGifReaction = async (sock, msg, mediaPath, caption = '', mentions = []) => {
    try {
        const fullPath = path.resolve(mediaPath);

        // Check if the GIF exists
        if (!fs.existsSync(fullPath)) {
            logger.error(`GIF not found: ${fullPath}`);
            throw new Error('GIF not found');
        }

        // Convert GIF to MP4
        const mp4Path = await convertGifToMp4(fullPath);
        const buffer = await fs.readFile(mp4Path);

        await sock.sendMessage(msg.key.remoteJid, {
            video: buffer,
            caption: caption,
            mentions: mentions,
            gifPlayback: true,
            mimetype: 'video/mp4',
            jpegThumbnail: null
        });

        // Clean up temp file
        try {
            await fs.unlink(mp4Path);
            logger.info(`Cleaned up temp file: ${mp4Path}`);
        } catch (cleanupError) {
            logger.warn('Failed to clean up temp file:', cleanupError);
        }

        return true;
    } catch (error) {
        logger.error('Error in sendGifReaction:', error);

        // Send fallback text message
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `${caption} (GIF not available)`,
                mentions: mentions
            });
        } catch (fallbackError) {
            logger.error('Error sending fallback message:', fallbackError);
        }
        return false;
    }
};

module.exports = {
    ...new MediaHandler(),
    sendGifReaction,
    convertGifToMp4
};