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
    },

    // Interactive anime-style commands
    slap: async (sock, msg, args) => {
        const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
        const sticker = { url: 'https://example.com/stickers/slap.webp' }; // Replace with actual sticker URL
        await sock.sendMessage(msg.key.remoteJid, {
            sticker: sticker,
            caption: `*${msg.pushName}* slapped ${target}! 👋`,
            mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
        });
    },

    hug: async (sock, msg, args) => {
        const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
        const sticker = { url: 'https://example.com/stickers/hug.webp' }; // Replace with actual sticker URL
        await sock.sendMessage(msg.key.remoteJid, {
            sticker: sticker,
            caption: `*${msg.pushName}* hugged ${target}! 🤗`,
            mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
        });
    },

    cuddle: async (sock, msg, args) => {
        const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
        const sticker = { url: 'https://example.com/stickers/cuddle.webp' }; // Replace with actual sticker URL
        await sock.sendMessage(msg.key.remoteJid, {
            sticker: sticker,
            caption: `*${msg.pushName}* cuddled ${target}! 🥰`,
            mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
        });
    },

    kiss: async (sock, msg, args) => {
        const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
        const sticker = { url: 'https://example.com/stickers/kiss.webp' }; // Replace with actual sticker URL
        await sock.sendMessage(msg.key.remoteJid, {
            sticker: sticker,
            caption: `*${msg.pushName}* kissed ${target}! 💋`,
            mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
        });
    },

    kill: async (sock, msg, args) => {
        const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
        const sticker = { url: 'https://example.com/stickers/kill.webp' }; // Replace with actual sticker URL
        await sock.sendMessage(msg.key.remoteJid, {
            sticker: sticker,
            caption: `*${msg.pushName}* killed ${target}! 💀`,
            mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
        });
    },

    dance: async (sock, msg) => {
        const sticker = { url: 'https://example.com/stickers/dance.webp' }; // Replace with actual sticker URL
        await sock.sendMessage(msg.key.remoteJid, {
            sticker: sticker,
            caption: `*${msg.pushName}* is dancing! 💃`
        });
    },

    insult: async (sock, msg, args) => {
        const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
        const insults = [
            "You're as useful as a screen door on a submarine!",
            "I'd agree with you but then we'd both be wrong.",
            "You're not the sharpest knife in the drawer, are you?",
            "I'd explain it to you but I ran out of crayons."
        ];
        const randomInsult = insults[Math.floor(Math.random() * insults.length)];
        await sock.sendMessage(msg.key.remoteJid, {
            text: `*${msg.pushName}* insults ${target}:\n\n"${randomInsult}" 😈`,
            mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
        });
    }
};

module.exports = funCommands;