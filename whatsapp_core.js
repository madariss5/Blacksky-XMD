const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState, Browsers, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const chalk = require('chalk');
const readline = require("readline");
const qrcode = require("qrcode-terminal");
const pino = require('pino');

// Initialize logger
const logger = pino({ 
    level: 'debug',
    transport: {
        target: 'pino-pretty',
        options: { colorize: true }
    }
});

// Initialize readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function startWhatsApp() {
    try {
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
        let phoneNumber = process.env.OWNER_NUMBER;
        if (!phoneNumber) {
            console.log(chalk.red('\nNo phone number provided in environment'));
            process.exit(1);
        }

        // Format phone number: remove non-digits and ensure it starts with country code
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
        logger.info('Using phone number:', phoneNumber);

        if (!phoneNumber || phoneNumber.length < 10) {
            console.log(chalk.red('\nInvalid phone number format'));
            process.exit(1);
        }

        console.log(chalk.green('\nPhone number validated:', phoneNumber));
        console.log(chalk.yellow('\nInitializing WhatsApp connection...'));

        // Clean previous session
        await fs.promises.rm('./sessions', { recursive: true, force: true }).catch(() => {});
        await fs.promises.mkdir('./sessions', { recursive: true });

        // Initialize auth state
        const { state, saveCreds } = await useMultiFileAuthState('./sessions');
        const { version } = await fetchLatestBaileysVersion();
        logger.info('Using Baileys version:', version);

        // Create WhatsApp socket with specific configuration
        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }), // Silence Baileys internal logging
            printQRInTerminal: false, // We'll handle QR display ourselves
            browser: Browsers.ubuntu('Chrome'),
            auth: state,
            mobile: false,
            defaultQueryTimeoutMs: undefined,
            connectTimeoutMs: 60_000,
            pairingCode: true,
            phoneNumber: parseInt(phoneNumber)
        });

        let hasPairingCode = false;
        let connectionRetries = 0;
        const MAX_RETRIES = 3;

        // Connection handling
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            logger.debug('Connection update:', update);

            if (connection === 'connecting' && !hasPairingCode) {
                // Allow some time for the connection to initialize
                setTimeout(async () => {
                    try {
                        console.log(chalk.yellow('\nRequesting pairing code...'));
                        const code = await sock.requestPairingCode(phoneNumber);
                        if (code) {
                            hasPairingCode = true;
                            const formattedCode = code.match(/.{1,4}/g)?.join("-") || code;
                            console.log('\n' + chalk.green('='.repeat(50)));
                            console.log(chalk.green('Your Pairing Code: ') + chalk.white(formattedCode));
                            console.log(chalk.green('='.repeat(50)) + '\n');
                            logger.info('Pairing code generated successfully:', formattedCode);
                        }
                    } catch (error) {
                        logger.error('Pairing code request failed:', error);
                        console.log(chalk.red('\nFailed to get pairing code:', error.message));

                        connectionRetries++;
                        if (connectionRetries >= MAX_RETRIES) {
                            console.log(chalk.yellow('\nFalling back to QR code method...'));
                            sock.printQRInTerminal = true;
                        } else {
                            console.log(chalk.yellow(`\nRetrying... (${connectionRetries}/${MAX_RETRIES})`));
                        }
                    }
                }, 3000);
            }

            if (connection === 'open') {
                console.log(chalk.green('\nWhatsApp connection established successfully!'));

                try {
                    const startupMessage = '🤖 *WhatsApp Bot Online!*\n\nSend !menu to see available commands';
                    await sock.sendMessage(sock.user.id, { text: startupMessage });
                    logger.info('Startup message sent successfully');
                    console.log(chalk.green('Startup message sent'));
                    process.exit(0);
                } catch (error) {
                    logger.error('Failed to send startup message:', error);
                }
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom) ?
                    lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut : true;

                logger.info('Connection closed:', {
                    shouldReconnect,
                    errorCode: lastDisconnect?.error?.output?.statusCode
                });

                if (shouldReconnect && connectionRetries < MAX_RETRIES) {
                    connectionRetries++;
                    console.log(chalk.yellow(`\nConnection closed, attempting reconnect ${connectionRetries}/${MAX_RETRIES}...`));
                    setTimeout(startWhatsApp, 3000);
                } else {
                    console.log(chalk.red('\nConnection closed permanently'));
                    process.exit(1);
                }
            }
        });

        // Handle credentials update
        sock.ev.on('creds.update', saveCreds);

        // Handle errors
        process.on('uncaughtException', (err) => {
            logger.error('Uncaught Exception:', err);
            console.error(chalk.red('\nFatal error:', err.message));
            process.exit(1);
        });

    } catch (error) {
        logger.error('Fatal error:', error);
        console.error(chalk.red('\nFatal error:', error.message));
        process.exit(1);
    }
}

// Start the application
console.log(chalk.blue('\nStarting WhatsApp Bot...'));
startWhatsApp().catch(err => {
    logger.error('Startup error:', err);
    console.error(chalk.red('\nStartup error:', err.message));
    process.exit(1);
});