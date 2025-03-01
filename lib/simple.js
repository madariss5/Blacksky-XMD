const { proto, getContentType } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');

exports.smsg = (hans, m, store) => {
    if (!m) return m;
    let M = proto.WebMessageInfo;
    if (m.key) {
        m.id = m.key.id;
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        m.sender = m.key.participant || m.key.remoteJid;
        if (m.isGroup) m.participant = m.key.participant || '';
    }
    if (m.message) {
        m.mtype = getContentType(m.message);
        m.msg = m.mtype === 'viewOnceMessage'
          ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)]
          : m.message[m.mtype];
        try {
            m.body = m.mtype === 'conversation' ? m.message.conversation :
                     m.mtype === 'imageMessage' ? m.message.imageMessage.caption :
                     m.mtype === 'videoMessage' ? m.message.videoMessage.caption :
                     m.mtype === 'extendedTextMessage' ? m.message.extendedTextMessage.text :
                     m.mtype === 'buttonsResponseMessage' ? m.message.buttonsResponseMessage.selectedButtonId :
                     m.mtype === 'listResponseMessage' ? m.message.listResponseMessage.singleSelectReply.selectedRowId :
                     m.mtype === 'templateButtonReplyMessage' ? m.message.templateButtonReplyMessage.selectedId :
                     m.mtype === 'messageContextInfo' ? (m.message.buttonsResponseMessage?.selectedButtonId ||
                                                        m.message.listResponseMessage?.singleSelectReply.selectedRowId ||
                                                        m.text)
                                                      : '';
        } catch {
            m.body = '';
        }

        let quoted = m.quoted = m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null;
        m.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];
        if (m.quoted) {
            let type = getContentType(quoted);
            m.quoted = m.quoted[type];
            if (['productMessage'].includes(type)) {
                type = getContentType(m.quoted);
                m.quoted = m.quoted[type];
            }
            if (typeof m.quoted === 'string') m.quoted = { text: m.quoted };
            m.quoted.mtype = type;
            m.quoted.id = m.msg.contextInfo.stanzaId;
            m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat;
            m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false;
            m.quoted.sender = m.msg.contextInfo.participant;
            m.quoted.fromMe = m.quoted.sender === (hans.user && hans.user.id);
            m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText ||
                           m.quoted.selectedDisplayText || m.quoted.title || '';
            m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];
            m.getQuotedObj = m.getQuotedMessage = async () => {
                if (!m.quoted.id) return false;
                let q = await store.loadMessage(m.chat, m.quoted.id, hans);
                return exports.smsg(hans, q, store);
            };
        }
    }
    return m;
};