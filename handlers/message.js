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
        if (msg.key.participant) {
            const xpGain = Math.floor(Math.random() * 5) + 1;
            const leveledUp = await store.addXP(msg.key.participant, xpGain);

            if (leveledUp) {
                const stats = store.getUserStats(msg.key.participant);
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `🎉 Congratulations @${msg.key.participant.split('@')[0]}!\nYou've reached level ${stats.level}!`,
                    mentions: [msg.key.participant]
                });
            }
        }

        // Check if message starts with prefix
        if (!text.startsWith(config.prefix)) return;

        // Extract command and arguments
        const [command, ...args] = text.slice(config.prefix.length).trim().split(' ');

        // Check if user is banned
        const banned = store.get('banned') || [];
        if (banned.includes(msg.key.participant) && command !== 'help') {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: 'You are banned from using the bot!' 
            });
            return;
        }

        // Check if group is banned
        if (msg.key.remoteJid.endsWith('@g.us')) {
            const bannedGroups = store.get('bannedGroups') || [];
            if (bannedGroups.includes(msg.key.remoteJid)) {
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: 'This group is banned from using the bot!' 
                });
                return;
            }
        }

        // Combine all commands
        const allCommands = {
            ...basicCommands,
            ...ownerCommands,
            ...groupCommands,
            ...userCommands,
            ...funCommands
        };

        // Execute command if it exists
        if (allCommands[command]) {
            try {
                await allCommands[command](sock, msg, args);
                logger.info(`Command ${command} executed by ${msg.key.remoteJid}`);
            } catch (error) {
                logger.error(`Error executing command ${command}:`, error);
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: 'An error occurred while executing the command.' 
                });
            }
        } else {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `Unknown command. Use ${config.prefix}help to see available commands.` 
            });
        }
    }
}

module.exports = messageHandler;