const chalk = require('chalk');
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, usePairingCode } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const path = require('path');
const fs = require('fs').promises;
const qrcode = require('qrcode-terminal');
const messageHandler = require('./handlers/message');
const logger = require('./utils/logger');
const config = require('./config');
const SessionManager = require('./utils/session');

// Create sessions directory if it doesn't exist
const SESSION_DIR = './sessions/blacksky-md';
const sessionManager = new SessionManager(SESSION_DIR);

let isConnected = false; // Track connection status

async function askPhoneNumber() {
    console.log(chalk.cyan('\n╔═══════════════════════════════════════════╗'));
    console.log(chalk.cyan('║       ') + chalk.yellow('ENTER YOUR PHONE NUMBER') + chalk.cyan('         ║'));
    console.log(chalk.cyan('╚═══════════════════════════════════════════╝\n'));
    console.log(chalk.gray('• Enter your phone number:'));
    console.log(chalk.gray('• Use this format: 1234567890'));
    console.log(chalk.gray('• No spaces or special characters'));
    console.log(chalk.gray('• Must include country code\n'));

    // Read phone number from environment
    const phone = process.env.BOT_NUMBER || '1234567890';
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    // Validate phone number format
    if (!cleanPhone.match(/^\d{10,14}$/)) {
        throw new Error('Invalid phone number format');
    }

    return cleanPhone;
}

async function showConnectionMenu() {
    console.log(chalk.cyan('\n╔═══════════════════════════════════════════╗'));
    console.log(chalk.cyan('║          ') + chalk.yellow('𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻 CONNECTION') + chalk.cyan('         ║'));
    console.log(chalk.cyan('╚═══════════════════════════════════════════╝\n'));

    console.log(chalk.cyan('╔═══════════════════════════════════════════╗'));
    console.log(chalk.cyan('║         ') + chalk.yellow('CONNECTION METHOD') + chalk.cyan('            ║'));
    console.log(chalk.cyan('╚═══════════════════════════════════════════╝\n'));

    console.log(chalk.white('1. ') + chalk.yellow('Pairing Code (Recommended)'));
    console.log(chalk.white('2. ') + chalk.yellow('QR Code (Alternative)\n'));

    console.log(chalk.gray('• Choose your preferred connection method'));
    console.log(chalk.gray('• Pairing code is faster and more reliable'));
    console.log(chalk.gray('• QR code is available as backup\n'));

    // Footer
    console.log(chalk.cyan('═══════════════════════════════════════════\n'));

    // Return selection based on environment or default to QR
    return process.env.USE_PAIRING !== 'false' ? '1' : '2';
}

async function showQRCode(qr) {
    console.log(chalk.cyan('\n╔═══════════════════════════════════════════╗'));
    console.log(chalk.cyan('║         ') + chalk.yellow('QR CODE SCANNER') + chalk.cyan('             ║'));
    console.log(chalk.cyan('╚═══════════════════════════════════════════╝\n'));

    qrcode.generate(qr, { small: true }, (qrcode) => {
        console.log(qrcode);
    });

    console.log(chalk.gray('\n1. Open WhatsApp on your phone'));
    console.log(chalk.gray('2. Tap Menu or Settings and select Linked Devices'));
    console.log(chalk.gray('3. Point your phone camera to scan the QR code\n'));
}

async function showPairingCode(phoneNumber) {
    console.log(chalk.cyan('\n╔═══════════════════════════════════════════╗'));
    console.log(chalk.cyan('║         ') + chalk.yellow('PAIRING CODE') + chalk.cyan('                ║'));
    console.log(chalk.cyan('╚═══════════════════════════════════════════╝\n'));

    try {
        const code = await sock.requestPairingCode(phoneNumber);
        console.log(chalk.white('Your pairing code: ') + chalk.green.bold(code));
        console.log(chalk.gray('\n1. Open WhatsApp on your phone'));
        console.log(chalk.gray('2. Go to Linked Devices > Link a Device'));
        console.log(chalk.gray('3. Enter the pairing code shown above\n'));
    } catch (error) {
        logger.error('Failed to generate pairing code:', error);
        throw error;
    }
}

