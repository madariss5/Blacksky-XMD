const { proto } = require('@whiskeysockets/baileys');
const logger = require('../utils/logger');
const { formatPhoneNumber } = require('../utils/phoneNumber');

// Utility function to decode JIDs (WhatsApp IDs)
function decodeJid(jid) {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
        let decode = jidDecode(jid) || {};
        return decode.user && decode.server && formatPhoneNumber(decode.user) || jid;
    } else return formatPhoneNumber(jid);
}

// Parse message into a simpler format
function smsg(sock, m, store) {
    try {
        if (!m) return null;

        let M = proto.WebMessageInfo;
        if (m.key) {
            m.id = m.key.id;
            m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16;
            m.chat = m.key.remoteJid;
            m.fromMe = m.key.fromMe;
            m.isGroup = m.chat.endsWith('@g.us');
            m.sender = decodeJid(m.fromMe && sock.user?.id || m.participant || m.key.participant || m.chat || '');
            m.pushName = m.pushName || sock.contacts?.[m.sender]?.name || sock.getName?.(m.sender) || 'Unknown';
        }

        if (m.message) {
            m.type = getContentType(m.message);
            if (!m.type) {
                logger.debug('Invalid message type detected');
                return null;
            }

            // Handle viewOnceMessage and extract actual message content
            if (m.type === 'viewOnceMessage' && m.message[m.type]?.message) {
                const viewOnceType = getContentType(m.message[m.type].message);
                m.msg = viewOnceType ? m.message[m.type].message[viewOnceType] : null;
            } else {
                m.msg = m.message[m.type];
            }

            // Extract message body from various possible locations
            m.body = m.message.conversation || 
                     m.msg?.text || 
                     m.msg?.caption || 
                     m.msg?.contentText || 
                     m.msg?.selectedDisplayText || 
                     m.msg?.title || '';

            // Safely extract mentioned JIDs and convert to clean format
            m.mentionedJid = m.msg?.contextInfo?.mentionedJid?.map(jid => formatPhoneNumber(jid)) || [];
        }

        // Add timestamp
        m.timestamp = typeof m.messageTimestamp === 'number' ? 
            m.messageTimestamp * 1000 : 
            m.messageTimestamp.low ? m.messageTimestamp.low * 1000 : 
            m.messageTimestamp.high ? m.messageTimestamp.high * 1000 : 0;

        return m;
    } catch (error) {
        logger.error('Error parsing message:', error);
        return null;
    }
}

// Get content type from message
function getContentType(message) {
    try {
        if (!message) return null;
        const keys = Object.keys(message);
        const key = keys.find(k => (
            k === 'conversation' || 
            k.endsWith('Message') || 
            k.includes('V2') || 
            k.includes('V3') || 
            k.includes('V4')
        ) && k !== 'senderKeyDistributionMessage' && k !== 'messageContextInfo');
        return key;
    } catch (error) {
        logger.error('Error getting content type:', error);
        return null;
    }
}

// Utility function to decode JID details
function jidDecode(jid) {
    try {
        if (!jid) return null;
        if (jid.includes('@g.us') || jid.includes('@s.whatsapp.net')) {
            const [user, server] = jid.split('@');
            return { user: formatPhoneNumber(user), server };
        }
        return null;
    } catch (error) {
        logger.error('Error decoding JID:', error);
        return null;
    }
}

module.exports = { smsg, getContentType, decodeJid, jidDecode };