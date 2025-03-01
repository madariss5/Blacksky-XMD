const logger = require('pino')();
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const tempDir = path.join(__dirname, '../temp');
fs.ensureDirSync(tempDir);

// Rate limiting configuration
const userCooldowns = new Map();
const COOLDOWN_PERIOD = 5000; // 5 seconds

const isOnCooldown = (userId) => {
    if (!userCooldowns.has(userId)) return false;
    const lastUsage = userCooldowns.get(userId);
    return Date.now() - lastUsage < COOLDOWN_PERIOD;
};

const setCooldown = (userId) => {
    userCooldowns.set(userId, Date.now());
};

const socialCommands = {
    insta: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide an Instagram URL!\nUsage: .insta <url>'
                });
            }

            const userId = msg.key.participant || msg.key.remoteJid;
            if (isOnCooldown(userId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ Please wait a few seconds before using this command again.'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing Instagram content...'
            });

            const tempFile = path.join(tempDir, `instagram_${Date.now()}.mp4`);

            try {
                const response = await axios.get(`https://www.instagram.com/oembed?url=${args[0]}`);
                const mediaUrl = response.data.thumbnail_url.replace('/s150x150/', '/s1080x1080/');

                const mediaResponse = await axios({
                    url: mediaUrl,
                    method: 'GET',
                    responseType: 'stream'
                });

                const writer = fs.createWriteStream(tempFile);
                mediaResponse.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                await sock.sendMessage(msg.key.remoteJid, {
                    video: { url: tempFile },
                    caption: '📱 Instagram Media'
                });

                setCooldown(userId);
                await fs.remove(tempFile);

            } catch (error) {
                throw new Error('Failed to fetch Instagram content. Make sure the URL is public and valid.');
            }

        } catch (error) {
            logger.error('Error in instagram command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error processing Instagram content: ' + error.message
            });
        }
    },

    fb: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a Facebook URL!\nUsage: .fb <url>'
                });
            }

            const userId = msg.key.participant || msg.key.remoteJid;
            if (isOnCooldown(userId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ Please wait a few seconds before using this command again.'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing Facebook content...'
            });

            // Use facebook-dl library for downloading
            const { fbdl } = require('../attached_assets/downloader-fbdl');
            const result = await fbdl.download(args[0]);

            const tempFile = path.join(tempDir, `facebook_${Date.now()}.mp4`);
            const writer = fs.createWriteStream(tempFile);

            const response = await axios({
                url: result.url,
                method: 'GET',
                responseType: 'stream'
            });

            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            await sock.sendMessage(msg.key.remoteJid, {
                video: { url: tempFile },
                caption: result.title || '📱 Facebook Video'
            });

            setCooldown(userId);
            await fs.remove(tempFile);

        } catch (error) {
            logger.error('Error in facebook command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error processing Facebook content: ' + error.message
            });
        }
    },

    twitter: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a Twitter/X URL!\nUsage: .twitter <url>'
                });
            }

            const userId = msg.key.participant || msg.key.remoteJid;
            if (isOnCooldown(userId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ Please wait a few seconds before using this command again.'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing Twitter/X content...'
            });

            // Extract tweet ID from URL
            const tweetId = args[0].split('/status/')[1]?.split('?')[0];
            if (!tweetId) {
                throw new Error('Invalid Twitter/X URL. Please provide a valid tweet URL.');
            }

            // Use Twitter API (v2) to fetch tweet
            try {
                const response = await axios.get(`https://api.twitter.com/2/tweets/${tweetId}`, {
                    headers: {
                        'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
                    }
                });

                await sock.sendMessage(msg.key.remoteJid, {
                    text: `🐦 *Tweet Content*\n\n${response.data.data.text}`
                });

                setCooldown(userId);

            } catch (error) {
                throw new Error('Failed to fetch tweet. The tweet might be private or deleted.');
            }

        } catch (error) {
            logger.error('Error in twitter command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error processing Twitter/X content: ' + error.message
            });
        }
    },

    tiktok: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Please provide a TikTok URL!\nUsage: .tiktok <url>'
                });
            }

            const userId = msg.key.participant || msg.key.remoteJid;
            if (isOnCooldown(userId)) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: '⏳ Please wait a few seconds before using this command again.'
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: '⏳ Processing TikTok content...'
            });

            // Use tiktok-dl library
            const { tiktok } = require('../attached_assets/downloader-tiktok');
            const result = await tiktok.download(args[0]);

            const tempFile = path.join(tempDir, `tiktok_${Date.now()}.mp4`);
            const writer = fs.createWriteStream(tempFile);

            const response = await axios({
                url: result.url,
                method: 'GET',
                responseType: 'stream'
            });

            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            await sock.sendMessage(msg.key.remoteJid, {
                video: { url: tempFile },
                caption: '📱 TikTok Video'
            });

            setCooldown(userId);
            await fs.remove(tempFile);

        } catch (error) {
            logger.error('Error in tiktok command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error processing TikTok content: ' + error.message
            });
        }
    }
};

module.exports = socialCommands;
