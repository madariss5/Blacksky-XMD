const config = require('../config');
const store = require('../database/store');
const logger = require('pino')();
const axios = require('axios');

// Age verification helper
const verifyAge = async (sock, msg) => {
    const user = await store.getUserInfo(msg.key.participant);
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

    const isNSFW = await store.isNSFWEnabled(msg.key.remoteJid);
    if (!isNSFW) {
        await sock.sendMessage(msg.key.remoteJid, { 
            text: '⚠️ NSFW commands are disabled in this group. Admins can enable them with !setnsfw on' 
        });
        return false;
    }
    return true;
};

// Base command handler with verification
const handleNSFWCommand = async (sock, msg, endpoint) => {
    try {
        logger.info(`Starting NSFW command with endpoint: ${endpoint}`);

        // Verify age and NSFW settings
        if (!await verifyAge(sock, msg)) return;
        if (!await checkGroupNSFW(sock, msg)) return;

        logger.debug('Making API request to NSFW endpoint');
        const response = await axios.get(`https://api.waifu.pics/nsfw/${endpoint}`);

        logger.debug('Sending NSFW image', { url: response.data.url });
        await sock.sendMessage(msg.key.remoteJid, {
            image: { url: response.data.url },
            caption: '🔞 NSFW content'
        });
        logger.info('NSFW command completed successfully');
    } catch (error) {
        logger.error(`Error in ${endpoint} command:`, {
            error: error.message,
            stack: error.stack,
            response: error.response?.data,
            status: error.response?.status
        });
        await sock.sendMessage(msg.key.remoteJid, {
            text: `❌ Error fetching content: ${error.message}`
        });
    }
};

// Core NSFW commands
const nsfwCommands = {
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
            const user = await store.getUserInfo(msg.key.participant);
            const isNSFW = isGroupChat ? await store.isNSFWEnabled(msg.key.remoteJid) : true;

            let status = `*NSFW Status Check*\n\n`;
            status += `• User Age: ${user?.age || 'Not registered'}\n`;
            status += `• Age Verified: ${user?.age >= 18 ? '✅' : '❌'}\n`;

            if (isGroupChat) {
                status += `• Group NSFW: ${isNSFW ? '✅' : '❌'}\n`;
            }

            await sock.sendMessage(msg.key.remoteJid, { text: status });
        } catch (error) {
            logger.error('Error in nsfwcheck command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to check NSFW status'
            });
        }
    },

    // New NSFW commands
    fuck: async (sock, msg) => {
        await handleNSFWCommand(sock, msg, 'fuck');
    },

    cum: async (sock, msg) => {
        await handleNSFWCommand(sock, msg, 'cum');
    },

    horny: async (sock, msg) => {
        await handleNSFWCommand(sock, msg, 'horny');
    }
};

module.exports = nsfwCommands;