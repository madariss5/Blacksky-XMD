const NodeCache = require('node-cache');
const logger = require('../utils/logger');

// Cache for rate limiting
const messageCache = new NodeCache({ stdTTL: 60 }); // 1 minute default TTL
const userActionCache = new NodeCache({ stdTTL: 3600 }); // 1 hour for user actions

class AntiBanMiddleware {
    constructor() {
        this.messageDelays = {
            min: 300,  // Minimum delay 300ms
            max: 800   // Maximum delay 800ms
        };

        // Increased limits per minute
        this.limits = {
            messagesPerMinute: 20,    // Increased from 10
            mediaPerMinute: 8,        // Increased from 5
            groupMessagesPerMinute: 25, // Increased from 15
            broadcastLimit: 8         // Increased from 5
        };
    }

    // Optimized delay function
    async addDelay() {
        const delay = Math.floor(Math.random() * 
            (this.messageDelays.max - this.messageDelays.min + 1)) + 
            this.messageDelays.min;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Optimized rate limit check
    isRateLimited(jid, type = 'message') {
        const key = `${jid}_${type}`;
        const count = messageCache.get(key) || 0;

        let limit;
        switch(type) {
            case 'media': limit = this.limits.mediaPerMinute; break;
            case 'group': limit = this.limits.groupMessagesPerMinute; break;
            case 'broadcast': limit = this.limits.broadcastLimit; break;
            default: limit = this.limits.messagesPerMinute;
        }

        if (count >= limit) {
            logger.warn(`Rate limit exceeded for ${jid} (${type})`);
            return true;
        }

        messageCache.set(key, count + 1);
        return false;
    }

    // Optimized message sanitization
    sanitizeMessage(text) {
        if (!text) return text;
        return text
            .replace(/([!?.,-])\1{4,}/g, '$1$1$1')
            .replace(/(.)\1{4,}/g, '$1$1$1');
    }

    // Optimized pattern check
    isSuspiciousPattern(message) {
        if (!message) return false;

        // Quick checks first
        if (message.mentionedJid?.length > 8) return true;
        if (message.body?.length > 1500) return true;

        // Link check
        const linkCount = (message.body?.match(/(https?:\/\/[^\s]+)/g) || []).length;
        return linkCount > 3;
    }

    // Optimized reconnection handler
    handleReconnection(retryCount) {
        const baseDelay = 3000; // Reduced from 5000
        const maxDelay = 180000; // Reduced from 300000
        return new Promise(resolve => 
            setTimeout(resolve, Math.min(baseDelay * Math.pow(1.8, retryCount), maxDelay))
        );
    }

    // Main middleware function with optimizations
    async processMessage(sock, msg) {
        try {
            // Add optimized delay
            await this.addDelay();

            // Quick return for invalid messages
            if (!msg?.key?.remoteJid) return false;

            // Check rate limits with group optimization
            const isGroup = msg.key.remoteJid.endsWith('@g.us');
            if (this.isRateLimited(msg.key.remoteJid, isGroup ? 'group' : 'message')) {
                return false;
            }

            // Sanitize only if needed
            if (msg.message?.conversation) {
                msg.message.conversation = this.sanitizeMessage(msg.message.conversation);
            }

            // Quick pattern check
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