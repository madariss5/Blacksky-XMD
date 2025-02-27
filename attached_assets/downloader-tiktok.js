const logger = require('pino')();

const tiktok = {
    download: async (url) => {
        logger.info('Stub tiktok.download called with url:', url);
        return {
            url: 'https://example.com/tiktok.mp4',
            title: 'Sample TikTok Video'
        };
    }
};

module.exports = tiktok;