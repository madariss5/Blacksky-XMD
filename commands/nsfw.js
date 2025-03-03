const config = require('../config');
const dbStore = require('../database/store');
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

        const apiEndpoints = {
            'waifu': 'https://api.waifu.im/search/?included_tags=waifu&is_nsfw=true',
            'neko': 'https://api.waifu.im/search/?included_tags=neko&is_nsfw=true',
            'milf': 'https://api.waifu.im/search/?included_tags=milf&is_nsfw=true',
            'oral': 'https://api.waifu.im/search/?included_tags=oral&is_nsfw=true',
            'hentai': 'https://api.waifu.im/search/?included_tags=hentai&is_nsfw=true',
            'ecchi': 'https://api.waifu.im/search/?included_tags=ecchi&is_nsfw=true',
            'ero': 'https://api.waifu.im/search/?included_tags=ero&is_nsfw=true',
            'trap': 'https://api.waifu.im/search/?included_tags=trap&is_nsfw=true',
            'blowjob': 'https://api.waifu.im/search/?included_tags=blowjob&is_nsfw=true',
            'ass': 'https://api.waifu.im/search/?included_tags=ass&is_nsfw=true',
            'paizuri': 'https://api.waifu.im/search/?included_tags=paizuri&is_nsfw=true'
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
        logger.info('Starting age verification for user', { userId });

        const user = await dbStore.getUser(userId);
        logger.info('User data retrieved:', {
            userId,
            userFound: !!user,
            userAge: user?.age || 'not set'
        });

        if (!user || !user.registered) {
            logger.debug('User not found or not registered', { userId });
            await sock.sendMessage(msg.key.remoteJid, {
                text: '⚠️ Please register first with .register <name> <age>. Must be 18+.'
            });
            return false;
        }

        const userAge = parseInt(user.age);
        if (isNaN(userAge) || userAge < 18) {
            logger.debug('User age verification failed', {
                userId,
                age: userAge,
                rawAge: user.age
            });
            await sock.sendMessage(msg.key.remoteJid, {
                text: '⚠️ You must be 18+ to use NSFW commands.'
            });
            return false;
        }

        logger.info('Age verification passed', {
            userId,
            age: userAge
        });
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
        if (!msg.key.remoteJid.endsWith('@g.us')) {
            logger.debug('Not a group chat, NSFW allowed');
            return true;
        }

        const isNSFW = await dbStore.isNSFWEnabled(msg.key.remoteJid);
        logger.debug('Checking group NSFW status', {
            groupId: msg.key.remoteJid,
            isEnabled: isNSFW
        });

        if (!isNSFW) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '⚠️ NSFW commands are disabled in this group. Admins can enable them with .setnsfw on'
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
    nsfwcheck: async (sock, msg) => {
        try {
            const isGroupChat = msg.key.remoteJid.endsWith('@g.us');
            const userId = msg.key.participant || msg.key.remoteJid;

            logger.info('Running NSFW check for user', { userId });
            const user = await dbStore.getUser(userId);
            const isNSFW = isGroupChat ? await dbStore.isNSFWEnabled(msg.key.remoteJid) : true;

            let status = `*NSFW Status Check*\n\n`;
            status += `• Registration: ${user?.registered ? '✅' : '❌'}\n`;
            status += `• Name: ${user?.name || 'Not registered'}\n`;
            status += `• Age: ${user?.age || 'Not set'}\n`;
            status += `• Age Verified: ${(user?.age >= 18) ? '✅' : '❌'}\n`;

            if (isGroupChat) {
                status += `• Group NSFW: ${isNSFW ? '✅' : '❌'}\n`;
            }

            status += `\nTo register: .register <name> <age>`;

            await sock.sendMessage(msg.key.remoteJid, { text: status });
            logger.info('NSFW check completed', {
                userId,
                registration: user?.registered,
                age: user?.age,
                ageVerified: user?.age >= 18
            });

        } catch (error) {
            logger.error('Error in nsfwcheck command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error checking NSFW status'
            });
        }
    },

    register: async (sock, msg, args) => {
        try {
            if (args.length < 2) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide your name and age!\nUsage: .register <name> <age>'
                });
            }

            const name = args.slice(0, -1).join(' ');
            const age = parseInt(args[args.length - 1]);

            logger.info('Processing registration request', {
                name,
                age,
                rawAge: args[args.length - 1]
            });

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
            logger.info('Registering user', { userId, name, age });

            const registeredUser = await dbStore.registerUser(userId, name, age);

            logger.info('Registration completed', {
                success: !!registeredUser,
                userData: registeredUser
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ Registration successful!\n\nName: ${name}\nAge: ${age}\n\nYou can now use NSFW commands.\nUse .nsfwcheck to verify your status.`
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
            await dbStore.setGroupSetting(msg.key.remoteJid, 'nsfw', status);

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

    // NSFW content commands
    waifu: async (sock, msg) => handleNSFWCommand(sock, msg, 'waifu'),
    neko: async (sock, msg) => handleNSFWCommand(sock, msg, 'neko'),
    trap: async (sock, msg) => handleNSFWCommand(sock, msg, 'trap'),
    blowjob: async (sock, msg) => handleNSFWCommand(sock, msg, 'blowjob'),
    ass: async (sock, msg) => handleNSFWCommand(sock, msg, 'ass'),
    hentai: async (sock, msg) => handleNSFWCommand(sock, msg, 'hentai'),
    milf: async (sock, msg) => handleNSFWCommand(sock, msg, 'milf'),
    oral: async (sock, msg) => handleNSFWCommand(sock, msg, 'oral'),
    paizuri: async (sock, msg) => handleNSFWCommand(sock, msg, 'paizuri'),
    ecchi: async (sock, msg) => handleNSFWCommand(sock, msg, 'ecchi'),
    ero: async (sock, msg) => handleNSFWCommand(sock, msg, 'ero')
};

module.exports = nsfwCommands;