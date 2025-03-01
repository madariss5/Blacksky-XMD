const fs = require('fs').promises;
const path = require('path');
const logger = require('pino')();

class SessionManager {
    constructor(sessionDir) {
        this.sessionDir = sessionDir;
        this.authDir = path.join(process.cwd(), 'auth_info_baileys');
    }

    async initialize() {
        try {
            // Clean up all existing sessions first
            await this.cleanupAllSessions();

            // Create fresh session directory
            await fs.mkdir(this.sessionDir, { recursive: true });

            // Also clean up auth directory
            await fs.rm(this.authDir, { recursive: true, force: true });
            await fs.mkdir(this.authDir, { recursive: true });

            logger.info('Session and auth directories initialized:', {
                sessionDir: this.sessionDir,
                authDir: this.authDir
            });
            return true;
        } catch (error) {
            logger.error('Failed to initialize session directory:', error);
            return false;
        }
    }

    async cleanupAllSessions() {
        try {
            // Remove entire sessions directory and its contents
            await fs.rm(this.sessionDir, { recursive: true, force: true });
            logger.info('All session files cleaned up successfully');
        } catch (error) {
            if (error.code !== 'ENOENT') { // Ignore if directory doesn't exist
                logger.error('Error cleaning up sessions:', error);
            }
        }
    }

    async saveSessionInfo(sessionId, sessionData) {
        try {
            const info = {
                id: sessionId,
                createdAt: new Date().toISOString(),
                data: sessionData
            };

            // Save session info to a single file
            await fs.writeFile(
                path.join(this.sessionDir, 'session_info.json'),
                JSON.stringify(info, null, 2)
            );
            logger.info(`Session info saved for ID: ${sessionId}`);
        } catch (error) {
            logger.error('Failed to save session info:', error);
        }
    }

    async verifySession(sessionId) {
        try {
            const infoPath = path.join(this.sessionDir, 'session_info.json');
            const data = await fs.readFile(infoPath, 'utf8');
            const info = JSON.parse(data);
            return info.id === sessionId;
        } catch {
            return false;
        }
    }
}

module.exports = SessionManager;