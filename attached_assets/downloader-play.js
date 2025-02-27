const logger = require('pino')();

const play = {
    search: async (query) => {
        logger.info('Stub play.search called with query:', query);
        return {
            url: 'https://example.com/audio.mp3',
            title: 'Sample Song'
        };
    }
};

module.exports = play;