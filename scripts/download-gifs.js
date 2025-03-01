const fs = require('fs-extra');
const https = require('https');
const path = require('path');
const axios = require('axios');
const logger = require('pino')();

// Using waifu.pics API for anime reactions
const gifs = {
    // Existing reactions
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
    'anime-boop.gif': 'https://waifu.pics/api/sfw/poke',
    'anime-bonk.gif': 'https://waifu.pics/api/sfw/bonk',
    'anime-wave.gif': 'https://waifu.pics/api/sfw/wave',
    'anime-kiss.gif': 'https://waifu.pics/api/sfw/kiss',
    'anime-punch.gif': 'https://waifu.pics/api/sfw/kick',
    'anime-wink.gif': 'https://waifu.pics/api/sfw/wink',

    // Emotional reactions
    'anime-cry.gif': 'https://waifu.pics/api/sfw/cry',
    'anime-bully.gif': 'https://waifu.pics/api/sfw/bully',
    'anime-awoo.gif': 'https://waifu.pics/api/sfw/awoo',
    'anime-lick.gif': 'https://waifu.pics/api/sfw/lick',
    'anime-smug.gif': 'https://waifu.pics/api/sfw/smug',
    'anime-bite.gif': 'https://waifu.pics/api/sfw/bite',
    'anime-nom.gif': 'https://waifu.pics/api/sfw/nom',
    'anime-glomp.gif': 'https://waifu.pics/api/sfw/glomp',
    'anime-happy.gif': 'https://waifu.pics/api/sfw/happy',
    'anime-smile.gif': 'https://waifu.pics/api/sfw/smile',
    'anime-blush.gif': 'https://waifu.pics/api/sfw/blush',
    'anime-handhold.gif': 'https://waifu.pics/api/sfw/handhold',
    'anime-love.gif': 'https://waifu.pics/api/sfw/smile', // Using smile as fallback for love
    'anime-neko.gif': 'https://waifu.pics/api/sfw/neko',

    // Special effects
    'anime-wasted.gif': 'https://waifu.pics/api/sfw/cry', // Using cry as fallback
    'anime-jail.gif': 'https://waifu.pics/api/sfw/handhold', // Using handhold as fallback
    'anime-rip.gif': 'https://waifu.pics/api/sfw/cry', // Using cry as fallback
    'anime-triggered.gif': 'https://waifu.pics/api/sfw/kick', // Using kick as fallback
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