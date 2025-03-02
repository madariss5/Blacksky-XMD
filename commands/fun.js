const config = require('../config');
const logger = require('pino')();
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

// Game states and cooldowns management
const gameStates = new Map();
const cooldowns = new Map();

const funCommands = {
    menu: async (sock, msg) => {
        try {
            const menuText = `🎮 *Fun Commands Menu*\n\n` +
                         `*Games:*\n` +
                         `• ${config.prefix}magic8ball - Ask the magic 8 ball\n` +
                         `• ${config.prefix}wordgame - Play word guessing game\n` +
                         `• ${config.prefix}trivia - Play trivia quiz\n` +
                         `• ${config.prefix}rps - Play rock paper scissors\n` +
                         `• ${config.prefix}roll - Roll a dice\n` +
                         `• ${config.prefix}coinflip - Flip a coin\n\n` +
                         `*Entertainment:*\n` +
                         `• ${config.prefix}joke - Get random jokes\n` +
                         `• ${config.prefix}meme - Get random memes\n` +
                         `• ${config.prefix}quote - Get inspirational quotes\n` +
                         `• ${config.prefix}fact - Get random facts\n` +
                         `• ${config.prefix}emojiart - Get random emoji art\n` +
                         `• ${config.prefix}roastme - Get playfully roasted\n\n`;

            await sock.sendMessage(msg.key.remoteJid, { text: menuText });
            logger.info('Fun menu command executed successfully');
        } catch (error) {
            logger.error('Error in fun menu command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to show fun menu' });
        }
    },

    roastme: async (sock, msg) => {
        try {
            const roasts = [
                "You're the reason why shampoo has instructions! 🧴",
                "I'd agree with you but then we'd both be wrong! 🤪",
                "You must have been born on a highway because that's where most accidents happen! 🛣️",
                "I'm not saying you're stupid, I'm just saying you've got bad luck when it comes to thinking! 🤔",
                "If laughter is the best medicine, your face must be curing the world! 😂",
                "You're like a cloud - when you disappear, it's a beautiful day! ☁️",
                "I would roast you, but looks like nature already did! 🔥",
                "You're living proof that evolution can go in reverse! 🦒",
                "I bet your brain feels as good as new, seeing that you never use it! 🧠",
                "Don't feel bad, your parents also had something perfect - until you were born! 👶"
            ];

            const roast = roasts[Math.floor(Math.random() * roasts.length)];

            // Send roast message with emoji
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🔥 *Roast*\n\n${roast}`
            });

            logger.info('Roastme command executed successfully');
        } catch (error) {
            logger.error('Error in roastme command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to execute roastme command!' });
        }
    },

    magic8ball: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, { 
                    text: '❌ Please ask a question!\nUsage: .magic8ball <question>' 
                });
            }

            const responses = [
                "It is certain! ✨",
                "Without a doubt! 💫",
                "Most likely! 🌟",
                "Yes definitely! ✅",
                "You may rely on it! 👍",
                "Ask again later... 🤔",
                "Better not tell you now... 🤫",
                "Cannot predict now... 💭",
                "Don't count on it! ❌",
                "My sources say no! 🚫",
                "Very doubtful! 😕",
                "Outlook not so good! 😬"
            ];

            const response = responses[Math.floor(Math.random() * responses.length)];
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎱 *Magic 8 Ball*\n\nQ: ${args.join(' ')}\nA: ${response}`
            });
            logger.info('Magic 8 Ball command executed successfully');
        } catch (error) {
            logger.error('Error in magic8ball command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to consult the Magic 8 Ball!' });
        }
    },

    rps: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please make your choice!\nUsage: .rps <rock/paper/scissors>'
                });
            }

            const choices = ['rock', 'paper', 'scissors'];
            const userChoice = args[0].toLowerCase();

            if (!choices.includes(userChoice)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Invalid choice! Please choose rock, paper, or scissors'
                });
            }

            const botChoice = choices[Math.floor(Math.random() * choices.length)];
            let result;

            if (userChoice === botChoice) {
                result = "It's a tie! 🤝";
            } else if (
                (userChoice === 'rock' && botChoice === 'scissors') ||
                (userChoice === 'paper' && botChoice === 'rock') ||
                (userChoice === 'scissors' && botChoice === 'paper')
            ) {
                result = "You win! 🎉";
            } else {
                result = "Bot wins! 🤖";
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎮 *Rock Paper Scissors*\n\nYour choice: ${userChoice}\nBot's choice: ${botChoice}\n\n${result}`
            });
            logger.info('RPS command executed successfully');
        } catch (error) {
            logger.error('Error in rps command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to play Rock Paper Scissors!' });
        }
    },

    roll: async (sock, msg, args) => {
        try {
            const max = args.length ? parseInt(args[0]) : 6;
            if (isNaN(max) || max < 1) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a valid number!\nUsage: .roll [max number]'
                });
            }

            const result = Math.floor(Math.random() * max) + 1;
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎲 *Dice Roll*\n\nYou rolled: ${result} (1-${max})`
            });
            logger.info('Roll command executed successfully');
        } catch (error) {
            logger.error('Error in roll command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to roll the dice!' });
        }
    },

    coinflip: async (sock, msg) => {
        try {
            const result = Math.random() < 0.5;
            const text = result ? 'Heads! 👑' : 'Tails! 🪙';

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎲 *Coin Flip*\n\n${text}`
            });
            logger.info('Coinflip command executed successfully');
        } catch (error) {
            logger.error('Error in coinflip command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to flip the coin!' });
        }
    },

    joke: async (sock, msg) => {
        try {
            const response = await axios.get('https://v2.jokeapi.dev/joke/Any?safe-mode');
            const joke = response.data;
            let jokeText;

            if (joke.type === 'single') {
                jokeText = joke.joke;
            } else {
                jokeText = `${joke.setup}\n\n${joke.delivery}`;
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `😂 *Here's a joke:*\n\n${jokeText}`
            });
            logger.info('Joke command executed successfully');
        } catch (error) {
            logger.error('Error in joke command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to fetch a joke!' });
        }
    },

    quote: async (sock, msg) => {
        try {
            const response = await axios.get('https://api.quotable.io/random');
            const quote = response.data;

            await sock.sendMessage(msg.key.remoteJid, {
                text: `📜 *Quote of the moment*\n\n"${quote.content}"\n\n- ${quote.author}`
            });
            logger.info('Quote command executed successfully');
        } catch (error) {
            logger.error('Error in quote command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to fetch a quote!' });
        }
    },
    wordgame: async (sock, msg) => {
        try {
            const words = {
                'HAPPY': 'Feeling or showing pleasure or contentment',
                'SMILE': 'Form one\'s features into a pleased expression',
                'LAUGH': 'Make spontaneous sounds and movements of joy',
                'DANCE': 'Move rhythmically to music',
                'PARTY': 'A social gathering of invited guests',
                'DREAM': 'A series of thoughts, images, and sensations occurring in sleep',
                'MAGIC': 'The power of apparently influencing events by supernatural forces',
                'PEACE': 'Freedom from disturbance; tranquility'
            };

            const wordList = Object.keys(words);
            const selectedWord = wordList[Math.floor(Math.random() * wordList.length)];
            const hint = words[selectedWord];
            const hidden = selectedWord.replace(/[A-Z]/g, '_ ');

            // Store the word for checking
            if (!global.wordGameAnswers) global.wordGameAnswers = {};
            global.wordGameAnswers[msg.key.remoteJid] = selectedWord;

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎮 *Word Guessing Game*\n\nGuess this word: ${hidden}\n\n💡 Hint: ${hint}\n\nReply with !guess [your answer] to play!`
            });

        } catch (error) {
            logger.error('Error in wordgame:', error);
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

            const isCorrect = userGuess === correctWord;

            // Clear the stored word if correct
            if (isCorrect) {
                delete global.wordGameAnswers[msg.key.remoteJid];
            }

            // Send result message with appropriate GIF reaction
            await sock.sendMessage(msg.key.remoteJid, {
                text: isCorrect
                    ? `🎉 *Congratulations!*\nYou got it right!\nThe word was: ${correctWord}`
                    : `❌ Wrong guess! Try again!${userGuess.length !== correctWord.length ? `\n💡 Hint: The word has ${correctWord.length} letters` : ''}`
            });

        } catch (error) {
            logger.error('Error in guess command:', error);
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
                }
            ];

            const question = questions[Math.floor(Math.random() * questions.length)];
            const shuffledOptions = question.options.sort(() => Math.random() - 0.5);

            // Store both the answer and the selected options for checking
            if (!global.triviaAnswers) global.triviaAnswers = {};
            global.triviaAnswers[msg.key.remoteJid] = {
                answer: question.a,
                options: shuffledOptions
            };

            const questionText = `🤔 *Trivia Time!*\n\nQuestion: ${question.q}\n\nOptions:\n${
                shuffledOptions.map((opt, i) => `${i + 1}. ${opt}`).join('\n')
            }\n\nReply with !answer [number] to submit your answer!`;

            await sock.sendMessage(msg.key.remoteJid, {
                text: questionText
            });

        } catch (error) {
            logger.error('Error in trivia command:', error);
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

            const triviaData = global.triviaAnswers?.[msg.key.remoteJid];
            if (!triviaData) {
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

            // Check answer using the stored options
            const selectedOption = triviaData.options[userAnswer - 1];
            const isCorrect = selectedOption === triviaData.answer;

            // Clear the stored answer
            delete global.triviaAnswers[msg.key.remoteJid];

            // Send result message with appropriate GIF reaction
            await sock.sendMessage(msg.key.remoteJid, {
                text: isCorrect
                    ? `🎉 *Correct!*\nThe answer was "${triviaData.answer}"`
                    : `❌ *Wrong!*\nThe correct answer was "${triviaData.answer}"`
            });

        } catch (error) {
            logger.error('Error in answer command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Oops! Something went wrong while checking your answer!'
            });
        }
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
    slap: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* slapped ${target}! 👋`,
                mentions: mentions
            });

        } catch (error) {
            logger.error('Error in slap command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute slap command!'
            });
        }
    },
    hug: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* hugged ${target}! 🤗`,
                mentions: mentions
            });

        } catch (error) {
            logger.error('Error in hug command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute hug command!'
            });
        }
    },
    pat: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* patted ${target}! 🥰`,
                mentions: mentions
            });

        } catch (error) {
            logger.error('Error in pat command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute pat command!'
            });
        }
    },
    dance: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* is dancing! 💃`
            });

        } catch (error) {
            logger.error('Error in dance command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute dance command!'
            });
        }
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
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* eliminated ${target}! ☠️`,
                mentions: mentions
            });

        } catch (error) {
            logger.error('Error in kill command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute kill command!'
            });
        }
    },
    highfive: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* high-fived ${target}! 🙌`,
                mentions: mentions
            });

        } catch (error) {
            logger.error('Error in highfive command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute highfive command!'
            });
        }
    },
    facepalm: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* facepalmed! 🤦‍♂️`
            });

        } catch (error) {
            logger.error('Error in facepalm command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute facepalm command!'
            });
        }
    },
    poke: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* poked ${target}! 👉`,
                mentions: mentions
            });

        } catch (error) {
            logger.error('Error in poke command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute poke command!'
            });
        }
    },
    cuddle: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* cuddles ${target}! 🤗`,
                mentions: mentions
            });

        } catch (error) {
            logger.error('Error in cuddle command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute cuddle command!'
            });
        }
    },
    yeet: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* yeeted ${target}! 🚀`,
                mentions: mentions
            });

        } catch (error) {
            logger.error('Error in yeet command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute yeet command!'
            });
        }
    },
    boop: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* boops ${target}'s nose! 👉👃`,
                mentions: mentions
            });

        } catch (error) {
            logger.error('Error in boop command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute boop command!'
            });
        }
    },
    bonk: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* bonked ${target}! 🔨`,
                mentions: mentions
            });

        } catch (error) {
            logger.error('Error in bonk command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute bonk command!'
            });
        }
    },
    wave: async(sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* waves at ${target}! 👋`,
                mentions: mentions
            });

        } catch (error) {
            logger.error('Error in wave command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute wave command!'
            });
        }
    },
    kiss: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* kisses ${target}! 💋`,
                mentions: mentions
            });

        } catch (error) {
            logger.error('Error in kiss command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute kiss command!'
            });
        }
    },
    punch: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@swhatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* punches ${target}! 👊`,
                mentions: mentions
            });

        } catch (error) {
            logger.error('Error in punch command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute punch command!'
            });
        }
    },
    wink: async(sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'everyone';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* winks at ${target}! 😉`,
                mentions: mentions
            });

        } catch (error) {
            logger.error('Error in wink command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute wink command!'
            });
        }
    },
    wasted: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : msg.pushName;
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `💀 *WASTED*\n${target} has been wasted!`,
                mentions: mentions
            });

        } catch (error) {
            logger.error('Error in wasted command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to execute wasted command!'
            });
        }
    },
    rip: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : msg.pushName;
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `⚰️ *RIP*\nHere lies ${target}, they will be missed.`,
                mentions: mentions
            });

        } catch (error) {
            logger.error('Error in rip command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to execute rip command!'
                        });
        }
    },
    triggered: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : msg.pushName;
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `💢 *TRIGGERED*\n${target} is triggered!`,
                mentions: mentions
            });

        } catch (error) {
            logger.error('Error in triggered command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to execute triggered command!'
            });
        }
    },
    jail: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : msg.pushName;
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🏢 *JAIL*\n${target} is now behind bars!`,
                mentions: mentions
            });

        } catch (error) {
            logger.error('Error in jail command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to execute jail command!'
            });
        }
    },
    ponk: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            // Send message first
            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* playfully ponks ${target}!\n\n` +
                      `🏓 *PONK!*\n` +
                      `(　＾∀＾) ⟶ 🏓 ⟶ ${target}`,
                mentions: mentions
            });

        } catch (error) {
            logger.error('Error in ponk command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to execute ponk command: ' + error.message
            });
        }
    },
    trash: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* threw ${target} in the trash! 🗑️`,
                mentions: mentions
            });

        } catch (error) {
            logger.error('Error in trash command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute trash command!'
            });
        }
    },
    triggered: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : msg.pushName;
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `💢 *TRIGGERED*\n${target} is triggered!`,
                mentions: mentions
            });

        } catch (error) {
            logger.error('Error in triggered command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to execute triggered command!'
            });
        }
    },
    wanted: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : msg.pushName;
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🤠 *WANTED*\n${target} is now wanted! Dead or alive!`,
                mentions: mentions
            });

        } catch (error) {
            logger.error('Error in wanted command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to execute wanted command!'
            });
        }
    },
    cry: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* is crying! 😢`
            });

        } catch (error) {
            logger.error('Error in cry command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute cry command!'
            });
        }
    },
    bully: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* bullies ${target}! 😈`,
                mentions: mentions
            });

        } catch (error) {
            logger.error('Error in bully command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute bully command!'
            });
        }
    },
    awoo: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* goes awoo! 🐺`
            });

        } catch (error) {
            logger.error('Error in awoo command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute awoo command!'
            });
        }
    },
    lick: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* licks ${target}! 👅`,
                mentions: mentions
            });

        } catch (error) {
            logger.error('Error in lick command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute lick command!'
            });
        }
    },
    smug: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* looks smug! 😏`
            });

        } catch (error) {
            logger.error('Error in smug command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute smug command!'
            });
        }
    },
    bite: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* bites ${target}! 🦷`,
                mentions: mentions
            });

        } catch (error) {
            logger.error('Error in bite command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute bite command!'
            });
        }
    },
    nom: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* noms ${target}! 😋`,
                mentions: mentions
            });

        } catch (error) {
            logger.error('Error in nom command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute nom command!'
            });
        }
    },
    glomp: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* glomps ${target}! 🤗`,
                mentions: mentions
            });

        } catch (error) {
            logger.error('Error in glomp command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute glomp command!'
            });
        }
    },
    happy: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* is very happy! 😄`
            });

        } catch (error) {
            logger.error('Error in happy command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute happy command!'
            });
        }
    },
    cringe: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* cringes! 😬`
            });

        } catch (error) {
            logger.error('Error in cringe command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute cringe command!'
            });
        }
    },
    blush: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* blushes! 😊`
            });

        } catch (error) {
            logger.error('Error in blush command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to execute blush command!'
            });
        }
    },
    smile: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* smiles! 😊`
            });

        } catch (error) {
            logger.error('Error in smile command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to execute smile command!'
            });
        }
    },
    handhold: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* holds hands with ${target}! 🤝`,
                mentions: mentions
            });

        } catch (error) {
            logger.error('Error in handhold command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute handhold command!'
            });
        }
    },
    baka: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'everyone';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* calls ${target} baka! 🤪`,
                mentions: mentions
            });

        } catch (error) {
            logger.error('Error in baka command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute baka command!'
            });
        }
    },
    neko: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* shows a cute neko! 🐱`
            });

        } catch (error) {
            logger.error('Error in neko command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute neko command!'
            });
        }
    },
    rps: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: 'Please make your choice!\nUsage: .rps <rock/paper/scissors>'
                });
            }

            const choices = ['rock', 'paper', 'scissors'];
            const userChoice = args[0].toLowerCase();
            const botChoice = choices[Math.floor(Math.random() * choices.length)];

            if (!choices.includes(userChoice)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Invalid choice! Please choose rock, paper, or scissors'
                });
            }

            // Determine winner
            let result;
            if (userChoice === botChoice) {
                result = "It's a tie! 🤝";
            } else if (
                (userChoice === 'rock' && botChoice === 'scissors') ||
                (userChoice === 'paper' && botChoice === 'rock') ||
                (userChoice === 'scissors' && botChoice === 'paper')
            ) {
                result = "You win! 🎉";
            } else {
                result = "I win! 😎";
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎮 *Rock Paper Scissors*\n\nYou chose: ${userChoice}\nI chose: ${botChoice}\n\n${result}`
            });


        } catch (error) {
            logger.error('Error in rps command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error playing Rock Paper Scissors!'
            });
        }
    },

    roll: async (sock, msg, args) => {
        try {
            const max = args.length ? parseInt(args[0]) : 6;

            if (isNaN(max) || max < 1 || max > 100) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a valid number between 1 and 100!'
                });
            }

            const result = Math.floor(Math.random() * max) + 1;

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎲 *Dice Roll*\n\nYou rolled a ${result} (1-${max})!`
            });


        } catch (error) {
            logger.error('Error in roll command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error rolling the dice!'
            });
        }
    },

    couple: async (sock, msg) => {
        try {
            const groupMembers = await sock.groupMetadata(msg.key.remoteJid).participants;
            if (groupMembers.length < 2) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Need at least 2 members in the group!'
                });
            }

            // Select two random members
            const shuffled = groupMembers.sort(() => 0.5 - Math.random());
            const couple = shuffled.slice(0, 2);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `💕 *Today's Lucky Couple*\n\n@${couple[0].id.split('@')[0]} + @${couple[1].id.split('@')[0]} = ❤️`,
                mentions: couple.map(member => member.id)
            });

        } catch (error) {
            logger.error('Error in couple command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to find a couple!'
            });
        }
    },

    blush: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* is blushing! 😊`
            });

        } catch (error) {
            logger.error('Error in blush command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to execute blush command!'
            });
        }
    },

    happy: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* is very happy! 😄`
            });

        } catch (error) {
            logger.error('Error in happy command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to execute happy command!'
            });
        }
    },

    smile: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* is smiling! 😊`
            });

        } catch (error) {
            logger.error('Error in smile command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to execute smile command!'
            });
        }
    },

    smug: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* has a smug look! 😏`
            });

        } catch (error) {
            logger.error('Error in smug command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to execute smug command!'
            });
        }
    },

    cry: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* is crying! 😢`
            });

        } catch (error) {
            logger.error('Error in cry command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to execute cry command!'
            });
        }
    },

    dance: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* is dancing! 💃`
            });

        } catch (error) {
            logger.error('Error in dance command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to execute dance command!'
            });
        }
    },
    fact: async (sock, msg) => {
        try {
            const response = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
            const fact = response.data;

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🤓 *Random Fact*\n\n${fact.text}`
            });
            logger.info('Fact command executed successfully');
        } catch (error) {
            logger.error('Error in fact command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to fetch a fact!' });
        }
    },

    emojiart: async (sock, msg) => {
        try {
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
            logger.info('Emoji art command executed successfully');
        } catch (error) {
            logger.error('Error in emojiart command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to generate emoji art!' });
        }
    },
    meme: async (sock, msg) => {
        try {
            const response = await axios.get('https://meme-api.com/gimme');
            const meme = response.data;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: meme.url },
                caption: `😂 ${meme.title}`
            });
            logger.info('Meme command executed successfully');
        } catch (error) {
            logger.error('Error in meme command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to fetch a meme!' });
        }
    },
};

module.exports = funCommands;