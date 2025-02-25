const config = require('../config');
const store = require('../database/store');

const userCommands = {
    register: async (sock, msg, args) => {
        if (store.isUserRegistered(msg.key.participant)) {
            return await sock.sendMessage(msg.key.remoteJid, { 
                text: 'You are already registered!' 
            });
        }

        if (args.length < 2) {
            return await sock.sendMessage(msg.key.remoteJid, { 
                text: `Please provide your name and age!\nFormat: ${config.prefix}register <name> <age>`
            });
        }

        const age = parseInt(args[args.length - 1]);
        const name = args.slice(0, -1).join(' ');

        if (isNaN(age) || age < 13 || age > 100) {
            return await sock.sendMessage(msg.key.remoteJid, { 
                text: 'Please provide a valid age between 13 and 100!' 
            });
        }

        await store.registerUser(msg.key.participant, name, age);
        await sock.sendMessage(msg.key.remoteJid, {
            text: `Registration successful!\n\n` +
                  `Name: ${name}\n` +
                  `Age: ${age}\n\n` +
                  `Use ${config.prefix}profile to view your profile!`
        });
    },

    profile: async (sock, msg, args) => {
        const user = args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : msg.key.participant;
        const userInfo = store.getUserInfo(user);

        try {
            const pp = await sock.profilePictureUrl(user, 'image');
            const info = `*User Profile*\n\n` +
                        `• Number: @${user.split('@')[0]}\n` +
                        `• Name: ${userInfo.name || 'Not registered'}\n` +
                        `• Age: ${userInfo.age || 'Not registered'}\n` +
                        `• Level: ${userInfo.level}\n` +
                        `• XP: ${userInfo.xp}\n` +
                        `• Registered: ${userInfo.registeredAt ? new Date(userInfo.registeredAt).toLocaleDateString() : 'No'}\n`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: pp },
                caption: info,
                mentions: [user]
            });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `*User Profile*\n\n` +
                      `• Number: @${user.split('@')[0]}\n` +
                      `• Name: ${userInfo.name || 'Not registered'}\n` +
                      `• Age: ${userInfo.age || 'Not registered'}\n` +
                      `• Level: ${userInfo.level}\n` +
                      `• XP: ${userInfo.xp}\n` +
                      `• Registered: ${userInfo.registeredAt ? new Date(userInfo.registeredAt).toLocaleDateString() : 'No'}`,
                mentions: [user]
            });
        }
    },

    me: async (sock, msg) => {
        const user = msg.key.participant;
        const stats = store.getUserInfo(user);

        try {
            const pp = await sock.profilePictureUrl(user, 'image');
            const info = `*Your Profile*\n\n` +
                        `• Number: @${user.split('@')[0]}\n` +
                        `• Name: ${stats.name || 'Not registered'}\n` +
                        `• Age: ${stats.age || 'Not registered'}\n` +
                        `• Level: ${stats.level}\n` +
                        `• XP: ${stats.xp}\n` +
                        `• Session ID: ${sock.authState.creds.me?.id || 'Not available'}\n`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: pp },
                caption: info,
                mentions: [user]
            });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `*Your Profile*\n\n` +
                      `• Number: @${user.split('@')[0]}\n` +
                      `• Name: ${stats.name || 'Not registered'}\n` +
                      `• Age: ${stats.age || 'Not registered'}\n` +
                      `• Level: ${stats.level}\n` +
                      `• XP: ${stats.xp}\n` +
                      `• Session ID: ${sock.authState.creds.me?.id || 'Not available'}`,
                mentions: [user]
            });
        }
    },

    level: async (sock, msg) => {
        const user = msg.key.participant;
        const stats = store.getUserStats(user);

        await sock.sendMessage(msg.key.remoteJid, {
            text: `*Level Stats*\n\n` +
                  `• Current Level: ${stats.level}\n` +
                  `• Total XP: ${stats.xp}\n` +
                  `• Next Level: ${stats.level + 1} (${Math.pow((stats.level + 1) / 0.1, 2) - stats.xp} XP needed)`,
            mentions: [user]
        });
    },

    status: async (sock, msg) => {
        const status = await sock.fetchStatus(msg.key.participant);
        await sock.sendMessage(msg.key.remoteJid, {
            text: `*Your Status*\n\n${status?.status || 'No status available'}`
        });
    },

    owner: async (sock, msg) => {
        try {
            const pp = await sock.profilePictureUrl(config.ownerNumber, 'image');
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: pp },
                caption: `*Bot Owner Information*\n\n` +
                        `• Name: ${config.ownerName}\n` +
                        `• Number: @${config.ownerNumber.split('@')[0]}\n` +
                        `• Bot Name: ${config.botName}\n` +
                        `• Session ID: ${sock.authState.creds.me?.id || 'Not available'}`,
                mentions: [config.ownerNumber]
            });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `*Bot Owner Information*\n\n` +
                      `• Name: ${config.ownerName}\n` +
                      `• Number: @${config.ownerNumber.split('@')[0]}\n` +
                      `• Bot Name: ${config.botName}\n` +
                      `• Session ID: ${sock.authState.creds.me?.id || 'Not available'}`,
                mentions: [config.ownerNumber]
            });
        }
    }
};

module.exports = userCommands;