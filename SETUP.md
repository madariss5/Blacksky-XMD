# GitHub Setup Instructions

1. Create a new repository on GitHub:
   - Go to https://github.com/new
   - Name: blacksky-md
   - Description: A WhatsApp Multi-Device bot using Node.js and Baileys library
   - Choose "Public" repository
   - Don't initialize with README (we already have one)

2. Initialize Git and push your code:
```bash
# Initialize Git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: BlackSky-MD WhatsApp Bot"

# Add GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/blacksky-md.git

# Push to GitHub
git push -u origin main
```

3. Important Notes:
   - Make sure to replace YOUR_USERNAME with your GitHub username
   - The .gitignore file is already set up to exclude sensitive files
   - The auth_info_baileys/ directory and creds.json are excluded for security
   - Environment variables should be set up separately on deployment

4. For Heroku Deployment:
   - The creds.json file should be added manually after successful QR scan
   - Set up environment variables in Heroku dashboard:
     - OWNER_NAME
     - OWNER_NUMBER
