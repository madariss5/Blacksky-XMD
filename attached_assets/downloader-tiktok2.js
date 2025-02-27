const logger = require('pino')();

const tiktok2 = {
    download: async (url) => {
        logger.info('Stub tiktok2.download called with url:', url);
        return {
            url: 'https://example.com/tiktok2.mp4',
            title: 'Sample TikTok Video (Alternative)'
        };
    }
};

module.exports = tiktok2;