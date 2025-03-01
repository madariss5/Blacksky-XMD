const fs = require('fs-extra');
const path = require('path');
const logger = require('pino')();

// Function to compress creds.json into single line
const compressCredsFile = async () => {
    try {
        const credsPath = path.join(process.cwd(), 'creds.json');
        if (fs.existsSync(credsPath)) {
            const creds = await fs.readJson(credsPath);
            await fs.writeJson(credsPath, creds, { spaces: 0 });
            logger.info('Successfully compressed creds.json');
        }
    } catch (error) {
        logger.error('Error compressing creds.json:', error);
    }
};

module.exports = { compressCredsFile };
