const pino = require('pino');

// Rate limiting for repeated messages
const msgCache = new Map();
const MSG_TIMEOUT = 5000; // 5 seconds timeout for duplicate messages

// Log levels and their numeric values
const LOG_LEVELS = {
    fatal: 60,
    error: 50,
    warn: 40,
    info: 30,
    debug: 20,
    trace: 10
};

// Configure logger options
const loggerOptions = {
    level: process.env.LOG_LEVEL || 'info',
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
    formatters: {
        level: (label) => {
            return { level: label.toUpperCase() };
        }
    },
    // Prevent logging of sensitive data
    redact: {
        paths: ['*.password', '*.token', '*.key', '*.secret', '*.auth', 'creds.*'],
        remove: true
    }
};

// Create base logger instance
const baseLogger = pino(loggerOptions);

// Rate limited logging function
function rateLimitedLog(level, message, data = {}) {
    const key = `${level}:${message}:${JSON.stringify(data)}`;
    const now = Date.now();
    const lastLog = msgCache.get(key);

    if (!lastLog || (now - lastLog) > MSG_TIMEOUT) {
        msgCache.set(key, now);
        baseLogger[level](data, message);
    }
}

// Error aggregation
const errorCounts = new Map();
const ERROR_THRESHOLD = 5; // Max errors of same type in timeframe
const ERROR_WINDOW = 60000; // 1 minute window

function shouldLogError(error) {
    const errorKey = error.message || 'unknown';
    const errorData = errorCounts.get(errorKey) || { count: 0, firstSeen: Date.now() };

    // Reset counter if outside time window
    if (Date.now() - errorData.firstSeen > ERROR_WINDOW) {
        errorData.count = 0;
        errorData.firstSeen = Date.now();
    }

    errorData.count++;
    errorCounts.set(errorKey, errorData);

    return errorData.count <= ERROR_THRESHOLD;
}

// Enhanced logger with rate limiting and error aggregation
const logger = {
    fatal: (message, data = {}) => rateLimitedLog('fatal', message, data),
    error: (message, error = {}, data = {}) => {
        if (shouldLogError(error)) {
            rateLimitedLog('error', message, { ...data, error: error.message || error });
        }
    },
    warn: (message, data = {}) => rateLimitedLog('warn', message, data),
    info: (message, data = {}) => rateLimitedLog('info', message, data),
    debug: (message, data = {}) => rateLimitedLog('debug', message, data),
    trace: (message, data = {}) => rateLimitedLog('trace', message, data),

    // Create child logger with component context
    child: function(component) {
        return {
            ...this,
            fatal: (message, data = {}) => this.fatal(message, { ...data, component }),
            error: (message, error = {}, data = {}) => this.error(message, error, { ...data, component }),
            warn: (message, data = {}) => this.warn(message, { ...data, component }),
            info: (message, data = {}) => this.info(message, { ...data, component }),
            debug: (message, data = {}) => this.debug(message, { ...data, component }),
            trace: (message, data = {}) => this.trace(message, { ...data, component })
        };
    },

    // Clear rate limiting caches periodically
    clearCaches: () => {
        msgCache.clear();
        errorCounts.clear();
    }
};

// Clear caches every hour
setInterval(logger.clearCaches, 3600000);

module.exports = logger;