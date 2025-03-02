const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeInMemoryStore, jidDecode, getContentType } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const logger = require('./logger');
const pino = require('pino');
const fs = require('fs-extra');
const path = require('path');
const FileType = require('file-type');
const { Sticker, createSticker, StickerTypes } = require('wa-sticker-formatter');
const config = require('../config');
const { verifierEtatJid, recupererActionJid } = require('./bdd/antilien');
const { atbverifierEtatJid, atbrecupererActionJid } = require('./bdd/antibot');
const events = require('./framework/zokou');
const { isUserBanned, addUserToBanList, removeUserFromBanList } = require('./bdd/banUser');
const { addGroupToBanList, isGroupBanned, removeGroupFromBanList } = require('./bdd/banGroup');
const { isGroupOnlyAdmin, addGroupToOnlyAdminList, removeGroupFromOnlyAdminList } = require('./bdd/onlyAdmin');
const { reagir } = require('./framework/app');

// Store Configuration
const store = makeInMemoryStore({
    logger: pino().child({
        level: 'silent',
        stream: 'store'
    })
});

// Session Management
async function initializeSession() {
    try {
        const { version, isLatest } = await fetchLatestBaileysVersion();
        logger.info(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

        const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, '../auth_info'));

        const socketConfig = {
            version,
            logger: pino({ level: 'info' }), // Changed to info for QR visibility
            printQRInTerminal: true,         // Ensure QR prints to terminal
            auth: state,
            browser: ['BlackSky-MD', 'Chrome', '112.0.5615.49'],
            connectTimeoutMs: 60000,         // Increased timeout
            qrTimeout: 60000,                // Added QR timeout
            emitOwnEvents: true,
            markOnlineOnConnect: true
        };

        const sock = makeWASocket(socketConfig);

        // Save credentials after successful connection
        sock.ev.on('creds.update', saveCreds);

        return sock;
    } catch (error) {
        logger.error('Error initializing session:', error);
        throw error;
    }
}

// Message Handler
async function handleIncomingMessage(sock, msg, messageType, messageContent, remoteJid) {
    try {
        // Format JID
        const formattedJid = (jid) => {
            if (!jid) return jid;
            if (/:\d+@/gi.test(jid)) {
                const decoded = jidDecode(jid) || {};
                return decoded.user && decoded.server && 
                       decoded.user + '@' + decoded.server || jid;
            }
            return jid;
        };

        // Process message content
        const botNumber = formattedJid(sock.user.id);
        const isGroup = remoteJid?.endsWith('@g.us');

        // Group metadata if applicable
        let groupMetadata = isGroup ? await sock.groupMetadata(remoteJid) : '';
        let groupName = isGroup ? groupMetadata.subject : '';

        // Message source
        const sender = isGroup ? msg.key.participant || msg.participant : remoteJid;

        // Command processing
        if (messageContent?.startsWith(config.prefix)) {
            const args = messageContent.slice(1).trim().split(/ +/);
            const command = args.shift().toLowerCase();

            // Find and execute command
            const cmdHandler = events.cm.find(cmd => cmd.name === command);
            if (cmdHandler) {
                try {
                    await cmdHandler.execute(sock, msg, {
                        args,
                        sender,
                        group: {
                            isGroup,
                            metadata: groupMetadata,
                            name: groupName
                        },
                        botNumber
                    });
                } catch (error) {
                    logger.error(`Error executing command ${command}:`, error);
                    await sock.sendMessage(remoteJid, {
                        text: `Error executing command: ${error.message}`
                    });
                }
            }
        }

    } catch (error) {
        logger.error('Error handling message:', error);
    }
}

// Initialize WhatsApp connection
async function connectToWhatsApp() {
    const sock = await initializeSession();
    store.bind(sock.ev);

    // Connection handling
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)? 
                lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut : true;

            if (shouldReconnect) {
                logger.info('Reconnecting...');
                connectToWhatsApp();
            } else {
                logger.info('Connection closed. Please scan QR code to reconnect.');
            }
        }

        logger.info(`Connection status: ${connection}`);
    });

    // Message handling
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg?.message) return;

        const messageType = getContentType(msg.message);
        const messageContent = msg.message[messageType]?.text || 
                                 msg.message[messageType]?.caption || 
                                 msg.message?.conversation || '';

        await handleIncomingMessage(sock, msg, messageType, messageContent, msg.key.remoteJid);
    });

    // Credentials update
    sock.ev.on('creds.update', saveCreds);

    return sock;
}

module.exports = { connectToWhatsApp };