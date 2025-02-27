const logger = require('pino')();

const fbdl = {
    download: async (url) => {
        logger.info('Stub fbdl.download called with url:', url);
        return {
            url: 'https://example.com/facebook.mp4',
            title: 'Sample Facebook Video'
        };
    }
};

module.exports = fbdl;