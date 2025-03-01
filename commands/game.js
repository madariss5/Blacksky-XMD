const config = require('../config');
const store = require('../database/store');
const logger = require('pino')();

// Game state management
const activeGames = new Map();

// Rate limiting for games
const userCooldowns = new Map();
const COOLDOWN_PERIOD = 30000; // 30 seconds

const isOnCooldown = (userId) => {
    if (!userCooldowns.has(userId)) return false;
    const lastUsage = userCooldowns.get(userId);
    return Date.now() - lastUsage < COOLDOWN_PERIOD;
};

const setCooldown = (userId) => {
    userCooldowns.set(userId, Date.now());
};

// Game-specific data storage
const truthQuestions = [
    "What's your biggest fear?",
    "What's the most embarrassing thing that's happened to you?",
    "What's your biggest secret?",
    "What's the worst lie you've ever told?",
    "What's your biggest regret?",
    // Add more truth questions
];

const dareActions = [
    "Send a funny selfie",
    "Do 10 push-ups",
    "Sing a song",
    "Tell a joke",
    "Dance for 30 seconds",
    // Add more dare actions
];

const familyQuestions = [
    {
        question: "Name something people do when they're bored",
        answers: ["Sleep", "Watch TV", "Play games", "Eat", "Browse phone", "Read", "Exercise"],
        points: [30, 25, 20, 15, 10, 5, 5]
    },
    // Add more family quiz questions
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
    // Add more quiz questions
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
            if (!args[0]) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please mention a player to play with!\nUsage: !chess @player'
                });
            }

            const challenger = msg.key.participant || msg.key.remoteJid;
            const opponent = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';

            if (challenger === opponent) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ You cannot play against yourself!'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '🏗️ Chess game feature is under construction!\n\n' +
                      'We are working on implementing a full chess game with:\n' +
                      '• Board visualization\n' +
                      '• Move validation\n' +
                      '• Game state tracking\n' +
                      '• Rating system\n\n' +
                      'Please try other games in the meantime!'
            });

        } catch ((error) {
            logger.error('Error in chess command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error starting chess game'
            });
        }
    },

    family100: async (sock, msg) => {
        try {
            const gameId = msg.key.remoteJid;

            if (activeGames.has(gameId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ A game is already in progress in this chat!'
                });
            }

            const randomQuestion = familyQuestions[Math.floor(Math.random() * familyQuestions.length)];
            const game = {
                question: randomQuestion.question,
                answers: randomQuestion.answers,
                points: randomQuestion.points,
                foundAnswers: new Set(),
                startTime: Date.now(),
                timeLimit: 60000 // 60 seconds
            };

            activeGames.set(gameId, game);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `👨‍👩‍👧‍👦 *Family 100*\n\n${game.question}\n\n⏳ You have 60 seconds to guess! Type your answers.`
            });

            // Set timeout to end game
            setTimeout(async () => {
                if (activeGames.has(gameId)) {
                    const game = activeGames.get(gameId);
                    const remainingAnswers = game.answers.filter(answer => !game.foundAnswers.has(answer));

                    await sock.sendMessage(msg.key.remoteJid, {
                        text: `⌛ Time's up!\n\nFound answers: ${Array.from(game.foundAnswers).join(', ')}\n\nMissed answers: ${remainingAnswers.join(', ')}`
                    });

                    activeGames.delete(gameId);
                }
            }, game.timeLimit);

            logger.info('Family100 game started in chat:', gameId);

        } catch (error) {
            logger.error('Error in family100 command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error starting Family 100 game'
            });
        }
    },

    truth: async (sock, msg) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;

            if (isOnCooldown(userId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ Please wait before starting another game!'
                });
            }

            const randomQuestion = truthQuestions[Math.floor(Math.random() * truthQuestions.length)];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🤔 *Truth Question*\n\n${randomQuestion}\n\n@${userId.split('@')[0]}, answer honestly!`,
                mentions: [userId]
            });

            setCooldown(userId);
            logger.info('Truth command executed for user:', userId);

        } catch (error) {
            logger.error('Error in truth command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error starting truth game'
            });
        }
    },

    dare: async (sock, msg) => {
        try {
            const userId = msg.key.participant || msg.key.remoteJid;

            if (isOnCooldown(userId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ Please wait before starting another game!'
                });
            }

            const randomDare = dareActions[Math.floor(Math.random() * dareActions.length)];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `😈 *Dare Challenge*\n\n${randomDare}\n\n@${userId.split('@')[0]}, you must complete this dare!`,
                mentions: [userId]
            });

            setCooldown(userId);
            logger.info('Dare command executed for user:', userId);

        } catch (error) {
            logger.error('Error in dare command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error starting dare game'
            });
        }
    },

    werewolf: async (sock, msg) => {
        await sock.sendMessage(msg.key.remoteJid, {
            text: '🚧 Werewolf game is under development!'
        });
    },
    asahotak: async (sock, msg) => {
        try {
            const gameId = msg.key.remoteJid;
            if (activeGames.has(gameId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ A game is already in progress in this chat!'
                });
            }

            const randomQuiz = asahOtakQuestions[Math.floor(Math.random() * asahOtakQuestions.length)];

            const game = {
                question: randomQuiz.question,
                answers: randomQuiz.answers,
                hint: randomQuiz.hint,
                attempts: 0,
                maxAttempts: 3,
                startTime: Date.now(),
                timeLimit: 60000 // 60 seconds
            };

            activeGames.set(gameId, game);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🧩 *Asah Otak*\n\n${game.question}\n\n💡 Hint: ${game.hint}\n\n⏳ You have 60 seconds and 3 attempts!`
            });

            // Set timeout to end game
            setTimeout(async () => {
                if (activeGames.has(gameId)) {
                    const game = activeGames.get(gameId);
                    if (!game.solved) {
                        await sock.sendMessage(msg.key.remoteJid, {
                            text: `⌛ Time's up!\n\nPossible answers were: ${game.answers.join(', ')}`
                        });
                        activeGames.delete(gameId);
                    }
                }
            }, game.timeLimit);

        } catch (error) {
            logger.error('Error in asahotak command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error starting Asah Otak quiz'
            });
        }
    },

    siapakahaku: async (sock, msg) => {
        await sock.sendMessage(msg.key.remoteJid, {
            text: '🚧 Siapakah Aku game is under development!'
        });
    },

    susunkata: async (sock, msg) => {
        await sock.sendMessage(msg.key.remoteJid, {
            text: '🚧 Susun Kata game is under development!'
        });
    },

    tebakkata: async (sock, msg) => {
        try {
            const gameId = msg.key.remoteJid;
            if (activeGames.has(gameId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ A game is already in progress in this chat!'
                });
            }

            const randomWord = wordQuestions[Math.floor(Math.random() * wordQuestions.length)];

            const game = {
                word: randomWord.word.toLowerCase(),
                hint: randomWord.hint,
                guessedLetters: new Set(),
                attempts: 0,
                maxAttempts: 6,
                startTime: Date.now(),
                timeLimit: 120000 // 120 seconds
            };

            activeGames.set(gameId, game);

            const displayWord = game.word
                .split('')
                .map(letter => letter === ' ' ? ' ' : '_')
                .join(' ');

            await sock.sendMessage(msg.key.remoteJid, {
                text: `📝 *Word Guessing Game*\n\n${displayWord}\n\n💡 Hint: ${game.hint}\n\n⏳ You have 120 seconds and 6 attempts!`
            });

            // Set timeout to end game
            setTimeout(async () => {
                if (activeGames.has(gameId)) {
                    const game = activeGames.get(gameId);
                    if (!game.solved) {
                        await sock.sendMessage(msg.key.remoteJid, {
                            text: `⌛ Time's up!\n\nThe word was: ${game.word}`
                        });
                        activeGames.delete(gameId);
                    }
                }
            }, game.timeLimit);

        } catch (error) {
            logger.error('Error in tebakkata command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error starting word guessing game'
            });
        }
    },

    tebakgambar: async (sock, msg) => {
        await sock.sendMessage(msg.key.remoteJid, {
            text: '🚧 Tebak Gambar game is under development!'
        });
    },

    tebaklirik: async (sock, msg) => {
        try {
            const gameId = msg.key.remoteJid;
            if (activeGames.has(gameId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ A game is already in progress in this chat!'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '🎵 *Lyrics Quiz*\n\n' +
                      'Complete the missing lyrics:\n\n' +
                      '[Coming Soon]\n' +
                      'We are preparing a comprehensive lyrics database.\n' +
                      'This feature will be available in the next update!'
            });

        } catch (error) {
            logger.error('Error in tebaklirik command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error starting lyrics quiz'
            });
        }
    },

    tebaklagu: async (sock, msg) => {
        await sock.sendMessage(msg.key.remoteJid, {
                        text: '🚧 Tebak Lagu game is under development!'
        });
    },

    tebakkimia: async (sock, msg) => {
        try {
            const gameId = msg.key.remoteJid;
            if (activeGames.has(gameId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ A game is already in progress in this chat!'
                });
            }

            const elements = [
                { symbol: 'Na', name: 'Sodium' },
                { symbol: 'K', name: 'Potassium' },
                { symbol: 'Fe', name: 'Iron' },
                { symbol: 'Au', name: 'Gold' },
                { symbol: 'Ag', name: 'Silver' },
                { symbol: 'Cu', name: 'Copper' },
                { symbol: 'Pb', name: 'Lead' },
                { symbol: 'Hg', name: 'Mercury' }
            ];

            const randomElement = elements[Math.floor(Math.random() * elements.length)];

            const game = {
                symbol: randomElement.symbol,
                answer: randomElement.name.toLowerCase(),
                attempts: 0,
                maxAttempts: 3,
                startTime: Date.now(),
                timeLimit: 60000 // 60 seconds
            };

            activeGames.set(gameId, game);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `⚗️ *Chemistry Quiz*\n\n` +
                      `What is the name of the element with symbol "${game.symbol}"?\n\n` +
                      `⏳ You have 60 seconds and 3 attempts to answer!`
            });

            // Set timeout to end game
            setTimeout(async () => {
                if (activeGames.has(gameId)) {
                    const game = activeGames.get(gameId);
                    if (!game.solved) {
                        await sock.sendMessage(msg.key.remoteJid, {
                            text: `⌛ Time's up!\n\nThe correct answer was: ${game.answer}`
                        });
                        activeGames.delete(gameId);
                    }
                }
            }, game.timeLimit);

        } catch (error) {
            logger.error('Error in tebakkimia command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error starting chemistry quiz'
            });
        }
    },

    tebakbendera: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '🎯 *Flag Quiz*\n\n' +
                      'Coming Soon!\n\n' +
                      'Features will include:\n' +
                      '• Country flags from all continents\n' +
                      '• Multiple difficulty levels\n' +
                      '• Score tracking\n' +
                      '• Regional flags option\n\n' +
                      'Stay tuned for the next update!'
            });
        } catch (error) {
            logger.error('Error in tebakbendera command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing flag quiz info'
            });
        }
    },

    tebakkabupaten: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '🗺️ *Region Quiz*\n\n' +
                      'Coming Soon!\n\n' +
                      'Features will include:\n' +
                      '• Indonesian regions and districts\n' +
                      '• Regional characteristics\n' +
                      '• Cultural facts\n' +
                      '• Geographic information\n\n' +
                      'Stay tuned for the next update!'
            });
        } catch (error) {
            logger.error('Error in tebakkabupaten command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing region quiz info'
            });
        }
    },

    caklontong: async (sock, msg) => {
        await sock.sendMessage(msg.key.remoteJid, {
            text: '🚧 Cak Lontong quiz game is under development!'
        });
    },
    quiz: async (sock, msg) => {
        try {
            const randomQuiz = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];

            const gameId = msg.key.remoteJid;
            if (activeGames.has(gameId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ A game is already in progress in this chat!'
                });
            }

            const game = {
                question: randomQuiz.question,
                answer: randomQuiz.answers[0],
                attempts: 0,
                maxAttempts: 3,
                startTime: Date.now(),
                timeLimit: 60000 // 60 seconds
            };

            activeGames.set(gameId, game);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎯 *Quiz Time*\n\n${game.question}\n\n⏳ You have 60 seconds and 3 attempts to answer!`
            });

            // Set timeout to end game
            setTimeout(async () => {
                if (activeGames.has(gameId)) {
                    const game = activeGames.get(gameId);
                    if (!game.solved) {
                        await sock.sendMessage(msg.key.remoteJid, {
                            text: `⌛ Time's up!\n\nThe correct answer was: ${game.answer}`
                        });
                        activeGames.delete(gameId);
                    }
                }
            }, game.timeLimit);

        } catch (error) {
            logger.error('Error in quiz command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error starting quiz'
            });
        }
    },

    answer: async (sock, msg, args) => {
        try {
            const gameId = msg.key.remoteJid;
            const game = activeGames.get(gameId);

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

            const answer = args.join(' ').toLowerCase();

            // Handle different game types
            if (game.word) { // Word guessing game
                if (answer === game.word) {
                    await sock.sendMessage(msg.key.remoteJid, {
                        text: `🎉 Correct! The word was "${game.word}"`
                    });
                    game.solved = true;
                    activeGames.delete(gameId);
                } else {
                    game.attempts++;
                    if (game.attempts >= game.maxAttempts) {
                        await sock.sendMessage(msg.key.remoteJid, {
                            text: `❌ Game Over! The word was "${game.word}"`
                        });
                        activeGames.delete(gameId);
                    } else {
                        await sock.sendMessage(msg.key.remoteJid, {
                            text: `❌ Wrong answer! ${game.maxAttempts - game.attempts} attempts left`
                        });
                    }
                }
            } else if (game.answers) { // Quiz or Asah Otak
                if (game.answers.includes(answer)) {
                    await sock.sendMessage(msg.key.remoteJid, {
                        text: '🎉 Correct answer!'
                    });
                    game.solved = true;
                    activeGames.delete(gameId);
                } else {
                    game.attempts++;
                    if (game.attempts >= game.maxAttempts) {
                        await sock.sendMessage(msg.key.remoteJid, {
                            text: `❌ Game Over! The correct answer was "${game.answers[0]}"`
                        });
                        activeGames.delete(gameId);
                    } else {
                        await sock.sendMessage(msg.key.remoteJid, {
                            text: `❌ Wrong answer! ${game.maxAttempts - game.attempts} attempts left`
                        });
                    }
                }
            }

        } catch (error) {
            logger.error('Error in answer command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error processing answer'
            });
        }
    },

    werewolf: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: '🐺 *Werewolf Game*\n\n' +
                      'This feature is coming soon!\n\n' +
                      'The Werewolf game will include:\n' +
                      '• Multiple roles (Werewolf, Villager, Seer, etc.)\n' +
                      '• Day/Night cycle\n' +
                      '• Voting system\n' +
                      '• Private role conversations\n\n' +
                      'Stay tuned for updates!'
            });
        } catch (error) {
            logger.error('Error in werewolf command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error showing werewolf info'
            });
        }
    }
};

// Extend gameCommands with additional commands
Object.assign(gameCommands, additionalCommands);

module.exports = gameCommands;