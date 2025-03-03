# 𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻
A highly advanced WhatsApp Multi-Device bot with AI capabilities and robust functionality.

## 🌟 Features
- 📱 Multi-Device Support
- 🤖 Advanced AI Integration with GPT and DALL-E
- 👥 Comprehensive Group Management
- 🎮 Interactive Games & Fun Commands
- 🔒 Enhanced Security Features
- 📊 User Statistics & Leveling
- 💬 Message Anti-Spam & Filtering
- 🎨 Media & Sticker Creation
- 🌐 Multi-Language Support
- 💰 Economy System with Shop
- 🎯 Quests and Achievements
- 🎁 Inventory Management

## 📋 Prerequisites
Before running the bot, ensure you have the following installed:
- Node.js 16+ (Download from [nodejs.org](https://nodejs.org))
- A WhatsApp account
- FFmpeg ([FFmpeg Installation Guide](https://ffmpeg.org/download.html))
- Git (for cloning the repository)

## ⚡️ Quick Deploy
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/madariss5/Blacksky-XMD)

## 🔐 Environment Configuration
Create a `.env` file with the following variables:
```env
# Required Configuration
OWNER_NUMBER=your_whatsapp_number  # e.g., 491234567890 for +49 123 456 7890
OWNER_NAME=your_name
PREFIX=.
BOT_NAME=BLACKSKY-MD
SESSION_ID=blacksky-md

# Optional AI Features
OPENAI_API_KEY=your_openai_api_key

# Optional Configuration
LOG_LEVEL=info
KEEP_ALIVE_INTERVAL=10000
QUERY_TIMEOUT=60000
CONNECT_TIMEOUT=60000
QR_TIMEOUT=40000
RETRY_DELAY=2000
```

## 🚀 Local Installation
```bash
# Clone the repository
git clone https://github.com/blacksky-algorithms/blacksky-md.git

# Enter the project directory
cd blacksky-md

# Install dependencies
npm install

# Create environment configuration
cp .env.example .env
# Edit .env with your configuration

# Start the bot
npm start
```

## 📱 First Time Setup
1. Run the bot using `npm start`
2. Scan the QR code with WhatsApp (Link a device)
3. The bot will automatically:
   - Send the credentials file to your number
   - Send a deployment status message
   - Start accepting commands

## 🔄 Keeping the Bot Online
For 24/7 operation, you can use process managers like PM2:
```bash
# Install PM2
npm install -g pm2

# Start the bot with PM2
pm2 start index.js --name blacksky-bot

# Monitor the bot
pm2 monit

# View logs
pm2 logs blacksky-bot
```

## 🌐 Heroku Deployment
1. Click the Deploy to Heroku button above
2. Fill in the required environment variables:
   - `OWNER_NUMBER`: Your WhatsApp number (e.g., 491234567890)
   - `OWNER_NAME`: Your name
   - `SESSION_ID`: Keep as 'blacksky-md' or set your own
   - `BOT_NAME`: Your bot's name
   - Other optional variables as needed
3. Wait for the deployment to complete
4. The bot will automatically send credentials to your number

## 🔄 Updating the Bot
To update the bot to the latest version:

```bash
# Pull the latest changes
git pull origin main

# Install any new dependencies
npm install

# Restart the bot
npm start
```

Or use the built-in command:
```
.update
```

## 📚 Command Categories
- 🎯 Basic Commands - General bot interactions
- 👥 Group Management - Manage group settings and members
- 🎮 Games & Fun - Interactive commands and games
- 🔧 Utility Tools - Helpful utilities and tools
- 🤖 AI Features - AI-powered interactions
- 📥 Downloaders - Media download capabilities
- 🎵 Music & Media - Audio and media features
- 👑 Owner Commands - Bot administration
- 💰 Economy System - Virtual currency and shop
- 🎨 Media Creation - Stickers and media editing
- 🎯 Achievement System - Rewards and progression

## ⚠️ Important Notes
1. Keep your `.env` file private and never share it
2. Regularly backup your `auth_info` directory
3. Monitor your API usage if using AI features
4. Follow WhatsApp's terms of service
5. Update dependencies regularly for security

## 🆘 Troubleshooting
Common issues and solutions:

1. **Connection Issues**
   - Ensure stable internet connection
   - Check if WhatsApp Web is accessible
   - Clear the `auth_info` directory and rescan QR
   - Verify your session is valid

2. **Dependencies Issues**
   ```bash
   # Clear npm cache
   npm cache clean --force

   # Reinstall dependencies
   rm -rf node_modules
   npm install
   ```

3. **FFmpeg Issues**
   - Verify FFmpeg installation: `ffmpeg -version`
   - Add FFmpeg to system PATH
   - For Heroku, buildpacks are automatically configured

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Credits
- [WhiskeySockets/Baileys](https://github.com/WhiskeySockets/Baileys)
- All contributors and users