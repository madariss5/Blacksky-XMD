const config = require('../config');

const funCommands = {
    coinflip: async (sock, msg) => {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
        await sock.sendMessage(msg.key.remoteJid, { text: `🎲 Coin flip result: *${result}*` });
    },

    dice: async (sock, msg) => {
        const result = Math.floor(Math.random() * 6) + 1;
        await sock.sendMessage(msg.key.remoteJid, { text: `🎲 Dice roll result: *${result}*` });
    },

    quote: async (sock, msg) => {
        const quotes = [
            "Life is what happens when you're busy making other plans.",
            "The only way to do great work is to love what you do.",
            "In three words I can sum up everything I've learned about life: it goes on.",
            "Success is not final, failure is not fatal.",
            "Be yourself; everyone else is already taken."
        ];
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        await sock.sendMessage(msg.key.remoteJid, { text: `📜 Random Quote:\n\n*${randomQuote}*` });
    }
};

module.exports = funCommands;
