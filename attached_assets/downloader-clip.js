const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

async function downloadClip(url, filename) {
    try {
        const response = await fetch(url);
        const buffer = await response.buffer();
        const mediaPath = path.join(__dirname, '..', 'media', filename);
        await fs.writeFile(mediaPath, buffer);
        return mediaPath;
    } catch (error) {
        console.error('Error downloading clip:', error);
        throw error;
    }
}

module.exports = { downloadClip };