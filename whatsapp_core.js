const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState, Browsers, DisconnectReason, PHONENUMBER_MCC } = require("@whiskeysockets/baileys");
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const chalk = require('chalk');
const readline = require("readline");
const qrcode = require("qrcode-terminal");
const pino = require('pino');

// Initialize logger
const logger = pino({ 
    level: 'warn',
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

const question = (text) => new Promise((resolve) => rl.question(text, resolve));

function validatePhoneNumber(number) {
    // Clean the number
    const cleanNumber = number.replace(/[^0-9]/g, '');

    // Basic validation
    if (!cleanNumber || cleanNumber.length < 10) {
        return { isValid: false, number: cleanNumber, error: 'Invalid phone number format' };
    }

    // Country code validation if PHONENUMBER_MCC is available
    if (typeof PHONENUMBER_MCC === 'object' && PHONENUMBER_MCC !== null) {
        const hasValidCountryCode = Object.keys(PHONENUMBER_MCC).some(v => cleanNumber.startsWith(v));
        if (!hasValidCountryCode) {
            return { isValid: false, number: cleanNumber, error: 'Invalid country code' };
        }
    }

    return { isValid: true, number: cleanNumber };
}

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

        // Get phone number from environment or user input
        let phoneNumber = process.env.OWNER_NUMBER;
        if (!phoneNumber) {
            phoneNumber = await question(chalk.green('Enter your WhatsApp number (e.g., +916909137213): '));
            if (!phoneNumber) {
                console.log(chalk.red('\nNo phone number provided and OWNER_NUMBER not set'));
                process.exit(1);
            }
        } else {
            console.log(chalk.yellow('\nUsing phone number from environment:', phoneNumber));
        }

        // Validate phone number
        const validation = validatePhoneNumber(phoneNumber);
        if (!validation.isValid) {
            console.log(chalk.red(`\nInvalid phone number: ${validation.error}`));
            process.exit(1);
        }

        phoneNumber = validation.number;
        console.log(chalk.green('\nPhone number validated:', phoneNumber));
        console.log(chalk.yellow('\nInitializing WhatsApp connection...'));

        // Clean previous session
        await fs.promises.rm('./sessions', { recursive: true, force: true }).catch(() => {});
        await fs.promises.mkdir('./sessions', { recursive: true });

        // Initialize auth
        const { state, saveCreds } = await useMultiFileAuthState('sessions');

        // Create socket with specific configuration for pairing
        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            mobile: false,
            logger: pino({ level: 'silent' }),
            browser: Browsers.ubuntu('Chrome'),
            pairingCode: true,
            defaultQueryTimeoutMs: undefined
        });

        // Handle connection updates
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'connecting') {
                console.log(chalk.yellow('\nConnecting to WhatsApp...'));

                // Request pairing code with retry
                setTimeout(async () => {
                    let retries = 3;
                    while (retries > 0) {
                        try {
                            console.log(chalk.yellow('Requesting pairing code...'));
                            const code = await sock.requestPairingCode(phoneNumber);
                            if (code) {
                                const formattedCode = code.match(/.{1,4}/g)?.join("-") || code;
                                console.log('\n' + chalk.green('='.repeat(50)));
                                console.log(chalk.green('Your Pairing Code: ') + chalk.white(formattedCode));
                                console.log(chalk.green('='.repeat(50)) + '\n');
                                break;
                            }
                        } catch (error) {
                            retries--;
                            if (retries === 0) {
                                console.log(chalk.red('\nFailed to get pairing code:', error.message));
                                console.log(chalk.yellow('Falling back to QR code...'));
                                sock.printQRInTerminal = true;
                            } else {
                                console.log(chalk.yellow(`\nRetrying pairing code request... (${retries} attempts left)`));
                                await new Promise(resolve => setTimeout(resolve, 2000));
                            }
                        }
                    }
                }, 3000);
            }

            if (connection === 'open') {
                console.log(chalk.green('\nWhatsApp connection established!'));

                try {
                    const startupMessage = '🤖 *WhatsApp Bot Online!*\n\nSend !menu to see available commands';
                    await sock.sendMessage(sock.user.id, { text: startupMessage });
                    console.log(chalk.green('Startup message sent'));
                    process.exit(0);
                } catch (error) {
                    console.log(chalk.red('Failed to send startup message:', error.message));
                }
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom) ?
                    lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut : true;

                if (shouldReconnect) {
                    console.log(chalk.yellow('\nConnection closed, attempting to reconnect...'));
                    setTimeout(startWhatsApp, 3000);
                } else {
                    console.log(chalk.red('\nConnection closed permanently'));
                    process.exit(1);
                }
            }
        });

        // Handle credentials update
        sock.ev.on('creds.update', saveCreds);

    } catch (error) {
        console.error(chalk.red('\nFatal error:', error.message));
        process.exit(1);
    }
}

// Start the application
console.log(chalk.blue('\nStarting WhatsApp Bot...'));
startWhatsApp().catch(err => {
    console.error(chalk.red('\nStartup error:', err.message));
    process.exit(1);
});