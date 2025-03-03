const fs = require('fs-extra');
const path = require('path');
const logger = require('pino')();

// Function to read and parse session data
const getSessionData = async () => {
    try {
        const credsPath = path.join(process.cwd(), 'auth_info', 'creds.json');
        if (fs.existsSync(credsPath)) {
            const creds = await fs.readJson(credsPath);
            return {
                success: true,
                sessionId: creds.noiseKey?.private || process.env.SESSION_ID || 'blacksky-md',
                registrationId: creds.registrationId,
                advSecretKey: creds.advSecretKey,
                nextPreKeyId: creds.nextPreKeyId,
                firstUnuploadedPreKeyId: creds.firstUnuploadedPreKeyId,
                serverHasPreKeys: creds.serverHasPreKeys,
                signedIdentityKey: creds.signedIdentityKey,
                signedPreKey: creds.signedPreKey,
                signalIdentities: creds.signalIdentities
            };
        }
        return {
            success: false,
            error: 'Credentials file not found'
        };
    } catch (error) {
        logger.error('Error reading credentials:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Function to compress creds.json into single line
const compressCredsFile = async () => {
    try {
        const credsPath = path.join(process.cwd(), 'auth_info', 'creds.json');
        if (fs.existsSync(credsPath)) {
            const creds = await fs.readJson(credsPath);
            await fs.writeJson(credsPath, creds, { spaces: 0 });
            logger.info('Successfully compressed creds.json');
        }
    } catch (error) {
        logger.error('Error compressing creds.json:', error);
    }
};

module.exports = {
    getSessionData,
    compressCredsFile
};