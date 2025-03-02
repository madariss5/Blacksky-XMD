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
        const validTypes = ['family100', 'quiz', 'asahotak', 'tebakkata', 'tebaklagu', 'tebakkimia', 'picture', 'numguess', 'hangman'];
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
        maxAttempts: 3,
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

// Game-specific data storage
const truthQuestions = [
    "What's your biggest fear?",
    "What's the most embarrassing thing that's happened to you?",
    "What's your biggest secret?",
    "What's your worst lie you've ever told?",
    "What's your biggest regret?",
];

const dareActions = [
    "Send a funny selfie",
    "Do 10 push-ups",
    "Sing a song",
    "Tell a joke",
    "Dance for 30 seconds",
];

const familyQuestions = [
    {
        question: "Name something people do when they're bored",
        answers: ["Sleep", "Watch TV", "Play games", "Eat", "Browse phone", "Read", "Exercise"],
        points: [30, 25, 20, 15, 10, 5, 5]
    },
];

const quizQuestions = [
    {
        question: "What is the capital of Japan?",
        answers: ["Tokyo"],
        category: "General"
    },
    {
        question: "Which element has the symbol 'Fe'?",
        answers: ["Iron"],
        category: "Chemistry"
    },
];

const asahOtakQuestions = [
    {
        question: "Apa yang hilang ketika diucapkan?",
        answers: ["Diam", "Keheningan", "Sunyi"],
        hint: "Kebalikan dari ribut"
    },
    {
        question: "Apa yang bertambah jika dibagi?",
        answers: ["Lubang"],
        hint: "Bisa dibuat dengan sekop"
    }
];

const wordQuestions = [
    {
        word: "Photosynthesis",
        hint: "Process used by plants to make food"
    },
    {
        word: "Algorithm",
        hint: "Step-by-step procedure to solve a problem"
    }
];

const imageQuizzes = [
    {
        image: "flag_japan.jpg",
        answer: "Japan",
        category: "Flags"
    },
    {
        image: "borobudur.jpg",
        answer: "Borobudur",
        category: "Landmarks"
    }
];

