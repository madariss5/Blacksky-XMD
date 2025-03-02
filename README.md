# 𝔹𝕃𝔸ℂ𝕂𝕊𝕂𝕐-𝕄𝔻
A highly advanced WhatsApp Multi-Device bot with AI capabilities and robust functionality.

## 🌟 Features
- 📱 Multi-Device Support
- 🤖 Advanced AI Integration
- 👥 Comprehensive Group Management
- 🎮 Interactive Games & Fun Commands
- 🔒 Enhanced Security Features
- 📊 User Statistics & Leveling
- 💬 Message Anti-Spam & Filtering
- 🎨 Media & Sticker Creation
- 🌐 Multi-Language Support

## 📋 Prerequisites
Before running the bot, ensure you have the following installed:
- Node.js 16+ (Download from [nodejs.org](https://nodejs.org))
- A WhatsApp account
- FFmpeg ([FFmpeg Installation Guide](https://ffmpeg.org/download.html))
- Git (for cloning the repository)

## ⚡️ Local Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/blacksky-md.git

# Enter the project directory
cd blacksky-md

# Install dependencies
npm install

# Create environment configuration
cp .env.example .env
# Edit .env with your configuration
```

## 🔐 Environment Configuration
Create a `.env` file with the following variables:
```env
# Required Configuration
OWNER_NUMBER=your_whatsapp_number
OWNER_NAME=your_name
PREFIX=!
BOT_NAME=BLACKSKY-MD

# Optional AI Features (if you want to use AI commands)
OPENAI_API_KEY=your_openai_api_key
REPLICATE_API_TOKEN=your_replicate_token

# Optional API Keys for Additional Features
NEWS_API_KEY=your_newsapi_key
WEATHER_API_KEY=your_openweather_key
```

## 🚀 Running the Bot
```bash
# Start the bot
npm start

# The bot will generate a QR code
# Scan the QR code with WhatsApp to log in
```

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

## 📚 Command Categories
- 🎯 Basic Commands - General bot interactions
- 👥 Group Management - Manage group settings and members
- 🎮 Games & Fun - Interactive commands and games
- 🔧 Utility Tools - Helpful utilities and tools
- 🤖 AI Features - AI-powered interactions
- 📥 Downloaders - Media download capabilities
- 🎵 Music & Media - Audio and media features
- 👑 Owner Commands - Bot administration

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