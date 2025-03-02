const logger = require('pino')();

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
        m.sender = sock.decodeJid(m.fromMe && sock.user.id || m.participant || m.key.participant || m.chat || '');
        m.pushName = m.pushName || sock.getName(m.sender);
    }
    
    if (m.message) {
        m.type = getContentType(m.message);
        m.msg = (m.type === 'viewOnceMessage' ? m.message[m.type].message[getContentType(m.message[m.type].message)] : m.message[m.type]);
        m.body = m.message.conversation || m.msg.text || m.msg.caption || m.msg.contentText || m.msg.selectedDisplayText || m.msg.title || '';
        m.mentionedJid = m.msg?.contextInfo?.mentionedJid || [];
    }
    
    // Add timestamp
    m.timestamp = typeof m.messageTimestamp === 'number' ? m.messageTimestamp * 1000 : m.messageTimestamp.low ? m.messageTimestamp.low * 1000 : m.messageTimestamp.high ? m.messageTimestamp.high * 1000 : 0;
    
    return m;
}

module.exports = { smsg };
