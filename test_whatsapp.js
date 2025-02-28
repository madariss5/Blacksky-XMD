const pino = require('pino');
const logger = pino();
const { 
    default: makeWASocket,
    useMultiFileAuthState,
    makeInMemoryStore,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const qrcode = require('qrcode-terminal');
const fs = require('fs-extra');
const path = require('path');

// Initialize store and auth directory
const store = makeInMemoryStore({ logger: pino({ level: "silent" }) });
const authDir = path.join(__dirname, 'auth_info_baileys');
fs.ensureDirSync(authDir);

async function testWhatsApp() {
    try {
        logger.info('Starting WhatsApp test...');
        
        // Clear existing auth info to force new QR code
        await fs.remove(authDir);
        await fs.ensureDir(authDir);
        
        logger.info('Loading authentication state...');
        const { state, saveCreds } = await useMultiFileAuthState(authDir);

        logger.info('Fetching Baileys version...');
        const { version } = await fetchLatestBaileysVersion();
        logger.info('Using Baileys version:', version);

        const sock = makeWASocket({
            version,
            logger: pino({ level: "debug" }), // Set to debug for more detailed logs
            printQRInTerminal: true,
            auth: state,
            browser: ['BLACKSKY-MD', 'Safari', '1.0.0'],
            connectTimeoutMs: 60_000,
            defaultQueryTimeoutMs: 0,
            keepAliveIntervalMs: 10000,
            emitOwnEvents: true,
            markOnlineOnConnect: true
        });

        store.bind(sock.ev);

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            logger.info('Connection status update:', {
                connection,
                hasQR: !!qr,
                disconnectReason: lastDisconnect?.error?.output?.statusCode,
                fullError: lastDisconnect ? JSON.stringify(lastDisconnect.error) : null
            });

            if (qr) {
                logger.info('New QR code received, displaying in terminal...');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'open') {
                logger.info('WhatsApp connection established successfully!');
                sock.sendPresenceUpdate('available');
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom) ?
                    lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;
                
                logger.info('Connection closed:', {
                    shouldReconnect,
                    statusCode: lastDisconnect?.error?.output?.statusCode,
                    errorMessage: lastDisconnect?.error?.message
                });

                if (shouldReconnect) {
                    logger.info('Attempting reconnection in 3 seconds...');
                    setTimeout(testWhatsApp, 3000);
                }
            }
        });

        sock.ev.on('creds.update', async () => {
            logger.info('Credentials updated, saving...');
            await saveCreds();
        });

        // Test message handling
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type === 'notify') {
                logger.info('New message received:', {
                    from: messages[0].key.remoteJid,
                    type: Object.keys(messages[0].message)[0]
                });
            }
        });

    } catch (error) {
        logger.error('WhatsApp test error:', error);
        process.exit(1);
    }
}

// Start the test
testWhatsApp().catch(error => {
    logger.error('Test failed:', error);
    process.exit(1);
});
