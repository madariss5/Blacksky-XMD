const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState, Browsers, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, delay } = require("@whiskeysockets/baileys");
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const NodeCache = require("node-cache");
const chalk = require('chalk');
const readline = require("readline");
const qrcode = require("qrcode-terminal");
const pino = require('pino'); // Re-add pino import

// Simple readline interface
const rl = readline.createInterface({ 
    input: process.stdin, 
    output: process.stdout 
});

// Configure minimal logger
const logger = pino({ level: 'warn' });

async function startWhatsApp() {
    console.clear();
    console.log('\n' + chalk.cyan('='.repeat(50)));
    console.log(chalk.cyan('WhatsApp Pairing Code Authentication'));
    console.log(chalk.cyan('='.repeat(50)) + '\n');

    console.log(chalk.yellow('Please follow these steps:'));
    console.log('1. Open WhatsApp on your phone');
    console.log('2. Go to Settings > Linked Devices');
    console.log('3. Tap on "Link a Device"');
    console.log('4. Wait for the pairing code prompt\n');

    try {
        // Get phone number
        const phoneNumber = await new Promise((resolve) => {
            rl.question(chalk.green('Enter your WhatsApp number (e.g., 916909137213): '), (answer) => {
                resolve(answer.trim().replace(/[^0-9]/g, ''));
            });
        });

        if (!phoneNumber || phoneNumber.length < 10) {
            console.log(chalk.red('\nInvalid phone number format'));
            rl.close();
            process.exit(1);
        }

        console.log(chalk.green('\nPhone number validated:', phoneNumber));
        console.log(chalk.yellow('\nInitializing WhatsApp connection...'));

        // Clean session and initialize auth
        await fs.promises.rm('./sessions', { recursive: true, force: true });
        await fs.promises.mkdir('./sessions', { recursive: true });

        const { state, saveCreds } = await useMultiFileAuthState('./sessions');
        const { version } = await fetchLatestBaileysVersion();
        const msgRetryCounterCache = new NodeCache();

        const sock = makeWASocket({
            version,
            logger: logger.child({ level: 'silent' }), // Use configured logger
            printQRInTerminal: true,
            browser: Browsers.ubuntu('Chrome'),
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger.child({ level: "fatal" })),
            },
            msgRetryCounterCache,
            defaultQueryTimeoutMs: undefined,
            pairingCode: true,
            phoneNumber: parseInt(phoneNumber)
        });

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (update.pairingCode) {
                const code = update.pairingCode.match(/.{1,4}/g)?.join("-") || update.pairingCode;
                console.log('\n' + chalk.green('='.repeat(50)));
                console.log(chalk.green('Your Pairing Code: ') + chalk.white(code));
                console.log(chalk.green('='.repeat(50)) + '\n');
            }

            if (qr) {
                console.log(chalk.yellow('\nFallback: Scan this QR code with WhatsApp:'));
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom) ?
                    lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut : true;

                if (shouldReconnect) {
                    console.log(chalk.yellow('\nConnection closed, reconnecting...'));
                    setTimeout(startWhatsApp, 3000);
                } else {
                    console.log(chalk.red('\nConnection closed permanently'));
                    rl.close();
                    process.exit(1);
                }
            }

            if (connection === 'open') {
                console.log(chalk.green('\nWhatsApp connection established successfully!'));

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

        sock.ev.on('creds.update', saveCreds);

    } catch (error) {
        console.error(chalk.red('\nFatal error:', error.message));
        rl.close();
        process.exit(1);
    }
}

// Start application
console.log(chalk.blue('\nStarting WhatsApp Bot...'));
startWhatsApp().catch(err => {
    console.error(chalk.red('\nStartup error:', err.message));
    rl.close();
    process.exit(1);
});