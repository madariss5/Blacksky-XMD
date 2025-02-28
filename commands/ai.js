const config = require('../config');
const logger = require('pino')();
const fs = require('fs');
const axios = require('axios');

// Import AI modules
const aiGpt = require('../attached_assets/ai-gpt');
const aiImagine = require('../attached_assets/ai-imagine');
const aiLisa = require('../attached_assets/ai-lisa');
const aiRias = require('../attached_assets/ai-rias');
const aiToxxic = require('../attached_assets/ai-toxxic');
const aiTxt2img = require('../attached_assets/ai-txt2img');
const aiUser = require('../attached_assets/ai-user');
const bugAndro = require('../attached_assets/bug-andro');
const bugIos = require('../attached_assets/bug-ios');

const aiCommands = {
    gpt: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide a prompt!\nUsage: .gpt <your question>`
                });
            }
            const response = await aiGpt.getResponse(args.join(' '));
            await sock.sendMessage(msg.key.remoteJid, { text: response });
        } catch (error) {
            logger.error('Error in gpt command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error processing GPT request: ' + error.message
            });
        }
    },

    imagine: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Please provide an image description!\nUsage: .imagine <description>`
                });
            }
            const imageUrl = await aiImagine.generateImage(args.join(' '));
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: imageUrl },
                caption: '🎨 Generated image based on your prompt'
            });
        } catch (error) {
            logger.error('Error in imagine command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error generating image: ' + error.message
            });
        }
    },

    lisa: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Chat with Lisa!\nUsage: .lisa <your message>`
                });
            }
            const response = await aiLisa.chat(args.join(' '));
            await sock.sendMessage(msg.key.remoteJid, { text: response });
        } catch (error) {
            logger.error('Error in lisa command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error chatting with Lisa: ' + error.message
            });
        }
    },

    rias: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Chat with Rias!\nUsage: .rias <your message>`
                });
            }
            const response = await aiRias.chat(args.join(' '));
            await sock.sendMessage(msg.key.remoteJid, { text: response });
        } catch (error) {
            logger.error('Error in rias command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error chatting with Rias: ' + error.message
            });
        }
    },

    toxxic: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Chat with Toxxic!\nUsage: .toxxic <your message>`
                });
            }
            const response = await aiToxxic.chat(args.join(' '));
            await sock.sendMessage(msg.key.remoteJid, { text: response });
        } catch (error) {
            logger.error('Error in toxxic command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error chatting with Toxxic: ' + error.message
            });
        }
    },

    txt2img: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Convert text to image!\nUsage: .txt2img <text>`
                });
            }
            const imageUrl = await aiTxt2img.generate(args.join(' '));
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: imageUrl },
                caption: '✨ Generated text image'
            });
        } catch (error) {
            logger.error('Error in txt2img command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error generating text image: ' + error.message
            });
        }
    },

    aiuser: async (sock, msg, args) => {
        try {
            const settings = await aiUser.handleSettings(msg.key.participant, args);
            await sock.sendMessage(msg.key.remoteJid, { text: settings });
        } catch (error) {
            logger.error('Error in aiuser command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error managing AI settings: ' + error.message
            });
        }
    },

    bugandro: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Report Android bug!\nUsage: .bugandro <bug description>`
                });
            }
            const report = await bugAndro.report(msg.key.participant, args.join(' '));
            await sock.sendMessage(msg.key.remoteJid, { text: report });
        } catch (error) {
            logger.error('Error in bugandro command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error reporting Android bug: ' + error.message
            });
        }
    },

    bugios: async (sock, msg, args) => {
        try {
            if (!args.length) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `Report iOS bug!\nUsage: .bugios <bug description>`
                });
            }
            const report = await bugIos.report(msg.key.participant, args.join(' '));
            await sock.sendMessage(msg.key.remoteJid, { text: report });
        } catch (error) {
            logger.error('Error in bugios command:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error reporting iOS bug: ' + error.message
            });
        }
    }
};

module.exports = aiCommands;