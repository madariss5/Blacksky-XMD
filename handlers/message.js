const config = require('../config');
const basicCommands = require('../commands/basic');
const ownerCommands = require('../commands/owner');
const groupCommands = require('../commands/group');
const userCommands = require('../commands/user');
const funCommands = require('../commands/fun');
const store = require('../database/store');
const logger = require('../utils/logger');

async function messageHandler(sock, msg) {
    // Ignore if not a message
    if (!msg.message) return;

    // Get the message content
    const messageType = Object.keys(msg.message)[0];
    const messageContent = msg.message[messageType];

    // Handle only text messages with commands
    if (messageType === 'conversation' || messageType === 'extendedTextMessage') {
        const text = messageType === 'conversation' ? 
            msg.message.conversation : 
            msg.message.extendedTextMessage.text;

        // Add XP for message activity (1-5 XP randomly)
        if (msg.key.participant || msg.key.remoteJid) {
            const userId = msg.key.participant || msg.key.remoteJid;
            const xpGain = Math.floor(Math.random() * 5) + 1;
            const leveledUp = await store.addXP(userId, xpGain);

            if (leveledUp) {
                const stats = store.getUserStats(userId);
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `🎉 Congratulations @${userId.split('@')[0]}!\nYou've reached level ${stats.level}!`,
                    mentions: [userId]
                });
            }
        }

        // Check if message starts with prefix
        if (!text.startsWith(config.prefix)) return;

        // Extract command and arguments
        const [command, ...args] = text.slice(config.prefix.length).trim().split(' ');

        // Combine all commands
        const allCommands = {
            ...basicCommands,
            ...ownerCommands,
            ...groupCommands,
            ...userCommands,
            ...funCommands
        };

        // Check if command exists and execute it
        if (command in allCommands) {
            try {
                // Check if user is banned
                const banned = store.get('banned') || [];
                if (banned.includes(msg.key.participant) && command !== 'help') {
                    await sock.sendMessage(msg.key.remoteJid, { 
                        text: 'You are banned from using the bot!' 
                    });
                    return;
                }

                // Owner commands check
                if (command in ownerCommands && msg.key.remoteJid !== config.ownerNumber) {
                    await sock.sendMessage(msg.key.remoteJid, { 
                        text: 'This command is only available to the bot owner!' 
                    });
                    return;
                }

                // Group admin commands check
                if (command in groupCommands && msg.key.remoteJid.endsWith('@g.us')) {
                    const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
                    const isAdmin = groupMetadata.participants.find(p => p.id === msg.key.participant)?.admin;
                    const adminOnlyCommands = ['kick', 'promote', 'demote', 'mute', 'unmute', 'setwelcome', 'setbye', 'antilink', 'setrules'];

                    if (adminOnlyCommands.includes(command) && !isAdmin) {
                        await sock.sendMessage(msg.key.remoteJid, { 
                            text: 'This command is only available to group admins!' 
                        });
                        return;
                    }
                }

                // Execute the command
                await allCommands[command](sock, msg, args);
                logger.info(`Command ${command} executed by ${msg.key.remoteJid}`);
            } catch (error) {
                logger.error(`Error executing command ${command}:`, error);
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: 'An error occurred while executing the command.' 
                });
            }
        }
    }
}

module.exports = messageHandler;