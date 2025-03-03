const fs = require('fs').promises;
const path = require('path');
const logger = require('pino')({ level: 'silent' });

class SessionManager {
    constructor(sessionDir) {
        this.sessionDir = sessionDir;
        this.authDir = path.join(process.cwd(), 'auth_info_baileys');
        this.isHeroku = process.env.NODE_ENV === 'production' && process.env.DYNO;
    }

    async initialize() {
        try {
            // If running on Heroku, try to load session from env var
            if (this.isHeroku && process.env.SESSION_DATA) {
                try {
                    const sessionData = JSON.parse(process.env.SESSION_DATA);
                    return true;
                } catch (error) {
                    return false;
                }
            }

            // Create fresh session directory
            await fs.mkdir(this.sessionDir, { recursive: true });
            await fs.mkdir(this.authDir, { recursive: true });

            // Create additional required directories
            const dirs = [
                path.join(this.sessionDir, 'sessions'),
                path.join(this.sessionDir, 'creds'),
                'temp',
                'database'
            ];

            for (const dir of dirs) {
                await fs.mkdir(dir, { recursive: true });
            }

            return true;
        } catch (error) {
            return false;
        }
    }

    async cleanupAllSessions() {
        try {
            if (!this.isHeroku) {
                await fs.rm(this.sessionDir, { recursive: true, force: true });
            }
        } catch (error) {
            if (error.code !== 'ENOENT') {
                return false;
            }
        }
        return true;
    }

    async saveSessionInfo(sessionId, sessionData) {
        try {
            const info = {
                id: sessionId,
                createdAt: new Date().toISOString(),
                data: sessionData
            };

            if (this.isHeroku) {
                return true;
            }

            await fs.writeFile(
                path.join(this.sessionDir, 'session_info.json'),
                JSON.stringify(info, null, 2)
            );
            return true;
        } catch (error) {
            return false;
        }
    }

    async verifySession(sessionId) {
        try {
            if (this.isHeroku && process.env.SESSION_DATA) {
                const info = JSON.parse(process.env.SESSION_DATA);
                return info.id === sessionId;
            }

            const infoPath = path.join(this.sessionDir, 'session_info.json');
            const data = await fs.readFile(infoPath, 'utf8');
            const info = JSON.parse(data);
            return info.id === sessionId;
        } catch {
            return false;
        }
    }

    isHerokuEnvironment() {
        return this.isHeroku;
    }
    async restoreToTimestamp(targetTimestamp) {
        try {
            const currentTime = new Date();
            if (currentTime < targetTimestamp) {
                throw new Error('Cannot restore to a future timestamp');
            }

            logger.info('Attempting to restore session to timestamp:', {
                target: targetTimestamp.toISOString(),
                current: currentTime.toISOString()
            });

            // Clean up sessions created after target timestamp
            const files = await fs.readdir(this.sessionDir);
            for (const file of files) {
                const filePath = path.join(this.sessionDir, file);
                const stats = await fs.stat(filePath);
                if (stats.mtime > targetTimestamp) {
                    await fs.unlink(filePath);
                    logger.info('Removed newer session file:', file);
                }
            }

            return true;
        } catch (error) {
            logger.error('Failed to restore to timestamp:', error);
            return false;
        }
    }
}

module.exports = SessionManager;