const config = require('../config');
const basicCommands = require('../commands/basic');
const ownerCommands = require('../commands/owner');
const groupCommands = require('../commands/group');
const userCommands = require('../commands/user');
const funCommands = require('../commands/fun');
const store = require('../database/store');
const logger = require('../utils/logger');

async function messageHandler(sock, msg) {
    try {
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

            // Get the sender ID correctly for both private and group messages
            // For groups, always use key.participant
            const senderId = msg.key.remoteJid.endsWith('@g.us') ? 
                (msg.key.participant?.split(':')[0] || msg.key.participant || msg.key.remoteJid) : 
                msg.key.remoteJid;

            // Check if message starts with prefix
            if (!text.startsWith(config.prefix)) return;

            // Extract command and arguments
            const [command, ...args] = text.slice(config.prefix.length).trim().split(' ');

            // Log incoming command with detailed info
            logger.info(`Received command: ${command} from ${senderId} in ${msg.key.remoteJid} (${msg.key.remoteJid.endsWith('@g.us') ? 'group' : 'private'})`);

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
                    if (banned.includes(senderId) && command !== 'help') {
                        await sock.sendMessage(msg.key.remoteJid, { 
                            text: 'You are banned from using the bot!' 
                        });
                        return;
                    }

                    // Owner commands check
                    if (command in ownerCommands && senderId !== config.ownerNumber) {
                        await sock.sendMessage(msg.key.remoteJid, { 
                            text: 'This command is only available to the bot owner!' 
                        });
                        return;
                    }

                    // Group command validation
                    if (command in groupCommands && !msg.key.remoteJid.endsWith('@g.us')) {
                        await sock.sendMessage(msg.key.remoteJid, { 
                            text: 'This command can only be used in groups!' 
                        });
                        return;
                    }

                    // Group admin commands check for group context only
                    if (msg.key.remoteJid.endsWith('@g.us')) {
                        const adminOnlyCommands = ['kick', 'promote', 'demote', 'mute', 'unmute', 'setwelcome', 'setbye', 'antilink', 'setrules'];

                        if (adminOnlyCommands.includes(command)) {
                            const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
                            const isAdmin = groupMetadata.participants.find(p => p.id === senderId)?.admin;

                            if (!isAdmin) {
                                await sock.sendMessage(msg.key.remoteJid, { 
                                    text: 'This command is only available to group admins!' 
                                });
                                return;
                            }
                        }
                    }

                    // Execute the command
                    await allCommands[command](sock, msg, args);
                    logger.info(`Command ${command} executed successfully by ${senderId} in ${msg.key.remoteJid}`);
                } catch (error) {
                    console.error('Error executing command:', error);
                    logger.error(`Error executing command ${command}:`, error);
                    await sock.sendMessage(msg.key.remoteJid, { 
                        text: 'An error occurred while executing the command.' 
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error in message handler:', error);
        logger.error('Error in message handler:', error);
    }
}

module.exports = messageHandler;