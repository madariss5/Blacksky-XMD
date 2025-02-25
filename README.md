# 𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻
A WhatsApp Multi-Device bot using Node.js and Baileys library.

## Features
- 🚀 Multi-Device Support
- 👥 Group Management
- 🎮 Fun Commands
- 📊 User Leveling System
- 🔒 Anti-link Protection
- 🎯 Poll Creation
- 👑 Owner Commands
- 📝 User Registration
- 💫 100+ Dynamic Commands

## Setup
1. Clone the repository
```bash
git clone https://github.com/your-username/blacksky-md
cd blacksky-md
```

2. Install dependencies
```bash
npm install
```

3. Run the bot
```bash
npm start
```

4. Scan the QR code with WhatsApp

## Heroku Deployment
1. Fork this repository
2. Create a new Heroku app
3. Connect your GitHub repository
4. Add the following Config Vars in Heroku Settings:
   - `SESSION_ID`: Your WhatsApp session ID (get this after scanning QR locally)
   - `OWNER_NAME`: Your name
   - `OWNER_NUMBER`: Your WhatsApp number (format: number@s.whatsapp.net)

5. Deploy the app and enable the worker in Resources tab

## Commands
Use `!help` to see all available commands.

### Basic Commands
- `!menu [page]` - Show command menu
- `!help` - Show help message
- `!ping` - Check bot response

### User Commands
- `!register <name> <age>` - Register your profile
- `!profile` - View your profile
- `!me` - View your stats
- `!level` - View your level

### Group Commands
- `!kick @user` - Kick user
- `!promote @user` - Promote to admin
- `!demote @user` - Demote from admin
- `!everyone` - Tag all members

### Owner Commands
- `!broadcast` - Send message to all chats
- `!ban/unban` - Manage user bans
- `!bangroup/unbangroup` - Manage group bans
- `!setprefix` - Change bot prefix
- `!setbotname` - Change bot name

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support
For support, join our WhatsApp group [here](https://chat.whatsapp.com/your-group-link).
