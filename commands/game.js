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
        maxAttempts: type === 'hangman' ? 6 : 7,
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
    }
};

module.exports = gameCommands;