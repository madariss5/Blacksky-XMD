const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason, fetchLatestBaileysVersion, makeInMemoryStore, jidDecode, proto } = require("@whiskeysockets/baileys");
const { Boom } = require('@hapi/boom');
const pino = require("pino");
const chalk = require('chalk');
const fs = require("fs-extra");
const path = require("path");
const qrcode = require('qrcode-terminal');
const conf = require("./config");
const logger = require("./utils/logger");

let isConnected = false;
let session = conf.session;
let connectionChoice = null;

const store = makeInMemoryStore({
    logger: pino().child({
        level: "silent",
        stream: "store"
    })
});

async function showConnectionMenu() {
    // Clear terminal first
    process.stdout.write('\x1Bc');

    console.log(chalk.cyan('\n╔═══════════════════════════════════════════╗'));
    console.log(chalk.cyan('║          ') + chalk.yellow('𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻') + chalk.cyan('              ║'));
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

    // Store choice and return
    connectionChoice = process.env.USE_PAIRING === 'true' ? '1' : '2';
    return connectionChoice;
}

async function askPhoneNumber() {
    console.log(chalk.cyan('\n╔═══════════════════════════════════════════╗'));
    console.log(chalk.cyan('║         ') + chalk.yellow('ENTER PHONE NUMBER') + chalk.cyan('            ║'));
    console.log(chalk.cyan('╚═══════════════════════════════════════════╝\n'));

    console.log(chalk.gray('• Format: Country Code + Number'));
    console.log(chalk.gray('• Example: 254712345678'));
    console.log(chalk.gray('• Do not include + or spaces\n'));

    const phone = process.env.BOT_NUMBER || '';
    if (!phone.match(/^\d{10,14}$/)) {
        throw new Error('Invalid phone number format');
    }
    return phone;
}

async function startWhatsAppConnection() {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState(__dirname + "/scan");

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: state.keys
        },
        browser: ["𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻", "safari", "1.0.0"],
        getMessage: async (key) => {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id);
                return msg?.message || undefined;
            }
            return { conversation: "An Error Occurred, Repeat Command!" };
        }
    });

    store.bind(sock.ev);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            try {
                if (connectionChoice === '1') {
                    try {
                        const phoneNumber = await askPhoneNumber();
                        console.log(chalk.yellow('\nGenerating pairing code...\n'));
                        const code = await sock.requestPairingCode(phoneNumber);
                        console.log(chalk.white('Your pairing code: ') + chalk.green.bold(code));
                        console.log(chalk.gray('\n1. Open WhatsApp on your phone'));
                        console.log(chalk.gray('2. Go to Linked Devices > Link a Device'));
                        console.log(chalk.gray('3. Enter the pairing code shown above\n'));
                    } catch (error) {
                        console.log(chalk.red('\nPairing code generation failed. Using QR code instead.\n'));
                        qrcode.generate(qr, { small: true });
                    }
                } else {
                    console.log(chalk.cyan('\n╔═══════════════════════════════════════════╗'));
                    console.log(chalk.cyan('║         ') + chalk.yellow('SCAN QR CODE') + chalk.cyan('                ║'));
                    console.log(chalk.cyan('╚═══════════════════════════════════════════╝\n'));
                    qrcode.generate(qr, { small: true });
                    console.log(chalk.gray('\n1. Open WhatsApp on your phone'));
                    console.log(chalk.gray('2. Go to Linked Devices > Link a Device'));
                    console.log(chalk.gray('3. Point your camera at the QR code\n'));
                }
            } catch (error) {
                logger.error('Connection error:', error);
            }
        }

        if (connection === "close") {
            let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (reason === DisconnectReason.badSession) {
                console.log(`Bad Session File, Please Delete ${session} and Scan Again`);
                sock.logout();
            } else if (reason === DisconnectReason.connectionClosed) {
                console.log("Connection closed, reconnecting....");
                connectToWhatsApp();
            } else if (reason === DisconnectReason.connectionLost) {
                console.log("Connection Lost from Server, reconnecting...");
                connectToWhatsApp();
            } else if (reason === DisconnectReason.connectionReplaced) {
                console.log("Connection Replaced, Another New Session Opened, Please Close Current Session First");
                sock.logout();
            } else if (reason === DisconnectReason.loggedOut) {
                console.log(`Device Logged Out, Please Delete ${session} and Scan Again.`);
                sock.logout();
            } else if (reason === DisconnectReason.restartRequired) {
                console.log("Restart Required, Restarting...");
                connectToWhatsApp();
            } else if (reason === DisconnectReason.timedOut) {
                console.log("Connection TimedOut, Reconnecting...");
                connectToWhatsApp();
            } else {
                sock.end(`Unknown DisconnectReason: ${reason}|${lastDisconnect.error}`);
            }
        }

        if (connection === 'open') {
            console.log('Connected to WhatsApp');
            isConnected = true;
        }
    });

    // Your existing event handlers here
    sock.ev.on("messages.upsert", async (messages) => {
        // Your existing message handling code
    });
}

async function connectToWhatsApp() {
    try {
        // Initialize session
        if (!fs.existsSync(__dirname + "/scan/creds.json")) {
            console.log("connexion en cour ...");
            await fs.writeFileSync(__dirname + "/scan/creds.json", atob(session), "utf8");
        } else if (fs.existsSync(__dirname + "/scan/creds.json") && session != "zokk") {
            await fs.writeFileSync(__dirname + "/scan/creds.json", atob(session), "utf8");
        }
    } catch (error) {
        console.log("Session Invalid " + error);
        return;
    }

    // Show connection menu first
    await showConnectionMenu();

    // Start connection after menu selection
    setTimeout(() => {
        startWhatsAppConnection();
    }, 0);
}

// Start the connection
connectToWhatsApp();