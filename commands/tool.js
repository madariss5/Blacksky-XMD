const logger = require('pino')();

const toolCommands = {
    calc: async (sock, msg, args) => {
        await sock.sendMessage(msg.key.remoteJid, {
            text: '🔧 Calculator command is under development'
        });
    },
    
    translate: async (sock, msg, args) => {
        await sock.sendMessage(msg.key.remoteJid, {
            text: '🔧 Translate command is under development'
        });
    },

    tts: async (sock, msg, args) => {
        await sock.sendMessage(msg.key.remoteJid, {
            text: '🔧 Text-to-speech command is under development'
        });
    },

    weather: async (sock, msg, args) => {
        await sock.sendMessage(msg.key.remoteJid, {
            text: '🔧 Weather info command is under development'
        });
    },

    dictionary: async (sock, msg, args) => {
        await sock.sendMessage(msg.key.remoteJid, {
            text: '🔧 Dictionary command is under development'
        });
    },

    styletext: async (sock, msg, args) => {
        await sock.sendMessage(msg.key.remoteJid, {
            text: '🔧 Style text command is under development'
        });
    },

    ss: async (sock, msg, args) => {
        await sock.sendMessage(msg.key.remoteJid, {
            text: '🔧 Screenshot command is under development'
        });
    },

    shortlink: async (sock, msg, args) => {
        await sock.sendMessage(msg.key.remoteJid, {
            text: '🔧 URL shortener command is under development'
        });
    }
};

module.exports = toolCommands;
