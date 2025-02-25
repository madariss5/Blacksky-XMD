const fs = require('fs').promises;
const path = require('path');

class Store {
    constructor() {
        this.storePath = path.join(__dirname, 'store.json');
        this.data = {};
        this.loadStore();
    }

    async loadStore() {
        try {
            const data = await fs.readFile(this.storePath, 'utf8');
            this.data = JSON.parse(data);
        } catch (error) {
            // If file doesn't exist, create it
            if (error.code === 'ENOENT') {
                await this.saveStore();
            } else {
                throw error;
            }
        }
    }

    async saveStore() {
        await fs.writeFile(this.storePath, JSON.stringify(this.data, null, 2));
    }

    async set(key, value) {
        this.data[key] = value;
        await this.saveStore();
    }

    get(key) {
        return this.data[key];
    }

    async delete(key) {
        delete this.data[key];
        await this.saveStore();
    }

    // User leveling system methods
    async addXP(userId, amount) {
        const users = this.data.users || {};
        if (!users[userId]) {
            users[userId] = { xp: 0, level: 1 };
        }
        users[userId].xp += amount;

        // Level up logic
        const currentLevel = users[userId].level;
        const newLevel = Math.floor(0.1 * Math.sqrt(users[userId].xp));

        if (newLevel > currentLevel) {
            users[userId].level = newLevel;
            this.data.users = users;
            await this.saveStore();
            return true; // Indicates level up
        }

        this.data.users = users;
        await this.saveStore();
        return false;
    }

    getUserStats(userId) {
        const users = this.data.users || {};
        return users[userId] || { xp: 0, level: 1 };
    }

    // Group settings methods
    async setGroupSetting(groupId, setting, value) {
        const groups = this.data.groups || {};
        if (!groups[groupId]) {
            groups[groupId] = {};
        }
        groups[groupId][setting] = value;
        this.data.groups = groups;
        await this.saveStore();
    }

    getGroupSetting(groupId, setting) {
        const groups = this.data.groups || {};
        return groups[groupId]?.[setting];
    }
}

module.exports = new Store();