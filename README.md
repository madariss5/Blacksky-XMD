# 𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻
A WhatsApp Multi-Device bot using Node.js and Baileys library.

## 🚀 Features
- 🌟 Multi-Device Support
- 👥 Group Management
- 🎮 Fun Commands with Stickers
- 📊 User Leveling System
- 🔒 Anti-link Protection
- 🎯 Poll Creation
- 👑 Owner Commands
- 📝 User Registration
- 💫 100+ Dynamic Commands
- 🔐 Dual Authentication (QR & Pairing)

## 📦 Installation

### Prerequisites
- Node.js 16 or higher
- A WhatsApp account

### Setup
1. Clone the repository:
```bash
git clone https://github.com/yourusername/blacksky-md.git
cd blacksky-md
```

2. Install dependencies:
```bash
npm install
```

3. Start the bot:
```bash
npm start
```

4. Scan the QR code with WhatsApp (Linked Devices > Link a Device)

## 🛠️ Configuration
Create a `.env` file with:
```env
OWNER_NAME=Your Name
OWNER_NUMBER=1234567890@s.whatsapp.net
```

## 📜 Available Commands

### Basic Commands
- `!menu` - Show command menu
- `!help` - Show help message
- `!ping` - Check bot response
- `!info` - Get bot information

### Group Commands
- `!kick @user` - Kick user
- `!promote @user` - Promote to admin
- `!demote @user` - Demote from admin
- `!everyone` - Tag all members

### Fun Commands
- `!slap @user` - Slap someone with sticker
- `!hug @user` - Hug someone with sticker
- `!pat @user` - Pat someone with sticker
- `!dance` - Show dance sticker
- `!rps` - Play rock, paper, scissors
- `!meme` - Get random meme

### User Commands
- `!register <name> <age>` - Register your profile
- `!profile` - View your profile
- `!daily` - Get daily rewards
- `!rank` - Check your rank
- `!inventory` - View your inventory

## 🔧 Development
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## ⚠️ Note
This is not an official WhatsApp product. This project was created for educational purposes only. Use at your own risk.

## Troubleshooting
- If you see "Error: Invalid QR code", just wait - a new QR code will appear
- If pairing code doesn't work, try scanning the QR code instead
- If bot disconnects, it will automatically try to reconnect
- For other issues, create an issue in this repository

## Support
For support:
1. Open an issue in this repository
2. Join our WhatsApp group [here](https://chat.whatsapp.com/your-group-link)