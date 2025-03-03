const pino = require('pino');

// Configure logger options with minimal output
const loggerOptions = {
    level: 'error', // Only show critical errors
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: false,
            translateTime: false,
            ignore: 'pid,hostname,time',
            messageFormat: '{msg}'
        }
    }
};

// Create base logger instance
const baseLogger = pino(loggerOptions);

// Simplified logger with minimal output
const logger = {
    fatal: (msg) => baseLogger.fatal(msg),
    error: (msg) => baseLogger.error(msg),
    warn: () => {},
    info: () => {},
    debug: () => {},
    trace: () => {},
    child: () => logger
};

module.exports = logger;