const { default: makeWASocket, useMultiFileAuthState, makeInMemoryStore, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const config = require("./config");
const fs = require("fs-extra");
const path = require("path");

// Create store to save chats
const store = makeInMemoryStore({ 
    logger: pino().child({ level: "silent", stream: "store" }) 
});

// Start WhatsApp connection
async function connectToWhatsApp() {
    // Ensure auth directory exists
    await fs.ensureDir("./auth_info_baileys");

    const { state, saveCreds } = await useMultiFileAuthState("./auth_info_baileys");
    console.log("Loaded session:", state.creds.registered ? "Registered" : "Waiting for QR");

    // Create socket connection
    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
        logger: pino({ level: "silent" }),
        browser: ["BLACKSKY-MD", "Safari", "1.0.0"],
        getMessage: async (key) => {
            if(store) {
                const msg = await store.loadMessage(key.remoteJid, key.id)
                return msg?.message || undefined
            }
            return {
                conversation: "Bot Message"
            }
        }
    });

    store.bind(sock.ev);

    // Handle connection updates
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if(qr) {
            console.log('\n🤖 Scan this QR code to connect:');
            // QR code will be printed in terminal
        }

        if(connection === "close") {
            let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if(reason === DisconnectReason.badSession) {
                console.log("❌ Bad Session File, Please Delete Session and Scan Again");
                await fs.remove("./auth_info_baileys");
                process.exit();
            } else if(reason === DisconnectReason.connectionClosed) {
                console.log("⚠️ Connection closed, reconnecting....");
                connectToWhatsApp();
            } else if(reason === DisconnectReason.connectionLost) {
                console.log("⚠️ Connection Lost from Server, reconnecting...");
                connectToWhatsApp();
            } else if(reason === DisconnectReason.connectionReplaced) {
                console.log("❌ Connection Replaced, Another New Session Opened, Please Close Current Session First");
                process.exit();
            } else if(reason === DisconnectReason.loggedOut) {
                console.log("❌ Device Logged Out, Please Delete Session and Scan Again.");
                await fs.remove("./auth_info_baileys");
                process.exit();
            } else if(reason === DisconnectReason.restartRequired) {
                console.log("🔄 Restart Required, Restarting...");
                connectToWhatsApp();
            } else if(reason === DisconnectReason.timedOut) {
                console.log("⚠️ Connection TimedOut, Reconnecting...");
                connectToWhatsApp();
            } else {
                console.log(`❌ Unknown DisconnectReason: ${reason}|${lastDisconnect.error}`);
                connectToWhatsApp();
            }
        } else if(connection === "open") {
            console.log("✅ Bot is now connected!");

            // Send initial status message
            const statusMessage = `🤖 ${config.botName} is now active!\n\n` +
                                `Type ${config.prefix}menu to see available commands.`;

            try {
                await sock.sendMessage(config.ownerNumber, { text: statusMessage });
            } catch (err) {
                console.log("Could not send initial status message:", err);
            }
        }
    });

    // Save credentials whenever updated
    sock.ev.on("creds.update", saveCreds);

    // Handle messages
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if(type !== "notify") return;

        const msg = messages[0];
        if(!msg.message) return;

        const messageType = Object.keys(msg.message)[0];
        const messageContent = msg.message[messageType];

        // Extract the text content based on message type
        let textContent = '';
        if (messageType === 'conversation') {
            textContent = messageContent;
        } else if (messageType === 'extendedTextMessage') {
            textContent = messageContent.text;
        } else if (messageType === 'imageMessage' || messageType === 'videoMessage') {
            textContent = messageContent.caption || '';
        }

        // Check if message starts with prefix
        if(textContent.startsWith(config.prefix)) {
            const cmd = textContent.slice(config.prefix.length).trim().split(/ +/).shift().toLowerCase();
            const args = textContent.slice(config.prefix.length).trim().split(/ +/).slice(1);

            try {
                if(cmd in require('./commands/basic')) {
                    // Handle basic commands
                    await require('./commands/basic')[cmd](sock, msg, args);
                } else {
                    // Try loading command from separate file
                    try {
                        const commandHandler = require(`./commands/${cmd}.js`);
                        await commandHandler(sock, msg, args);
                    } catch(err) {
                        console.error(`Error loading command ${cmd}:`, err);
                        await sock.sendMessage(msg.key.remoteJid, { 
                            text: "Command not found or error in execution."
                        });
                    }
                }
            } catch(err) {
                console.error(`Error executing command ${cmd}:`, err);
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: "Error executing command. Please try again later."
                });
            }
        }
    });

    return sock;
}

// Start the bot
connectToWhatsApp().catch(err => console.log("Unexpected error: " + err));