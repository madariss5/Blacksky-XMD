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

const question = (text, timeout = 15000) => new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
        rl.removeAllListeners('line');
        resolve(null);
    }, timeout);

    rl.question(text, (answer) => {
        clearTimeout(timeoutId);
        resolve(answer ? answer.trim() : null);
    });
});

async function selectAuthMethod() {
    console.log(chalk.cyan('\nSelect Authentication Method:'));
    console.log('1. Pairing Code');
    console.log('2. QR Code');

    const answer = await question(chalk.green('\nEnter your choice (1 or 2): '));

    if (!answer) {
        console.log(chalk.yellow('\nNo input received, defaulting to QR code method...'));
        return 'qr';
    }

    if (answer !== '1' && answer !== '2') {
        console.log(chalk.red('\nInvalid choice. Please select 1 or 2.'));
        return await selectAuthMethod();
    }

    return answer === '1' ? 'pairing' : 'qr';
}

async function startWhatsApp() {
    try {
        console.clear();
        console.log('\n' + chalk.cyan('='.repeat(50)));
        console.log(chalk.cyan('WhatsApp Bot Authentication'));
        console.log(chalk.cyan('='.repeat(50)) + '\n');

        // Select authentication method
        const authMethod = await selectAuthMethod();

        if (authMethod === 'pairing') {
            console.log('\n' + chalk.yellow('Pairing Code Authentication'));
            console.log('Please follow these steps:');
            console.log('1. Open WhatsApp on your phone');
            console.log('2. Go to Settings > Linked Devices');
            console.log('3. Tap on "Link a Device"');
            console.log('4. Wait for the pairing code prompt\n');

            // Get phone number from environment
            let phoneNumber = process.env.OWNER_NUMBER;
            if (!phoneNumber) {
                console.log(chalk.red('\nNo phone number provided in environment'));
                process.exit(1);
            }

            // Format phone number: remove non-digits
            phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
            logger.info('Using phone number:', phoneNumber);

            if (!phoneNumber || phoneNumber.length < 10) {
                console.log(chalk.red('\nInvalid phone number format'));
                process.exit(1);
            }

            console.log(chalk.green('\nPhone number validated:', phoneNumber));
        } else {
            console.log('\n' + chalk.yellow('QR Code Authentication'));
            console.log('Please follow these steps:');
            console.log('1. Open WhatsApp on your phone');
            console.log('2. Go to Settings > Linked Devices');
            console.log('3. Tap on "Link a Device"');
            console.log('4. Scan the QR code when it appears\n');
        }

        console.log(chalk.yellow('\nInitializing WhatsApp connection...'));

        // Clean previous session
        await fs.promises.rm('./sessions', { recursive: true, force: true }).catch(() => {});
        await fs.promises.mkdir('./sessions', { recursive: true });

        // Initialize auth state
        const { state, saveCreds } = await useMultiFileAuthState('./sessions');
        const { version } = await fetchLatestBaileysVersion();
        logger.info('Using Baileys version:', version);

        // Create WhatsApp socket
        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }), // Silence Baileys internal logging
            printQRInTerminal: authMethod === 'qr', // Show QR in terminal only for QR auth
            browser: Browsers.ubuntu('Chrome'),
            auth: state,
            mobile: false,
            defaultQueryTimeoutMs: undefined,
            connectTimeoutMs: 60_000,
            pairingCode: authMethod === 'pairing',
            phoneNumber: authMethod === 'pairing' ? parseInt(phoneNumber) : undefined
        });

        let hasPairingCode = false;
        let connectionRetries = 0;
        const MAX_RETRIES = 3;

        // Connection handling
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            logger.debug('Connection update:', update);

            if (authMethod === 'qr' && qr) {
                console.log(chalk.yellow('\nScan this QR code with WhatsApp:'));
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'connecting') {
                console.log(chalk.yellow('\nConnecting to WhatsApp...'));

                if (authMethod === 'pairing' && !hasPairingCode) {
                    // Request pairing code with retry mechanism
                    setTimeout(async () => {
                        try {
                            console.log(chalk.yellow('Requesting pairing code...'));
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

                            if (connectionRetries < MAX_RETRIES) {
                                connectionRetries++;
                                console.log(chalk.yellow(`\nRetrying pairing code request... (${connectionRetries}/${MAX_RETRIES})`));
                                setTimeout(() => {
                                    if (!hasPairingCode) {
                                        sock.requestPairingCode(phoneNumber);
                                    }
                                }, 2000);
                            } else {
                                console.log(chalk.yellow('\nFalling back to QR code method...'));
                                sock.printQRInTerminal = true;
                            }
                        }
                    }, 3000);
                }
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