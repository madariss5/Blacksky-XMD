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
        const sticker = { url: 'https://example.com/stickers/slap.webp' }; 
        await sock.sendMessage(msg.key.remoteJid, {
            sticker: sticker,
            caption: `*${msg.pushName}* slapped ${target}! 👋`,
            mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
        });
    },

    hug: async (sock, msg, args) => {
        const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
        const sticker = { url: 'https://example.com/stickers/hug.webp' }; 
        await sock.sendMessage(msg.key.remoteJid, {
            sticker: sticker,
            caption: `*${msg.pushName}* hugged ${target}! 🤗`,
            mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
        });
    },

    cuddle: async (sock, msg, args) => {
        const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
        const sticker = { url: 'https://example.com/stickers/cuddle.webp' }; 
        await sock.sendMessage(msg.key.remoteJid, {
            sticker: sticker,
            caption: `*${msg.pushName}* cuddled ${target}! 🥰`,
            mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
        });
    },

    kiss: async (sock, msg, args) => {
        const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
        const sticker = { url: 'https://example.com/stickers/kiss.webp' }; 
        await sock.sendMessage(msg.key.remoteJid, {
            sticker: sticker,
            caption: `*${msg.pushName}* kissed ${target}! 💋`,
            mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
        });
    },

    kill: async (sock, msg, args) => {
        const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
        const sticker = { url: 'https://example.com/stickers/kill.webp' }; 
        await sock.sendMessage(msg.key.remoteJid, {
            sticker: sticker,
            caption: `*${msg.pushName}* killed ${target}! 💀`,
            mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
        });
    },

    dance: async (sock, msg) => {
        const sticker = { url: 'https://example.com/stickers/dance.webp' }; 
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
        const memeUrl = 'https://example.com/meme.jpg'; 
        await sock.sendMessage(msg.key.remoteJid, {
            image: { url: memeUrl },
            caption: '😂 Here\'s your meme!'
        });
    },

    ship: async (sock, msg, args) => {
        if (args.length !== 2) {
            return await sock.sendMessage(msg.key.remoteJid, { 
                text: 'Tag two people to ship!\nFormat: !ship @user1 @user2' 
            });
        }

        const percent = Math.floor(Math.random() * 101);
        const heart = percent > 75 ? '❤️' : percent > 50 ? '💕' : percent > 25 ? '💖' : '💔';

        const message = `*Love Calculator* ${heart}\n\n` +
                       `${args[0]} + ${args[1]}\n` +
                       `= ${percent}% Compatibility\n\n` +
                       `${percent > 75 ? 'Perfect match!' : 
                         percent > 50 ? 'Good match!' :
                         percent > 25 ? 'Could work...' : 
                         'Better stay friends 😅'}`;

        await sock.sendMessage(msg.key.remoteJid, {
            text: message,
            mentions: args.map(arg => arg + '@s.whatsapp.net')
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

        const sticker = { url: 'https://example.com/stickers/fight.webp' }; 
        await sock.sendMessage(msg.key.remoteJid, {
            sticker: sticker,
            caption: `*${msg.pushName}* ${move}\nDealt ${damage} damage to ${target}! 👊💥`,
            mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
        });
    },
    rps: async (sock, msg, args) => {
        const choices = ['rock', 'paper', 'scissors'];
        const userChoice = args[0]?.toLowerCase();

        if (!choices.includes(userChoice)) {
            return await sock.sendMessage(msg.key.remoteJid, { 
                text: 'Please choose rock, paper, or scissors!'
            });
        }

        const botChoice = choices[Math.floor(Math.random() * 3)];
        let result;

        if (userChoice === botChoice) result = 'Tie!';
        else if (
            (userChoice === 'rock' && botChoice === 'scissors') ||
            (userChoice === 'paper' && botChoice === 'rock') ||
            (userChoice === 'scissors' && botChoice === 'paper')
        ) result = 'You win!';
        else result = 'Bot wins!';

        await sock.sendMessage(msg.key.remoteJid, {
            text: `You chose: ${userChoice}\nBot chose: ${botChoice}\n\n${result}`
        });
    },

    truthordare: async (sock, msg, args) => {
        const type = args[0]?.toLowerCase();
        if (!['truth', 'dare'].includes(type)) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: 'Please specify either truth or dare!'
            });
        }

        const truths = [
            "What's your biggest fear?",
            "What's your most embarrassing moment?",
            "What's the worst trouble you've been in?"
        ];

        const dares = [
            "Send your latest selfie",
            "Text your crush",
            "Do 10 push-ups"
        ];

        const question = type === 'truth' 
            ? truths[Math.floor(Math.random() * truths.length)]
            : dares[Math.floor(Math.random() * dares.length)];

        await sock.sendMessage(msg.key.remoteJid, {
            text: `Here's your ${type}:\n\n${question}`
        });
    },
    ...Array.from({ length: 48 }, (_, i) => ({
        [`funCmd${i + 1}`]: async (sock, msg, args) => {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `Executing fun command ${i + 1} with args: ${args.join(' ')}`
            });
        }
    })).reduce((acc, curr) => ({ ...acc, ...curr }), {})
};

module.exports = funCommands;