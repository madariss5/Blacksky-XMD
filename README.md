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

## 🚀 Heroku Deployment

### Prerequisites
1. A Heroku account
2. Heroku CLI installed locally
3. WhatsApp session credentials (creds.json from your local bot)

### Required Buildpacks
Add these buildpacks in your Heroku app (Settings > Buildpacks):
1. `heroku/nodejs`
2. `https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git`

### Environment Variables
Set the following in Heroku (Settings > Config Vars):
```env
# Required
OWNER_NAME=Your Name
OWNER_NUMBER=1234567890@s.whatsapp.net
LOG_LEVEL=info
NODE_ENV=production
PREFIX=!
BOT_NAME=BlackSky-MD
USE_PAIRING=true

# Optional API Keys (if using related features)
OPENAI_API_KEY=your_openai_key
ANIME_API_KEY=your_anime_key
IMAGE_API_KEY=your_image_key
```

### Session Persistence
Since Heroku has an ephemeral filesystem, you need to handle session persistence:

1. After successfully running the bot locally, locate your `creds.json` file
2. Save the file content securely
3. In Heroku, add a new Config Var:
   - Name: `SESSION_DATA`
   - Value: [Paste your creds.json content]

### Deployment Steps
1. Initialize Git in your project (if not already done):
```bash
git init
git add .
git commit -m "Initial commit"
```

2. Create a new Heroku app:
```bash
heroku create your-app-name
```

3. Add buildpacks:
```bash
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git
```

4. Set environment variables:
```bash
heroku config:set OWNER_NAME="Your Name"
heroku config:set OWNER_NUMBER="1234567890@s.whatsapp.net"
heroku config:set LOG_LEVEL=info
heroku config:set NODE_ENV=production
heroku config:set PREFIX="!"
heroku config:set BOT_NAME="BlackSky-MD"
heroku config:set USE_PAIRING=true
```

5. Deploy your code:
```bash
git push heroku main
```

6. Enable the worker dyno:
```bash
heroku ps:scale worker=1
```

### Post-Deployment
1. Check logs for any issues:
```bash
heroku logs --tail
```

2. Monitor the bot's status in Heroku dashboard
3. Test basic commands to ensure functionality

### Troubleshooting
1. If the bot disconnects:
   - Check Heroku logs for errors
   - Verify environment variables
   - Ensure SESSION_DATA is properly set

2. If media commands fail:
   - Verify ffmpeg buildpack is properly installed
   - Check storage limits on your Heroku dyno

3. For other issues:
   - Review application logs
   - Ensure all buildpacks are properly installed
   - Verify your dyno is running

## 🛠️ Configuration
Create a `.env` file with:
```env
OWNER_NAME=Your Name
OWNER_NUMBER=1234567890@s.whatsapp.net
BOT_NAME=BlackSky-MD
PREFIX=!
LOG_LEVEL=info
```

## 📜 Available Commands

### Basic Commands
- `.menu` - Show command menu
- `.help` - Show help message
- `.ping` - Check bot response
- `.info` - Get bot information

### Group Commands
- `.kick @user` - Kick user
- `.promote @user` - Promote to admin
- `.demote @user` - Demote from admin
- `.everyone` - Tag all members

### Fun Commands
- `.slap @user` - Slap someone with sticker
- `.hug @user` - Hug someone with sticker
- `.pat @user` - Pat someone with sticker
- `.dance` - Show dance sticker
- `.rps` - Play rock, paper, scissors
- `.meme` - Get random meme

### User Commands
- `.register <name> <age>` - Register your profile
- `.profile` - View your profile
- `.daily` - Get daily rewards
- `.rank` - Check your rank
- `.inventory` - View your inventory

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