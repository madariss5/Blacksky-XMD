# 𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻
A WhatsApp Multi-Device bot using Node.js and Baileys library.

## 🚀 Quick Start (Replit)
1. Click "Fork" or "Use Template" to create your own copy
2. The bot will automatically start and show both connection options:
   - Scan QR Code (Default)
   - Use Pairing Code (Optional)
3. Choose your preferred connection method:
   - QR Code: Scan with WhatsApp (Linked Devices > Link a Device)
   - Pairing Code: Enter the code shown in WhatsApp
4. Bot is ready to use! Try `!menu` to see available commands

## ⚙️ Optional Configuration
Want to customize the bot? Add these in your Replit Secrets:
- `OWNER_NAME`: Your name (default: "Bot Owner")
- `OWNER_NUMBER`: Your WhatsApp number (format: number@s.whatsapp.net)
- `BOT_NUMBER`: Bot's phone number for pairing code (no '+' or spaces)
- `USE_PAIRING`: Set to "true" to enable pairing code (default: false)

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
- 🔐 Dual Authentication (QR & Pairing)

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
- If you see "Error: Invalid QR code", just wait - a new QR code will appear
- If pairing code doesn't work, try scanning the QR code instead
- If bot disconnects, it will automatically try to reconnect
- For other issues, create an issue in this repository

## Support
For support:
1. Open an issue in this repository
2. Join our WhatsApp group [here](https://chat.whatsapp.com/your-group-link)

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.