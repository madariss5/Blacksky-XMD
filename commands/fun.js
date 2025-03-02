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
                text: `📜 *Quote of the moment*\n\n"${quote.content}"\n\n- ${quote.author}`
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
    }
};

module.exports = funCommands;