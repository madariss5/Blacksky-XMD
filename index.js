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

// Initialize Express server
const app = express();
const PORT = process.env.PORT || 5000;

// Bot configuration
const owner = ['254710772666']; // Replace with your number
const sessionName = "shaban-md"; // Session name
const botName = "SHABAN-MD"; // Bot name
const TIME_ZONE = "Africa/Nairobi"; // Adjust to your timezone

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });
const msgRetryCounterCache = new NodeCache();

// Start server with port handling
const startServer = () => {
    app.get('/', (req, res) => {
        res.json({ status: 'WhatsApp Bot Server Running' });
    });

    return new Promise((resolve, reject) => {
        const server = app.listen(PORT, '0.0.0.0')
            .once('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    console.log(chalk.yellow(`Port ${PORT} is busy. Server could not start.`));
                    resolve(false);
                } else {
                    reject(err);
                }
            })
            .once('listening', () => {
                console.log(chalk.green(`Server started on port ${PORT}`));
                resolve(true);
            });
    });
};

async function startHANS() {
    try {
        // Try to start the server first
        await startServer();

        console.log(chalk.yellow('Loading WhatsApp session...'));

        const { state, saveCreds } = await useMultiFileAuthState(`./auth_info_baileys`);
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(chalk.yellow(`Using WA v${version.join('.')}, isLatest: ${isLatest}`));

        const hans = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: true,
            auth: state,
            browser: ['SHABAN-MD', 'Safari', '1.0.0'],
            msgRetryCounterCache,
            defaultQueryTimeoutMs: undefined,
            patchMessageBeforeSending: (message) => {
                const requiresPatch = !!(
                    message.buttonsMessage 
                    || message.templateMessage
                    || message.listMessage
                );
                if (requiresPatch) {
                    message = {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadataVersion: 2,
                                    deviceListMetadata: {},
                                },
                                ...message,
                            },
                        },
                    };
                }
                return message;
            },
        });

        store.bind(hans.ev);

        // Handle connection updates
        hans.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log(chalk.cyan('\nScan this QR code to connect:'));
            }

            if (connection === 'close') {
                let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
                console.log(chalk.red('Connection closed due to ', reason));

                if (reason === DisconnectReason.badSession) {
                    console.log(chalk.red('Bad Session File, Please Delete Session and Scan Again'));
                    process.exit(1);
                } else if (reason === DisconnectReason.connectionClosed) {
                    console.log(chalk.yellow('Connection closed, reconnecting....'));
                    startHANS();
                } else if (reason === DisconnectReason.connectionLost) {
                    console.log(chalk.yellow('Connection Lost from Server, reconnecting...'));
                    startHANS();
                } else if (reason === DisconnectReason.connectionReplaced) {
                    console.log(chalk.red('Connection Replaced, Please Close Current Session First'));
                    process.exit(1);
                } else if (reason === DisconnectReason.loggedOut) {
                    console.log(chalk.red('Device Logged Out, Please Delete Session and Scan Again.'));
                    process.exit(1);
                } else if (reason === DisconnectReason.restartRequired) {
                    console.log(chalk.yellow('Restart Required, Restarting...'));
                    startHANS();
                } else if (reason === DisconnectReason.timedOut) {
                    console.log(chalk.yellow('Connection TimedOut, Reconnecting...'));
                    startHANS();
                } else {
                    console.log(chalk.red(`Unknown DisconnectReason: ${reason}|${connection}`));
                    process.exit(1);
                }
            }

            if (connection === 'open') {
                console.log(chalk.green('\n✓ Successfully connected to WhatsApp\n'));
                console.log(chalk.cyan('• Bot Status: Online'));
                console.log(chalk.cyan('• Type !menu to see available commands\n'));

                // Send info message to bot number
                hans.sendMessage(hans.user.id, { 
                    text: `🟢 ${botName} is now active and ready to use!`
                });
            }
        });

        // Handle credentials update
        hans.ev.on('creds.update', saveCreds);

        // Handle incoming messages
        hans.ev.on('messages.upsert', async chatUpdate => {
            try {
                let msg = JSON.parse(JSON.stringify(chatUpdate.messages[0]));
                if (!msg.message) return;

                msg.message = (Object.keys(msg.message)[0] === 'ephemeralMessage') 
                    ? msg.message.ephemeralMessage.message 
                    : msg.message;

                if (msg.key && msg.key.remoteJid === 'status@broadcast') return;

                const m = smsg(hans, msg, store);
                require('./handler')(hans, m, chatUpdate, store);
            } catch (err) {
                console.error('Error in message handler: ', err);
            }
        });

        // Handle group participants update
        hans.ev.on('group-participants.update', async (grp) => {
            try {
                let metadata = await hans.groupMetadata(grp.id);
                let participants = grp.participants;

                for (let num of participants) {
                    const welcomeMessage = `Welcome @${num.split('@')[0]} to ${metadata.subject}! 🎉`;
                    if (grp.action == 'add') {
                        hans.sendMessage(grp.id, { 
                            text: welcomeMessage,
                            mentions: [num]
                        });
                    }
                }
            } catch (err) {
                console.error('Error in group update handler: ', err);
            }
        });

        // Handle presence update
        hans.ev.on('presence.update', async data => {
            // Presence handling implementation
        });

        // Handle message delete
        hans.ev.on('message-delete', async data => {
            // Message delete handling implementation
        });

        return hans;
    } catch (err) {
        console.error('Fatal error in startHANS: ', err);
        process.exit(1);
    }
}

// Start the bot
startHANS().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});

// Handle uncaught errors
process.on('uncaughtException', err => {
    console.error('Uncaught Exception:', err);
    if (err.code !== 'EADDRINUSE') {
        process.exit(1);
    }
});

process.on('unhandledRejection', err => {
    console.error('Unhandled Promise Rejection:', err);
    if (err.code !== 'EADDRINUSE') {
        process.exit(1);
    }
});