const fs = require('fs').promises;
const path = require('path');
const logger = require('pino')();

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
                    logger.info('Session data loaded from environment variable');
                    return true;
                } catch (error) {
                    logger.error('Failed to parse SESSION_DATA:', error);
                }
            }

            // Clean up all existing sessions first
            await this.cleanupAllSessions();

            // Create fresh session directory
            await fs.mkdir(this.sessionDir, { recursive: true });

            // Also clean up auth directory
            await fs.rm(this.authDir, { recursive: true, force: true });
            await fs.mkdir(this.authDir, { recursive: true });

            logger.info('Session and auth directories initialized:', {
                sessionDir: this.sessionDir,
                authDir: this.authDir,
                mode: this.isHeroku ? 'Heroku' : 'Local',
                timestamp: new Date().toISOString()
            });
            return true;
        } catch (error) {
            logger.error('Failed to initialize session directory:', error);
            return false;
        }
    }

    async cleanupAllSessions() {
        try {
            if (!this.isHeroku) {
                // Only clean local files if not on Heroku
                await fs.rm(this.sessionDir, { recursive: true, force: true });
                logger.info('All session files cleaned up successfully');
            }
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

            if (this.isHeroku) {
                // On Heroku, log the session data that should be set in env var
                logger.info('Session data for Heroku ENV:', JSON.stringify(info));
                return;
            }

            // Save session info to a single file for local development
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

    // Helper method to check if running on Heroku
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