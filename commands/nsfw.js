const config = require('../config');
const store = require('../database/store');
const logger = require('pino')();
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Initialize temp directory if it doesn't exist
const tempDir = path.join(__dirname, '../temp');
fs.ensureDirSync(tempDir);

// Rate limiting map
const userCooldowns = new Map();
const COOLDOWN_PERIOD = 10000; // 10 seconds

const isOnCooldown = (userId) => {
    if (!userCooldowns.has(userId)) return false;
    const lastUsage = userCooldowns.get(userId);
    return Date.now() - lastUsage < COOLDOWN_PERIOD;
};

const setCooldown = (userId) => {
    userCooldowns.set(userId, Date.now());
};

// Helper function to download and save image temporarily
const downloadImage = async (imageUrl, filename) => {
    const response = await axios({
        method: 'get',
        url: imageUrl,
        responseType: 'stream'
    });

    const tempFilePath = path.join(tempDir, filename);
    const writer = fs.createWriteStream(tempFilePath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(tempFilePath));
        writer.on('error', reject);
    });
};

// Base command handler with verification
const handleNSFWCommand = async (sock, msg, endpoint) => {
    try {
        const userId = msg.key.participant || msg.key.remoteJid;

        if (isOnCooldown(userId)) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Please wait a few seconds before using this command again.'
            });
        }

        // Verify age and NSFW settings
        if (!await verifyAge(sock, msg)) return;
        if (!await checkGroupNSFW(sock, msg)) return;

        // Available NSFW endpoints from waifu.pics
        const validEndpoints = {
            'fuck': 'waifu',         // Using waifu endpoint for intimate content
            'cum': 'neko',           // Using neko endpoint for cute NSFW
            'horny': 'waifu',        // Using waifu endpoint for suggestive content
            'pussy': 'neko',         // Using neko endpoint for intimate content
            'dick': 'trap',          // Using trap endpoint for specific content
            'riding': 'waifu',       // Using waifu endpoint for action content
            'doggy': 'waifu',        // Using waifu endpoint for position content
            'sex': 'waifu'           // Using waifu endpoint for general NSFW
        };

        const actualEndpoint = validEndpoints[endpoint] || endpoint;
        logger.debug('Making API request to NSFW endpoint', { endpoint: actualEndpoint });

        // Send initial message
        await sock.sendMessage(msg.key.remoteJid, {
            text: '🔄 Fetching NSFW content...'
        });

        const response = await axios.get(`https://api.waifu.pics/nsfw/${actualEndpoint}`);

        logger.debug('Sending NSFW image', { url: response.data.url });
        await sock.sendMessage(msg.key.remoteJid, {
            image: { url: response.data.url },
            caption: `🔞 NSFW ${endpoint} content`
        });

        setCooldown(userId);
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

// Age verification helper
const verifyAge = async (sock, msg) => {
    try {
        const user = await store.getUserInfo(msg.key.participant);
        if (!user || !user.age || user.age < 18) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '⚠️ This command requires age verification. Please register with !register <name> <age> first. Must be 18+.' 
            });
            return false;
        }
        return true;
    } catch (error) {
        logger.error('Error in age verification:', error);
        return false;
    }
};

// Group NSFW setting check
const checkGroupNSFW = async (sock, msg) => {
    try {
        // If not a group chat, NSFW is allowed
        if (!msg.key.remoteJid.endsWith('@g.us')) return true;

        const isNSFW = await store.isNSFWEnabled(msg.key.remoteJid);
        if (!isNSFW) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '⚠️ NSFW commands are disabled in this group. Admins can enable them with !setnsfw on' 
            });
            return false;
        }
        return true;
    } catch (error) {
        logger.error('Error checking group NSFW status:', error);
        return false;
    }
};

// NSFW commands
const nsfwCommands = {
    register: async (sock, msg, args) => {
        try {
            logger.info('Starting register command');

            if (args.length < 2) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide your name and age!\nUsage: !register <name> <age>'
                });
            }

            const name = args.slice(0, -1).join(' ');
            const age = parseInt(args[args.length - 1]);

            if (isNaN(age) || age < 1 || age > 100) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a valid age between 1 and 100!'
                });
            }

            if (age < 18) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '🔞 Sorry, you must be 18 or older to register for NSFW content!'
                });
            }

            await store.registerUser(msg.key.participant, name, age);

            logger.info('User registered successfully', {
                user: msg.key.participant,
                name,
                age
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ Registration successful!\n\nName: ${name}\nAge: ${age}\n\nYou can now use NSFW commands.`
            });
        } catch (error) {
            logger.error('Error in register command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to register: ' + error.message
            });
        }
    },

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

    // NSFW content commands
    fuck: async (sock, msg) => {
        logger.info('Executing fuck command');
        await handleNSFWCommand(sock, msg, 'fuck');
    },

    cum: async (sock, msg) => {
        logger.info('Executing cum command');
        await handleNSFWCommand(sock, msg, 'cum');
    },

    horny: async (sock, msg) => {
        logger.info('Executing horny command');
        await handleNSFWCommand(sock, msg, 'horny');
    },

    pussy: async (sock, msg) => {
        logger.info('Executing pussy command');
        await handleNSFWCommand(sock, msg, 'pussy');
    },

    dick: async (sock, msg) => {
        logger.info('Executing dick command');
        await handleNSFWCommand(sock, msg, 'dick');
    },

    riding: async (sock, msg) => {
        logger.info('Executing riding command');
        await handleNSFWCommand(sock, msg, 'riding');
    },

    doggy: async (sock, msg) => {
        logger.info('Executing doggy command');
        await handleNSFWCommand(sock, msg, 'doggy');
    },

    sex: async (sock, msg) => {
        logger.info('Executing sex command');
        await handleNSFWCommand(sock, msg, 'sex');
    }
};

module.exports = nsfwCommands;