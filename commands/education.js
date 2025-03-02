const axios = require('axios');
const logger = require('pino')();

const educationCommands = {
    math: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a math expression!\nUsage: .math <expression>'
                });
            }

            const expression = args.join(' ');
            const response = await axios.get(`http://api.mathjs.org/v4/`, {
                params: { expr: expression }
            });

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🔢 *Math Result*\n\n${expression} = ${response.data}`
            });
        } catch (error) {
            logger.error('Math command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error calculating: ' + error.message
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

            const word = args[0];
            const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            const entry = response.data[0];

            let text = `📚 *Dictionary: ${entry.word}*\n\n`;
            text += `*Phonetic:* ${entry.phonetic || 'N/A'}\n\n`;

            entry.meanings.forEach(meaning => {
                text += `*${meaning.partOfSpeech}*\n`;
                meaning.definitions.slice(0, 2).forEach((def, i) => {
                    text += `${i + 1}. ${def.definition}\n`;
                    if (def.example) text += `Example: ${def.example}\n`;
                });
                text += '\n';
            });

            await sock.sendMessage(msg.key.remoteJid, { text });
        } catch (error) {
            logger.error('Dictionary command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error looking up word: ' + error.message
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

            const targetLang = args[0];
            const text = args.slice(1).join(' ');

            const response = await axios.get(`https://translate.googleapis.com/translate_a/single`, {
                params: {
                    client: 'gtx',
                    sl: 'auto',
                    tl: targetLang,
                    dt: 't',
                    q: text
                }
            });

            const translation = response.data[0][0][0];
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🌐 *Translation*\n\nFrom: ${text}\nTo (${targetLang}): ${translation}`
            });
        } catch (error) {
            logger.error('Translate command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error translating: ' + error.message
            });
        }
    }
};

module.exports = educationCommands;
