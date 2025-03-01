const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, Browsers, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const chalk = require('chalk');
const pino = require('pino');
const NodeCache = require('node-cache');
const path = require('path');

// Initialize logger
const logger = pino({ 
    level: 'info',
    transport: {
        target: 'pino-pretty',
        options: { colorize: true }
    }
});

async function startWhatsApp() {
    try {
        console.clear();
        console.log('\n' + chalk.cyan('='.repeat(50)));
        console.log(chalk.cyan('WhatsApp Bot Pairing Code Authentication'));
        console.log(chalk.cyan('='.repeat(50)) + '\n');

        console.log(chalk.yellow('Please follow these steps:'));
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
        console.log(chalk.yellow('\nInitializing WhatsApp connection...'));

        // Clean previous session
        const sessionsDir = path.join(process.cwd(), 'sessions');
        await fs.promises.rm(sessionsDir, { recursive: true, force: true }).catch(() => {});
        await fs.promises.mkdir(sessionsDir, { recursive: true });

        // Initialize auth state with retries
        let state, saveCreds;
        try {
            const authResult = await useMultiFileAuthState('sessions');
            state = authResult.state;
            saveCreds = authResult.saveCreds;
            logger.info('Auth state loaded successfully');
        } catch (error) {
            logger.error('Failed to load auth state:', error);
            process.exit(1);
        }

        // Initialize version
        const { version } = await fetchLatestBaileysVersion();
        logger.info('Using Baileys version:', version);

        let hasPairingCode = false;
        let connectionRetries = 0;
        const MAX_RETRIES = 3;

        const msgRetryCounterCache = new NodeCache();

        // Create socket with enhanced error handling
        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            mobile: false,
            browser: Browsers.ubuntu('Chrome'),
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger),
            },
            msgRetryCounterCache,
            generateHighQualityLinkPreview: true,
            defaultQueryTimeoutMs: undefined,
            connectTimeoutMs: 60_000,
            emitOwnEvents: true,
            pairingCode: true,
            phoneNumber: parseInt(phoneNumber)
        });

        // Handle connection updates
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            logger.info('Connection update:', {
                connection,
                disconnectReason: lastDisconnect?.error?.output?.statusCode
            });

            if (connection === 'connecting' && !hasPairingCode) {
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
                            console.log(chalk.yellow('Enter this code in WhatsApp mobile app when prompted'));
                            console.log(chalk.yellow('Waiting for connection...\n'));
                            logger.info('Pairing code generated:', formattedCode);
                        }
                    } catch (error) {
                        logger.error('Failed to request pairing code:', error);
                        connectionRetries++;

                        if (connectionRetries < MAX_RETRIES) {
                            console.log(chalk.yellow(`\nRetrying... (${connectionRetries}/${MAX_RETRIES})`));
                            setTimeout(() => {
                                if (!hasPairingCode) {
                                    sock.requestPairingCode(phoneNumber);
                                }
                            }, 2000);
                        } else {
                            console.log(chalk.red('\nFailed to generate pairing code after multiple attempts.'));
                            process.exit(1);
                        }
                    }
                }, 3000);
            }

            if (connection === 'open') {
                console.log(chalk.green('\nWhatsApp connection established successfully!'));
                try {
                    await sock.sendMessage(sock.user.id, {
                        text: '🤖 *WhatsApp Bot Online!*\n\nSend !menu to see available commands'
                    });
                    logger.info('Startup message sent successfully');
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
                    errorCode: lastDisconnect?.error?.output?.statusCode,
                    retries: connectionRetries
                });

                if (shouldReconnect && connectionRetries < MAX_RETRIES) {
                    connectionRetries++;
                    console.log(chalk.yellow(`\nConnection closed, attempting reconnect (${connectionRetries}/${MAX_RETRIES})...`));
                    setTimeout(startWhatsApp, 3000);
                } else {
                    console.log(chalk.red('\nConnection closed permanently. Please check your WhatsApp mobile app and try again.'));
                    process.exit(1);
                }
            }
        });

        // Handle credentials update
        sock.ev.on('creds.update', saveCreds);

        process.on('uncaughtException', (err) => {
            logger.error('Uncaught Exception:', err);
            console.error(chalk.red('\nFatal error:', err.message));
            process.exit(1);
        });

    } catch (error) {
        logger.error('Fatal error:', error);
        console.error(chalk.red('\nStartup error:', error.message));
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