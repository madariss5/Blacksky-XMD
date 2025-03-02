const basicCommands = require('./commands/basic');
const userCommands = require('./commands/user');
const reactionsCommands = require('./commands/reactions');
const ownerCommands = require('./commands/owner');
const funCommands = require('./commands/fun');
const logger = require('./utils/logger');

const prefix = '.';

const commandModules = {
    basic: basicCommands,
    user: userCommands,
    reactions: reactionsCommands,
    owner: ownerCommands.commands,
    fun: funCommands
};

module.exports = async (sock, msg, { messages, type }, store) => {
    try {
        if (!msg.body) return;

        // Check for prefix
        if (!msg.body.startsWith(prefix)) return;

        // Parse command
        const args = msg.body.slice(1).trim().split(/\s+/);
        const command = args.shift()?.toLowerCase();

        if (!command) return;

        // Enhanced message structure logging (from original)
        logger.info('Message received:', {
            messageKey: JSON.stringify(msg.key),
            messageType: msg.type,
            fromGroup: msg.key.remoteJid?.includes('@g.us'),
            fromPrivate: msg.key.remoteJid?.includes('@s.whatsapp.net'),
            participant: msg.key.participant,
            remoteJid: msg.key.remoteJid,
            fromMe: msg.key.fromMe,
            timestamp: msg.messageTimestamp
        });

        // Log command processing (from original)
        logger.info('Processing command', {
            command,
            args,
            chat: msg.key.remoteJid,
            sender: msg.key.participant || msg.key.remoteJid
        });


        // Execute command if found
        for (const [module, commands] of Object.entries(commandModules)) {
            if (commands[command]) {
                await commands[command](sock, msg, args);
                return;
            }
        }

        // Command not found
        await sock.sendMessage(msg.chat, {
            text: `Command *${command}* not found. Use ${prefix}menu to see available commands.`
        });

    } catch (err) {
        logger.error('Error in command handler:', err);
        await sock.sendMessage(msg.chat, {
            text: '❌ Error executing command'
        });
    }
};