const config = require('../config');
const logger = require('pino')();

// Safe module import function
const safeRequire = (path) => {
    try {
        return require(path);
    } catch (error) {
        logger.warn(`Failed to load module ${path}: ${error.message}`);
        return {
            download: () => Promise.reject(new Error(`Module ${path} not available`)),
            search: () => Promise.reject(new Error(`Module ${path} not available`))
        };
    }
};

// Import downloader modules safely
const modules = {
    ytmp3: '../attached_assets/downloader-ytmp3',
    ytmp4: '../attached_assets/downloader-ytmp4',
    play: '../attached_assets/downloader-play',
    tiktok: '../attached_assets/downloader-tiktok',
    tiktok2: '../attached_assets/downloader-tiktok2',
    fbdl: '../attached_assets/downloader-fbdl',
    mediafire: '../attached_assets/downloader-mediafire',
    apk: '../attached_assets/downloader-apk',
    clip: '../attached_assets/downloader-clip',
    lyrics: '../attached_assets/downloader-lyrics'
};

// Import modules with fallback
const {
    ytmp3,
    ytmp4,
    play,
    tiktok,
    tiktok2,
    fbdl,
    mediafire,
    apk,
    clip,
    lyrics
} = Object.entries(modules).reduce((acc, [key, path]) => {
    acc[key] = safeRequire(path);
    return acc;
}, {});

const downloaderCommands = {
    ytmp3: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a YouTube URL!\nUsage: ${config.prefix}ytmp3 <url>`
                });
            }
            const result = await ytmp3.download(args[0]);
            await sock.sendMessage(msg.key.remoteJid, {
                audio: { url: result.url },
                mimetype: 'audio/mp4'
            });
        } catch (error) {
            logger.error('Error in ytmp3 command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error downloading audio: ' + error.message
            });
        }
    },

    ytmp4: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a YouTube URL!\nUsage: ${config.prefix}ytmp4 <url>`
                });
            }
            const result = await ytmp4.download(args[0]);
            await sock.sendMessage(msg.key.remoteJid, {
                video: { url: result.url },
                caption: result.title
            });
        } catch (error) {
            logger.error('Error in ytmp4 command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error downloading video: ' + error.message
            });
        }
    },

    play: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a song name!\nUsage: ${config.prefix}play <song name>`
                });
            }
            const result = await play.search(args.join(' '));
            await sock.sendMessage(msg.key.remoteJid, {
                audio: { url: result.url },
                mimetype: 'audio/mp4',
                caption: result.title
            });
        } catch (error) {
            logger.error('Error in play command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error playing audio: ' + error.message
            });
        }
    },

    tiktok: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a TikTok URL!\nUsage: ${config.prefix}tiktok <url>`
                });
            }
            const result = await tiktok.download(args[0]);
            await sock.sendMessage(msg.key.remoteJid, {
                video: { url: result.url },
                caption: '📱 TikTok Video'
            });
        } catch (error) {
            logger.error('Error in tiktok command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error downloading TikTok: ' + error.message
            });
        }
    },

    facebook: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a Facebook URL!\nUsage: ${config.prefix}facebook <url>`
                });
            }
            const result = await fbdl.download(args[0]);
            await sock.sendMessage(msg.key.remoteJid, {
                video: { url: result.url },
                caption: '📱 Facebook Video'
            });
        } catch (error) {
            logger.error('Error in facebook command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error downloading Facebook video: ' + error.message
            });
        }
    },

    mediafire: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a MediaFire URL!\nUsage: ${config.prefix}mediafire <url>`
                });
            }
            const result = await mediafire.download(args[0]);
            await sock.sendMessage(msg.key.remoteJid, {
                document: { url: result.url },
                mimetype: result.mime,
                fileName: result.filename
            });
        } catch (error) {
            logger.error('Error in mediafire command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error downloading file: ' + error.message
            });
        }
    },

    apk: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide an app name!\nUsage: ${config.prefix}apk <app name>`
                });
            }
            const result = await apk.download(args.join(' '));
            await sock.sendMessage(msg.key.remoteJid, {
                document: { url: result.url },
                mimetype: 'application/vnd.android.package-archive',
                fileName: result.name + '.apk'
            });
        } catch (error) {
            logger.error('Error in apk command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error downloading APK: ' + error.message
            });
        }
    },

    lyrics: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a song name!\nUsage: ${config.prefix}lyrics <song name>`
                });
            }
            const result = await lyrics.search(args.join(' '));
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🎵 *${result.title}*\n👤 ${result.artist}\n\n${result.lyrics}`
            });
        } catch (error) {
            logger.error('Error in lyrics command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error finding lyrics: ' + error.message
            });
        }
    }
};

module.exports = downloaderCommands;