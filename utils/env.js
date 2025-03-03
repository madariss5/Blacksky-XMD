const dotenv = require('dotenv');
const logger = require('./logger');

function loadEnvironment() {
    // Load environment variables from .env file
    dotenv.config();

    const requiredVars = [
        'OWNER_NUMBER',
        'OWNER_NAME',
        'BOT_NAME',
        'SESSION_ID'
    ];

    const optionalVars = [
        'PREFIX',
        'LOG_LEVEL',
        'KEEP_ALIVE_INTERVAL',
        'QUERY_TIMEOUT',
        'CONNECT_TIMEOUT',
        'QR_TIMEOUT',
        'RETRY_DELAY',
        'AUTH_DIR'
    ];

    // Check required variables
    const missing = requiredVars.filter(varName => !process.env[varName]);
    if (missing.length > 0) {
        logger.error(`Missing required environment variables: ${missing.join(', ')}`);
        logger.error('Please check your .env file or environment configuration');
        process.exit(1);
    }

    // Log optional variables status
    optionalVars.forEach(varName => {
        if (!process.env[varName]) {
            logger.warn(`Optional environment variable ${varName} not set, using default value`);
        }
    });

    return {
        required: requiredVars.reduce((acc, varName) => {
            acc[varName] = process.env[varName];
            return acc;
        }, {}),
        optional: optionalVars.reduce((acc, varName) => {
            acc[varName] = process.env[varName];
            return acc;
        }, {})
    };
}

module.exports = { loadEnvironment };
