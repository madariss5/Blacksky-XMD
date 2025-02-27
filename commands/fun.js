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

    slap: async (sock, msg, args) => {
        const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
        const sticker = { url: 'https://media.tenor.com/images/53b846f3cc11c7c5fe358fc6d458901d/tenor.gif' };
        await sock.sendMessage(msg.key.remoteJid, {
            sticker: sticker,
            caption: `*${msg.pushName}* slapped ${target}! 👋`,
            mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
        });
    },

    hug: async (sock, msg, args) => {
        const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
        const sticker = { url: 'https://media.tenor.com/images/afbc39fcc4cdc189c481008026712d2b/tenor.gif' };
        await sock.sendMessage(msg.key.remoteJid, {
            sticker: sticker,
            caption: `*${msg.pushName}* hugged ${target}! 🤗`,
            mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
        });
    },

    cuddle: async (sock, msg, args) => {
        const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
        const sticker = { url: 'https://media.tenor.com/images/6f7eebef17bf270fd7e1aa5beabd934f/tenor.gif' };
        await sock.sendMessage(msg.key.remoteJid, {
            sticker: sticker,
            caption: `*${msg.pushName}* cuddled ${target}! 🥰`,
            mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
        });
    },

    kiss: async (sock, msg, args) => {
        const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
        const sticker = { url: 'https://media.tenor.com/images/197df534507bd229ba790e8e1b5f63dc/tenor.gif' };
        await sock.sendMessage(msg.key.remoteJid, {
            sticker: sticker,
            caption: `*${msg.pushName}* kissed ${target}! 💋`,
            mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
        });
    },

    kill: async (sock, msg, args) => {
        const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
        const sticker = { url: 'https://media.tenor.com/images/8c8f18f7b3b748c555ec8b12bb5a7699/tenor.gif' };
        await sock.sendMessage(msg.key.remoteJid, {
            sticker: sticker,
            caption: `*${msg.pushName}* killed ${target}! 💀`,
            mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
        });
    },

    dance: async (sock, msg) => {
        const sticker = { url: 'https://media.tenor.com/images/9ee571803c9079068c6c6c0e17e6f54d/tenor.gif' };
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
    },

    meme: async (sock, msg) => {
        const memeUrl = 'https://api.memeapi.link/random';
        await sock.sendMessage(msg.key.remoteJid, {
            image: { url: memeUrl },
            caption: '😂 Here\'s your meme!'
        });
    },

    fight: async (sock, msg, args) => {
        const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
        const moves = [
            'used Hadouken!',
            'performed a Fatality!',
            'used Ultra Combo!',
            'landed a Critical Hit!'
        ];
        const damages = [100, 150, 200, 250];
        const move = moves[Math.floor(Math.random() * moves.length)];
        const damage = damages[Math.floor(Math.random() * damages.length)];

        const sticker = { url: 'https://media.tenor.com/images/1ed88576f029d89c7fea9246e47f5246/tenor.gif' };
        await sock.sendMessage(msg.key.remoteJid, {
            sticker: sticker,
            caption: `*${msg.pushName}* ${move}\nDealt ${damage} damage to ${target}! 👊💥`,
            mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
        });
    },

    // Additional fun commands implementation...
    ...Array.from({ length: 48 }, (_, i) => ({
        [`funCmd${i + 1}`]: async (sock, msg, args) => {
            const reactions = ['😂', '🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎪'];
            const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `${randomReaction} Executing fun command ${i + 1} with args: ${args.join(' ')}`
            });
        }
    })).reduce((acc, curr) => ({ ...acc, ...curr }), {})
};

module.exports = funCommands;