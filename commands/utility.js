const logger = require('pino')();

const utilityCommands = {
    stats: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '📊 *Bot Statistics*\n\n' +
                      '• Status: Online\n' +
                      '• Uptime: ' + process.uptime().toFixed(2) + ' seconds\n' +
                      '• Memory Usage: ' + (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB'
            });
        } catch (error) {
            logger.error('Error in stats command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to fetch statistics'
            });
        }
    },

    report: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide an issue to report!\nUsage: !report <issue description>'
                });
            }

            const issue = args.join(' ');
            logger.info('Issue reported:', { issue, reporter: msg.key.participant || msg.key.remoteJid });

            await sock.sendMessage(msg.key.remoteJid, {
                text: '✅ Thank you for your report! The issue has been logged for review.'
            });
        } catch (error) {
            logger.error('Error in report command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to submit report'
            });
        }
    },

    donate: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '💝 *Support the Bot*\n\n' +
                      'Thank you for considering a donation!\n' +
                      'Your support helps keep the bot running and improving.\n\n' +
                      'Contact the bot owner for donation information.'
            });
        } catch (error) {
            logger.error('Error in donate command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to show donation information'
            });
        }
    },

    qrmaker: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide text to convert to QR!\nUsage: !qrmaker <text>'
                });
            }

            const text = args.join(' ');
            // Note: QR generation would go here
            await sock.sendMessage(msg.key.remoteJid, {
                text: '🔄 QR code generation is currently under development.'
            });
        } catch (error) {
            logger.error('Error in qrmaker command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to generate QR code'
            });
        }
    },

    qrreader: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '🔄 QR code reading is currently under development.'
            });
        } catch (error) {
            logger.error('Error in qrreader command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to read QR code'
            });
        }
    }
};

module.exports = utilityCommands;