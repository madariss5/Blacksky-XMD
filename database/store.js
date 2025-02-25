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
}

module.exports = new Store();
