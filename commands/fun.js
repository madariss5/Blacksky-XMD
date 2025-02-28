const config = require('../config');
const fs = require('fs-extra');
const path = require('path');
const logger = require('pino')();
const ffmpeg = require('fluent-ffmpeg');
const { exec } = require('child_process');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const tempDir = require('os').tmpdir();


const mediaDir = path.join(__dirname, '../media');
if (!fs.existsSync(mediaDir)) {
    fs.mkdirpSync(mediaDir);
    logger.info('Media directory created');
}

const convertGifToMp4 = async (inputPath) => {
    try {
        const outputPath = inputPath.replace('.gif', '.mp4');

        // Check if converted file already exists
        if (fs.existsSync(outputPath)) {
            logger.info(`Using existing MP4: ${outputPath}`);
            return outputPath;
        }

        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .toFormat('mp4')
                .addOutputOptions([
                    '-pix_fmt yuv420p',
                    '-movflags +faststart',
                    '-vf scale=trunc(iw/2)*2:trunc(ih/2)*2',
                    '-c:v libx264',
                    '-preset ultrafast',
                    '-b:v 1M'
                ])
                .on('end', () => {
                    logger.info(`Successfully converted GIF to MP4: ${outputPath}`);
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    logger.error(`Error converting GIF to MP4: ${err.message}`);
                    reject(err);
                })
                .save(outputPath);
        });
    } catch (error) {
        logger.error('Error in convertGifToMp4:', error);
        throw error;
    }
};

const sendGifReaction = async (sock, msg, mediaPath, caption = '', mentions = []) => {
    try {
        // Check if the GIF exists
        if (fs.existsSync(mediaPath)) {
            // Convert GIF to MP4
            const mp4Path = await convertGifToMp4(mediaPath);
            const buffer = await fs.readFile(mp4Path);

            try {
                await sock.sendMessage(msg.key.remoteJid, {
                    video: buffer,
                    caption: caption,
                    mentions: mentions,
                    gifPlayback: true,
                    mimetype: 'video/mp4',
                    messageType: 'videoMessage',
                    jpegThumbnail: null,
                    seconds: 1,
                    contextInfo: {
                        isGif: true
                    }
                });
                logger.info(`Successfully sent MP4: ${mp4Path}`);
                return true;
            } catch (sendError) {
                logger.error('Error sending MP4 message:', sendError);
                throw sendError;
            }
        } else {
            logger.error(`GIF not found: ${mediaPath}`);
            throw new Error('GIF not found');
        }
    } catch (error) {
        logger.error('Error in sendGifReaction:', error);

        // Send fallback text message
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `${caption} (GIF not available: ${error.message})`,
                mentions: mentions
            });
        } catch (fallbackError) {
            logger.error('Error sending fallback message:', fallbackError);
        }
        return false;
    }
};

