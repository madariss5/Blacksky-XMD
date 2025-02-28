const config = require('../config');
const store = require('../database/store');
const logger = require('pino')();
const axios = require('axios');

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

// Base command handler with verification
const handleNSFWCommand = async (sock, msg, endpoint) => {
    try {
        logger.info(`Starting NSFW command with endpoint: ${endpoint}`);

        // Verify age and NSFW settings
        if (!await verifyAge(sock, msg)) return;
        if (!await checkGroupNSFW(sock, msg)) return;

        // Available NSFW endpoints from waifu.pics
        const validEndpoints = {
            'fuck': 'blowjob',     // Using appropriate alternative
            'cum': 'neko',         // Using appropriate alternative
            'horny': 'waifu',      // Using appropriate alternative
            'pussy': 'trap',       // Using appropriate alternative
            'dick': 'blowjob',     // Using appropriate alternative
            'riding': 'waifu',     // Using appropriate alternative
            'doggy': 'blowjob',    // Using appropriate alternative
            'sex': 'neko'          // Using appropriate alternative
        };

        const actualEndpoint = validEndpoints[endpoint] || endpoint;
        logger.debug('Making API request to NSFW endpoint', { endpoint: actualEndpoint });

        const response = await axios.get(`https://api.waifu.pics/nsfw/${actualEndpoint}`);

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
            logger.error('Error in register command:', {
                error: error.message,
                stack: error.stack
            });
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

    // NSFW commands
    fuck: async (sock, msg) => {
        await handleNSFWCommand(sock, msg, 'fuck');
    },

    cum: async (sock, msg) => {
        await handleNSFWCommand(sock, msg, 'cum');
    },

    horny: async (sock, msg) => {
        await handleNSFWCommand(sock, msg, 'horny');
    },

    pussy: async (sock, msg) => {
        await handleNSFWCommand(sock, msg, 'pussy');
    },

    dick: async (sock, msg) => {
        await handleNSFWCommand(sock, msg, 'dick');
    },

    riding: async (sock, msg) => {
        await handleNSFWCommand(sock, msg, 'riding');
    },

    doggy: async (sock, msg) => {
        await handleNSFWCommand(sock, msg, 'doggy');
    },

    sex: async (sock, msg) => {
        await handleNSFWCommand(sock, msg, 'sex');
    }
};

module.exports = nsfwCommands;