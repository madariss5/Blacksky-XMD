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
const FileType = require('file-type');
const path = require('path');
const axios = require('axios');
const NodeCache = require('node-cache');
const moment = require('moment-timezone');
const express = require('express');
const { exec, spawn, execSync } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const { smsg } = require('./lib/simple'); // We'll create this helper later

// Initialize Express server
const app = express();
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });
const msgRetryCounterCache = new NodeCache();

// Bot configuration
const owner = ['254710772666']; // Replace with your number
const sessionName = "shaban-md"; // Session name
const botName = "SHABAN-MD"; // Bot name
const TIME_ZONE = "Africa/Nairobi"; // Adjust to your timezone

async function startHANS() {
    try {
        console.log(chalk.yellow('Loading session...'));

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
                console.log(chalk.yellow('Please scan QR code to connect...'));
            }

            if (connection === 'close') {
                let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
                if (reason === DisconnectReason.badSession) {
                    console.log(chalk.red('Bad Session File, Please Delete Session and Scan Again'));
                    startHANS();
                } else if (reason === DisconnectReason.connectionClosed) {
                    console.log(chalk.red('Connection closed, reconnecting....'));
                    startHANS();
                } else if (reason === DisconnectReason.connectionLost) {
                    console.log(chalk.red('Connection Lost from Server, reconnecting...'));
                    startHANS();
                } else if (reason === DisconnectReason.connectionReplaced) {
                    console.log(chalk.red('Connection Replaced, Another New Session Opened, Please Close Current Session First'));
                    hans.logout();
                } else if (reason === DisconnectReason.loggedOut) {
                    console.log(chalk.red('Device Logged Out, Please Scan Again And Run.'));
                    hans.logout();
                } else if (reason === DisconnectReason.restartRequired) {
                    console.log(chalk.yellow('Restart Required, Restarting...'));
                    startHANS();
                } else if (reason === DisconnectReason.timedOut) {
                    console.log(chalk.red('Connection TimedOut, Reconnecting...'));
                    startHANS();
                } else {
                    hans.end(`Unknown DisconnectReason: ${reason}|${connection}`);
                }
            }

            if (connection === 'open') {
                console.log(chalk.green('Successfully connected to WhatsApp'));

                // Send info message to bot number
                hans.sendMessage(hans.user.id, { text: `🟢 Bot is now active!\n\n${botName} is ready to use.` });
            }
        });

        // Handle credentials update
        hans.ev.on('creds.update', saveCreds);

        // Handle incoming messages
        hans.ev.on('messages.upsert', async chatUpdate => {
            try {
                let msg = JSON.parse(JSON.stringify(chatUpdate.messages[0]));
                if (!msg.message) return;

                msg.message = (Object.keys(msg.message)[0] === 'ephemeralMessage') ? msg.message.ephemeralMessage.message : msg.message;
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
                    // Welcome message implementation will go here
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

        // Add more features and command handlers here

        return hans;
    } catch (err) {
        console.error('Error in startHANS: ', err);
    }
}

// Start the bot
startHANS();

// Catch uncaught errors
process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);