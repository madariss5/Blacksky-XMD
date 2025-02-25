const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

class SessionManager {
    constructor(sessionDir) {
        this.sessionDir = sessionDir;
    }

    async initialize() {
        try {
            await fs.mkdir(this.sessionDir, { recursive: true });
            logger.info(`Session directory initialized: ${this.sessionDir}`);
            return true;
        } catch (error) {
            logger.error('Failed to initialize session directory:', error);
            return false;
        }
    }

    async cleanupOldSessions() {
        try {
            const files = await fs.readdir(this.sessionDir);
            for (const file of files) {
                const filePath = path.join(this.sessionDir, file);
                const stats = await fs.stat(filePath);
                // Remove files older than 7 days
                const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
                if (Date.now() - stats.mtime.getTime() > maxAge) {
                    await fs.unlink(filePath);
                    logger.info(`Removed old session file: ${file}`);
                }
            }
        } catch (error) {
            logger.error('Error cleaning up old sessions:', error);
        }
    }

    async saveSessionInfo(sessionId, sessionData) {
        try {
            const info = {
                id: sessionId,
                createdAt: new Date().toISOString(),
                data: sessionData
            };
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
