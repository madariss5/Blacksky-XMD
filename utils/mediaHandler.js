const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const logger = require('pino')();

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
            logger.info('Media and temp directories created');
        } catch (error) {
            logger.error('Error creating directories:', error);
        }
    }
}

const sendGifReaction = async (sock, msg, caption = '', mentions = []) => {
    try {
        // Since we don't have the GIFs yet, we'll just send the text response
        await sock.sendMessage(msg.key.remoteJid, {
            text: caption,
            mentions: mentions
        });
        return true;
    } catch (error) {
        logger.error('Error in sendGifReaction:', error);
        return false;
    }
};

module.exports = {
    MediaHandler,
    sendGifReaction
};