const funCommands = {
    menu: async (sock, msg) => {
        const commandList = `🎮 *Fun Commands Menu* 🎮\n
🎯 *Interactive Games:*
1. *!rps* <choice> - Play Rock Paper Scissors
2. *!magic8ball* <question> - Ask the Magic 8 Ball
3. *!coinflip* - Flip a coin
4. *!roll* [max] - Roll a dice (default: 6)
5. *!wordgame* - Play word guessing game
6. *!trivia* - Play trivia quiz

🌟 *Reaction Commands:*
7. *!slap* [@user] - Slap someone
8. *!hug* [@user] - Give someone a hug
9. *!pat* [@user] - Pat someone gently
10. *!kiss* [@user] - Kiss someone
11. *!punch* [@user] - Punch someone
12. *!bonk* [@user] - Bonk someone

😊 *Emotional Reactions:*
13. *!blush* - Show blushing reaction
14. *!happy* - Show happy reaction
15. *!smile* - Show smiling reaction
16. *!smug* - Show smug reaction
17. *!cry* - Show crying reaction

🎭 *Fun Reactions:*
18. *!bully* [@user] - Bully someone (playfully)
19. *!lick* [@user] - Lick someone
20. *!bite* [@user] - Bite someone
21. *!nom* [@user] - Nom on someone
22. *!glomp* [@user] - Tackle-hug someone

🎬 *Action Commands:*
23. *!dance* - Show off your dance moves
24. *!highfive* [@user] - Give a high-five
25. *!wave* [@user] - Wave at someone
26. *!wink* [@user] - Wink at someone
27. *!yeet* [@user] - Yeet someone
28. *!poke* [@user] - Poke someone
29. *!facepalm* - Express disappointment

:✨ *Special Effects:*
30. *!wasted* [@user] - Apply wasted effect
31. *!jail* [@user] - Put behind bars
32. *!triggered* [@user] - Show triggered reaction
33. *!rip* [@user] - Create a memorial

*Game Commands:*
• Use !guess [word] to answer word game
• Use !answer [number] to answer trivia

*How to use:*
• Commands with [@user] can tag someone
• [max] means optional number
• <choice/question> means required text
• Have fun and be respectful! 😊`;

        await sock.sendMessage(msg.key.remoteJid, { text: commandList });
    },
    coinflip: async (sock, msg) => {
        try {
            const result = Math.random() < 0.5;
            const text = result ? 'Heads! 👑' : 'Tails! 🪙';
            const gif = result ? './media/anime-happy.gif' : './media/anime-smile.gif';

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎲 *Coin Flip*\n\n${text}`
            });

            await sendGifReaction(sock, msg, gif);

        } catch (error) {
            logger.error('Error in coinflip command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to flip the coin!'
            });
        }
    },
    slap: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* slapped ${target}! 👋`,
                mentions: mentions
            });

            await sendGifReaction(sock, msg, './media/anime-slap.gif', '👋', mentions);
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

            await sendGifReaction(sock, msg, './media/anime-hug.gif', '🤗', mentions);
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

            await sendGifReaction(sock, msg, './media/anime-pat.gif', '🥰', mentions);
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

            await sendGifReaction(sock, msg, './media/anime-dance.gif', '💃');
        } catch (error) {
            logger.error('Error in dance command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute dance command!'
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
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '🎱 Please ask a question! Example: !magic8ball will it rain today?'
                });
            }

            const responses = [
                { text: "It is certain! ✨", gif: './media/anime-happy.gif' },
                { text: "Without a doubt! 💫", gif: './media/anime-smile.gif' },
                { text: "Most likely! 🌟", gif: './media/anime-smug.gif' },
                { text: "Better not tell you now... 🤫", gif: './media/anime-shush.gif' },
                { text: "Cannot predict now... 🤔", gif: './media/anime-think.gif' },
                { text: "Don't count on it! 🚫", gif: './media/anime-no.gif' },
                { text: "My sources say no! ❌", gif: './media/anime-cry.gif' },
                { text: "Outlook not so good! 😕", gif: './media/anime-sad.gif' }
            ];

            const response = responses[Math.floor(Math.random() * responses.length)];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎱 *Magic 8 Ball*\n\nQ: ${args.join(' ')}\nA: ${response.text}`
            });

            await sendGifReaction(sock, msg, response.gif);

        } catch (error) {
            logger.error('Error in magic8ball command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to consult the Magic 8 Ball!'
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

            // Add start game reaction
            await sendGifReaction(sock, msg, './media/anime-happy.gif', '🎮 Game started!');

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

            await sendGifReaction(sock, msg,
                isCorrect ? './media/anime-happy.gif' : './media/anime-cry.gif',
                isCorrect ? '🎉' : '😢'
            );

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

            // Add start game reaction
            await sendGifReaction(sock, msg, './media/anime-happy.gif', '🎮 Game started!');

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

            await sendGifReaction(sock, msg, 
                isCorrect ? './media/anime-happy.gif' : './media/anime-cry.gif',
                isCorrect ? '🎉' : '😢'
            );

        } catch (error) {
            logger.error('Error in answer command:', error);
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
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* eliminated ${target}! ☠️`,
                mentions: mentions
            });

            await sendGifReaction(sock, msg, './media/anime-kill.gif', '☠️', mentions);
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

            await sendGifReaction(sock, msg, './media/anime-highfive.gif', '🙌', mentions);
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

            await sendGifReaction(sock, msg, './media/anime-facepalm.gif', '🤦‍♂️');
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

            await sendGifReaction(sock, msg, './media/anime-poke.gif', '👉', mentions);
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

            await sendGifReaction(sock, msg, './media/anime-cuddle.gif', '🤗', mentions);
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

            await sendGifReaction(sock, msg, './media/anime-yeet.gif', '🚀', mentions);
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

            await sendGifReaction(sock, msg, './media/anime-boop.gif', '👉👃', mentions);
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

            await sendGifReaction(sock, msg, './media/anime-bonk.gif', '🔨', mentions);
        } catch (error) {
            logger.error('Error in bonk command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute bonk command!'
            });
        }
    },
    wave: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* waves at ${target}! 👋`,
                mentions: mentions
            });

            await sendGifReaction(sock, msg, './media/anime-wave.gif', '👋', mentions);
        } catch (error) {
            logger.error('Error in wave command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute wave command!'
            });
        }
    },
    kiss: async (sock, msg, args) => {
        try {const target = args[0] ? `@${args[0].replace('@', '')}` : 'themselves';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* kisses ${target}! 💋`,
                mentions: mentions
            });

            await sendGifReaction(sock, msg, './media/anime-kiss.gif', '💋', mentions);
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

            await sendGifReaction(sock, msg, './media/anime-punch.gif','👊', mentions);
        } catch (error) {
            logger.error('Error in punch command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute punch command!'
            });
        }
    },
    wink: async (sock, msg, args) => {
        try {
            const target = args[0] ? `@${args[0].replace('@', '')}` : 'everyone';
            const mentions = args[0] ? [args[0] + '@s.whatsapp.net'] : [];

            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* winks at ${target}! 😉`,
                mentions: mentions
            });

            await sendGifReaction(sock, msg, './media/anime-wink.gif', '😉', mentions);
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

            await sendGifReaction(sock, msg, './media/wasted.gif', '💀', mentions);
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

            await sendGifReaction(sock, msg, './media/rip.gif', '⚰️', mentions);
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

            await sendGifReaction(sock, msg, './media/triggered.gif', '💢', mentions);
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

            await sendGifReaction(sock, msg, './media/jail.gif', '🏢', mentions);
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

            // Verify GIF exists and log path
            const gifPath = path.join(__dirname, '../media/anime-ponk.gif');
            logger.info('Checking for ponk GIF at path:', gifPath);

            if (!fs.existsSync(gifPath)) {
                logger.error('Ponk GIF not found at path:', gifPath);
                throw new Error('Ponk GIF not found');
            }

            // Send the anime ponk GIF
            await sendGifReaction(sock, msg, gifPath, '🏓', mentions);
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

            await sendGifReaction(sock, msg, './media/anime-trash.gif', '🗑️', mentions);
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

            await sendGifReaction(sock, msg, './media/triggered.gif', '💢', mentions);
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

            await sendGifReaction(sock, msg, './media/anime-wanted.gif', '🤠', mentions)
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

            await sendGifReaction(sock, msg, './media/anime-cry.gif', '😢');
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

            await sendGifReaction(sock, msg, './media/anime-bully.gif', '😈', mentions);
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

            await sendGifReaction(sock, msg, './media/anime-awoo.gif', '🐺');
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

            await sendGifReaction(sock, msg, './media/anime-lick.gif', '👅', mentions);
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

            await sendGifReaction(sock, msg, './media/anime-smug.gif', '😏');
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

            await sendGifReaction(sock, msg, './media/anime-bite.gif', '🦷', mentions);
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

            await sendGifReaction(sock, msg, './media/anime-nom.gif', '😋', mentions);
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

            await sendGifReaction(sock, msg, './media/anime-glomp.gif', '🤗', mentions);
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

            await sendGifReaction(sock, msg, './media/anime-happy.gif', '😄');
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

            await sendGifReaction(sock, msg, './media/anime-cringe.gif', '😬');
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

            await sendGifReaction(sock, msg, './media/anime-blush.gif', '😊');
        } catch (error) {
            logger.error('Error in blush command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute blush command!'
            });
        }
    },
    smile: async (sock, msg) => {
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `*${msg.pushName}* smiles! 😊`
            });

            await sendGifReaction(sock, msg, './media/anime-smile.gif', '😊');
        } catch (error) {
            logger.error('Error in smile command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute smile command!'
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

            await sendGifReaction(sock, msg, './media/anime-handhold.gif', '🤝', mentions);
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

            await sendGifReaction(sock, msg, './media/anime-baka.gif', '🤪', mentions);
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

            await sendGifReaction(sock, msg, './media/anime-neko.gif', '🐱');
        } catch (error) {
            logger.error('Error in neko command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Failed to execute neko command!'
            });
        }
    },
    rps: async (sock, msg, args) => {
        try {
            const choices = ['rock', 'paper', 'scissors'];
            const userChoice = args[0]?.toLowerCase();

            if (!userChoice || !choices.includes(userChoice)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '🎮 *Rock Paper Scissors*\nUse: !rps <choice>\nChoices: rock, paper, scissors'
                });
            }

            const botChoice = choices[Math.floor(Math.random() * choices.length)];
            let result;

            if (userChoice === botChoice) {
                result = 'It\'s a tie! 🤝';
            } else if (
                (userChoice === 'rock' && botChoice === 'scissors') ||
                (userChoice === 'paper' && botChoice === 'rock') ||
                (userChoice === 'scissors' && botChoice === 'paper')
            ) {
                result = 'You win! 🎉';
            } else {
                result = 'I win! 😎';
            }

            // Use appropriate reaction GIF based on result
            const reactionGif = result.includes('win') ? './media/anime-happy.gif' : 
                              result.includes('tie') ? './media/anime-smile.gif' : 
                              './media/anime-smug.gif';

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎮 *Rock Paper Scissors*\n\nYou chose: ${userChoice}\nI chose: ${botChoice}\n\n${result}`
            });

            await sendGifReaction(sock, msg, reactionGif);

        } catch (error) {
            logger.error('Error in rps command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to play Rock Paper Scissors!'
            });
        }
    },
    roll: async (sock, msg, args) => {
        try {
            const max = parseInt(args[0]) || 6;
            if (max < 1 || max > 100) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please specify a number between 1 and 100'
                });
            }

            const result = Math.floor(Math.random() * max) + 1;
            const gif = result === max ? './media/anime-happy.gif' : 
                       result === 1 ? './media/anime-cry.gif' : 
                       './media/anime-smile.gif';

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎲 *Dice Roll*\n\nYou rolled a ${result} (1-${max})`
            });

            await sendGifReaction(sock, msg, gif);

        } catch (error) {
            logger.error('Error in roll command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to roll the dice!'
            });
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

            // Add start game reaction
            await sendGifReaction(sock, msg, './media/anime-happy.gif', '🎮 Game started!');

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

            await sendGifReaction(sock, msg,
                isCorrect ? './media/anime-happy.gif' : './media/anime-cry.gif',
                isCorrect ? '🎉' : '😢'
            );

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

            // Add start game reaction
            await sendGifReaction(sock, msg, './media/anime-happy.gif', '🎮 Game started!');

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

            await sendGifReaction(sock, msg, 
                isCorrect ? './media/anime-happy.gif' : './media/anime-cry.gif',
                isCorrect ? '🎉' : '😢'
            );

        } catch (error) {
            logger.error('Error in answer command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '😅 Oops! Something went wrong while checking your answer!'
            });
        }
    }
};

module.exports = funCommands;