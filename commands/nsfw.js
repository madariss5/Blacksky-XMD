const config = require('../config');
const store = require('../database/store');

// Age verification helper
const verifyAge = async (sock, msg) => {
    const user = store.getUserInfo(msg.key.participant);
    if (!user || !user.age || user.age < 18) {
        await sock.sendMessage(msg.key.remoteJid, { 
            text: '⚠️ This command requires age verification. Please register with !register <name> <age> first. Must be 18+.' 
        });
        return false;
    }
    return true;
};

// Group NSFW setting check
const checkGroupNSFW = async (sock, msg) => {
    if (!msg.key.remoteJid.endsWith('@g.us')) return true;
    
    const groupSettings = store.getGroupSettings(msg.key.remoteJid);
    if (!groupSettings?.nsfw) {
        await sock.sendMessage(msg.key.remoteJid, { 
            text: '⚠️ NSFW commands are disabled in this group. Admins can enable them with !setnsfw on' 
        });
        return false;
    }
    return true;
};

// Base command handler with verification
const handleNSFWCommand = async (sock, msg, handler) => {
    if (!await verifyAge(sock, msg)) return;
    if (!await checkGroupNSFW(sock, msg)) return;
    await handler(sock, msg);
};

// Generate 50 NSFW commands
const nsfwCommands = {};
for (let i = 1; i <= 50; i++) {
    nsfwCommands[`nsfwCmd${i}`] = async (sock, msg) => {
        await handleNSFWCommand(sock, msg, async (sock, msg) => {
            await sock.sendMessage(msg.key.remoteJid, { 
                text: `Executing NSFW command ${i}...`
            });
            // Implement specific NSFW command logic here
        });
    };
}

module.exports = nsfwCommands;
