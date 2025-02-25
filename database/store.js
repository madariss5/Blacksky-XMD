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

    // Ban management methods
    async banUser(userId) {
        const banned = this.data.banned || [];
        if (!banned.includes(userId)) {
            banned.push(userId);
            this.data.banned = banned;
            await this.saveStore();
            return true;
        }
        return false;
    }

    async unbanUser(userId) {
        const banned = this.data.banned || [];
        const index = banned.indexOf(userId);
        if (index > -1) {
            banned.splice(index, 1);
            this.data.banned = banned;
            await this.saveStore();
            return true;
        }
        return false;
    }

    isUserBanned(userId) {
        const banned = this.data.banned || [];
        return banned.includes(userId);
    }

    async banGroup(groupId) {
        const bannedGroups = this.data.bannedGroups || [];
        if (!bannedGroups.includes(groupId)) {
            bannedGroups.push(groupId);
            this.data.bannedGroups = bannedGroups;
            await this.saveStore();
            return true;
        }
        return false;
    }

    async unbanGroup(groupId) {
        const bannedGroups = this.data.bannedGroups || [];
        const index = bannedGroups.indexOf(groupId);
        if (index > -1) {
            bannedGroups.splice(index, 1);
            this.data.bannedGroups = bannedGroups;
            await this.saveStore();
            return true;
        }
        return false;
    }

    isGroupBanned(groupId) {
        const bannedGroups = this.data.bannedGroups || [];
        return bannedGroups.includes(groupId);
    }

    getBannedUsers() {
        return this.data.banned || [];
    }

    getBannedGroups() {
        return this.data.bannedGroups || [];
    }

    // User registration methods
    async registerUser(userId, name, age) {
        const users = this.data.users || {};
        if (!users[userId]) {
            users[userId] = { xp: 0, level: 1 };
        }
        users[userId] = {
            ...users[userId],
            name,
            age,
            registeredAt: new Date().toISOString()
        };
        this.data.users = users;
        await this.saveStore();
    }

    getUserInfo(userId) {
        const users = this.data.users || {};
        return users[userId] || { xp: 0, level: 1 };
    }

    isUserRegistered(userId) {
        const users = this.data.users || {};
        return !!(users[userId]?.name && users[userId]?.age);
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

    // Command generation helpers
    generatePlaceholderCommands(category, count) {
        const commands = {};
        for (let i = 1; i <= count; i++) {
            const cmdName = `${category}${i}`;
            commands[cmdName] = async (sock, msg) => {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `${category.toUpperCase()} Command ${i} executed!`
                });
            };
        }
        return commands;
    }

    // User preferences and customization
    async setUserPreference(userId, setting, value) {
        const users = this.data.users || {};
        if (!users[userId]) {
            users[userId] = { xp: 0, level: 1, preferences: {} };
        }
        if (!users[userId].preferences) {
            users[userId].preferences = {};
        }
        users[userId].preferences[setting] = value;
        this.data.users = users;
        await this.saveStore();
    }

    getUserPreference(userId, setting) {
        const users = this.data.users || {};
        return users[userId]?.preferences?.[setting];
    }
}

module.exports = new Store();