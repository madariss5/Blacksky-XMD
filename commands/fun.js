const config = require('../config');
const fs = require('fs-extra');
const path = require('path');

const funCommands = {
    menu: async (sock, msg) => {
        const commandList = `🎮 *Fun Commands Menu* 🎮\n
1. *!slap* [@user] - Slap someone with an anime gif
2. *!hug* [@user] - Give someone a warm hug
3. *!pat* [@user] - Pat someone gently
4. *!dance* - Show off your dance moves
5. *!joke* - Get a random funny joke
6. *!quote* - Get an inspirational quote
7. *!fact* - Learn an interesting fact
8. *!magic8ball* [question] - Ask the magic 8 ball a question
9. *!dare* - Get a random dare challenge
10. *!truth* - Get a random truth question
11. *!meme* - Get a random anime meme
12. *!wordgame* - Play a word guessing game
   - Use *!guess* [word] to make a guess
13. *!trivia* - Play a trivia game
   - Use *!answer* [number] to answer
14. *!emojiart* - Get a random emoji art
15. *!insult* [@user] - Playfully insult someone
16. *!kill* [@user] - Dramatically eliminate someone\n
*How to use:*
- Commands with [@user] can tag someone
- For games, follow the instructions given
- Have fun and be respectful! 😊`;

        await sock.sendMessage(msg.key.remoteJid, { text: commandList });
    },

    coinflip: async (sock, msg) => {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
        await sock.sendMessage(msg.key.remoteJid, { text: `🎲 Coin flip result: *${result}*` });
    },

    slap: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `*${msg.pushName}* slapped ${target}! 👋`,
                mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
            });

            const mediaPath = './media/anime-slap.gif';
            if (fs.existsSync(mediaPath)) {
                await sock.sendMessage(msg.key.remoteJid, { 
                    video: fs.readFileSync(mediaPath),
                    gifPlayback: true,
                    caption: '🎭',
                    mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
                });
            }
        } catch (error) {
            console.error('Error in slap command:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '😅 Failed to send slap animation!' 
            });
        }
    },

    hug: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `*${msg.pushName}* hugged ${target}! 🤗`,
                mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
            });

            const mediaPath = './media/anime-hug.gif';
            if (fs.existsSync(mediaPath)) {
                await sock.sendMessage(msg.key.remoteJid, { 
                    video: fs.readFileSync(mediaPath),
                    gifPlayback: true,
                    caption: '🎭',
                    mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
                });
            }
        } catch (error) {
            console.error('Error in hug command:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '😅 Failed to send hug animation!' 
            });
        }
    },

    pat: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `*${msg.pushName}* patted ${target}! 🥰`,
                mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
            });

            const mediaPath = './media/anime-pat.gif';
            if (fs.existsSync(mediaPath)) {
                await sock.sendMessage(msg.key.remoteJid, { 
                    video: fs.readFileSync(mediaPath),
                    gifPlayback: true,
                    caption: '🎭',
                    mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
                });
            }
        } catch (error) {
            console.error('Error in pat command:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '😅 Failed to send pat animation!' 
            });
        }
    },

    dance: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `*${msg.pushName}* is dancing! 💃`
            });

            const mediaPath = './media/anime-dance.gif';
            if (fs.existsSync(mediaPath)) {
                await sock.sendMessage(msg.key.remoteJid, { 
                    video: fs.readFileSync(mediaPath),
                    gifPlayback: true,
                    caption: '🎭'
                });
            }
        } catch (error) {
            console.error('Error in dance command:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '😅 Failed to send dance animation!' 
            });
        }
    },

    joke: async (sock, msg) => {
        const jokes = [
            "Why don't scientists trust atoms? Because they make up everything! 😄",
            "What did the grape say when it got stepped on? Nothing, it just let out a little wine! 🍷",
            "Why don't eggs tell jokes? They'd crack up! 🥚",
            "What do you call a bear with no teeth? A gummy bear! 🐻",
            "Why did the scarecrow win an award? He was outstanding in his field! 🌾",
            "What do you call a can opener that doesn't work? A can't opener! 🥫",
            "Why did the cookie go to the doctor? Because it was feeling crumbly! 🍪",
            "What do you call fake spaghetti? An impasta! 🍝"
        ];
        const joke = jokes[Math.floor(Math.random() * jokes.length)];
        await sock.sendMessage(msg.key.remoteJid, {
            text: `😂 *Here's a joke:*\n\n${joke}`
        });
    },

    quote: async (sock, msg) => {
        const quotes = [
            "Life is what happens when you're busy making other plans. - John Lennon",
            "The only way to do great work is to love what you do. - Steve Jobs",
            "In three words I can sum up everything I've learned about life: it goes on. - Robert Frost",
            "Success is not final, failure is not fatal. - Winston Churchill",
            "Be yourself; everyone else is already taken. - Oscar Wilde",
            "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
            "Do what you can, with what you have, where you are. - Theodore Roosevelt",
            "Everything you've ever wanted is on the other side of fear. - George Addair"
        ];
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        await sock.sendMessage(msg.key.remoteJid, { 
            text: `📜 *Inspirational Quote:*\n\n${randomQuote}`
        });
    },

    fact: async (sock, msg) => {
        const facts = [
            "Honey never spoils! 🍯",
            "Bananas are berries, but strawberries aren't! 🍌",
            "A day on Venus is longer than its year! 🌟",
            "Octopuses have three hearts! 🐙",
            "The Great Wall of China isn't visible from space! 🌍",
            "Sloths can hold their breath for up to 40 minutes underwater! 🦥",
            "Cows have best friends and get stressed when separated! 🐄",
            "A cloud can weigh more than a million pounds! ☁️"
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
            "Outlook not so good! 😕",
            "Signs point to yes! ✅",
            "Ask again later! 🕐"
        ];

        if (!args.length) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: "🎱 Please ask a question! For example: !magic8ball will it rain today?"
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
            "Share your most used emoji! 😊",
            "Do 10 jumping jacks right now! 🏃‍♂️",
            "Tell us your favorite childhood memory! 👶"
        ];

        const dare = dares[Math.floor(Math.random() * dares.length)];
        await sock.sendMessage(msg.key.remoteJid, {
            text: `🎯 *Dare Challenge*\n\n${dare}\n\nAre you brave enough to do it? 😏`
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
            "What's the childish thing you still do? 👶",
            "What's the weirdest dream you've had? 💭",
            "What's your most unusual talent? 🎭"
        ];

        const truth = truths[Math.floor(Math.random() * truths.length)];
        await sock.sendMessage(msg.key.remoteJid, {
            text: `🎯 *Truth Challenge*\n\n${truth}\n\nDare to answer honestly? 🤔`
        });
    },

    meme: async (sock, msg) => {
        try {
            const mediaPath = './media/anime-meme.gif';
            if (fs.existsSync(mediaPath)) {
                await sock.sendMessage(msg.key.remoteJid, { 
                    video: fs.readFileSync(mediaPath),
                    gifPlayback: true,
                    caption: '😂 Here\'s your meme!'
                });
            }
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '😅 Oops! Failed to fetch a meme. Try again later!'
            });
        }
    },

    wordgame: async (sock, msg) => {
        try {
            const words = {
                'HAPPY': 'Feeling or showing pleasure or contentment',
                'SMILE': 'Form one\'s features into a pleased expression',
                'LAUGH': 'Make the spontaneous sounds and movements of the face and body that are instinctive expressions of lively amusement',
                'DANCE': 'Move rhythmically to music',
                'PARTY': 'A social gathering of invited guests'
            };

            const wordList = Object.keys(words);
            const selectedWord = wordList[Math.floor(Math.random() * wordList.length)];
            const hint = words[selectedWord];
            const hidden = selectedWord.replace(/[A-Z]/g, '_ ');

            // Store the word in memory for later checking
            if (!global.wordGameAnswers) global.wordGameAnswers = {};
            global.wordGameAnswers[msg.key.remoteJid] = selectedWord;

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎮 *Word Game*\n\nGuess this word: ${hidden}\n\n💡 Hint: ${hint}\n\nReply with !guess [your answer] to play!`
            });
        } catch (error) {
            console.error('Error in wordgame:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Oops! Something went wrong with the word game!'
            });
        }
    },

    guess: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide your guess! Example: !guess HAPPY'
                });
            }

            const userGuess = args[0].toUpperCase();
            const correctWord = global.wordGameAnswers?.[msg.key.remoteJid];

            if (!correctWord) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No active word game! Start one with !wordgame'
                });
            }

            if (userGuess === correctWord) {
                delete global.wordGameAnswers[msg.key.remoteJid];
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `🎉 Congratulations! You got it right!\nThe word was: ${correctWord}`
                });
            } else {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Wrong guess! Try again!'
                });
            }
        } catch (error) {
            console.error('Error in guess command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Oops! Something went wrong while checking your guess!'
            });
        }
    },

    trivia: async (sock, msg) => {
        try {
            const questions = [
                { 
                    q: "What planet is known as the Red Planet?",
                    a: "Mars",
                    options: ["Venus", "Mars", "Jupiter", "Mercury"]
                },
                { 
                    q: "What is the largest planet in our solar system?",
                    a: "Jupiter",
                    options: ["Saturn", "Neptune", "Jupiter", "Uranus"]
                },
                { 
                    q: "What is the closest star to Earth?",
                    a: "The Sun",
                    options: ["Proxima Centauri", "The Sun", "Alpha Centauri", "Sirius"]
                },
                {
                    q: "Which animal can sleep for 3 years?",
                    a: "Snail",
                    options: ["Bear", "Snail", "Sloth", "Koala"]
                }
            ];

            const question = questions[Math.floor(Math.random() * questions.length)];

            // Store the answer for checking
            if (!global.triviaAnswers) global.triviaAnswers = {};
            global.triviaAnswers[msg.key.remoteJid] = question.a;

            // Randomize options order
            const shuffledOptions = question.options.sort(() => Math.random() - 0.5);

            const questionText = `🤔 *Trivia Time!*\n\nQuestion: ${question.q}\n\nOptions:\n${
                shuffledOptions.map((opt, i) => `${i + 1}. ${opt}`).join('\n')
            }\n\nReply with !answer [number] to submit your answer!`;

            await sock.sendMessage(msg.key.remoteJid, {
                text: questionText
            });
        } catch (error) {
            console.error('Error in trivia command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Oops! Something went wrong with the trivia game!'
            });
        }
    },

    answer: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide your answer number! Example: !answer 2'
                });
            }

            const correctAnswer = global.triviaAnswers?.[msg.key.remoteJid];
            if (!correctAnswer) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No active trivia question! Start one with !trivia'
                });
            }

            const userAnswer = parseInt(args[0]);
            if (isNaN(userAnswer) || userAnswer < 1 || userAnswer > 4) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a valid answer number (1-4)!'
                });
            }

            delete global.triviaAnswers[msg.key.remoteJid];
            const isCorrect = correctAnswer === userAnswer;

            await sock.sendMessage(msg.key.remoteJid, {
                text: isCorrect 
                    ? `🎉 Correct! The answer was ${correctAnswer}`
                    : `❌ Wrong! The correct answer was ${correctAnswer}`
            });
        } catch (error) {
            console.error('Error in answer command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Oops! Something went wrong while checking your answer!'
            });
        }
    },
    emojiart: async (sock, msg) => {
        const arts = [
            "ʕ•ᴥ•ʔ",
            "(づ｡◕‿‿◕｡)づ",
            "(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧",
            "▼・ᴥ・▼",
            "(｡◕‿◕｡)",
            "( ͡° ͜ʖ ͡°)",
            "(╯°□°）╯︵ ┻━┻",
            "┬─┬ノ( º _ ºノ)",
            "(｡♥‿♥｡)",
            "^_^"
        ];
        const art = arts[Math.floor(Math.random() * arts.length)];
        await sock.sendMessage(msg.key.remoteJid, {
            text: `🎨 *Here's your emoji art:*\n\n${art}`
        });
    },
    insult: async (sock, msg, args) => {
        const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
        const insults = [
            "You're as useful as a screen door on a submarine!",
            "I'd agree with you but then we'd both be wrong.",
            "You're not the sharpest knife in the drawer, are you?",
            "I'd explain it to you but I ran out of crayons.",
            "You're like a cloud - when you disappear, it's a beautiful day!",
            "I'm not saying you're stupid, I'm just saying you've got bad luck when it comes to thinking.",
            "If laughter is the best medicine, your face must be curing the world!",
            "I'm jealous of people who don't know you!"
        ];
        const randomInsult = insults[Math.floor(Math.random() * insults.length)];
        await sock.sendMessage(msg.key.remoteJid, {
            text: `*${msg.pushName}* insults ${target}:\n\n"${randomInsult}" 😈`,
            mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
        });
    },
    kill: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const killMessages = [
                `💀 *${msg.pushName}* used the death note on ${target}!`,
                `🔪 *${msg.pushName}* dramatically eliminated ${target}!`,
                `⚰️ *${msg.pushName}* sent ${target} to the shadow realm!`,
                `☠️ *${msg.pushName}* used Avada Kedavra on ${target}!`,
                `🎮 *${msg.pushName}* used /kill command on ${target}!`,
                `👻 *${msg.pushName}* made ${target} disappear mysteriously!`,
                `💥 *${msg.pushName}* used the infinity gauntlet on ${target}!`,
                `🌟 *${msg.pushName}* used their special move on ${target}!`,
                `🎯 *${msg.pushName}* landed a critical hit on ${target}!`,
                `🌪️ *${msg.pushName}* banished ${target} to the void!`
            ];

            const randomMessage = killMessages[Math.floor(Math.random() * killMessages.length)];

            // First send the message
            await sock.sendMessage(msg.key.remoteJid, { 
                text: randomMessage + "\n\n☠️ *K.O!* ⚰️",
                mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
            });

            // Then send the GIF
            const mediaPath = './media/anime-kill.gif';
            if (fs.existsSync(mediaPath)) {
                const stats = fs.statSync(mediaPath);
                console.log("GIF file size:", stats.size, "bytes");

                if (stats.size > 1000) { // Only send if file is larger than 1KB
                    try {
                        await sock.sendMessage(msg.key.remoteJid, {
                            sticker: fs.readFileSync(mediaPath),
                            mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
                        });
                    } catch (gifError) {
                        console.error("Error sending sticker:", gifError.stack);
                        // Fallback to simpler message
                        await sock.sendMessage(msg.key.remoteJid, {
                            text: '💀 *FATALITY!*',
                            mentions: args[0] ? [args[0] + '@s.whatsapp.net'] : []
                        });
                    }
                } else {
                    console.error("Kill animation GIF is too small:", stats.size, "bytes");
                }
            } else {
                console.error("Kill animation GIF not found");
            }
        } catch (error) {
            console.error('Error in kill command:', error.stack);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '😅 Failed to execute kill command!'
            });
        }
    },
};

module.exports = funCommands;