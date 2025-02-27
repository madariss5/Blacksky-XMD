const fs = require('fs-extra');
const https = require('https');
const path = require('path');

// Sample anime GIF URLs (replace with your actual GIF URLs)
const gifs = {
    'anime-slap.gif': 'https://example.com/slap.gif',
    'anime-hug.gif': 'https://example.com/hug.gif',
    'anime-pat.gif': 'https://example.com/pat.gif',
    'anime-dance.gif': 'https://example.com/dance.gif',
    'anime-kill.gif': 'https://example.com/kill.gif',
    'anime-highfive.gif': 'https://example.com/highfive.gif',
    'anime-facepalm.gif': 'https://example.com/facepalm.gif',
    'anime-poke.gif': 'https://example.com/poke.gif',
    'anime-cuddle.gif': 'https://example.com/cuddle.gif',
    'anime-yeet.gif': 'https://example.com/yeet.gif',
    'anime-boop.gif': 'https://example.com/boop.gif',
    'anime-bonk.gif': 'https://example.com/bonk.gif'
};

const downloadGif = (url, filename) => {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                const file = fs.createWriteStream(path.join('media', filename));
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            } else {
                reject(`Failed to download ${filename}`);
            }
        }).on('error', (err) => {
            reject(err);
        });
    });
};

const downloadAllGifs = async () => {
    try {
        // Create media directory if it doesn't exist
        await fs.ensureDir('media');
        
        // Download all GIFs
        for (const [filename, url] of Object.entries(gifs)) {
            try {
                await downloadGif(url, filename);
                console.log(`Downloaded ${filename}`);
            } catch (error) {
                console.error(`Error downloading ${filename}:`, error);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

downloadAllGifs();
