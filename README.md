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
- Git

### Local Setup
1. Clone the repository:
```bash
git clone https://github.com/yourusername/blacksky-md.git
cd blacksky-md
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
- Copy `.env.example` to `.env`
- Update the variables in `.env` file

4. Start the bot:
```bash
npm start
```

5. Scan the QR code with WhatsApp (Linked Devices > Link a Device)

## 🚀 Heroku Deployment

### Method 1: Standard Deployment
Follow these steps for a standard Node.js deployment:

1. Add buildpacks in Heroku (Settings > Buildpacks):
   - `heroku/nodejs`
   - `https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git`

2. Set up environment variables in Heroku (Settings > Config Vars).

3. Deploy using Heroku CLI:
```bash
heroku create your-app-name
git push heroku main
heroku ps:scale worker=1
```

### Method 2: Docker Deployment (Recommended)
This method uses Docker for better dependency management:

1. Enable Docker deployment:
```bash
heroku stack:set container
```

2. Set up environment variables in Heroku (Settings > Config Vars):
```bash
heroku config:set OWNER_NAME="Your Name"
heroku config:set OWNER_NUMBER="1234567890@s.whatsapp.net"
heroku config:set LOG_LEVEL=info
heroku config:set NODE_ENV=production
heroku config:set PREFIX="!"
heroku config:set BOT_NAME="BlackSky-MD"
heroku config:set USE_PAIRING=true
```

3. Deploy:
```bash
git push heroku main
```

The Docker deployment will automatically:
- Install all required system dependencies (ffmpeg, etc.)
- Set up Node.js environment
- Handle process management

### Post-Deployment (Both Methods)
1. Check logs:
```bash
heroku logs --tail
```

2. Monitor the bot's status in Heroku dashboard
3. Test basic commands to ensure functionality


## 🤝 Contributing
1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## ⚠️ Note
This is not an official WhatsApp product. This project was created for educational purposes only. Use at your own risk.

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support
For support:
1. Open an issue in this repository
2. Join our WhatsApp group [here](https://chat.whatsapp.com/your-group-link)