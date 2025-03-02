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
                    '-preset ultrafast', // Fastest encoding
                    '-tune zerolatency', // Minimize latency
                    '-vf scale=w=320:h=-2',
                    '-r 24', // Reduce framerate
                    '-t 8',
                    '-an',
                    '-f mp4'
                ])
                .on('end', () => resolve(outputPath))
                .on('error', reject)
                .save(outputPath);
        });
    }

    async sendGifReaction(sock, msg, gifName, caption = '', mentions = []) {
        let tempFile = null;
        try {
            const gifPath = path.join(this.mediaDir, gifName.endsWith('.gif') ? gifName : `${gifName}.gif`);

            // Quick file check
            const buffer = await fs.readFile(gifPath);
            if (!buffer.length) throw new Error('Invalid GIF file');

            // Create temp file
            tempFile = path.join(this.tempDir, `${Date.now()}.mp4`);
            await this.convertGifToVideo(gifPath, tempFile);

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
            // Simplified error handling
            if (tempFile) await fs.remove(tempFile).catch(() => {});
            await sock.sendMessage(msg.key.remoteJid, {
                text: `${caption} (GIF not available)`,
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