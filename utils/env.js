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
        'DATABASE_URL',
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

    // Setup Heroku-specific configurations
    if (process.env.NODE_ENV === 'production' && process.env.DYNO) {
        // Set optimized Node.js flags for Heroku
        process.env.NODE_OPTIONS = '--max-old-space-size=2560';

        // Use Heroku's PORT
        process.env.PORT = process.env.PORT || 5000;

        // Set production-specific configurations
        process.env.AUTH_DIR = '/app/auth_info';
        process.env.KEEP_ALIVE_INTERVAL = process.env.KEEP_ALIVE_INTERVAL || '300000';
        process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'warn';
    }

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