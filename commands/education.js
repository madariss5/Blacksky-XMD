const axios = require('axios');
const logger = require('pino')();
const math = require('mathjs');
const wiki = require('wikipedia');
const translate = require('@vitalets/google-translate-api');

const educationCommands = {
    math: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a math expression!\nUsage: .math <expression>'
                });
            }

            const expression = args.join(' ');
            const result = math.evaluate(expression);

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🔢 *Math Result*\n\n${expression} = ${result}`
            });
        } catch (error) {
            logger.error('Math command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error calculating. Please check your expression.'
            });
        }
    },

    dictionary: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a word!\nUsage: .dictionary <word>'
                });
            }

            const word = args[0].toLowerCase();
            const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            const entry = response.data[0];

            let text = `📚 *Dictionary: ${entry.word}*\n\n`;
            text += `*Phonetic:* ${entry.phonetic || 'N/A'}\n\n`;

            entry.meanings.forEach((meaning, index) => {
                if (index < 3) { // Limit to 3 meanings for readability
                    text += `*${meaning.partOfSpeech}*\n`;
                    meaning.definitions.slice(0, 2).forEach((def, i) => {
                        text += `${i + 1}. ${def.definition}\n`;
                        if (def.example) text += `   Example: "${def.example}"\n`;
                    });
                    text += '\n';
                }
            });

            await sock.sendMessage(msg.key.remoteJid, { text });
        } catch (error) {
            logger.error('Dictionary command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Word not found or error occurred.'
            });
        }
    },

    wiki: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a search term!\nUsage: .wiki <search term>'
                });
            }

            const searchTerm = args.join(' ');
            await wiki.setLang('en');

            const searchResults = await wiki.search(searchTerm);
            if (!searchResults.results.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ No Wikipedia articles found.'
                });
            }

            const page = await wiki.page(searchResults.results[0].title);
            const summary = await page.summary();

            let text = `📖 *Wikipedia: ${summary.title}*\n\n`;
            text += summary.extract;
            text += `\n\n🔗 Read more: ${summary.content_urls.desktop.page}`;

            await sock.sendMessage(msg.key.remoteJid, { text });
        } catch (error) {
            logger.error('Wiki command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error searching Wikipedia.'
            });
        }
    },

    translate: async (sock, msg, args) => {
        try {
            if (args.length < 2) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide language and text!\nUsage: .translate <lang> <text>'
                });
            }

            const targetLang = args[0].toLowerCase();
            const text = args.slice(1).join(' ');

            const result = await translate(text, { to: targetLang });

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🌐 *Translation*\n\n` +
                      `From: ${text}\n` +
                      `To (${targetLang}): ${result.text}\n` +
                      `Language: ${result.from.language.iso}`
            });
        } catch (error) {
            logger.error('Translate command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error translating. Please check the language code.'
            });
        }
    }
};

module.exports = educationCommands;