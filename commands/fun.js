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
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: 'https://c.tenor.com/CvBTA0GyrogAAAPo/anime-slap.gif' },
                caption: `*${msg.pushName}* slapped ${target}! 👋`,
                mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : [],
                gifPlayback: true
            });
        } catch (error) {
            console.error('Error sending slap:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `*${msg.pushName}* slapped ${target}! 👋`
            });
        }
    },

    hug: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: 'https://c.tenor.com/1T1B8HcWalQAAAPo/anime-hug.gif' },
                caption: `*${msg.pushName}* hugged ${target}! 🤗`,
                mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : [],
                gifPlayback: true
            });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `*${msg.pushName}* hugged ${target}! 🤗`
            });
        }
    },

    cuddle: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: 'https://c.tenor.com/wUQH5CF2DJ4AAAPo/anime-cuddle.gif' },
                caption: `*${msg.pushName}* cuddled ${target}! 🥰`,
                mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : [],
                gifPlayback: true
            });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `*${msg.pushName}* cuddled ${target}! 🥰`
            });
        }
    },

    kiss: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: 'https://c.tenor.com/F02Ep3b2jJgAAAPo/cute-kawai.gif' },
                caption: `*${msg.pushName}* kissed ${target}! 💋`,
                mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : [],
                gifPlayback: true
            });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `*${msg.pushName}* kissed ${target}! 💋`
            });
        }
    },

    kill: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: 'https://c.tenor.com/UKsNkAqj7YkAAAPo/anime-kill.gif' },
                caption: `*${msg.pushName}* killed ${target}! 💀`,
                mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : [],
                gifPlayback: true
            });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `*${msg.pushName}* killed ${target}! 💀`
            });
        }
    },

    dance: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: 'https://c.tenor.com/1sCpX5R3idsAAAPo/anime-dance.gif' },
                caption: `*${msg.pushName}* is dancing! 💃`,
                gifPlayback: true
            });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `*${msg.pushName}* is dancing! 💃`
            });
        }
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
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: 'https://c.tenor.com/ZATOxNglZlwAAAPo/anime-meme.gif' },
                caption: '😂 Here\'s your meme!',
                gifPlayback: true
            });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '😅 Oops! Failed to fetch a meme. Try again later!'
            });
        }
    },

    fight: async (sock, msg, args) => {
        try {
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

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: 'https://c.tenor.com/E0mxW6hhZQcAAAPo/anime-fight.gif' },
                caption: `*${msg.pushName}* ${move}\nDealt ${damage} damage to ${target}! 👊💥`,
                mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : [],
                gifPlayback: true
            });
        } catch (error) {
            const move = moves[Math.floor(Math.random() * moves.length)];
            const damage = damages[Math.floor(Math.random() * damages.length)];
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `*${msg.pushName}* ${move}\nDealt ${damage} damage to ${target}! 👊💥`,
                mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
            });
        }
    },

    wordgame: async (sock, msg) => {
        const words = ['HAPPY', 'SMILE', 'LAUGH', 'DANCE', 'PARTY'];
        const word = words[Math.floor(Math.random() * words.length)];
        const hidden = word.replace(/[A-Z]/g, '_ ');
        await sock.sendMessage(msg.key.remoteJid, {
            text: `🎮 Word Game\n\nGuess this word: ${hidden}\nHint: It's related to fun!`
        });
    },

    emojiart: async (sock, msg) => {
        const arts = [
            "ʕ•ᴥ•ʔ",
            "(づ｡◕‿‿◕｡)づ",
            "(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧",
            "▼・ᴥ・▼"
        ];
        const art = arts[Math.floor(Math.random() * arts.length)];
        await sock.sendMessage(msg.key.remoteJid, {
            text: `🎨 Here's your emoji art:\n\n${art}`
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

        const botChoice = choices[Math.floor(Math.random() * choices.length)];
        let result;

        if (userChoice === botChoice) result = 'Tie!';
        else if (
            (userChoice === 'rock' && botChoice === 'scissors') ||
            (userChoice === 'paper' && botChoice === 'rock') ||
            (userChoice === 'scissors' && botChoice === 'paper')
        ) result = 'You win! 🎉';
        else result = 'Bot wins! 🤖';

        await sock.sendMessage(msg.key.remoteJid, {
            text: `You chose: ${userChoice}\nBot chose: ${botChoice}\n\n${result}`
        });
    },

    trivia: async (sock, msg) => {
        const questions = [
            { q: "What planet is known as the Red Planet?", a: "Mars" },
            { q: "What is the largest planet in our solar system?", a: "Jupiter" },
            { q: "What is the closest star to Earth?", a: "The Sun" }
        ];
        const question = questions[Math.floor(Math.random() * questions.length)];
        await sock.sendMessage(msg.key.remoteJid, {
            text: `🤔 Trivia Time!\n\nQuestion: ${question.q}\n\nReply with your answer!`
        });
    },
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