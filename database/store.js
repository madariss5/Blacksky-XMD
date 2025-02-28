const fs = require('fs').promises;
const path = require('path');
const logger = require('pino')();

class Store {
    constructor() {
        this.storePath = path.join(__dirname, 'store.json');
        this.data = {
            users: {},
            banned: [],
            bannedGroups: [],
            groups: {} // Added groups property to store group settings
        };
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
                logger.error('Error loading store:', error);
                throw error;
            }
        }
    }

    async saveStore() {
        try {
            await fs.writeFile(this.storePath, JSON.stringify(this.data, null, 2));
        } catch (error) {
            logger.error('Error saving store:', error);
            throw error;
        }
    }

    // User data methods
    async getUserData(userId) {
        try {
            if (!this.data.users[userId]) {
                this.data.users[userId] = {
                    gold: 0,
                    bank: 0,
                    inventory: [],
                    lastDaily: 0,
                    level: 1,
                    xp: 0
                };
                await this.saveStore();
            }
            return this.data.users[userId];
        } catch (error) {
            logger.error('Error getting user data:', error);
            return null;
        }
    }

    async updateUserGold(userId, newGold) {
        try {
            if (!this.data.users[userId]) {
                this.data.users[userId] = {
                    gold: 0,
                    bank: 0,
                    inventory: [],
                    lastDaily: 0,
                    level: 1,
                    xp: 0
                };
            }
            this.data.users[userId].gold = newGold;
            await this.saveStore();
            return true;
        } catch (error) {
            logger.error('Error updating user gold:', error);
            return false;
        }
    }

    async getDailyStatus(userId) {
        try {
            const userData = await this.getUserData(userId);
            if (!userData) return { canClaim: true, timeLeft: 0 };

            const lastDaily = userData.lastDaily || 0;
            const now = Date.now();
            const cooldown = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
            const timeLeft = Math.max(0, cooldown - (now - lastDaily));

            return {
                canClaim: timeLeft === 0,
                timeLeft
            };
        } catch (error) {
            logger.error('Error getting daily status:', error);
            throw error;
        }
    }

    async updateDailyReward(userId, reward) {
        try {
            const userData = await this.getUserData(userId);
            if (!userData) return false;

            userData.gold = (userData.gold || 0) + reward;
            userData.lastDaily = Date.now();
            await this.saveStore();

            // Add XP for claiming daily reward
            await this.addXP(userId, XP_REWARDS.daily);

            return true;
        } catch (error) {
            logger.error('Error updating daily reward:', error);
            return false;
        }
    }

    async updateWeeklyReward(userId, reward) {
        try {
            const userData = await this.getUserData(userId);
            if (!userData) return false;

            userData.gold += reward;
            userData.lastWeekly = Date.now();
            await this.saveStore();
            return true;
        } catch (error) {
            logger.error('Error updating weekly reward:', error);
            return false;
        }
    }

    async updateMonthlyReward(userId, reward) {
        try {
            const userData = await this.getUserData(userId);
            if (!userData) return false;

            userData.gold += reward;
            userData.lastMonthly = Date.now();
            await this.saveStore();
            return true;
        } catch (error) {
            logger.error('Error updating monthly reward:', error);
            return false;
        }
    }

    async getWorkCooldown(userId) {
        try {
            const userData = await this.getUserData(userId);
            if (!userData) return { canWork: true, timeLeft: 0 };

            const lastWork = userData.lastWork || 0;
            const now = Date.now();
            const cooldown = 60 * 60 * 1000; // 1 hour
            const timeLeft = Math.max(0, cooldown - (now - lastWork));

            return {
                canWork: timeLeft === 0,
                timeLeft
            };
        } catch (error) {
            logger.error('Error getting work cooldown:', error);
            throw error;
        }
    }

    async updateWorkReward(userId, reward) {
        try {
            const userData = await this.getUserData(userId);
            if (!userData) return false;

            userData.gold += reward;
            userData.lastWork = Date.now();
            await this.saveStore();
            return true;
        } catch (error) {
            logger.error('Error updating work reward:', error);
            return false;
        }
    }

    // Shop system methods
    async getShopItems() {
        return [
            { id: 'fishing_rod', name: 'Fishing Rod', price: 1000, description: 'Required for fishing' },
            { id: 'pickaxe', name: 'Pickaxe', price: 2000, description: 'Required for mining' },
            { id: 'hunting_rifle', name: 'Hunting Rifle', price: 3000, description: 'Required for hunting' },
            { id: 'laptop', name: 'Laptop', price: 5000, description: 'Increases work earnings' }
        ];
    }

    async buyItem(userId, itemId) {
        try {
            const userData = await this.getUserData(userId);
            if (!userData) return { success: false, error: 'User not found' };

            const shopItems = await this.getShopItems();
            const item = shopItems.find(i => i.id === itemId);

            if (!item) return { success: false, error: 'Item not found' };
            if (userData.gold < item.price) return { success: false, error: 'Insufficient funds' };

            if (!userData.inventory) userData.inventory = {};
            if (!userData.inventory[itemId]) userData.inventory[itemId] = 0;

            userData.inventory[itemId]++;
            userData.gold -= item.price;

            await this.saveStore();
            return { success: true, item };
        } catch (error) {
            logger.error('Error buying item:', error);
            return { success: false, error: error.message };
        }
    }

    async sellItem(userId, itemId, quantity = 1) {
        try {
            const userData = await this.getUserData(userId);
            if (!userData) return { success: false, error: 'User not found' };

            const shopItems = await this.getShopItems();
            const item = shopItems.find(i => i.id === itemId);

            if (!item) return { success: false, error: 'Item not found' };
            if (!userData.inventory?.[itemId] || userData.inventory[itemId] < quantity) {
                return { success: false, error: 'Item not in inventory' };
            }

            const sellPrice = Math.floor(item.price * 0.7); // 70% of original price
            userData.inventory[itemId] -= quantity;
            userData.gold += sellPrice * quantity;

            await this.saveStore();
            return { success: true, amount: sellPrice * quantity };
        } catch (error) {
            logger.error('Error selling item:', error);
            return { success: false, error: error.message };
        }
    }

    // Activity cooldown methods
    async getActivityCooldown(userId, activity) {
        try {
            const userData = await this.getUserData(userId);
            if (!userData) return { canDo: true, timeLeft: 0 };

            const lastTime = userData[`last${activity}`] || 0;
            const now = Date.now();
            const cooldown = 30 * 60 * 1000; // 30 minutes
            const timeLeft = Math.max(0, cooldown - (now - lastTime));

            return {
                canDo: timeLeft === 0,
                timeLeft
            };
        } catch (error) {
            logger.error(`Error getting ${activity} cooldown:`, error);
            throw error;
        }
    }

    async updateActivity(userId, activity, reward) {
        try {
            const userData = await this.getUserData(userId);
            if (!userData) return false;

            userData.gold += reward;
            userData[`last${activity}`] = Date.now();
            await this.saveStore();
            return true;
        } catch (error) {
            logger.error(`Error updating ${activity}:`, error);
            return false;
        }
    }

    // Required methods from other modules
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

        // Level up logic: level = square root of (xp/100)
        const currentLevel = users[userId].level;
        const newLevel = Math.floor(Math.sqrt(users[userId].xp / 100));

        if (newLevel > currentLevel) {
            users[userId].level = newLevel;
            this.data.users = users;
            await this.saveStore();
            return { levelUp: true, newLevel }; // Return level up info
        }

        this.data.users = users;
        await this.saveStore();
        return { levelUp: false };
    }

    getUserStats(userId) {
        const users = this.data.users || {};
        const user = users[userId] || { xp: 0, level: 1 };
        const nextLevelXP = Math.pow((user.level + 1), 2) * 100;
        return {
            ...user,
            nextLevelXP,
            progress: (user.xp / nextLevelXP) * 100
        };
    }

    getUserRank(userId) {
        const users = this.data.users || {};
        const usersList = Object.entries(users)
            .map(([id, data]) => ({ id, xp: data.xp }))
            .sort((a, b) => b.xp - a.xp);

        return usersList.findIndex(user => user.id === userId) + 1;
    }

    // User inventory methods
    getUserInventory(userId) {
        const users = this.data.users || {};
        return users[userId]?.inventory || {};
    }

    async updateUserInventory(userId, inventory) {
        try {
            const users = this.data.users || {};
            if (!users[userId]) {
                users[userId] = { xp: 0, level: 1 };
            }
            users[userId].inventory = inventory;
            this.data.users = users;
            await this.saveStore();
            return true;
        } catch (error) {
            logger.error('Error updating user inventory:', error);
            return false;
        }
    }

    // Required group management methods
    async setGroupSetting(groupId, setting, value) {
        try {
            const groups = this.data.groups || {};
            if (!groups[groupId]) {
                groups[groupId] = {};
            }
            groups[groupId][setting] = value;
            this.data.groups = groups;
            await this.saveStore();
            logger.info('Group setting updated:', { groupId, setting, value });
            return true;
        } catch (error) {
            logger.error('Error setting group setting:', error);
            return false;
        }
    }

    getGroupSetting(groupId, setting) {
        try {
            const groups = this.data.groups || {};
            return groups[groupId]?.[setting];
        } catch (error) {
            logger.error('Error getting group setting:', error);
            return null;
        }
    }

    getGroupSettings(groupId) {
        try {
            const groups = this.data.groups || {};
            return groups[groupId] || {};
        } catch (error) {
            logger.error('Error getting group settings:', error);
            return {};
        }
    }

    async setGroupRules(groupId, rules) {
        try {
            const groups = this.data.groups || {};
            if (!groups[groupId]) {
                groups[groupId] = {};
            }
            groups[groupId].rules = rules;
            this.data.groups = groups;
            await this.saveStore();
            logger.info('Group rules updated:', { groupId });
            return true;
        } catch (error) {
            logger.error('Error setting group rules:', error);
            return false;
        }
    }

    getGroupRules(groupId) {
        try {
            const groups = this.data.groups || {};
            return groups[groupId]?.rules || null;
        } catch (error) {
            logger.error('Error getting group rules:', error);
            return null;
        }
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

    // Warning system methods
    async addWarning(groupId, userId, reason = '', warnedBy) {
        try {
            const groups = this.data.groups || {};
            if (!groups[groupId]) {
                groups[groupId] = { warnings: {} };
            }
            if (!groups[groupId].warnings) {
                groups[groupId].warnings = {};
            }
            if (!groups[groupId].warnings[userId]) {
                groups[groupId].warnings[userId] = [];
            }

            const warning = {
                reason,
                warnedBy,
                timestamp: Date.now()
            };

            groups[groupId].warnings[userId].push(warning);
            this.data.groups = groups;
            await this.saveStore();

            return {
                success: true,
                warningCount: groups[groupId].warnings[userId].length
            };
        } catch (error) {
            logger.error('Error adding warning:', error);
            return { success: false, error: error.message };
        }
    }

    async removeWarning(groupId, userId, index) {
        try {
            const groups = this.data.groups || {};
            if (!groups[groupId]?.warnings?.[userId]) {
                return { success: false, error: 'No warnings found' };
            }

            const warnings = groups[groupId].warnings[userId];
            if (index >= warnings.length) {
                return { success: false, error: 'Invalid warning index' };
            }

            warnings.splice(index, 1);
            if (warnings.length === 0) {
                delete groups[groupId].warnings[userId];
            }

            await this.saveStore();
            return { success: true, remainingWarnings: warnings.length };
        } catch (error) {
            logger.error('Error removing warning:', error);
            return { success: false, error: error.message };
        }
    }

    async getWarnings(groupId, userId) {
        try {
            const groups = this.data.groups || {};
            return groups[groupId]?.warnings?.[userId] || [];
        } catch (error) {
            logger.error('Error getting warnings:', error);
            return [];
        }
    }

    async clearWarnings(groupId, userId) {
        try {
            const groups = this.data.groups || {};
            if (groups[groupId]?.warnings?.[userId]) {
                delete groups[groupId].warnings[userId];
                await this.saveStore();
            }
            return { success: true };
        } catch (error) {
            logger.error('Error clearing warnings:', error);
            return { success: false, error: error.message };
        }
    }

    async isNSFWEnabled(groupId) {
        try {
            const groupSettings = await this.getGroupSettings(groupId);
            return !!groupSettings?.nsfw; // Convert to boolean
        } catch (error) {
            logger.error('Error checking NSFW status:', error);
            return false;
        }
    }
}

// Add XP reward amounts
const XP_REWARDS = {
    message: 5,         // Base XP for sending a message
    command: 10,        // Base XP for using a command
    reaction: 15,       // XP for using reaction commands
    daily: 100,        // Daily reward XP
    levelMultiplier: 1.5 // Multiplier for higher levels
};

module.exports = new Store();