const config = require('../config');
const logger = require('pino')();
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { sendGifReaction } = require('../utils/mediaHandler');

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
                         `• ${config.prefix}emojiart - Get random emoji art\n\n` +
                         `*Reactions:*\n` +
                         `Check ${config.prefix}reactions for animated reactions!`;

            await sock.sendMessage(msg.key.remoteJid, { text: menuText });
            logger.info('Fun menu command executed successfully');
        } catch (error) {
            logger.error('Error in fun menu command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to show fun menu' });
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
                text: `📜 *Quote of the Moment*\n\n"${quote.content}"\n\n- ${quote.author}`
            });
            logger.info('Quote command executed successfully');
        } catch (error) {
            logger.error('Error in quote command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to fetch a quote!' });
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
    ship: async (sock, msg, args) => {
        try {
            if (args.length < 2) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please mention two people to ship!\nUsage: .ship @user1 @user2'
                });
            }

            const percentage = Math.floor(Math.random() * 101);
            let message = `💖 *Love Calculator* 💖\n\n`;
            message += `${args[0]} + ${args[1]}\n`;
            message += `${percentage}% Compatible\n\n`;

            if (percentage > 80) {
                message += 'Perfect match! 💑';
            } else if (percentage > 60) {
                message += 'Great potential! 💕';
            } else if (percentage > 40) {
                message += 'There\'s a chance! 💫';
            } else {
                message += 'Maybe just friends... 🤝';
            }

            await sock.sendMessage(msg.key.remoteJid, { text: message });
        } catch (error) {
            logger.error('Error in ship command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to calculate love percentage!' });
        }
    },

    roast: async (sock, msg, args) => {
        try {
            const roasts = [
                "I'd agree with you but then we'd both be wrong.",
                "You're about as useful as a screen door on a submarine.",
                "I'm not saying I'm Wonder Woman, I'm just saying no one has ever seen me and Wonder Woman in the same room.",
                "You have empty head syndrome.",
                "I bet your brain feels as good as new, seeing that you never use it.",
                "I'd tell you to go outside and play, but that would be child endangerment."
            ];

            const roast = roasts[Math.floor(Math.random() * roasts.length)];
            await sock.sendMessage(msg.key.remoteJid, { text: `🔥 ${roast}` });
        } catch (error) {
            logger.error('Error in roast command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to generate roast!' });
        }
    },

    compliment: async (sock, msg) => {
        try {
            const compliments = [
                "You're amazing just the way you are! ✨",
                "Your smile lights up the room! 😊",
                "You're making a difference in the world! 🌟",
                "You have such a beautiful soul! 💖",
                "You inspire others to be better! 🌈",
                "Your kindness makes the world better! 🎉"
            ];

            const compliment = compliments[Math.floor(Math.random() * compliments.length)];
            await sock.sendMessage(msg.key.remoteJid, { text: compliment });
        } catch (error) {
            logger.error('Error in compliment command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to generate compliment!' });
        }
    },

    pickup: async (sock, msg) => {
        try {
            const lines = [
                "Are you a magician? Because whenever I look at you, everyone else disappears! ✨",
                "Do you have a map? I keep getting lost in your eyes! 🗺️",
                "Are you a camera? Because every time I look at you, I smile! 📸",
                "Is your name Google? Because you have everything I've been searching for! 🔍",
                "Are you a parking ticket? Because you've got FINE written all over you! 🎫",
                "Do you like science? Because we've got chemistry! 🧪"
            ];

            const line = lines[Math.floor(Math.random() * lines.length)];
            await sock.sendMessage(msg.key.remoteJid, { text: line });
        } catch (error) {
            logger.error('Error in pickup command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to generate pickup line!' });
        }
    },

    riddle: async (sock, msg) => {
        try {
            const riddles = [
                {
                    q: "What has keys, but no locks; space, but no room; and you can enter, but not go in?",
                    a: "A keyboard"
                },
                {
                    q: "What gets wetter and wetter the more it dries?",
                    a: "A towel"
                },
                {
                    q: "What has a head and a tail that will never meet?",
                    a: "A coin"
                },
                {
                    q: "What has teeth but cannot bite?",
                    a: "A comb"
                }
            ];

            const riddle = riddles[Math.floor(Math.random() * riddles.length)];
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🤔 *Riddle*\n\n${riddle.q}\n\n_Send .answer to see the answer_`
            });

            // Store riddle answer for later
            if (!global.riddleAnswers) global.riddleAnswers = {};
            global.riddleAnswers[msg.key.remoteJid] = riddle.a;
        } catch (error) {
            logger.error('Error in riddle command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to generate riddle!' });
        }
    },

    answer: async (sock, msg) => {
        try {
            if (!global.riddleAnswers?.[msg.key.remoteJid]) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No active riddle! Use .riddle to get a riddle first!'
                });
            }

            const answer = global.riddleAnswers[msg.key.remoteJid];
            delete global.riddleAnswers[msg.key.remoteJid];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎯 The answer is: ${answer}`
            });
        } catch (error) {
            logger.error('Error in answer command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to show answer!' });
        }
    },

    fact: async (sock, msg) => {
        try {
            const facts = [
                "A day on Venus is longer than its year! 🌟",
                "Honey never spoils! 🍯",
                "The shortest war in history lasted 38 minutes! ⚔️",
                "A single cloud can weigh more than 1 million pounds! ☁️",
                "Octopuses have three hearts! 🐙",
                "The first oranges weren't orange! 🍊"
            ];

            const fact = facts[Math.floor(Math.random() * facts.length)];
            await sock.sendMessage(msg.key.remoteJid, { text: `📚 *Fun Fact*\n\n${fact}` });
        } catch (error) {
            logger.error('Error in fact command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to get fact!' });
        }
    },

    would: async (sock, msg) => {
        try {
            const questions = [
                "Would you rather be able to fly or be invisible? 🦅/👻",
                "Would you rather live in the ocean or on Mars? 🌊/🔴",
                "Would you rather be a superhero or a supervillain? 🦸‍♂️/🦹‍♂️",
                "Would you rather have unlimited money or unlimited knowledge? 💰/📚",
                "Would you rather be able to talk to animals or speak all human languages? 🐾/🗣️",
                "Would you rather live without music or without movies? 🎵/🎬"
            ];

            const question = questions[Math.floor(Math.random() * questions.length)];
            await sock.sendMessage(msg.key.remoteJid, { text: `🤔 *Would You Rather*\n\n${question}` });
        } catch (error) {
            logger.error('Error in would command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to generate question!' });
        }
    },

    never: async (sock, msg) => {
        try {
            const statements = [
                "Never have I ever gone skydiving! 🪂",
                "Never have I ever eaten a whole pizza by myself! 🍕",
                "Never have I ever sent a text to the wrong person! 📱",
                "Never have I ever pretended to laugh at a joke I didn't get! 😅",
                "Never have I ever stayed awake for 24 hours straight! ⏰",
                "Never have I ever forgotten my own birthday! 🎂"
            ];

            const statement = statements[Math.floor(Math.random() * statements.length)];
            await sock.sendMessage(msg.key.remoteJid, { text: `🎮 *Never Have I Ever*\n\n${statement}` });
        } catch (error) {
            logger.error('Error in never command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to generate statement!' });
        }
    },

    darkjoke: async (sock, msg) => {
        try {
            const jokes = [
                "Why don't blind people skydive? It scares their dogs!",
                "What's red and bad for your teeth? A brick.",
                "What did the lawyer say to the other lawyer? We're both lawyers!",
                "What's the difference between a good joke and a bad joke timing.",
                "Why can't orphans play baseball? They don't know where home is.",
                "What did the grape say when it got stepped on? Nothing, it just let out a little wine."
            ];

            const joke = jokes[Math.floor(Math.random() * jokes.length)];
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎭 *Dark Humor*\n\n${joke}\n\n⚠️ Note: Just for fun, no offense intended!`
            });
        } catch (error) {
            logger.error('Error in darkjoke command:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to generate joke!' });
        }
    }
};

module.exports = funCommands;