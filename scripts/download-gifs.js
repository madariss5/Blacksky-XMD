const fs = require('fs-extra');
const https = require('https');
const path = require('path');

// Updated anime reaction GIF URLs with working alternatives from Tenor
const gifs = {
    'anime-slap.gif': 'https://media.tenor.com/CadCuf_eeTMAAAAC/anime-slap.gif',
    'anime-hug.gif': 'https://media.tenor.com/J7eGDvGeP9IAAAAC/anime-hug.gif',
    'anime-pat.gif': 'https://media.tenor.com/N41zKEDABuUAAAAC/anime-head-pat-anime-pat.gif',
    'anime-dance.gif': 'https://media.tenor.com/wpSo-P_eRwgAAAAC/anime-dance.gif',
    'anime-kill.gif': 'https://media.tenor.com/no7J4RQkxpoAAAAC/anime-kill.gif',
    'anime-highfive.gif': 'https://media.tenor.com/w0_p7HgI3H0AAAAC/anime-highfive.gif',
    'anime-facepalm.gif': 'https://media.tenor.com/E7Kh-KJV5YIAAAAC/anime-facepalm.gif',
    'anime-poke.gif': 'https://media.tenor.com/3dOqO4vVlr8AAAAC/poke-anime.gif',
    'anime-cuddle.gif': 'https://media.tenor.com/2VVGNLi-EV4AAAAC/anime-cuddle.gif',
    'anime-yeet.gif': 'https://media.tenor.com/Q5xNpRwU_D8AAAAC/anime-yeet.gif',
    'anime-boop.gif': 'https://media.tenor.com/POFPkiaQQE8AAAAC/anime-poke.gif',
    'anime-bonk.gif': 'https://media.tenor.com/qvvKGZhH0ysAAAAC/anime-girl.gif'
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