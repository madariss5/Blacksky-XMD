const config = require('../config');
const store = require('../database/store');
const logger = require('pino')();
const fs = require('fs-extra');
const path = require('path');

// Add debug logging to monitor game state
const logGameState = (gameId, action, game) => {
    logger.info(`Game State [${action}] for ${gameId}:`, {
        type: game?.type,
        timeLeft: game ? (game.timeLimit - (Date.now() - game.startTime)) : null,
        attempts: game?.attempts,
        solved: game?.solved
    });
};

// Add this at the start of the file, after the initial requires
const validateGameState = (gameId, game) => {
    try {
        const validTypes = ['numguess', 'hangman'];
        if (!validTypes.includes(game.type)) {
            logger.warn(`Invalid game type: ${game.type} for game ${gameId}`);
            return false;
        }
        if (!game.startTime || !game.timeLimit) {
            logger.warn(`Missing time properties for game ${gameId}`);
            return false;
        }
        return true;
    } catch (error) {
        logger.error('Error validating game state:', error);
        return false;
    }
};

// Game state management
const activeGames = new Map();
const gameScores = new Map();

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
    logger.info(`Created new game state:`, { type, timeLimit: state.timeLimit });
    return state;
};

// Rate limiting for games
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
            if (!msg.key.participant) return;

            // Check cooldown
            if (isOnCooldown(msg.key.participant)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ Please wait before starting a new game!'
                });
            }

            // Start new game
            if (!args.length) {
                const target = Math.floor(Math.random() * 100) + 1;
                const gameState = createGameState('numguess', { target });
                activeGames.set(msg.key.participant, gameState);

                await sock.sendMessage(msg.key.remoteJid, {
                    text: '🎮 *Number Guessing Game*\n\n' +
                          'I\'m thinking of a number between 1 and 100.\n' +
                          `You have ${gameState.maxAttempts} attempts to guess it!\n\n` +
                          `Use ${config.prefix}numguess <number> to make a guess.`
                });
                return;
            }

            // Handle guess
            const gameState = activeGames.get(msg.key.participant);
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
            const target = gameState.data.target;

            if (guess === target) {
                activeGames.delete(msg.key.participant);
                setCooldown(msg.key.participant);
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `🎉 Congratulations! You guessed it in ${gameState.attempts} attempts!\n` +
                          `The number was ${target}`
                });
                return;
            }

            if (gameState.attempts >= gameState.maxAttempts) {
                activeGames.delete(msg.key.participant);
                setCooldown(msg.key.participant);
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
            logger.error('Number guess game error:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error in number guessing game'
            });
        }
    },

    hangman: async (sock, msg, args) => {
        try {
            if (!msg.key.participant) return;

            // Check cooldown
            if (isOnCooldown(msg.key.participant)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ Please wait before starting a new game!'
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
                activeGames.set(msg.key.participant, gameState);

                await sock.sendMessage(msg.key.remoteJid, {
                    text: '🎮 *Hangman Game*\n\n' +
                          `Word: ${gameState.data.revealed.join(' ')}\n` +
                          `Lives: ${'❤️'.repeat(gameState.maxAttempts)}\n\n` +
                          `Use ${config.prefix}hangman <letter> to guess a letter!`
                });
                return;
            }

            // Handle guess
            const gameState = activeGames.get(msg.key.participant);
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
                activeGames.delete(msg.key.participant);
                setCooldown(msg.key.participant);
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `🎉 Congratulations! You won!\n` +
                          `The word was: ${word}\n` +
                          `Wrong guesses: ${gameState.attempts}`
                });
                return;
            }

            if (gameState.attempts >= gameState.maxAttempts) {
                activeGames.delete(msg.key.participant);
                setCooldown(msg.key.participant);
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
            logger.error('Hangman game error:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error in hangman game'
            });
        }
    }
};

// Helper functions
const updateScore = (userId, points) => {
    try {
        const currentScore = gameScores.get(userId) || { points: 0, wins: 0 };
        gameScores.set(userId, {
            points: currentScore.points + points,
            wins: currentScore.wins + 1
        });
        logger.info(`Updated score for user ${userId}:`, { points, totalPoints: currentScore.points + points });
    } catch (error) {
        logger.error('Error updating score:', error);
        throw error;
    }
};

const cleanupGame = (gameId) => {
    try {
        if (activeGames.has(gameId)) {
            const game = activeGames.get(gameId);
            logGameState(gameId, 'CLEANUP', game);
            activeGames.delete(gameId);
        }
    } catch (error) {
        logger.error('Error in cleanupGame:', error);
    }
};

const verifyGameAssets = async (game) => {
    try {
        switch (game.type) {
            case 'tebaklagu':
                const audioPath = path.join(__dirname, '..', 'assets', 'audio', game.data.audio);
                return await fs.pathExists(audioPath);
            case 'tebakgambar':
                const imagePath = path.join(__dirname, '..', 'assets', 'quiz', game.data.image);
                return await fs.pathExists(imagePath);
            default:
                return true;
        }
    } catch (error) {
        logger.error('Error verifying game assets:', error);
        return false;
    }
};

