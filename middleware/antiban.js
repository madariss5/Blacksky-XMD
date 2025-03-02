const NodeCache = require('node-cache');
const logger = require('../utils/logger');

// Cache for rate limiting
const messageCache = new NodeCache({ stdTTL: 60 }); // 1 minute default TTL
const userActionCache = new NodeCache({ stdTTL: 3600 }); // 1 hour for user actions

class AntiBanMiddleware {
    constructor() {
        this.messageDelays = {
            min: 1000,  // Minimum delay 1 second
            max: 3000   // Maximum delay 3 seconds
        };

        // Limits per minute
        this.limits = {
            messagesPerMinute: 10,
            mediaPerMinute: 5,
            groupMessagesPerMinute: 15,
            broadcastLimit: 5
        };
    }

    // Random delay to make bot behavior more human-like
    async addDelay() {
        const delay = Math.floor(Math.random() * 
            (this.messageDelays.max - this.messageDelays.min + 1)) + 
            this.messageDelays.min;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Check if user or group has exceeded rate limits
    isRateLimited(jid, type = 'message') {
        const key = `${jid}_${type}`;
        const count = messageCache.get(key) || 0;

        let limit;
        switch(type) {
            case 'media':
                limit = this.limits.mediaPerMinute;
                break;
            case 'group':
                limit = this.limits.groupMessagesPerMinute;
                break;
            case 'broadcast':
                limit = this.limits.broadcastLimit;
                break;
            default:
                limit = this.limits.messagesPerMinute;
        }

        if (count >= limit) {
            logger.warn(`Rate limit exceeded for ${jid} (${type})`);
            return true;
        }

        messageCache.set(key, count + 1);
        return false;
    }

    // Sanitize message content to prevent banned patterns
    sanitizeMessage(text) {
        if (!text) return text;

        // Remove excessive symbols
        text = text.replace(/([!?.,-])\1{4,}/g, '$1$1$1');

        // Remove excessive capital letters
        if (text.length > 10 && text.toUpperCase() === text) {
            text = text.toLowerCase();
        }

        return text;
    }

    // Check for suspicious patterns
    isSuspiciousPattern(message) {
        if (!message) return false;

        // Check for mass mentions
        if (message.mentionedJid && message.mentionedJid.length > 5) {
            return true;
        }

        // Check for very long messages
        if (message.body && message.body.length > 1000) {
            return true;
        }

        // Check for suspicious links
        const suspiciousLinkPattern = /(https?:\/\/[^\s]+)/g;
        if (message.body && message.body.match(suspiciousLinkPattern)?.length > 2) {
            return true;
        }

        return false;
    }

    // Handle connection to prevent aggressive reconnection
    handleReconnection(retryCount) {
        const baseDelay = 5000; // 5 seconds
        const maxDelay = 300000; // 5 minutes

        // Exponential backoff
        const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);

        return new Promise(resolve => setTimeout(resolve, delay));
    }

    // Main middleware function to process messages
    async processMessage(sock, msg) {
        try {
            // Add random delay
            await this.addDelay();

            // Check rate limits
            const isGroup = msg.key.remoteJid.endsWith('@g.us');
            if (this.isRateLimited(msg.key.remoteJid, isGroup ? 'group' : 'message')) {
                logger.info(`Rate limit applied for ${msg.key.remoteJid}`);
                return false;
            }

            // Sanitize message content
            if (msg.message?.conversation) {
                msg.message.conversation = this.sanitizeMessage(msg.message.conversation);
            }

            // Check for suspicious patterns
            if (this.isSuspiciousPattern(msg)) {
                logger.warn(`Suspicious pattern detected from ${msg.key.remoteJid}`);
                return false;
            }

            return true;

        } catch (error) {
            logger.error('Error in anti-ban middleware:', error);
            return false;
        }
    }
}

module.exports = new AntiBanMiddleware();