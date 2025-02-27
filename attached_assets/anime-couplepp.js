// Dynamic import for node-fetch ES Module
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const logger = require('pino')();

const waifuPicsApiUrl = 'https://api.waifu.pics/sfw/';

async function getRandomCouple() {
    try {
        // Get male image
        const maleResponse = await fetch(waifuPicsApiUrl + 'male');
        const maleData = await maleResponse.json();

        // Get female image
        const femaleResponse = await fetch(waifuPicsApiUrl + 'female');
        const femaleData = await femaleResponse.json();

        return {
            male: maleData.url,
            female: femaleData.url
        };
    } catch (error) {
        logger.error('Error in getRandomCouple:', error);
        throw new Error('Failed to fetch couple pictures');
    }
}

module.exports = {
    getRandomCouple
};