const fs = require('fs-extra');
const https = require('https');
const path = require('path');

// Update with stable CDN URLs from GIPHY and other reliable sources
const gifs = {
    'anime-slap.gif': 'https://media4.giphy.com/media/Zau0yrl17uzdK/giphy.gif',
    'anime-hug.gif': 'https://media4.giphy.com/media/od5H3PmEG5EVq/giphy.gif',
    'anime-pat.gif': 'https://media2.giphy.com/media/ARSp9T7wwxNcs/giphy.gif',
    'anime-dance.gif': 'https://media3.giphy.com/media/mJIa7rg9VPEhzU1dyQ/giphy.gif',
    'anime-kill.gif': 'https://media2.giphy.com/media/HZboJ5Pkti9k4/giphy.gif',
    'anime-highfive.gif': 'https://media1.giphy.com/media/838dLMDnxfWzS/giphy.gif',
    'anime-facepalm.gif': 'https://media3.giphy.com/media/pPhyAv5t9V8djyRFJH/giphy.gif',
    'anime-poke.gif': 'https://media3.giphy.com/media/pWd3gD577gOqs/giphy.gif',
    'anime-cuddle.gif': 'https://media1.giphy.com/media/143v0Z4767T15e/giphy.gif',
    'anime-yeet.gif': 'https://media4.giphy.com/media/11s7Ke7jcNxCHS/giphy.gif',
    'anime-boop.gif': 'https://media2.giphy.com/media/HeaBmucBGiwdW/giphy.gif',
    'anime-bonk.gif': 'https://media4.giphy.com/media/30lxTuJueXE7C/giphy.gif',
    'anime-wave.gif': 'https://media2.giphy.com/media/xTiIzJSKB4l7xTouE8/giphy.gif',
    'anime-kiss.gif': 'https://media1.giphy.com/media/FqBTvSNjNzeZG/giphy.gif',
    'anime-punch.gif': 'https://media2.giphy.com/media/arbHBoiUWUgmc/giphy.gif',
    'anime-wink.gif': 'https://media2.giphy.com/media/yoJC2El7xJkYCadlWE/giphy.gif',
    // Special effect GIFs - using stable CDN URLs
    'wasted.gif': 'https://media2.giphy.com/media/Rl9Yqavfj2Ula/giphy.gif',
    'triggered.gif': 'https://media0.giphy.com/media/ZdrUuSEC0LygaFXtNT/giphy.gif',
    'jail.gif': 'https://media4.giphy.com/media/3o6wNPIj7WBQcJCReE/giphy.gif',
    'rip.gif': 'https://media1.giphy.com/media/3oz8xQQP4ahKiyuxHy/giphy.gif'
};

const downloadGif = (url, filename) => {
    return new Promise((resolve, reject) => {
        const mediaPath = path.join(__dirname, '..', 'media', filename);
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                const file = fs.createWriteStream(mediaPath);
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`✅ Downloaded ${filename}`);
                    resolve();
                });
            } else {
                reject(`Failed to download ${filename}: Status ${response.statusCode}`);
            }
        }).on('error', (err) => {
            reject(`Error downloading ${filename}: ${err.message}`);
        });
    });
};

const downloadAllGifs = async () => {
    try {
        // Create media directory if it doesn't exist
        await fs.ensureDir(path.join(__dirname, '..', 'media'));

        // Download all GIFs
        for (const [filename, url] of Object.entries(gifs)) {
            try {
                await downloadGif(url, filename);
            } catch (error) {
                console.error(`❌ ${error}`);
            }
        }

        console.log('✨ All GIFs downloaded successfully!');
    } catch (error) {
        console.error('❌ Error:', error);
    }
};

// Execute the download
downloadAllGifs();