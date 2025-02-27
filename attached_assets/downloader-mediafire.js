const logger = require('pino')();

const mediafire = {
    download: async (url) => {
        logger.info('Stub mediafire.download called with url:', url);
        return {
            url: 'https://example.com/file.zip',
            filename: 'sample_file.zip',
            mime: 'application/zip'
        };
    }
};

module.exports = mediafire;