const setupGameTimeout = (gameId, game, sock) => {
    try {
        setTimeout(async () => {
            try {
                if (activeGames.has(gameId)) {
                    const currentGame = activeGames.get(gameId);
                    if (!currentGame.solved) {
                        let timeoutMessage = '⌛ Time\'s up!\n\n';

                        switch (currentGame.type) {
                            case 'numguess':
                                timeoutMessage += `The number was: ${currentGame.data.target}`;
                                break;
                            case 'hangman':
                                timeoutMessage += `The word was: ${currentGame.data.word}`;
                                break;
                            default:
                                timeoutMessage += `The correct answer was: ${currentGame.data?.answer || currentGame.answer}`;
                        }

                        await sock.sendMessage(gameId, { text: timeoutMessage });
                        cleanupGame(gameId);
                    }
                }
            } catch (error) {
                logger.error('Error in game timeout handler:', error);
                cleanupGame(gameId);
            }
        }, game.timeLimit);
    } catch (error) {
        logger.error('Error setting up game timeout:', error);
        throw error;
    }
};

const handleGameWin = async (sock, msg, game, answer) => {
    try {
        const userId = msg.key.participant || msg.key.remoteJid;
        const points = Math.max(10, Math.floor((game.timeLimit - (Date.now() - game.startTime)) / 1000));

        updateScore(userId, points);
        logGameState(msg.key.remoteJid, 'WIN_HANDLED', game);

        await sock.sendMessage(msg.key.remoteJid, {
            text: `🎉 Correct!\n\n` +
                  `🎯 Answer: ${answer}\n` +
                  `✨ Points: +${points}\n\n` +
                  `Use ${config.prefix}leaderboard to see rankings!`
        });

        cleanupGame(msg.key.remoteJid);
    } catch (error) {
        logger.error('Error in handleGameWin:', error);
        cleanupGame(msg.key.remoteJid);
        throw error;
    }
};

const handleWrongAnswer = async (sock, msg, game) => {
    try {
        game.attempts++;
        if (game.attempts >= game.maxAttempts) {
            let gameOverText = `❌ Game Over!\n`;

            switch (game.type) {
                case 'numguess':
                    gameOverText += `The number was: ${game.data.target}`;
                    break;
                case 'hangman':
                    gameOverText += `The word was: ${game.data.word}`;
                    break;
                default:
                    gameOverText += `The correct answer was: ${game.answer || game.data?.answer || 'Not available'}`;
            }

            await sock.sendMessage(msg.key.remoteJid, { text: gameOverText });
            cleanupGame(msg.key.remoteJid);
            logGameState(msg.key.remoteJid, 'GAME_OVER', game);
        } else {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ Wrong answer!\n${game.maxAttempts - game.attempts} attempts left`
            });
            logGameState(msg.key.remoteJid, 'WRONG_ANSWER', game);
        }
    } catch (error) {
        logger.error('Error in handleWrongAnswer:', error);
        throw error;
    }
};

const modifyGameStart = async (sock, msg, gameType, createGameFn) => {
    try {
        const gameId = msg.key.remoteJid;
        const userId = msg.key.participant || msg.key.remoteJid;

        logger.info(`Starting ${gameType} game for chat: ${gameId}, user: ${userId}`);

        if (activeGames.has(gameId)) {
            return await sock.sendMessage(gameId, {
                text: '❌ A game is already in progress in this chat!'
            });
        }

        if (isOnCooldown(userId)) {
            return await sock.sendMessage(gameId, {
                text: '⏳ Please wait before starting another game!'
            });
        }

        const game = createGameFn();
        if (!validateGameState(gameId, game)) {
            return await sock.sendMessage(gameId, {
                text: '❌ Error creating game. Please try again.'
            });
        }

        activeGames.set(gameId, game);
        logGameState(gameId, 'START', game);
        setupGameTimeout(gameId, game, sock);
        setCooldown(userId);

        return game;
    } catch (error) {
        logger.error(`Error starting ${gameType} game:`, error);
        cleanupGame(msg.key.remoteJid);
        throw error;
    }
};

const additionalCommands = {
    leaderboard: async (sock, msg) => {
        try {
            logger.info('Displaying leaderboard');
            const scores = Array.from(gameScores.entries())
                .map(([userId, data]) => ({
                    userId,
                    points: data.points,
                    wins: data.wins
                }))
                .sort((a, b) => b.points - a.points)
                .slice(0, 10); // Top 10

            if (!scores.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '📊 No game scores recorded yet!'
                });
            }

            let leaderboardText = '🏆 *Game Leaderboard*\n\n';
            for (let i = 0; i < scores.length; i++) {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '•';
                leaderboardText += `${medal} ${i + 1}. @${scores[i].userId.split('@')[0]}\n` +
                                 `   Points: ${scores[i].points} | Wins: ${scores[i].wins}\n`;
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: leaderboardText,
                mentions: scores.map(s => s.userId)
            });

        } catch (error) {
            logger.error('Error in leaderboard command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error displaying leaderboard'
            });
        }
    }
};

Object.assign(gameCommands, additionalCommands);

module.exports = gameCommands;