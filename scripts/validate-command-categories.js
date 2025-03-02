const fs = require('fs-extra');
const path = require('path');
const config = require('../config');
const logger = require('pino')();

async function validateCommandCategory(categoryFile) {
    try {
        const filePath = path.join(__dirname, '../commands', categoryFile);
        if (!fs.existsSync(filePath)) {
            return {
                file: categoryFile,
                error: 'File not found',
                status: false
            };
        }

        delete require.cache[require.resolve(filePath)];
        const commands = require(filePath);

        return {
            file: categoryFile,
            commandCount: Object.keys(commands).length,
            commands: Object.keys(commands),
            status: true
        };
    } catch (error) {
        return {
            file: categoryFile,
            error: error.message,
            status: false
        };
    }
}

async function main() {
    const commandsDir = path.join(__dirname, '../commands');
    const files = await fs.readdir(commandsDir);
    const results = [];

    for (const file of files) {
        if (file.endsWith('.js')) {
            const result = await validateCommandCategory(file);
            results.push(result);
            console.log('\nValidating:', file);
            console.log('Status:', result.status ? '✅ OK' : '❌ Failed');
            if (result.status) {
                console.log('Commands:', result.commands.length);
                console.log('Implemented:', result.commands.join(', '));
            } else {
                console.log('Error:', result.error);
            }
        }
    }

    return results;
}

main().catch(console.error);
