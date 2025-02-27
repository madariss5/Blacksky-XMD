const fs = require('fs-extra');
const https = require('https');
const path = require('path');

// Updated anime reaction GIF URLs with better, more dynamic options from Tenor
const gifs = {
    'anime-slap.gif': 'https://media.tenor.com/Ws6Dm1ZW_vMAAAAC/girl-slap.gif',
    'anime-hug.gif': 'https://media.tenor.com/kCZjTqCKiggAAAAC/anime-hug.gif',
    'anime-pat.gif': 'https://media.tenor.com/YaFzR7EkabYAAAAC/head-pat-anime.gif',
    'anime-dance.gif': 'https://media.tenor.com/9ex0IdWU_P8AAAAC/anime-dance.gif',
    'anime-kill.gif': 'https://media.tenor.com/2Pm4nI9hBwgAAAAC/anime-fight.gif',
    'anime-highfive.gif': 'https://media.tenor.com/JBBZ9mQntx8AAAAC/anime-high-five.gif',
    'anime-facepalm.gif': 'https://media.tenor.com/UIILZBPtX6QAAAAC/anime-facepalm.gif',
    'anime-poke.gif': 'https://media.tenor.com/1YMrMsCtxLQAAAAC/poke-anime.gif',
    'anime-cuddle.gif': 'https://media.tenor.com/keasv-Cnh4QAAAAC/anime-hug.gif',
    'anime-yeet.gif': 'https://media.tenor.com/g8HCtGTNpvsAAAAC/anime-throw.gif',
    'anime-boop.gif': 'https://media.tenor.com/He-mpsD_hSEAAAAC/boop-anime.gif',
    'anime-bonk.gif': 'https://media.tenor.com/0XzBtq0DOYQAAAAC/anime-bonk.gif',
    'anime-wave.gif': 'https://media.tenor.com/1Ek3ViRbG_QAAAAC/wave-anime.gif',
    'anime-kiss.gif': 'https://media.tenor.com/hK3UBwGHDhsAAAAC/anime-kiss.gif',
    'anime-punch.gif': 'https://media.tenor.com/p3Hg_w_8QRYAAAAC/anime-punch.gif',
    'anime-wink.gif': 'https://media.tenor.com/DxMeGkN1YZEAAAAC/anime-wink.gif',
    // Special effect GIFs
    'wasted.gif': 'https://media.tenor.com/ZBQz_MYhKekAAAAC/wasted-gta.gif',
    'triggered.gif': 'https://media.tenor.com/cg8PZP1JtdcAAAAC/anime-triggered.gif',
    'jail.gif': 'https://media.tenor.com/9SQD7qN0WGEAAAAC/jail-bonk.gif',
    'rip.gif': 'https://media.tenor.com/4Ql2mWM6hLQAAAAC/anime-rip.gif'
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