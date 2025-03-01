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

// Base command handler with verification
const handleNSFWCommand = async (sock, msg, endpoint) => {
    try {
        const userId = msg.key.participant || msg.key.remoteJid;
        logger.info('Processing NSFW command', {
            command: endpoint,
            userId: userId,
            messageId: msg.key.id
        });

        if (isOnCooldown(userId)) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Please wait a few seconds before using this command again.'
            });
        }

        // Verify age and NSFW settings
        if (!await verifyAge(sock, msg)) {
            logger.info('Age verification failed', { userId });
            return;
        }
        if (!await checkGroupNSFW(sock, msg)) {
            logger.info('Group NSFW check failed', { 
                groupId: msg.key.remoteJid,
                userId 
            });
            return;
        }

        // Send initial message
        await sock.sendMessage(msg.key.remoteJid, {
            text: '🔄 Fetching NSFW content...'
        });

        // Using alternative API endpoint
        const apiEndpoints = {
            'waifu': 'https://api.waifu.im/search/?included_tags=waifu&is_nsfw=true',
            'neko': 'https://api.waifu.im/search/?included_tags=neko&is_nsfw=true',
            'milf': 'https://api.waifu.im/search/?included_tags=milf&is_nsfw=true',
            'oral': 'https://api.waifu.im/search/?included_tags=oral&is_nsfw=true',
            'hentai': 'https://api.waifu.im/search/?included_tags=hentai&is_nsfw=true',
            'ecchi': 'https://api.waifu.im/search/?included_tags=ecchi&is_nsfw=true',
            'ero': 'https://api.waifu.im/search/?included_tags=ero&is_nsfw=true'
        };

        const apiUrl = apiEndpoints[endpoint] || apiEndpoints['waifu'];

        logger.debug('Making API request', { endpoint, url: apiUrl });

        const response = await axios.get(apiUrl, {
            timeout: 10000,
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.data || !response.data.images || !response.data.images[0]) {
            throw new Error('Invalid API response structure');
        }

        const imageUrl = response.data.images[0].url;

        logger.debug('Received API response', { 
            url: imageUrl,
            status: response.status
        });

        await sock.sendMessage(msg.key.remoteJid, {
            image: { url: imageUrl },
            caption: `🔞 NSFW ${endpoint} content`
        });

        setCooldown(userId);
        logger.info('NSFW command completed successfully', { endpoint });

    } catch (error) {
        logger.error(`Error in ${endpoint} command:`, {
            error: error.message,
            stack: error.stack,
            response: error.response?.data,
            endpoint,
            userId: msg.key.participant || msg.key.remoteJid
        });

        let errorMessage = '❌ Failed to fetch content';
        if (error.response?.status === 404) {
            errorMessage = '❌ Content not available at the moment';
        } else if (error.code === 'ECONNABORTED') {
            errorMessage = '❌ Request timed out';
        } else if (error.response?.status === 403) {
            errorMessage = '❌ Access denied';
        }

        await sock.sendMessage(msg.key.remoteJid, {
            text: `${errorMessage}\nPlease try again later.`
        });
    }
};

// Age verification helper
const verifyAge = async (sock, msg) => {
    try {
        const userId = msg.key.participant || msg.key.remoteJid;
        logger.debug('Verifying age for user', { userId });

        const user = await store.getUser(userId);

        if (!user) {
            logger.debug('User not found in database', { userId });
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '⚠️ Please register first with !register <name> <age>. Must be 18+.' 
            });
            return false;
        }

        if (!user.age || user.age < 18) {
            logger.debug('User age verification failed', { 
                userId,
                age: user.age || 'not set'
            });
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '⚠️ You must be 18+ to use NSFW commands.' 
            });
            return false;
        }

        return true;
    } catch (error) {
        logger.error('Error in age verification:', error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: '❌ Error verifying age. Please try again later.' 
        });
        return false;
    }
};

// Group NSFW setting check
const checkGroupNSFW = async (sock, msg) => {
    try {
        // If not a group chat, NSFW is allowed
        if (!msg.key.remoteJid.endsWith('@g.us')) {
            logger.debug('Not a group chat, NSFW allowed');
            return true;
        }

        const isNSFW = await store.isNSFWEnabled(msg.key.remoteJid);
        logger.debug('Checking group NSFW status', {
            groupId: msg.key.remoteJid,
            isEnabled: isNSFW
        });

        if (!isNSFW) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '⚠️ NSFW commands are disabled in this group. Admins can enable them with !setnsfw on' 
            });
            return false;
        }
        return true;
    } catch (error) {
        logger.error('Error checking group NSFW status:', error);
        await sock.sendMessage(msg.key.remoteJid, { 
            text: '❌ Error checking group settings' 
        });
        return false;
    }
};

// NSFW commands
const nsfwCommands = {
    // Registration and settings
    register: async (sock, msg, args) => {
        try {
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

            const userId = msg.key.participant || msg.key.remoteJid;
            await store.registerUser(userId, {
                name,
                age,
                registrationTime: Date.now()
            });

            logger.info('User registered successfully', {
                userId,
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

            logger.info('NSFW setting updated', {
                groupId: msg.key.remoteJid,
                enabled: status
            });

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
            const userId = msg.key.participant || msg.key.remoteJid;
            const user = await store.getUserInfo(userId);
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
    waifu: async (sock, msg) => {
        logger.info('Executing waifu command');
        await handleNSFWCommand(sock, msg, 'waifu');
    },

    neko: async (sock, msg) => {
        logger.info('Executing neko command');
        await handleNSFWCommand(sock, msg, 'neko');
    },

    trap: async (sock, msg) => {
        logger.info('Executing trap command');
        await handleNSFWCommand(sock, msg, 'trap');
    },

    blowjob: async (sock, msg) => {
        logger.info('Executing blowjob command');
        await handleNSFWCommand(sock, msg, 'blowjob');
    },

    // Additional NSFW commands with improved error handling and rate limiting
    ass: async (sock, msg) => {
        logger.info('Executing ass command');
        await handleNSFWCommand(sock, msg, 'ass');
    },

    hentai: async (sock, msg) => {
        logger.info('Executing hentai command');
        await handleNSFWCommand(sock, msg, 'hentai');
    },

    milf: async (sock, msg) => {
        logger.info('Executing milf command');
        await handleNSFWCommand(sock, msg, 'milf');
    },

    oral: async (sock, msg) => {
        logger.info('Executing oral command');
        await handleNSFWCommand(sock, msg, 'oral');
    },

    paizuri: async (sock, msg) => {
        logger.info('Executing paizuri command');
        await handleNSFWCommand(sock, msg, 'paizuri');
    },

    ecchi: async (sock, msg) => {
        logger.info('Executing ecchi command');
        await handleNSFWCommand(sock, msg, 'ecchi');
    },

    ero: async (sock, msg) => {
        logger.info('Executing ero command');
        await handleNSFWCommand(sock, msg, 'ero');
    }
};

module.exports = nsfwCommands;