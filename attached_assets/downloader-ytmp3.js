const logger = require('pino')();

const ytmp3 = {
    download: async (url) => {
        logger.info('Stub ytmp3.download called with url:', url);
        return {
            url: 'https://example.com/audio.mp3',
            title: 'Sample Audio'
        };
    }
};

module.exports = ytmp3;