const config = require('../config');

const funCommands = {
    coinflip: async (sock, msg) => {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
        await sock.sendMessage(msg.key.remoteJid, { text: `🎲 Coin flip result: *${result}*` });
    },

    slap: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';

            // Send text message first
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `*${msg.pushName}* slapped ${target}! 👋`,
                mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
            });

            // Send sticker using native method
            await sock.sendMessage(msg.key.remoteJid, {
                sticker: { url: 'https://i.imgur.com/ZXeVMub.webp' },
                mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
            });
        } catch (error) {
            console.error('Error sending slap:', error);
            // Message already sent above
        }
    },

    hug: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `*${msg.pushName}* hugged ${target}! 🤗`,
                mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
            });

            await sock.sendMessage(msg.key.remoteJid, {
                sticker: { url: 'https://i.imgur.com/wuK60gP.webp' },
                mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
            });
        } catch (error) {
            console.error('Error sending hug:', error);
            // Text message already sent
        }
    },

    pat: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `*${msg.pushName}* patted ${target}! 🥰`,
                mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
            });

            await sock.sendMessage(msg.key.remoteJid, {
                sticker: { url: 'https://i.imgur.com/P8PH4LJ.webp' },
                mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
            });
        } catch (error) {
            console.error('Error sending pat:', error);
            // Text message already sent
        }
    },

    dance: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `*${msg.pushName}* is dancing! 💃`
            });

            await sock.sendMessage(msg.key.remoteJid, {
                sticker: { url: 'https://i.imgur.com/WzlYwGR.webp' }
            });
        } catch (error) {
            console.error('Error sending dance:', error);
            // Text message already sent
        }
    },

    cry: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `*${msg.pushName}* is crying! 😢`
            });

            await sock.sendMessage(msg.key.remoteJid, {
                sticker: { url: 'https://i.imgur.com/TJZjE6r.webp' }
            });
        } catch (error) {
            console.error('Error sending cry:', error);
            // Text message already sent
        }
    },

    bonk: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `*${msg.pushName}* bonked ${target}! 🔨`,
                mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
            });

            await sock.sendMessage(msg.key.remoteJid, {
                sticker: { url: 'https://i.imgur.com/ZNgzelP.webp' },
                mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
            });
        } catch (error) {
            console.error('Error sending bonk:', error);
            // Text message already sent
        }
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
    joke: async (sock, msg) => {
        const jokes = [
            "Why don't scientists trust atoms? Because they make up everything! 😄",
            "What did the grape say when it got stepped on? Nothing, it just let out a little wine! 🍷",
            "Why don't eggs tell jokes? They'd crack up! 🥚",
            "What do you call a bear with no teeth? A gummy bear! 🐻"
        ];
        const joke = jokes[Math.floor(Math.random() * jokes.length)];
        await sock.sendMessage(msg.key.remoteJid, {
            text: `😂 *Here's a joke:*\n\n${joke}`
        });
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
    fact: async (sock, msg) => {
        const facts = [
            "Honey never spoils! 🍯",
            "Bananas are berries, but strawberries aren't! 🍌",
            "A day on Venus is longer than its year! 🌟",
            "Octopuses have three hearts! 🐙"
        ];
        const fact = facts[Math.floor(Math.random() * facts.length)];
        await sock.sendMessage(msg.key.remoteJid, {
            text: `🤓 *Random Fact:*\n\n${fact}`
        });
    },
    magic8ball: async (sock, msg, args) => {
        const responses = [
            "It is certain! ✨",
            "Without a doubt! 💫",
            "Most likely! 🌟",
            "Better not tell you now... 🤫",
            "Cannot predict now... 🤔",
            "Don't count on it! 🚫",
            "My sources say no! ❌",
            "Outlook not so good! 😕"
        ];

        if (!args.length) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: "Please ask a question! 🎱"
            });
        }

        const response = responses[Math.floor(Math.random() * responses.length)];
        await sock.sendMessage(msg.key.remoteJid, {
            text: `🎱 *Magic 8 Ball*\n\nQ: ${args.join(' ')}\nA: ${response}`
        });
    },
    dare: async (sock, msg) => {
        const dares = [
            "Send your latest selfie! 📸",
            "Tell us your most embarrassing story! 😳",
            "Do your best dance move! 💃",
            "Sing a part of your favorite song! 🎤",
            "Tell us your worst joke! 😆",
            "Share your phone's battery percentage! 🔋",
            "Tell us the last thing you googled! 🔍",
            "Share your most used emoji! 😊"
        ];

        const dare = dares[Math.floor(Math.random() * dares.length)];
        await sock.sendMessage(msg.key.remoteJid, {
            text: `🎯 *Dare*\n\n${dare}`
        });
    },
    truth: async (sock, msg) => {
        const truths = [
            "What's your biggest fear? 😱",
            "What's the last lie you told? 🤥",
            "What's your most embarrassing moment? 😳",
            "What's your biggest secret? 🤫",
            "Who's your crush? 💕",
            "What's the worst thing you've ever done? 😈",
            "What's your biggest regret? 😔",
            "What's the childish thing you still do? 👶"
        ];

        const truth = truths[Math.floor(Math.random() * truths.length)];
        await sock.sendMessage(msg.key.remoteJid, {
            text: `🎯 *Truth*\n\n${truth}`
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