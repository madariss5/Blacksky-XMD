const baseLogger = {
    level: 'info',
    info: (message, ...args) => {
        console.log(`[INFO] ${message}`, ...args);
    },
    error: (message, ...args) => {
        console.error(`[ERROR] ${message}`, ...args);
    },
    warn: (message, ...args) => {
        console.warn(`[WARN] ${message}`, ...args);
    },
    debug: (message, ...args) => {
        console.debug(`[DEBUG] ${message}`, ...args);
    },
    trace: (message, ...args) => {
        console.trace(`[TRACE] ${message}`, ...args);
    },
    child: function(component) {
        return {
            ...this,
            info: (message, ...args) => this.info(`[${component.name}] ${message}`, ...args),
            error: (message, ...args) => this.error(`[${component.name}] ${message}`, ...args),
            warn: (message, ...args) => this.warn(`[${component.name}] ${message}`, ...args),
            debug: (message, ...args) => this.debug(`[${component.name}] ${message}`, ...args),
            trace: (message, ...args) => this.trace(`[${component.name}] ${message}`, ...args)
        };
    }
};

module.exports = baseLogger;