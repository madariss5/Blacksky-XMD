const axios = require('axios');
const logger = require('pino')();

const searchCommands = {
    googlesearch: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a search query!\nUsage: .googlesearch <query>'
                });
            }

            const query = args.join(' ');
            const response = await axios.get(`https://www.googleapis.com/customsearch/v1`, {
                params: {
                    key: process.env.GOOGLE_API_KEY,
                    cx: process.env.GOOGLE_SEARCH_ID,
                    q: query
                }
            });

            let results = `🔍 *Google Search Results*\n\n`;
            response.data.items.slice(0, 5).forEach((item, index) => {
                results += `${index + 1}. *${item.title}*\n`;
                results += `${item.snippet}\n`;
                results += `${item.link}\n\n`;
            });

            await sock.sendMessage(msg.key.remoteJid, { text: results });
        } catch (error) {
            logger.error('Google search command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error performing search: ' + error.message
            });
        }
    },

    wikipedia: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a search term!\nUsage: .wikipedia <term>'
                });
            }

            const query = args.join(' ');
            const response = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);

            const text = `📚 *Wikipedia: ${response.data.title}*\n\n` +
                        `${response.data.extract}\n\n` +
                        `🔗 Read more: ${response.data.content_urls.desktop.page}`;

            await sock.sendMessage(msg.key.remoteJid, { text });
        } catch (error) {
            logger.error('Wikipedia command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error searching Wikipedia: ' + error.message
            });
        }
    },

    playstore: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide an app name!\nUsage: .playstore <app name>'
                });
            }

            const query = args.join(' ');
            const response = await axios.get(`https://api.github.com/search/repositories`, {
                params: {
                    q: query,
                    sort: 'stars',
                    order: 'desc'
                }
            });

            const app = response.data.items[0];
            const text = `📱 *${app.name}*\n\n` +
                        `📝 Description: ${app.description}\n` +
                        `⭐ Stars: ${app.stargazers_count}\n` +
                        `👁️ Watchers: ${app.watchers_count}\n` +
                        `🔄 Last Updated: ${new Date(app.updated_at).toLocaleDateString()}\n\n` +
                        `🔗 Link: ${app.html_url}`;

            await sock.sendMessage(msg.key.remoteJid, { text });
        } catch (error) {
            logger.error('Playstore command failed:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error searching Play Store: ' + error.message
            });
        }
    }
};

module.exports = searchCommands;