const gameCommands = {
    // Main game command implementations
    rpg: async (sock, msg) => {
        try {
            if (!msg.key.participant) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: 'Could not identify user. Please try again.'
                });
            }

            const userData = await store.getUserData(msg.key.participant);
            if (!userData) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `You need to register first! Use ${config.prefix}register <name> <age> to create your profile.`
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎮 *RPG Status*\n\n` +
                      `📊 *Player Info*\n` +
                      `• Name: ${userData.name || 'Anonymous'}\n` +
                      `• Level: ${userData.level || 1}\n` +
                      `• XP: ${userData.xp || 0}/${Math.pow((userData.level || 1) + 1, 2) * 100}\n\n` +
                      `💪 *Stats*\n` +
                      `• HP: ${userData.hp || 100}/100\n` +
                      `• MP: ${userData.mp || 100}/100\n` +
                      `• Gold: ${userData.gold || 0} 💰\n\n` +
                      `💎 *Inventory*\n` +
                      `${Object.entries(userData.inventory || {}).map(([item, count]) => `• ${item}: ${count}`).join('\n') || '• Empty'}\n\n` +
                      `Use ${config.prefix}quest to start an adventure!`
            });

            logger.info('RPG status displayed for user:', msg.key.participant);
        } catch (error) {
            logger.error('Error in rpg command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error accessing RPG status. Please try again.'
            });
        }
    },

    battle: async (sock, msg, args) => {
        try {
            if (!msg.key.participant) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: 'Could not identify user. Please try again.'
                });
            }

            if (!args[0]) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please mention a user to battle!\nUsage: ${config.prefix}battle @user`
                });
            }

            const challenger = msg.key.participant;
            const opponent = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';

            if (challenger === opponent) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ You cannot battle yourself!'
                });
            }

            // Get challenger and opponent data
            const challengerData = await store.getUserData(challenger);
            const opponentData = await store.getUserData(opponent);

            if (!challengerData || !opponentData) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: 'Both players need to be registered to battle!'
                });
            }

            // Battle mechanics with level consideration
            const challengerPower = Math.floor(Math.random() * 100) + (challengerData.level || 1) * 10;
            const opponentPower = Math.floor(Math.random() * 100) + (opponentData.level || 1) * 10;

            const winner = challengerPower > opponentPower ? challenger : opponent;
            const loser = winner === challenger ? opponent : challenger;
            const reward = Math.floor(Math.random() * 100) + 100; // Random reward between 100-200 gold

            // Update winner's gold and XP
            const winnerData = winner === challenger ? challengerData : opponentData;
            await store.updateUserGold(winner, (winnerData.gold || 0) + reward);
            await store.addXP(winner, 50); // Add XP for winning

            // Add some XP to loser for participating
            await store.addXP(loser, 20);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `⚔️ *Battle Results*\n\n` +
                      `${challengerData.name || 'Challenger'} vs ${opponentData.name || 'Opponent'}\n\n` +
                      `🏆 Winner: @${winner.split('@')[0]}\n` +
                      `💰 Reward: ${reward} gold\n` +
                      `✨ XP Gained: Winner +50, Loser +20\n\n` +
                      `Battle Stats:\n` +
                      `🎲 ${challengerData.name}: ${challengerPower}\n` +
                      `🎲 ${opponentData.name}: ${opponentPower}`,
                mentions: [winner, loser]
            });

            logger.info('Battle completed:', { winner, reward });
        } catch (error) {
            logger.error('Error in battle command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: 'Error during battle. Please try again.'
            });
        }
    },

    quest: async (sock, msg) => {
        try {
            if (!msg.key.participant) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: 'Could not identify user. Please try again.'
                });
            }

            const userData = await store.getUserData(msg.key.participant);
            if (!userData) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `You need to register first! Use ${config.prefix}register <name> <age> to create your profile.`
                });
            }

            // Check if user already has an active quest
            if (global.activeQuests?.has(msg.key.participant)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `You already have an active quest! Use ${config.prefix}complete to finish it first.`
                });
            }

            const quests = [
                { name: 'Defeat the Dragon', reward: { gold: 150, xp: 100 } },
                { name: 'Find the Lost Treasure', reward: { gold: 200, xp: 80 } },
                { name: 'Save the Village', reward: { gold: 120, xp: 90 } },
                { name: 'Clear the Dungeon', reward: { gold: 180, xp: 110 } },
                { name: 'Hunt Monsters', reward: { gold: 100, xp: 70 } }
            ];

            const randomQuest = quests[Math.floor(Math.random() * quests.length)];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🗺️ *New Quest*\n\n` +
                      `Quest: ${randomQuest.name}\n` +
                      `Rewards:\n` +
                      `• Gold: ${randomQuest.reward.gold} 💰\n` +
                      `• XP: ${randomQuest.reward.xp} ✨\n\n` +
                      `Type ${config.prefix}complete to finish the quest!`
            });

            // Store active quest
            if (!global.activeQuests) global.activeQuests = new Map();
            global.activeQuests.set(msg.key.participant, {
                quest: randomQuest.name,
                reward: randomQuest.reward,
                timestamp: Date.now()
            });

            logger.info('New quest started:', { user: msg.key.participant, quest: randomQuest });
        } catch (error) {
            logger.error('Error in quest command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: 'Error starting quest. Please try again.'
            });
        }
    },

    complete: async (sock, msg) => {
        try {
            if (!msg.key.participant) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: 'Could not identify user. Please try again.'
                });
            }

            if (!global.activeQuests?.has(msg.key.participant)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `You don't have an active quest! Use ${config.prefix}quest to start one.`
                });
            }

            const quest = global.activeQuests.get(msg.key.participant);
            const timeElapsed = Date.now() - quest.timestamp;

            // Minimum 1 minute between starting and completing quest
            if (timeElapsed < 60000) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ You need to wait at least 1 minute to complete the quest!'
                });
            }

            // Update user's gold and XP
            const userData = await store.getUserData(msg.key.participant);
            const currentGold = userData?.gold || 0;

            await store.updateUserGold(msg.key.participant, currentGold + quest.reward.gold);
            const xpResult = await store.addXP(msg.key.participant, quest.reward.xp);

            let completionMessage = `🎉 *Quest Completed*\n\n` +
                                  `Quest: ${quest.quest}\n` +
                                  `Rewards:\n` +
                                  `• Gold: +${quest.reward.gold} 💰\n` +
                                  `• XP: +${quest.reward.xp} ✨\n\n` +
                                  `Current Gold: ${currentGold + quest.reward.gold}`;

            if (xpResult.levelUp) {
                completionMessage += `\n\n🎊 *LEVEL UP!*\n` +
                                   `You've reached level ${xpResult.newLevel}!`;
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: completionMessage
            });

            // Clear completed quest
            global.activeQuests.delete(msg.key.participant);
            logger.info('Quest completed:', { 
                user: msg.key.participant, 
                quest: quest.quest, 
                rewards: quest.reward 
            });

        } catch (error) {
            logger.error('Error in complete command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: 'Error completing quest. Please try again.'
            });
        }
    },
    level: async (sock, msg) => {
        try {
            if (!msg.key.participant) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: 'Could not identify user. Please try again.'
                });
            }

            const userData = await store.getUserData(msg.key.participant);
            if (!userData) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `You need to register first! Use ${config.prefix}register <name> <age> to create your profile.`
                });
            }

            // Calculate XP needed for next level
            const nextLevelXP = Math.pow((userData.level || 1) + 1, 2) * 100;
            const progress = ((userData.xp || 0) / nextLevelXP) * 100;

            // Create progress bar
            const progressBar = '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));

            await sock.sendMessage(msg.key.remoteJid, {
                text: `📊 *Level Status*\n\n` +
                      `👤 *${userData.name || 'Player'}*\n` +
                      `📈 Level: ${userData.level || 1}\n` +
                      `✨ XP: ${userData.xp || 0}/${nextLevelXP}\n` +
                      `⭐ Progress: ${Math.floor(progress)}%\n` +
                      `[${progressBar}]\n\n` +
                      `💡 Earn XP by:\n` +
                      `• Completing quests\n` +
                      `• Winning battles\n` +
                      `• Daily activities`
            });

            logger.info('Level status displayed for user:', msg.key.participant);
        } catch (error) {
            logger.error('Error in level command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error accessing level status. Please try again.'
            });
        }
    },

    leveling: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎮 *Leveling System Guide*\n\n` +
                      `📊 *How Leveling Works*\n` +
                      `• Each level requires: Level² × 100 XP\n` +
                      `• Example: Level 2 needs 400 XP\n\n` +
                      `🎯 *XP Sources*\n` +
                      `• Quests: 70-110 XP\n` +
                      `• Battles: 20-50 XP\n` +
                      `• Daily Tasks: 100 XP\n\n` +
                      `💫 *Level Benefits*\n` +
                      `• Higher battle power\n` +
                      `• Better quest rewards\n` +
                      `• Special titles\n\n` +
                      `Use ${config.prefix}level to check your progress!`
            });

            logger.info('Leveling guide displayed');
        } catch (error) {
            logger.error('Error displaying leveling guide:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing leveling guide. Please try again.'
            });
        }
    },

    levelup: async (sock, msg) => {
        try {
            if (!msg.key.participant) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: 'Could not identify user. Please try again.'
                });
            }

            const userData = await store.getUserData(msg.key.participant);
            if (!userData) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `You need to register first! Use ${config.prefix}register <name> <age> to create your profile.`
                });
            }

            // Get the top 10 players by level
            const users = store.data.users || {};
            const topPlayers = Object.entries(users)
                .map(([id, data]) => ({
                    name: data.name || id.split('@')[0],
                    level: data.level || 1,
                    xp: data.xp || 0
                }))
                .sort((a, b) => b.level - a.level || b.xp - a.xp)
                .slice(0, 10);

            let leaderboard = `🏆 *Top 10 Players*\n\n`;
            topPlayers.forEach((player, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤';
                leaderboard += `${medal} ${index + 1}. ${player.name}\n` +
                             `   Level ${player.level} • ${player.xp} XP\n`;
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: leaderboard
            });

            logger.info('Levelup leaderboard displayed');
        } catch (error) {
            logger.error('Error displaying levelup leaderboard:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing leaderboard. Please try again.'
            });
        }
    },
    tictactoe: async (sock, msg, args) => {
        try {
            if (!args[0]) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please mention a player to play with!\nUsage: !tictactoe @player'
                });
            }

            const challenger = msg.key.participant || msg.key.remoteJid;
            const opponent = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';

            if (challenger === opponent) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ You cannot play against yourself!'
                });
            }

            logger.info('Starting TicTacToe game:', {
                challenger,
                opponent,
                chatId: msg.key.remoteJid
            });

            const gameId = msg.key.remoteJid;
            if (activeGames.has(gameId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ A game is already in progress in this chat!'
                });
            }

            const game = {
                board: createTicTacToeBoard(),
                players: [challenger, opponent],
                currentPlayer: 0,
                started: false
            };
            activeGames.set(gameId, game);

            const challengerName = challenger.split('@')[0];
            const opponentName = opponent.split('@')[0];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎮 *TicTacToe Challenge*\n\n` +
                      `@${challengerName} has challenged @${opponentName}!\n\n` +
                      `Type !accept to start the game or !reject to decline.`,
                mentions: game.players
            });

            logger.info('TicTacToe game created:', { 
                gameId,
                challenger: challengerName,
                opponent: opponentName
            });

        } catch (error) {
            logger.error('Error in tictactoe command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error starting game: ' + error.message
            });
        }
    },

    accept: async (sock, msg) => {
        try {
            const gameId = msg.key.remoteJid;
            const game = activeGames.get(gameId);
            const player = msg.key.participant || msg.key.remoteJid;

            if (!game || game.started) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No pending game invitation!'
                });
            }

            if (player !== game.players[1]) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ This invitation is not for you!'
                });
            }

            game.started = true;
            const boardText = game.board.map(row => row.join('')).join('\n');

            const player1Name = game.players[0].split('@')[0];
            const player2Name = game.players[1].split('@')[0];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎮 *TicTacToe Game Started*\n\n` +
                      `@${player1Name}: ❌\n` +
                      `@${player2Name}: ⭕\n\n` +
                      `${boardText}\n\n` +
                      `@${player1Name}'s turn!\n` +
                      `Use !place <1-9> to place your mark.`,
                mentions: game.players
            });

            logger.info('TicTacToe game started:', { 
                gameId,
                player1: player1Name,
                player2: player2Name
            });

        } catch (error) {
            logger.error('Error in accept command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error accepting game: ' + error.message
            });
        }
    },

    reject: async (sock, msg) => {
        try {
            const gameId = msg.key.remoteJid;
            const game = activeGames.get(gameId);

            if (!game || game.started) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No pending game invitation!'
                });
            }

            if (msg.key.participant !== game.players[1]) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ This invitation is not for you!'
                });
            }

            activeGames.delete(gameId);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎮 Game invitation rejected by @${game.players[1].split('@')[0]}`,
                mentions: [game.players[1]]
            });

            logger.info('TicTacToe game rejected:', { gameId });
        } catch (error) {
            logger.error('Error in reject command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error rejecting game: ' + error.message
            });
        }
    },

    place: async (sock, msg, args) => {
        try {
            const gameId = msg.key.remoteJid;
            const game = activeGames.get(gameId);

            if (!game || !game.started) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No active game in this chat!'
                });
            }

            if (msg.key.participant !== game.players[game.currentPlayer]) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ It\'s not your turn!'
                });
            }

            const position = parseInt(args[0]);
            if (isNaN(position) || position < 1 || position > 9) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please enter a number between 1 and 9!'
                });
            }

            const row = Math.floor((position - 1) / 3);
            const col = (position - 1) % 3;

            if (game.board[row][col] !== '⬜') {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ That position is already taken!'
                });
            }

            game.board[row][col] = game.currentPlayer === 0 ? '❌' : '⭕';
            const winner = checkWinner(game.board);
            const boardText = game.board.map(row => row.join('')).join('\n');

            if (winner) {
                let resultText;
                if (winner === 'draw') {
                    resultText = `🎮 *Game Over - Draw!*\n\n${boardText}`;
                } else {
                    const winnerIndex = winner === '❌' ? 0 : 1;
                    resultText = `🎮 *Game Over - Winner!*\n\n` +
                                `@${game.players[winnerIndex].split('@')[0]} wins! 🏆\n\n${boardText}`;
                }

                await sock.sendMessage(msg.key.remoteJid, {
                    text: resultText,
                    mentions: game.players
                });

                activeGames.delete(gameId);
                logger.info('TicTacToe game ended:', { gameId, winner });
            } else {
                game.currentPlayer = 1 - game.currentPlayer;
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `🎮 *TicTacToe*\n\n${boardText}\n\n` +
                          `@${game.players[game.currentPlayer].split('@')[0]}'s turn!`,
                    mentions: [game.players[game.currentPlayer]]
                });
            }
        } catch (error) {
            logger.error('Error in place command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error placing mark: ' + error.message
            });
        }
    },

    suit: async (sock, msg, args) => {
        try {
            if (!args[0]) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please mention a player to play with!\nUsage: !suit @player'
                });
            }

            const challenger = msg.key.participant || msg.key.remoteJid;
            const opponent = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';

            if (challenger === opponent) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ You cannot play against yourself!'
                });
            }

            const gameId = msg.key.remoteJid;
            if (activeGames.has(gameId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ A game is already in progress in this chat!'
                });
            }

            logger.info('Starting Suit game:', {
                challenger,
                opponent,
                chatId: msg.key.remoteJid
            });

            const game = {
                type: 'suit',
                players: [challenger, opponent],
                choices: {},
                started: false
            };
            activeGames.set(gameId, game);

            const challengerName = challenger.split('@')[0];
            const opponentName = opponent.split('@')[0];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `👊 *Rock Paper Scissors Challenge*\n\n` +
                      `@${challengerName} has challenged @${opponentName}!\n\n` +
                      `Type !accept to start the game or !reject to decline.`,
                mentions: game.players
            });

            logger.info('Suit game created:', { 
                gameId, 
                challenger: challengerName, 
                opponent: opponentName 
            });

        } catch (error) {
            logger.error('Error in suit command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error starting game: ' + error.message
            });
        }
    },

    choose: async (sock, msg, args) => {
        try {
            const gameId = msg.key.remoteJid;
            const game = activeGames.get(gameId);
            const player = msg.key.participant || msg.key.remoteJid;

            if (!game || !game.started || game.type !== 'suit') {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No active Rock Paper Scissors game in this chat!'
                });
            }

            if (!game.players.includes(player)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ You are not part of this game!'
                });
            }

            const choice = args[0]?.toLowerCase();
            if (!['rock', 'paper', 'scissors'].includes(choice)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please choose rock, paper, or scissors!'
                });
            }

            // Store player's choice
            game.choices[player] = choice;
            logger.info('Player made choice:', { 
                gameId, 
                player: player.split('@')[0], 
                choice 
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ @${player.split('@')[0]} has made their choice!`,
                mentions: [player]
            });

            // Check if both players have made their choices
            if (Object.keys(game.choices).length === 2) {
                const choices = game.players.map(p => ({
                    player: p,
                    choice: game.choices[p]
                }));

                // Determine winner
                let result;
                if (choices[0].choice === choices[1].choice) {
                    result = 'draw';
                } else if (
                    (choices[0].choice === 'rock' && choices[1].choice === 'scissors') ||
                    (choices[0].choice === 'paper' && choices[1].choice === 'rock') ||
                    (choices[0].choice === 'scissors' && choices[1].choice === 'paper')
                ) {
                    result = 'player1';
                } else {
                    result = 'player2';
                }

                // Send result message
                let resultText = `🎮 *Game Results*\n\n` +
                               `@${choices[0].player.split('@')[0]}: ${choices[0].choice}\n` +
                               `@${choices[1].player.split('@')[0]}: ${choices[1].choice}\n\n`;

                if (result === 'draw') {
                    resultText += `It's a draw! 🤝`;
                } else {
                    const winner = result === 'player1' ? choices[0].player : choices[1].player;
                    resultText += `@${winner.split('@')[0]} wins! 🏆`;
                }

                await sock.sendMessage(msg.key.remoteJid, {
                    text: resultText,
                    mentions: game.players
                });

                                // Clean up game state
                activeGames.delete(gameId);
                logger.info('Suit game ended:', { 
                    gameId, 
                    result,
                    choices: game.choices
                });
            }

        } catch (error) {
            logger.error('Error in choose command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error making choice: ' + error.message
            });
        }
    },
    chess: async (sock, msg, args) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '🏗️ Chess game feature is under construction!\n\n' +
                      'We are working on implementing a full chess game with:\n' +
                      '• Board visualization\n' +
                      '• Move validation\n' +
                      '• Game state tracking\n' +
                      '• Rating system\n\n' +
                      'Please try other games in the meantime!'
            });

        } catch (error) {
            logger.error('Error in chess command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error starting chess game'
            });
        }
    },

    family100: async (sock, msg) => {
        try {
            const game = await modifyGameStart(sock, msg, 'family100', () => {
                const randomQuestion = familyQuestions[Math.floor(Math.random() * familyQuestions.length)];
                return {
                    type: 'family100',
                    question: randomQuestion.question,
                    answers: randomQuestion.answers,
                    points: randomQuestion.points,
                    foundAnswers: new Set(),
                    startTime: Date.now(),
                    timeLimit: 60000,
                    solved: false
                };
            });

            if (game) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `👨‍👩‍👧‍👦 *Family 100*\n\n${game.question}\n\n⏳ You have 60 seconds to find all answers!`
                });
            }
        } catch (error) {
            logger.error('Error in family100 command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error starting Family 100 game'
            });
        }
    },

    answer: async (sock, msg, args) => {
        try {
            const gameId = msg.key.remoteJid;
            const game = activeGames.get(gameId);
            const userId = msg.key.participant || msg.key.remoteJid;

            logger.info(`Processing answer for game in chat: ${gameId}, user: ${userId}`);

            if (!game) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No active game in this chat!'
                });
            }

            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide an answer!'
                });
            }

            const userAnswer = args.join(' ').toLowerCase();
            logGameState(gameId, 'ANSWER_ATTEMPT', game);

            switch (game.type) {
                case 'family100':
                    const matchedAnswer = game.answers.find(ans => 
                        ans.toLowerCase() === userAnswer && !game.foundAnswers.has(ans)
                    );

                    if (matchedAnswer) {
                        game.foundAnswers.add(matchedAnswer);
                        const points = game.points[game.answers.indexOf(matchedAnswer)];

                        await sock.sendMessage(msg.key.remoteJid, {
                            text: `✅ Correct! "${matchedAnswer}" (+${points} points)\n\n` +
                                  `Found: ${game.foundAnswers.size}/${game.answers.length}`
                        });

                        if (game.foundAnswers.size === game.answers.length) {
                            game.solved = true;
                            await sock.sendMessage(msg.key.remoteJid, {
                                text: '🎉 Congratulations! All answers found!'
                            });
                            cleanupGame(gameId);
                            logGameState(gameId, 'COMPLETE', game);
                        }
                    }
                    break;

                case 'quiz':
                case 'asahotak':
                case 'tebakkata':
                    if (userAnswer === game.answer?.toLowerCase()) {
                        game.solved = true;
                        await handleGameWin(sock, msg, game, game.answer);
                        cleanupGame(gameId);
                        logGameState(gameId, 'WIN', game);
                    } else {
                        await handleWrongAnswer(sock, msg, game);
                    }
                    break;

                default:
                    logger.warn(`Unknown game type: ${game.type}`);
                    await sock.sendMessage(msg.key.remoteJid, {
                        text: '❌ Unknown game type'
                    });
                    cleanupGame(gameId);
            }

        } catch (error) {
            logger.error('Error in answer command:', {
                error: error.message,
                gameId,
                gameType: game?.type,
                attempts: game?.attempts
            });
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error processing answer. The game has been reset.'
            });
            cleanupGame(msg.key.remoteJid);
        }
    },
    numguess: async (sock, msg, args) => {
        try {
            const gameId = msg.key.remoteJid;

            // Start new game if none exists
            if (!args.length) {
                if (activeGames.has(gameId)) {
                    return await sock.sendMessage(msg.key.remoteJid, {
                        text: '❌ A game is already in progress! Use .guess [number] to play'
                    });
                }

                const number = Math.floor(Math.random() * 100) + 1;
                const game = {
                    type: 'numguess',
                    answer: number,
                    attempts: 0,
                    maxAttempts: 7,
                    startTime: Date.now(),
                    timeLimit: 120000 // 2 minutes
                };

                activeGames.set(gameId, game);
                logGameState(gameId, 'started', game);

                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `🎮 *Number Guessing Game*\n\n` +
                          `I'm thinking of a number between 1 and 100.\n` +
                          `You have ${game.maxAttempts} attempts to guess it!\n\n` +
                          `Use .numguess [number] to make a guess.`
                });
            }

            // Handle guess
            const game = activeGames.get(gameId);
            if (!game || game.type !== 'numguess') {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No active number guessing game! Use .numguess to start'
                });
            }

            // Check time limit
            if (Date.now() - game.startTime > game.timeLimit) {
                activeGames.delete(gameId);
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏰ Time\'s up! The number was ' + game.answer
                });
            }

            const guess = parseInt(args[0]);
            if (isNaN(guess) || guess < 1 || guess > 100) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please guess a number between 1 and 100!'
                });
            }

            game.attempts++;

            if (guess === game.answer) {
                activeGames.delete(gameId);
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `🎉 *Correct!*\n\nYou got it in ${game.attempts} attempts!`
                });
            }

            if (game.attempts >= game.maxAttempts) {
                activeGames.delete(gameId);
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `💔 *Game Over!*\n\nThe number was ${game.answer}`
                });
            }

            const hint = guess < game.answer ? 'higher' : 'lower';
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ Wrong! Try a ${hint} number.\n${game.maxAttempts - game.attempts} attempts remaining.`
            });

        } catch (error) {
            logger.error('Error in numguess command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error in number guessing game: ' + error.message
            });
        }
    },

    hangman: async (sock, msg, args) => {
        try {
            const gameId = msg.key.remoteJid;

            // List of words for the game
            const words = [
                { word: 'PROGRAMMING', hint: 'Writing code' },
                { word: 'JAVASCRIPT', hint: 'Popular web programming language' },
                { word: 'DATABASE', hint: 'Stores information' },
                { word: 'ALGORITHM', hint: 'Step by step problem solving' },
                { word: 'NETWORK', hint: 'Computers connected together' }
            ];

            // Start new game
            if (!args.length) {
                if (activeGames.has(gameId)) {
                    const game = activeGames.get(gameId);
                    return await sock.sendMessage(msg.key.remoteJid, {
                        text: `🎮 *Current Hangman Game*\n\n` +
                              `Word: ${game.display.join(' ')}\n` +
                              `Hint: ${game.hint}\n` +
                              `Wrong guesses: ${game.wrongGuesses.join(', ') || 'None'}\n` +
                              `Lives: ${'❤️'.repeat(game.lives)}\n\n` +
                              `Use .hangman [letter] to guess!`
                    });
                }

                const wordObj = words[Math.floor(Math.random() * words.length)];
                const game = {
                    type: 'hangman',
                    word: wordObj.word,
                    hint: wordObj.hint,
                    guessed: new Set(),
                    wrongGuesses: [],
                    lives: 6,
                    display: Array(wordObj.word.length).fill('_'),
                    startTime: Date.now(),
                    timeLimit: 300000 // 5 minutes
                };

                activeGames.set(gameId, game);
                logGameState(gameId, 'started', game);

                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `🎮 *Hangman Game*\n\n` +
                          `Word: ${game.display.join(' ')}\n` +
                          `Hint: ${game.hint}\n` +
                          `Lives: ${'❤️'.repeat(game.lives)}\n\n` +
                          `Use .hangman [letter] to guess!`
                });
            }

            // Handle guess
            const game = activeGames.get(gameId);
            if (!game || game.type !== 'hangman') {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No active hangman game! Use .hangman to start'
                });
            }

            // Check time limit
            if (Date.now() - game.startTime > game.timeLimit) {
                activeGames.delete(gameId);
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `⏰ Time's up! The word was "${game.word}"`
                });
            }

            const guess = args[0].toUpperCase();
            if (guess.length !== 1 || !/[A-Z]/.test(guess)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please guess a single letter!'
                });
            }

            if (game.guessed.has(guess)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ You already guessed that letter!'
                });
            }

            game.guessed.add(guess);

            if (game.word.includes(guess)) {
                // Correct guess
                for (let i = 0; i < game.word.length; i++) {
                    if (game.word[i] === guess) {
                        game.display[i] = guess;
                    }
                }
            } else {
                // Wrong guess
                game.wrongGuesses.push(guess);
                game.lives--;
            }

            // Check win/lose conditions
            if (!game.display.includes('_')) {
                activeGames.delete(gameId);
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `🎉 *You won!*\n\nThe word was "${game.word}"`
                });
            }

            if (game.lives <= 0) {
                activeGames.delete(gameId);
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `💔 *Game Over!*\n\nThe word was "${game.word}"`
                });
            }

            // Game continues
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎮 *Hangman*\n\n` +
                      `Word: ${game.display.join(' ')}\n` +
                      `Wrong guesses: ${game.wrongGuesses.join(', ') || 'None'}\n` +
                      `Lives: ${'❤️'.repeat(game.lives)}\n\n` +
                      `Keep guessing!`
            });

        } catch (error) {
            logger.error('Error in hangman command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error in hangman game: ' + error.message
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
                            case 'family100':
                                const foundAnswers = Array.from(currentGame.foundAnswers).join(', ') || 'None';
                                const missedAnswers = currentGame.answers.filter(a => !currentGame.foundAnswers.has(a));
                                timeoutMessage += `Found answers: ${foundAnswers}\nMissed answers: ${missedAnswers.join(', ')}`;
                                break;
                            case 'tebaklagu':
                                timeoutMessage += `The song was: ${currentGame.data.title}\nArtist: ${currentGame.data.artist}`;
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
                case 'picture':
                    gameOverText += `The correct answer was: ${game.data.answer}`;
                    break;
                case 'caklontong':
                    gameOverText += `The correct answer was: ${game.data.answer}\nExplanation: ${game.data.explanation}`;
                    break;
                case 'tebaklagu':
                    gameOverText += `The song was: ${game.data.title}\nArtist: ${game.data.artist}`;
                    break;
                case 'asahotak':
                    gameOverText += `Possible answers were: ${game.answers.join(', ')}`;
                    break;
                case 'tebakkata':
                    gameOverText += `The word was: ${game.word}`;
                    break;
                case 'quiz':
                    gameOverText += `The correct answer was: ${game.answer}`;
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

//Helper function for tictactoe.  Add this after imageQuizzes
const createTicTacToeBoard = () => {
    const board = [];
    for (let i = 0; i < 3; i++) {
        board.push(['⬜', '⬜', '⬜']);
    }
    return board;
};
const checkWinner = (board) => {
    // Check rows
    for (let i = 0; i < 3; i++) {
        if (board[i][0] !== '⬜' && board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
            return board[i][0];
        }
    }

    // Check columns
    for (let i = 0; i < 3; i++) {
        if (board[0][i] !== '⬜' && board[0][i] === board[1][i] && board[1][i] === board[2][i]) {
            return board[0][i];
        }
    }

    // Check diagonals
    if (board[0][0] !== '⬜' && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
        return board[0][0];
    }
    if (board[0][2] !== '⬜' && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
        return board[0][2];
    }

    // Check for draw
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[i][j] === '⬜') {
                return null;
            }
        }
    }

    return 'draw';
};