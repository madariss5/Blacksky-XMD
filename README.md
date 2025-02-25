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

3. Configure environment variables:
Create a `.env` file with:
```env
OWNER_NAME=YourName
OWNER_NUMBER=1234567890@s.whatsapp.net
```

4. Run the bot
```bash
npm start
```

5. Scan the QR code with WhatsApp to start

## Heroku Deployment
1. Run the bot locally first to get session data
2. When the bot connects, copy the `SESSION_ID` and `SESSION_DATA` values from console
3. Create a new Heroku app
4. Add the following Config Vars in Heroku Settings:
   - `SESSION_ID`: Your session ID from step 2
   - `SESSION_DATA`: Your session data from step 2
   - `OWNER_NAME`: Your name
   - `OWNER_NUMBER`: Your WhatsApp number (format: number@s.whatsapp.net)

5. Deploy to Heroku:
   ```bash
   heroku login
   heroku git:remote -a your-app-name
   git push heroku main
   ```

6. Enable the worker in Resources tab

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

## Troubleshooting
- If the bot disconnects, restart it and scan the QR code again
- For Heroku deployment issues, ensure all config vars are set correctly
- Make sure your WhatsApp is updated to the latest version

## Support
For support:
1. Open an issue in this repository
2. Join our WhatsApp group [here](https://chat.whatsapp.com/your-group-link)

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.