async function connectToWhatsApp() {
    // Initialize session directory
    await sessionManager.initialize();

    // Use file-based auth state
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    // FLASH-MD Connection Configuration
    const sock = makeWASocket({
        printQRInTerminal: false,
        auth: state,
        logger: logger,
        browser: ["FLASH-MD", "Firefox", "1.0.0"],
        connectTimeoutMs: 60000,
        qrTimeout: 60000,
        defaultQueryTimeoutMs: 60000,
        generateHighQualityLinkPreview: true,
        syncFullHistory: true,
        markOnlineOnConnect: true,
        shouldIgnoreJid: jid => isJidBroadcast(jid),
        downloadHistory: false,
        getMessage: async (key) => { return { conversation: 'hello' } },
        patchMessageBeforeSending: (message) => {
            const requiresPatch = !!(
                message.buttonsMessage ||
                message.templateMessage ||
                message.listMessage
            );
            if (requiresPatch) {
                message = {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadataVersion: 2,
                                deviceListMetadata: {}
                            },
                            ...message
                        }
                    }
                };
            }
            return message;
        }
    });

    // Handle connection updates
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            try {
                // Clear terminal and show the menu first
                process.stdout.write('\x1Bc');
                const method = await showConnectionMenu();

                if (method === '1') {
                    try {
                        const phoneNumber = await askPhoneNumber();
                        await showPairingCode(phoneNumber);
                    } catch (error) {
                        console.log(chalk.red('\nPairing code setup failed. Falling back to QR code...\n'));
                        await showQRCode(qr);
                    }
                } else {
                    await showQRCode(qr);
                }

                // Footer
                console.log(chalk.cyan('═══════════════════════════════════════════\n'));
                console.log(chalk.yellow('Waiting for connection...'));

            } catch (error) {
                logger.error('Failed to handle connection update:', error);
                console.log('\nConnection data:', qr);
            }
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)
                ? lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
                : true;

            console.log('Connection closed due to:', lastDisconnect?.error?.output?.payload?.message || 'unknown error');
            console.log('Reconnecting:', shouldReconnect);

            if (shouldReconnect) {
                setTimeout(connectToWhatsApp, 3000);
            }
        } else if (connection === 'open') {
            if (!isConnected) {
                isConnected = true;
                console.log('Connected to WhatsApp');

                // Save session data for persistence
                const sessionData = {
                    creds: sock.authState.creds,
                    keys: sock.authState.keys
                };

                try {
                    await fs.writeFile(
                        path.join(__dirname, 'creds.json'),
                        JSON.stringify(sessionData, null, 2)
                    );
                    console.log('Credentials saved to creds.json');

                    await sessionManager.saveSessionInfo(
                        sock.authState.creds.me?.id || 'Not available',
                        JSON.stringify(sessionData)
                    );

                    await sock.sendMessage(config.ownerNumber, {
                        text: `*🚀 𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻 Connected Successfully!*\n\n` +
                              `• Bot Name: ${config.botName}\n` +
                              `• Owner: ${config.ownerName}\n` +
                              `• Session ID: ${sock.authState.creds.me?.id || 'Not available'}\n` +
                              `• Time: ${new Date().toLocaleString()}\n\n` +
                              `Bot is ready! Use ${config.prefix}menu to see commands.`
                    });

                } catch (error) {
                    console.error('Failed to save credentials:', error);
                }
            }
        }
    });

    // Save credentials when updated
    sock.ev.on('creds.update', saveCreds);

    // Handle messages
    sock.ev.on('messages.upsert', async ({ messages }) => {
        if (!messages[0]) return;
        try {
            await messageHandler(sock, messages[0]);
        } catch (error) {
            console.error('Error handling message:', error);
            try {
                await sock.sendMessage(config.ownerNumber, {
                    text: `*⚠️ Error*\n\n${error.message}`
                });
            } catch (err) {
                console.error('Failed to send error notification:', err);
            }
        }
    });
}

// Helper function for JID validation
function isJidBroadcast(jid) {
    return jid.includes('@broadcast');
}

// Start the bot with error handling
(async () => {
    try {
        await connectToWhatsApp();
    } catch (err) {
        console.error('Fatal error:', err);
        process.exit(1);
    }
})();