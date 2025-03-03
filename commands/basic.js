const logger = require('pino')();
const { getUptime } = require('../utils');
const config = require('../config');
const moment = require('moment-timezone');

// Helper function to format duration
function formatDuration(ms) {
    const duration = moment.duration(ms);
    const days = Math.floor(duration.asDays());
    const hours = duration.hours();
    const minutes = duration.minutes();
    const seconds = duration.seconds();
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

const basicCommands = {
    ping: async (sock, msg) => {
        try {
            const start = Date.now();
            await sock.sendMessage(msg.key.remoteJid, { text: '📱 Testing bot response...' });
            const end = Date.now();

            const pingText = `*🤖 Bot Status*\n\n` +
                         `Response Time: ${end - start}ms\n` +
                         `Uptime: ${formatDuration(process.uptime() * 1000)}\n` +
                         `Status: Online ✅`;

            await sock.sendMessage(msg.key.remoteJid, { text: pingText });
            logger.info('Ping command executed successfully');

        } catch (error) {
            logger.error('Error in ping command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error checking ping'
            });
        }
    },

    runtime: async (sock, msg) => {
        try {
            const uptimeText = `*🕒 Bot Runtime*\n\n` +
                           `• Running for: ${formatDuration(process.uptime() * 1000)}\n` +
                           `• Started: ${moment(Date.now() - (process.uptime() * 1000)).format('llll')}`;

            await sock.sendMessage(msg.key.remoteJid, { text: uptimeText });
            logger.info('Runtime command executed successfully');

        } catch (error) {
            logger.error('Error in runtime command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error checking runtime'
            });
        }
    },

    creator: async (sock, msg) => {
        try {
            // Get owner number from config
            const ownerJid = config.owner[0] || '0@s.whatsapp.net';

            let pp;
            try {
                pp = await sock.profilePictureUrl(ownerJid, 'image');
            } catch {
                pp = 'https://i.imgur.com/wuxBN7M.png'; // Default profile picture
            }

            const creatorText = `*🤖 Bot Creator*\n\n` +
                            `• Name: ${config.botName}\n` +
                            `• Owner: @${ownerJid.split('@')[0]}\n` +
                            `• Version: ${config.version || '1.0.0'}\n` +
                            `• GitHub: https://github.com/LoopZhou/WhatsApp-Bot\n` +
                            `• Prefix: ${config.prefix}\n\n` +
                            `Contact owner for any issues or questions!`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: pp },
                caption: creatorText,
                mentions: [ownerJid]
            });
            logger.info('Creator command executed successfully');

        } catch (error) {
            logger.error('Error in creator command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing creator info'
            });
        }
    }
};

module.exports = basicCommands;