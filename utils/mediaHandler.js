const fs = require('fs-extra');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
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

module.exports = new MediaHandler();
