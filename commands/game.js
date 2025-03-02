const config = require('../config');
const logger = require('pino')();
const store = require('../database/store');

// Game state management
const activeGames = new Map();

// Helper function to create game state
const createGameState = (type, data) => {
    const state = {
        type,
        data,
        startTime: Date.now(),
        timeLimit: 60000, // Default 60 seconds
        attempts: 0,
        maxAttempts: type === 'hangman' ? 6 : type === 'wordgame' ? 5 : 7,
        solved: false
    };
    logger.info('Created new game state:', { type, timeLimit: state.timeLimit });
    return state;
};

// Rate limiting
const userCooldowns = new Map();
const COOLDOWN_PERIOD = 30000; // 30 seconds

const isOnCooldown = (userId) => {
    if (!userCooldowns.has(userId)) return false;
    const timeLeft = COOLDOWN_PERIOD - (Date.now() - userCooldowns.get(userId));
    return timeLeft > 0;
};

const setCooldown = (userId) => {
    userCooldowns.set(userId, Date.now());
    logger.debug(`Set cooldown for user: ${userId}`);
};

const gameCommands = {
    numguess: async (sock, msg, args) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;
            logger.info('Starting numguess game for user:', userId);

            // Check cooldown
            if (isOnCooldown(userId)) {
                const timeLeft = Math.ceil((COOLDOWN_PERIOD - (Date.now() - userCooldowns.get(userId))) / 1000);
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `⏳ Please wait ${timeLeft} seconds before starting a new game!`
                });
            }

            // Start new game
            if (!args.length) {
                const target = Math.floor(Math.random() * 100) + 1;
                const gameState = createGameState('numguess', { target });
                activeGames.set(userId, gameState);
                logger.info('Created new numguess game:', { userId, target });

                await sock.sendMessage(msg.key.remoteJid, {
                    text: '🎮 *Number Guessing Game*\n\n' +
                          'I\'m thinking of a number between 1 and 100.\n' +
                          `You have ${gameState.maxAttempts} attempts to guess it!\n\n` +
                          `Use ${config.prefix}numguess <number> to make a guess.`
                });
                return;
            }

            // Handle guess
            const gameState = activeGames.get(userId);
            if (!gameState || gameState.type !== 'numguess') {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Start a new game with ${config.prefix}numguess`
                });
            }

            const guess = parseInt(args[0]);
            if (isNaN(guess) || guess < 1 || guess > 100) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please guess a number between 1 and 100!'
                });
            }

            gameState.attempts++;
            logger.info('Processing guess:', { userId, guess, attempts: gameState.attempts });

            const target = gameState.data.target;
            if (guess === target) {
                activeGames.delete(userId);
                setCooldown(userId);

                // Update user stats
                await store.updateGameStats(userId, 'numguess', true);

                await sock.sendMessage(msg.key.remoteJid, {
                    text: `🎉 Congratulations! You guessed it in ${gameState.attempts} attempts!\n` +
                          `The number was ${target}`
                });
                return;
            }

            if (gameState.attempts >= gameState.maxAttempts) {
                activeGames.delete(userId);
                setCooldown(userId);

                // Update user stats
                await store.updateGameStats(userId, 'numguess', false);

                await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Game Over! The number was ${target}\n` +
                          `Try again with ${config.prefix}numguess`
                });
                return;
            }

            const hint = guess > target ? 'lower' : 'higher';
            await sock.sendMessage(msg.key.remoteJid, {
                text: `Try ${hint}! ${gameState.maxAttempts - gameState.attempts} attempts remaining.`
            });

        } catch (error) {
            logger.error('Error in numguess game:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error in number guessing game'
            });
        }
    },

    hangman: async (sock, msg, args) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;
            logger.info('Starting hangman game for user:', userId);

            // Check cooldown
            if (isOnCooldown(userId)) {
                const timeLeft = Math.ceil((COOLDOWN_PERIOD - (Date.now() - userCooldowns.get(userId))) / 1000);
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `⏳ Please wait ${timeLeft} seconds before starting a new game!`
                });
            }

            const words = [
                'JAVASCRIPT', 'PYTHON', 'PROGRAMMING',
                'COMPUTER', 'ALGORITHM', 'DATABASE',
                'NETWORK', 'SECURITY', 'INTERFACE',
                'DEVELOPER'
            ];

            // Start new game
            if (!args.length) {
                const word = words[Math.floor(Math.random() * words.length)];
                const gameState = createGameState('hangman', {
                    word,
                    guessed: new Set(),
                    revealed: Array(word.length).fill('_')
                });
                activeGames.set(userId, gameState);
                logger.info('Created new hangman game:', { userId, word });

                await sock.sendMessage(msg.key.remoteJid, {
                    text: '🎮 *Hangman Game*\n\n' +
                          `Word: ${gameState.data.revealed.join(' ')}\n` +
                          `Lives: ${'❤️'.repeat(gameState.maxAttempts)}\n\n` +
                          `Use ${config.prefix}hangman <letter> to guess a letter!`
                });
                return;
            }

            // Handle guess
            const gameState = activeGames.get(userId);
            if (!gameState || gameState.type !== 'hangman') {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Start a new game with ${config.prefix}hangman`
                });
            }

            const guess = args[0].toUpperCase();
            if (guess.length !== 1 || !/[A-Z]/.test(guess)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please guess a single letter!'
                });
            }

            if (gameState.data.guessed.has(guess)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ You already guessed that letter!'
                });
            }

            gameState.data.guessed.add(guess);
            const word = gameState.data.word;
            logger.info('Processing guess:', { userId, guess, word });

            if (!word.includes(guess)) {
                gameState.attempts++;
            } else {
                for (let i = 0; i < word.length; i++) {
                    if (word[i] === guess) {
                        gameState.data.revealed[i] = guess;
                    }
                }
            }

            const isComplete = !gameState.data.revealed.includes('_');
            if (isComplete) {
                activeGames.delete(userId);
                setCooldown(userId);

                // Update user stats
                await store.updateGameStats(userId, 'hangman', true);

                await sock.sendMessage(msg.key.remoteJid, {
                    text: `🎉 Congratulations! You won!\n` +
                          `The word was: ${word}\n` +
                          `Wrong guesses: ${gameState.attempts}`
                });
                return;
            }

            if (gameState.attempts >= gameState.maxAttempts) {
                activeGames.delete(userId);
                setCooldown(userId);

                // Update user stats
                await store.updateGameStats(userId, 'hangman', false);

                await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Game Over! The word was ${word}\n` +
                          `Try again with ${config.prefix}hangman`
                });
                return;
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `Word: ${gameState.data.revealed.join(' ')}\n` +
                      `Lives: ${'❤️'.repeat(gameState.maxAttempts - gameState.attempts)}\n` +
                      `Guessed: ${Array.from(gameState.data.guessed).join(', ')}`
            });

        } catch (error) {
            logger.error('Error in hangman game:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error in hangman game'
            });
        }
    },

    leaderboard: async (sock, msg) => {
        try {
            logger.info('Fetching game leaderboard');
            const stats = await store.getGameLeaderboard();

            if (!stats.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '📊 No game stats recorded yet!'
                });
            }

            let leaderboardText = '🏆 *Game Leaderboard*\n\n';
            for (let i = 0; i < Math.min(stats.length, 10); i++) {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '•';
                leaderboardText += `${medal} ${i + 1}. @${stats[i].userId.split('@')[0]}\n` +
                                 `   Wins: ${stats[i].wins} | Games: ${stats[i].totalGames}\n`;
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: leaderboardText,
                mentions: stats.slice(0, 10).map(s => s.userId)
            });

        } catch (error) {
            logger.error('Error in leaderboard command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error displaying leaderboard'
            });
        }
    },

    wordgame: async (sock, msg, args) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;

            if (isOnCooldown(userId)) {
                const timeLeft = Math.ceil((COOLDOWN_PERIOD - (Date.now() - userCooldowns.get(userId))) / 1000);
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `⏳ Please wait ${timeLeft} seconds before starting a new game!`
                });
            }

            const words = [
                'ELEPHANT', 'RAINBOW', 'BICYCLE', 'DIAMOND', 'WHISPER',
                'MYSTERY', 'JOURNEY', 'EXPLORE', 'CRYSTAL', 'BREEZE'
            ];

            const word = words[Math.floor(Math.random() * words.length)];
            const gameState = createGameState('wordgame', {
                word,
                hints: [],
                lettersRevealed: Array(word.length).fill('_')
            });

            activeGames.set(userId, gameState);

            await sock.sendMessage(msg.key.remoteJid, {
                text: '🎮 *Word Guessing Game*\n\n' +
                      `Word: ${gameState.data.lettersRevealed.join(' ')}\n` +
                      `Length: ${word.length} letters\n` +
                      `Attempts remaining: ${gameState.maxAttempts}\n\n` +
                      `Use ${config.prefix}guess <word> to make a guess!`
            });

        } catch (error) {
            logger.error('Error in wordgame command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error starting word game'
            });
        }
    },

    guess: async (sock, msg, args) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;
            const gameState = activeGames.get(userId);

            if (!gameState || gameState.type !== 'wordgame') {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Start a new game with ${config.prefix}wordgame`
                });
            }

            if (!args[0]) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a word to guess!'
                });
            }

            const guess = args[0].toUpperCase();
            gameState.attempts++;

            if (guess === gameState.data.word) {
                activeGames.delete(userId);
                setCooldown(userId);
                await store.updateGameStats(userId, 'wordgame', true);

                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `🎉 Congratulations! You guessed the word: ${gameState.data.word}`
                });
            }

            if (gameState.attempts >= gameState.maxAttempts) {
                activeGames.delete(userId);
                setCooldown(userId);
                await store.updateGameStats(userId, 'wordgame', false);

                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Game Over! The word was: ${gameState.data.word}`
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ Wrong guess! ${gameState.maxAttempts - gameState.attempts} attempts remaining.`
            });

        } catch (error) {
            logger.error('Error in guess command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error processing guess'
            });
        }
    },

    trivia: async (sock, msg) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;

            if (isOnCooldown(userId)) {
                const timeLeft = Math.ceil((COOLDOWN_PERIOD - (Date.now() - userCooldowns.get(userId))) / 1000);
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `⏳ Please wait ${timeLeft} seconds before starting a new game!`
                });
            }

            const questions = [
                {
                    q: 'What is the capital of France?',
                    options: ['London', 'Berlin', 'Paris', 'Madrid'],
                    answer: 2
                },
                {
                    q: 'Which planet is known as the Red Planet?',
                    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
                    answer: 1
                },
                // Add more questions here
            ];

            const question = questions[Math.floor(Math.random() * questions.length)];
            const gameState = createGameState('trivia', {
                question: question.q,
                options: question.options,
                answer: question.answer
            });

            activeGames.set(userId, gameState);

            let questionText = '❓ *Trivia Question*\n\n' + question.q + '\n\n';
            question.options.forEach((opt, i) => {
                questionText += `${i + 1}. ${opt}\n`;
            });
            questionText += `\nUse ${config.prefix}answer <number> to answer!`;

            await sock.sendMessage(msg.key.remoteJid, { text: questionText });

        } catch (error) {
            logger.error('Error in trivia command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error starting trivia'
            });
        }
    },

    answer: async (sock, msg, args) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;
            const gameState = activeGames.get(userId);

            if (!gameState || gameState.type !== 'trivia') {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Start a new game with ${config.prefix}trivia`
                });
            }

            if (!args[0]) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide an answer number!'
                });
            }

            const answer = parseInt(args[0]) - 1;
            if (answer === gameState.data.answer) {
                activeGames.delete(userId);
                setCooldown(userId);
                await store.updateGameStats(userId, 'trivia', true);

                await sock.sendMessage(msg.key.remoteJid, {
                    text: '🎉 Correct answer! Well done!'
                });
            } else {
                activeGames.delete(userId);
                setCooldown(userId);
                await store.updateGameStats(userId, 'trivia', false);

                await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Wrong answer! The correct answer was: ${gameState.data.options[gameState.data.answer]}`
                });
            }

        } catch (error) {
            logger.error('Error in answer command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error processing answer'
            });
        }
    },

    rps: async (sock, msg, args) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;

            if (!args[0]) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please choose rock, paper, or scissors!\nUsage: .rps <rock/paper/scissors>'
                });
            }

            const choices = ['rock', 'paper', 'scissors'];
            const playerChoice = args[0].toLowerCase();

            if (!choices.includes(playerChoice)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Invalid choice! Please choose rock, paper, or scissors.'
                });
            }

            const botChoice = choices[Math.floor(Math.random() * 3)];
            let result;

            if (playerChoice === botChoice) {
                result = "It's a tie!";
            } else if (
                (playerChoice === 'rock' && botChoice === 'scissors') ||
                (playerChoice === 'paper' && botChoice === 'rock') ||
                (playerChoice === 'scissors' && botChoice === 'paper')
            ) {
                result = 'You win!';
                await store.updateGameStats(userId, 'rps', true);
            } else {
                result = 'Bot wins!';
                await store.updateGameStats(userId, 'rps', false);
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎮 *Rock Paper Scissors*\n\n` +
                      `You chose: ${playerChoice}\n` +
                      `Bot chose: ${botChoice}\n\n` +
                      `Result: ${result}`
            });

        } catch (error) {
            logger.error('Error in rps command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error playing Rock Paper Scissors'
            });
        }
    },

    roll: async (sock, msg, args) => {
        try {
            const max = args[0] ? parseInt(args[0]) : 6;

            if (isNaN(max) || max < 1) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a valid number!'
                });
            }

            const result = Math.floor(Math.random() * max) + 1;
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎲 Rolling a ${max}-sided dice...\n\nResult: ${result}`
            });

        } catch (error) {
            logger.error('Error in roll command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error rolling dice'
            });
        }
    },

    coinflip: async (sock, msg) => {
        try {
            const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🪙 Flipping a coin...\n\nResult: ${result}`
            });

        } catch (error) {
            logger.error('Error in coinflip command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error flipping coin'
            });
        }
    },

    would: async (sock, msg) => {
        try {
            const questions = [
                'Would you rather be able to fly or be invisible?',
                'Would you rather have unlimited money or unlimited knowledge?',
                'Would you rather live in the past or the future?',
                'Would you rather be a famous musician or a famous actor?',
                'Would you rather have the ability to speak all languages or play all instruments?'
            ];

            const question = questions[Math.floor(Math.random() * questions.length)];
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🤔 *Would You Rather*\n\n${question}`
            });

        } catch (error) {
            logger.error('Error in would command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error generating would you rather question'
            });
        }
    },

    never: async (sock, msg) => {
        try {
            const statements = [
                'Never have I ever traveled outside my country',
                'Never have I ever broken a bone',
                'Never have I ever gone skydiving',
                'Never have I ever eaten sushi',
                'Never have I ever learned to play a musical instrument'
            ];

            const statement = statements[Math.floor(Math.random() * statements.length)];
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎮 *Never Have I Ever*\n\n${statement}`
            });

        } catch (error) {
            logger.error('Error in never command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error generating never have I ever statement'
            });
        }
    },

    riddle: async (sock, msg) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;

            if (isOnCooldown(userId)) {
                const timeLeft = Math.ceil((COOLDOWN_PERIOD - (Date.now() - userCooldowns.get(userId))) / 1000);
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `⏳ Please wait ${timeLeft} seconds before starting a new riddle!`
                });
            }

            const riddles = [
                {
                    q: 'What has keys, but no locks; space, but no room; and you can enter, but not go in?',
                    a: 'A keyboard'
                },
                {
                    q: 'What gets wetter and wetter the more it dries?',
                    a: 'A towel'
                },
                {
                    q: 'I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?',
                    a: 'An echo'
                }
            ];

            const riddle = riddles[Math.floor(Math.random() * riddles.length)];
            const gameState = createGameState('riddle', riddle);
            activeGames.set(userId, gameState);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🧩 *Riddle*\n\n${riddle.q}\n\nUse ${config.prefix}answer <your answer> to solve!`
            });

        } catch (error) {
            logger.error('Error in riddle command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error generating riddle'
            });
        }
    }
};

module.exports = gameCommands;