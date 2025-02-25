const config = require('../config');

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

    status: async (sock, msg) => {
        const status = await sock.fetchStatus(msg.key.participant);
        await sock.sendMessage(msg.key.remoteJid, {
            text: `*Your Status*\n\n${status?.status || 'No status available'}`
        });
    }
};

module.exports = userCommands;
