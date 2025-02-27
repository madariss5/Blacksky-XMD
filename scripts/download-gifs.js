const fs = require('fs-extra');
const https = require('https');
const path = require('path');
const axios = require('axios');
const logger = require('pino')();

// Using waifu.pics API for anime reactions
const gifs = {
    'anime-slap.gif': 'https://waifu.pics/api/sfw/slap',
    'anime-hug.gif': 'https://waifu.pics/api/sfw/hug',
    'anime-pat.gif': 'https://waifu.pics/api/sfw/pat',
    'anime-dance.gif': 'https://waifu.pics/api/sfw/dance',
    'anime-kill.gif': 'https://waifu.pics/api/sfw/kill',
    'anime-highfive.gif': 'https://waifu.pics/api/sfw/highfive',
    'anime-facepalm.gif': 'https://waifu.pics/api/sfw/cringe',
    'anime-poke.gif': 'https://waifu.pics/api/sfw/poke',
    'anime-cuddle.gif': 'https://waifu.pics/api/sfw/cuddle',
    'anime-yeet.gif': 'https://waifu.pics/api/sfw/yeet',
    'anime-boop.gif': 'https://waifu.pics/api/sfw/poke', // Using poke as alternative
    'anime-bonk.gif': 'https://waifu.pics/api/sfw/bonk',
    'anime-wave.gif': 'https://waifu.pics/api/sfw/wave',
    'anime-kiss.gif': 'https://waifu.pics/api/sfw/kiss',
    'anime-punch.gif': 'https://waifu.pics/api/sfw/kick',
    'anime-wink.gif': 'https://waifu.pics/api/sfw/wink',
    // Special effect GIFs using alternative emotional reactions
    'wasted.gif': 'https://waifu.pics/api/sfw/cry',
    'triggered.gif': 'https://waifu.pics/api/sfw/angry', // Using angry as alternative for triggered
    'jail.gif': 'https://waifu.pics/api/sfw/handhold',
    'rip.gif': 'https://waifu.pics/api/sfw/cry'
};

const downloadGif = async (endpoint, filename) => {
    try {
        let url = endpoint;
        let maxRetries = 3;
        let retryCount = 0;
        let success = false;

        while (!success && retryCount < maxRetries) {
            try {
                // If it's a waifu.pics API endpoint, get the actual URL
                if (endpoint.includes('waifu.pics/api')) {
                    const response = await axios.get(endpoint);
                    url = response.data.url;
                    logger.info(`Resolved waifu.pics URL for ${filename}: ${url}`);
                }

                // Download the actual GIF
                const response = await axios.get(url, {
                    responseType: 'arraybuffer',
                    maxRedirects: 5,
                    validateStatus: null,
                    timeout: 5000
                });

                if (response.status === 200) {
                    const buffer = Buffer.from(response.data);
                    const mediaPath = path.join(__dirname, '..', 'media', filename);

                    // Basic GIF validation
                    if (buffer.toString('ascii', 0, 3) === 'GIF') {
                        await fs.writeFile(mediaPath, buffer);
                        logger.info(`✅ Successfully downloaded: ${filename}`);
                        success = true;
                        return true;
                    } else {
                        throw new Error('Not a valid GIF file');
                    }
                } else {
                    throw new Error(`Failed with status ${response.status}`);
                }
            } catch (error) {
                retryCount++;
                if (retryCount < maxRetries) {
                    logger.warn(`Retry ${retryCount}/${maxRetries} for ${filename}`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                } else {
                    throw error;
                }
            }
        }
    } catch (error) {
        logger.error(`❌ Failed to download ${filename}: ${error.message}`);
        return false;
    }
};

const downloadAllGifs = async () => {
    try {
        // Ensure media directory exists
        await fs.ensureDir(path.join(__dirname, '..', 'media'));

        // Download all GIFs
        const results = await Promise.all(
            Object.entries(gifs).map(([filename, url]) => 
                downloadGif(url, filename)
            )
        );

        const successful = results.filter(Boolean).length;
        const failed = results.length - successful;

        console.log('\n📊 Download Summary:');
        console.log(`✅ Successfully downloaded: ${successful} GIFs`);
        console.log(`❌ Failed to download: ${failed} GIFs`);
        console.log('✨ Download process completed!');
    } catch (error) {
        logger.error('❌ Error:', error);
    }
};

// Execute the download
downloadAllGifs();