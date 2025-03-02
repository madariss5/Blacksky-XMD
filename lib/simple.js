const { proto } = require('@whiskeysockets/baileys');
const logger = require('../utils/logger');

// Utility function to decode JIDs (WhatsApp IDs)
function decodeJid(jid) {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
        let decode = jidDecode(jid) || {};
        return decode.user && decode.server && decode.user + '@' + decode.server || jid;
    } else return jid;
}

// Parse message into a simpler format
function smsg(sock, m, store) {
    if (!m) return m;

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
        m.msg = (m.type === 'viewOnceMessage' ? 
            m.message[m.type].message[getContentType(m.message[m.type].message)] : 
            m.message[m.type]);
        m.body = m.message.conversation || 
                 m.msg?.text || 
                 m.msg?.caption || 
                 m.msg?.contentText || 
                 m.msg?.selectedDisplayText || 
                 m.msg?.title || '';
        m.mentionedJid = m.msg?.contextInfo?.mentionedJid || [];
    }

    // Add timestamp
    m.timestamp = typeof m.messageTimestamp === 'number' ? 
        m.messageTimestamp * 1000 : 
        m.messageTimestamp.low ? m.messageTimestamp.low * 1000 : 
        m.messageTimestamp.high ? m.messageTimestamp.high * 1000 : 0;

    return m;
}

// Get content type from message
function getContentType(message) {
    if (!message) return null;
    const keys = Object.keys(message);
    const key = keys.find(k => (k === 'conversation' || k.endsWith('Message') || k.includes('V2') || k.includes('V3') || k.includes('V4')) && k !== 'senderKeyDistributionMessage' && k !== 'messageContextInfo');
    return key;
}

// Utility function to decode JID details
function jidDecode(jid) {
    if (!jid) return null;
    if (jid.includes('@g.us') || jid.includes('@s.whatsapp.net')) {
        const [user, server] = jid.split('@');
        return { user, server };
    }
    return null;
}

module.exports = { smsg, getContentType, decodeJid, jidDecode };