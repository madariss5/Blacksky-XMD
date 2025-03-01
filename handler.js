module.exports = async (hans, m, chatUpdate, store) => {
    try {
        const prefix = '!'; // Your prefix here
        const isCmd = m.body.startsWith(prefix);
        const command = isCmd ? m.body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : '';
        const args = m.body.trim().split(/ +/).slice(1);
        
        // Basic command handler
        switch (command) {
            case 'hi':
            case 'hello':
                await m.reply('Hello! How can I help you today?');
                break;
                
            case 'ping':
                const start = Date.now();
                await m.reply('Testing ping...');
                const end = Date.now();
                await m.reply(`Pong! Latency: ${end - start}ms`);
                break;
                
            case 'menu':
                const menuText = `
🤖 *${botName} Menu* 🤖

*Basic Commands*
• ${prefix}hi - Say hello
• ${prefix}ping - Check bot latency
• ${prefix}menu - Show this menu

*More commands coming soon!*
                `;
                await m.reply(menuText);
                break;
                
            default:
                if (isCmd) {
                    await m.reply(`Command *${command}* not found. Type ${prefix}menu to see available commands.`);
                }
        }
        
    } catch (err) {
        console.error("Error in command handler: ", err);
        await m.reply("An error occurred while processing your command.");
    }
};
