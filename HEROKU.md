# Heroku Deployment Guide

## Prerequisites
1. A Heroku account
2. Heroku CLI installed
3. Git installed
4. Node.js installed locally

## Environment Variables Setup

1. Go to your Heroku Dashboard and select your app
2. Click on "Settings" tab
3. Under "Config Vars", click "Reveal Config Vars"
4. Add the following required variables:

### Required Variables
- `SESSION_ID`: Your WhatsApp session ID (will be provided after first local run)
- `OWNER_NAME`: Your name as the bot owner
- `OWNER_NUMBER`: Your WhatsApp number (format: country code + number, e.g., 1234567890)

### Optional Variables
- `BOT_NAME`: Name for your bot (default: BlackSky-MD)
- `PREFIX`: Command prefix (default: !)
- `USE_PAIRING`: Enable pairing code authentication (default: true)

## Getting Your Session ID

1. Run the bot locally first:
```bash
npm install
npm start
```

2. Scan the QR code with WhatsApp (Linked Devices > Link a Device)
3. After successful connection, the bot will send you the session ID in your WhatsApp
4. Copy this session ID and add it to your Heroku Config Vars

## Deployment Steps

1. Fork the repository
2. Create a new Heroku app:
   ```bash
   heroku create your-app-name
   ```

3. Set up the environment variables:
   ```bash
   heroku config:set OWNER_NAME="Your Name"
   heroku config:set OWNER_NUMBER="1234567890"
   heroku config:set SESSION_ID="your_session_id"
   ```

4. Enable worker dyno (IMPORTANT):
   ```bash
   heroku ps:scale web=0 worker=1
   ```

5. Deploy to Heroku:
   ```bash
   git push heroku main
   ```

## Important Notes

- The bot MUST run on a worker dyno, not a web dyno
- Make sure you have the proper buildpacks installed:
  ```bash
  heroku buildpacks:set heroku/nodejs
  ```
- Keep your session ID secure and never share it
- If using pairing code, make sure USE_PAIRING is set to "true"
- Free dynos have limitations, consider upgrading for better reliability

## Verifying Deployment

1. Check your deployment logs:
   ```bash
   heroku logs --tail
   ```

2. Make sure the worker dyno is running:
   ```bash
   heroku ps
   ```

## Troubleshooting

If you encounter any issues:
1. Check the Heroku logs for errors: `heroku logs --tail`
2. Verify all environment variables are set correctly
3. Ensure your WhatsApp number format is correct
4. Try restarting the dyno: `heroku restart`
5. Make sure worker dyno is active (not web dyno)
6. Check if session ID is valid and properly formatted

For support, create an issue in the GitHub repository.