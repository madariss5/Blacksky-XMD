const config = require('../config');
const store = require('../database/store');

const userCommands = {
    profile: async (sock, msg, args) => {
        const user = args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : msg.key.participant;

        try {
            const pp = await sock.profilePictureUrl(user, 'image');
            const info = `*User Profile*\n\n` +
                        `• Number: @${user.split('@')[0]}\n` +
                        `• Profile Picture: Available\n`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: pp },
                caption: info,
                mentions: [user]
            });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `*User Profile*\n\n` +
                      `• Number: @${user.split('@')[0]}\n` +
                      `• Profile Picture: Not available`,
                mentions: [user]
            });
        }
    },

    me: async (sock, msg) => {
        const user = msg.key.participant;
        const stats = store.getUserStats(user);

        try {
            const pp = await sock.profilePictureUrl(user, 'image');
            const info = `*Your Profile*\n\n` +
                        `• Number: @${user.split('@')[0]}\n` +
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
    }
};

module.exports = userCommands;