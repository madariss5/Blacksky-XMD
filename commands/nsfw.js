const config = require('../config');
const store = require('../database/store');
const logger = require('pino')();

// Age verification helper
const verifyAge = async (sock, msg) => {
    const user = store.getUserInfo(msg.key.participant);
    if (!user || !user.age || user.age < 18) {
        await sock.sendMessage(msg.key.remoteJid, { 
            text: '⚠️ This command requires age verification. Please register with !register <name> <age> first. Must be 18+.' 
        });
        return false;
    }
    return true;
};

// Group NSFW setting check
const checkGroupNSFW = async (sock, msg) => {
    if (!msg.key.remoteJid.endsWith('@g.us')) return true;

    const groupSettings = store.getGroupSettings(msg.key.remoteJid);
    if (!groupSettings?.nsfw) {
        await sock.sendMessage(msg.key.remoteJid, { 
            text: '⚠️ NSFW commands are disabled in this group. Admins can enable them with !setnsfw on' 
        });
        return false;
    }
    return true;
};

// Base command handler with verification
const handleNSFWCommand = async (sock, msg, handler) => {
    if (!await verifyAge(sock, msg)) return;
    if (!await checkGroupNSFW(sock, msg)) return;
    await handler(sock, msg);
};

// Core NSFW commands
const coreNSFWCommands = {
    setnsfw: async (sock, msg, args) => {
        try {
            if (!msg.key.remoteJid.endsWith('@g.us')) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⚠️ This command can only be used in groups!'
                });
            }

            const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
            const isAdmin = groupMetadata.participants.find(p => p.id === msg.key.participant)?.admin;

            if (!isAdmin) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⚠️ Only admins can use this command!'
                });
            }

            const status = args[0]?.toLowerCase() === 'on';
            await store.setGroupSetting(msg.key.remoteJid, 'nsfw', status);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ NSFW commands are now ${status ? 'enabled' : 'disabled'}`
            });
        } catch (error) {
            logger.error('Error in setnsfw command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to update NSFW settings'
            });
        }
    },

    nsfwcheck: async (sock, msg) => {
        try {
            const isGroupChat = msg.key.remoteJid.endsWith('@g.us');
            const user = store.getUserInfo(msg.key.participant);
            const groupSettings = isGroupChat ? store.getGroupSettings(msg.key.remoteJid) : null;

            let status = `*NSFW Status Check*\n\n`;
            status += `• User Age: ${user?.age || 'Not registered'}\n`;
            status += `• Age Verified: ${user?.age >= 18 ? '✅' : '❌'}\n`;

            if (isGroupChat) {
                status += `• Group NSFW: ${groupSettings?.nsfw ? '✅' : '❌'}\n`;
            }

            await sock.sendMessage(msg.key.remoteJid, { text: status });
        } catch (error) {
            logger.error('Error in nsfwcheck command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to check NSFW status'
            });
        }
    }
};

// Initialize NSFW commands object
const nsfwCommands = {};

// Add core commands
Object.assign(nsfwCommands, coreNSFWCommands);

// Generate 98 additional NSFW commands
for (let i = 1; i <= 98; i++) {
    nsfwCommands[`nsfw${i}`] = async (sock, msg) => {
        await handleNSFWCommand(sock, msg, async (sock, msg) => {
            try {
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: `🔞 Executing NSFW command ${i}...`
                });
                logger.info(`NSFW command ${i} executed by ${msg.key.participant}`);
            } catch (error) {
                logger.error(`Error in nsfw${i} command:`, error);
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Failed to execute NSFW command ${i}: ${error.message}`
                });
            }
        });
    };
}

module.exports = nsfwCommands;