const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
    jidDecode,
    proto,
    getContentType
} = require("@whiskeysockets/baileys");

const pino = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require('fs-extra');
const chalk = require('chalk');
const path = require('path');
const axios = require('axios');
const NodeCache = require('node-cache');
const moment = require('moment-timezone');
const express = require('express');
const { exec, spawn, execSync } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const { smsg } = require('./lib/simple');

// Initialize Express server for keep-alive
const app = express();
const PORT = process.env.PORT || 5000;

// Bot configuration
const owner = ['254710772666']; // Replace with your number
const sessionName = "blacksky-md"; // Session name
const botName = "𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻"; // Bot name
const TIME_ZONE = "Africa/Nairobi"; // Adjust to your timezone

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });
const msgRetryCounterCache = new NodeCache();
let isShuttingDown = false;

// Keep-alive ping endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'WhatsApp Bot Server Running',
        botName: botName,
        uptime: process.uptime()
    });
});

// Start Express server with error handling
const startServer = () => {
    return new Promise((resolve) => {
        const server = app.listen(PORT, '0.0.0.0')
            .once('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    console.log(chalk.yellow(`Port ${PORT} is busy, trying alternative port`));
                    resolve(false);
                }
            })
            .once('listening', () => {
                console.log(chalk.green(`\nServer started on port ${PORT}`));
                resolve(true);
            });

        // Keep-alive interval
        setInterval(() => {
            axios.get(`http://0.0.0.0:${PORT}/`)
                .catch(() => console.log('Keep-alive ping'));
        }, 5 * 60 * 1000); // Every 5 minutes
    });
};

async function startHANS() {
    try {
        await startServer();
        console.log(chalk.yellow('\nLoading WhatsApp session...'));

        const { state, saveCreds } = await useMultiFileAuthState(`./auth_info_baileys`);
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(chalk.yellow(`Using WA v${version.join('.')}, isLatest: ${isLatest}`));

        const hans = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: true,
            auth: state,
            browser: ['𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻', 'Chrome', '112.0.5615.49'],
            msgRetryCounterCache,
            defaultQueryTimeoutMs: undefined,
            connectTimeoutMs: 60_000,
            qrTimeout: 40000,
            keepAliveIntervalMs: 10000,
            emitOwnEvents: true,
            markOnlineOnConnect: true,
            // Add decode functions
            getMessage: async (key) => {
                if (store) {
                    const msg = await store.loadMessage(key.remoteJid, key.id)
                    return msg?.message || undefined
                }
                return {
                    conversation: ''
                }
            }
        });

        store.bind(hans.ev);

        hans.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log(chalk.cyan('\nScan this QR code to connect:'));
            }

            if (connection === 'close') {
                let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
                console.log(chalk.red('Connection closed due to:', reason));

                if (reason === DisconnectReason.loggedOut) {
                    console.log(chalk.red('Device Logged Out, Please Delete Session and Scan Again.'));
                    await fs.remove('./auth_info_baileys');
                    process.exit(0);
                } else if (!isShuttingDown) {
                    console.log(chalk.yellow('Reconnecting...'));
                    setTimeout(startHANS, 3000);
                }
            }

            if (connection === 'open') {
                console.log(chalk.green('\n✓ Successfully connected to WhatsApp\n'));
                console.log(chalk.cyan('• Bot Status: Online'));
                console.log(chalk.cyan('• Type .menu to see available commands\n'));

                hans.sendMessage(hans.user.id, { 
                    text: `🟢 ${botName} is now active and ready to use!`
                });
            }
        });

        hans.ev.on('creds.update', saveCreds);

        hans.ev.on('messages.upsert', async chatUpdate => {
            try {
                let msg = JSON.parse(JSON.stringify(chatUpdate.messages[0]));
                if (!msg.message) return;

                msg.message = (Object.keys(msg.message)[0] === 'ephemeralMessage') 
                    ? msg.message.ephemeralMessage.message 
                    : msg.message;

                if (msg.key && msg.key.remoteJid === 'status@broadcast') return;

                try {
                    const m = smsg(hans, msg, store);
                    require('./handler')(hans, m, chatUpdate, store);
                } catch (parseError) {
                    console.error('Error parsing message:', parseError);
                }
            } catch (err) {
                console.error('Error in message handler:', err);
            }
        });

        return hans;
    } catch (err) {
        console.error('Fatal error in startHANS:', err);
        if (!isShuttingDown) {
            console.log(chalk.yellow('Attempting restart in 10 seconds...'));
            setTimeout(startHANS, 10000);
        }
    }
}

// Handle graceful shutdown
const shutdown = async (signal) => {
    try {
        isShuttingDown = true;
        console.log(chalk.yellow(`\nReceived ${signal}, shutting down gracefully...`));
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    if (!isShuttingDown && err.code !== 'EADDRINUSE') {
        console.log(chalk.yellow('Attempting restart after uncaught exception...'));
        setTimeout(startHANS, 3000);
    }
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    if (!isShuttingDown && err.code !== 'EADDRINUSE') {
        console.log(chalk.yellow('Attempting restart after unhandled rejection...'));
        setTimeout(startHANS, 3000);
    }
});

// Start the bot
startHANS().catch(err => {
    console.error('Fatal error:', err);
    if (!isShuttingDown) {
        console.log(chalk.yellow('Attempting restart after fatal error...'));
        setTimeout(startHANS, 10000);
    }
});