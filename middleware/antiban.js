const NodeCache = require('node-cache');
const logger = require('../utils/logger');

// Optimized cache with shorter TTL
const messageCache = new NodeCache({ stdTTL: 30 }); // 30 seconds TTL
const userActionCache = new NodeCache({ stdTTL: 1800 }); // 30 minutes

class AntiBanMiddleware {
    constructor() {
        this.messageDelays = {
            min: 50,   // Minimum delay 50ms
            max: 200   // Maximum delay 200ms
        };

        // Increased limits for faster responses
        this.limits = {
            messagesPerMinute: 40,    // Doubled from 20
            mediaPerMinute: 15,       // Almost doubled from 8
            groupMessagesPerMinute: 45, // Increased from 25
            broadcastLimit: 15        // Increased from 8
        };
    }

    // Ultra-fast delay function
    async addDelay() {
        const delay = Math.floor(Math.random() * 
            (this.messageDelays.max - this.messageDelays.min + 1)) + 
            this.messageDelays.min;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Simplified rate limit check
    isRateLimited(jid, type = 'message') {
        const key = `${jid}_${type}`;
        const count = messageCache.get(key) || 0;
        const limit = this.limits[type + 'PerMinute'] || this.limits.messagesPerMinute;

        if (count >= limit) {
            logger.warn(`Rate limit exceeded for ${jid}`);
            return true;
        }

        messageCache.set(key, count + 1);
        return false;
    }

    // Minimal message sanitization
    sanitizeMessage(text) {
        return text ? text.replace(/(.)\1{9,}/g, '$1$1$1') : text;
    }

    // Quick pattern check
    isSuspiciousPattern(message) {
        return message?.mentionedJid?.length > 15 || 
               (message?.body?.length || 0) > 2500;
    }

    // Optimized reconnection handler
    handleReconnection(retryCount) {
        return new Promise(resolve => 
            setTimeout(resolve, Math.min(2000 * Math.pow(1.5, retryCount), 60000))
        );
    }

    // Streamlined message processing
    async processMessage(sock, msg) {
        try {
            if (!msg?.key?.remoteJid) return false;

            await this.addDelay();

            // Basic rate limiting
            if (this.isRateLimited(msg.key.remoteJid, 
                msg.key.remoteJid.endsWith('@g.us') ? 'group' : 'message')) {
                return false;
            }

            // Quick sanitize and check
            if (msg.message?.conversation) {
                msg.message.conversation = this.sanitizeMessage(msg.message.conversation);
            }

            return !this.isSuspiciousPattern(msg);

        } catch (error) {
            logger.error('Error in anti-ban middleware:', error);
            return false;
        }
    }
}

module.exports = new AntiBanMiddleware();