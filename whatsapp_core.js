const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState, Browsers, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, delay } = require("@whiskeysockets/baileys");
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const NodeCache = require("node-cache");
const chalk = require('chalk');
const readline = require("readline");
const qrcode = require("qrcode-terminal");

// Create readline interface
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function initializeWhatsApp() {
    try {
        // Clear console and show welcome message
        console.clear();
        console.log('\n' + chalk.cyan('='.repeat(50)));
        console.log(chalk.cyan('WhatsApp Pairing Code Authentication'));
        console.log(chalk.cyan('='.repeat(50)) + '\n');

        console.log(chalk.yellow('Please follow these steps:'));
        console.log('1. Open WhatsApp on your phone');
        console.log('2. Go to Settings > Linked Devices');
        console.log('3. Tap on "Link a Device"');
        console.log('4. Wait for the pairing code prompt\n');

        // Get phone number
        const phoneNumber = await question(chalk.green('Enter your WhatsApp number (e.g., 916909137213): '));
        const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

        if (!cleanNumber || cleanNumber.length < 10) {
            console.log(chalk.red('\nInvalid phone number format. Please enter a valid number.'));
            process.exit(1);
        }

        console.log(chalk.green('\nPhone number validated:', cleanNumber));
        console.log(chalk.yellow('\nInitializing WhatsApp connection...'));

        // Get latest version
        let { version, isLatest } = await fetchLatestBaileysVersion();

        // Clean sessions directory
        await fs.promises.rm('./sessions', { recursive: true, force: true });
        await fs.promises.mkdir('./sessions', { recursive: true });

        // Initialize auth state
        const { state, saveCreds } = await useMultiFileAuthState('./sessions');
        const msgRetryCounterCache = new NodeCache();

        // Create socket with proven configuration
        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            mobile: false,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            browser: ['Chrome (Linux)', '', ''],
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            msgRetryCounterCache,
            defaultQueryTimeoutMs: undefined,
            pairingCode: true,
            phoneNumber: parseInt(cleanNumber)
        });

        // Set timeout for pairing code
        const pairingTimeout = setTimeout(() => {
            console.log(chalk.yellow('\nNo pairing code received within 30 seconds'));
            console.log('Possible issues:');
            console.log('1. WhatsApp version not up to date');
            console.log('2. Invalid phone number');
            console.log('3. Network connectivity issues\n');
        }, 30000);

        // Handle connection updates
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            // Handle pairing code
            if (update.pairingCode) {
                clearTimeout(pairingTimeout);
                const code = update.pairingCode.match(/.{1,4}/g)?.join("-") || update.pairingCode;
                console.log('\n' + chalk.green('='.repeat(50)));
                console.log(chalk.green('Your Pairing Code: ') + chalk.white(code));
                console.log(chalk.green('='.repeat(50)) + '\n');
            }

            // Handle QR code as fallback
            if (qr) {
                clearTimeout(pairingTimeout);
                console.log(chalk.yellow('\nFallback: Scan this QR code with WhatsApp:'));
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom)? 
                    lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut : true;

                if (shouldReconnect) {
                    console.log(chalk.yellow('\nConnection closed, attempting to reconnect...'));
                    setTimeout(initializeWhatsApp, 3000);
                } else {
                    console.log(chalk.red('\nConnection closed permanently'));
                    process.exit(1);
                }
            }

            if (connection === 'open') {
                clearTimeout(pairingTimeout);
                console.log(chalk.green('\nWhatsApp connection established successfully!'));

                await delay(1000 * 2); // Short delay before sending message
                const startupMessage = '🤖 *WhatsApp Bot Online!*\n\nSend !menu to see available commands';

                try {
                    await sock.sendMessage(sock.user.id, { text: startupMessage });
                    console.log(chalk.green('Startup message sent successfully'));
                    rl.close();
                } catch (error) {
                    console.log(chalk.red('Failed to send startup message:', error.message));
                }
            }
        });

        // Handle credentials update
        sock.ev.on('creds.update', saveCreds);

        return sock;
    } catch (error) {
        console.error(chalk.red('\nFatal error:', error.message));
        rl.close();
        process.exit(1);
    }
}

// Start the application
console.log(chalk.blue('\nStarting WhatsApp Bot...'));
initializeWhatsApp().catch(err => {
    console.error(chalk.red('\nStartup error:'), err.message);
    rl.close();
    process.exit(1);
});