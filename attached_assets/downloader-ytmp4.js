const logger = require('pino')();

const ytmp4 = {
    download: async (url) => {
        logger.info('Stub ytmp4.download called with url:', url);
        return {
            url: 'https://example.com/video.mp4',
            title: 'Sample Video'
        };
    }
};

module.exports = ytmp4;