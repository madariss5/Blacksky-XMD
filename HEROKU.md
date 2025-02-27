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
- `LOG_LEVEL`: Logging level (default: info)
- `NODE_ENV`: Should be set to "production"
- `BOT_NAME`: Name for your bot (default: BlackSky-MD)
- `PREFIX`: Command prefix (default: !)
- `USE_PAIRING`: Enable pairing code authentication (default: true)

## Deployment Steps

1. Login to Heroku CLI:
   ```bash
   heroku login
   ```

2. Create a new Heroku app (if not already created):
   ```bash
   heroku create your-app-name
   ```

3. Set up environment variables:
   ```bash
   heroku config:set OWNER_NAME="Your Name"
   heroku config:set OWNER_NUMBER="1234567890"
   heroku config:set NODE_ENV="production"
   ```

4. Configure dyno type (IMPORTANT):
   ```bash
   heroku ps:type worker=basic
   ```

5. Deploy to Heroku:
   ```bash
   git push heroku main
   ```

6. Enable worker dyno and disable web dyno:
   ```bash
   heroku ps:scale web=0 worker=1
   ```

7. Check logs to ensure proper startup:
   ```bash
   heroku logs --tail
   ```

## Important Notes

1. The bot MUST run on a worker dyno, not a web dyno
2. The SESSION_ID will be sent to the bot's own chat after first connection
3. Copy the SESSION_ID from the bot's chat and set it in Heroku:
   ```bash
   heroku config:set SESSION_ID="your_session_id"
   ```
4. After setting SESSION_ID, restart the dyno:
   ```bash
   heroku restart
   ```
5. Make sure you have the proper buildpacks installed:
   ```bash
   heroku buildpacks:set heroku/nodejs
   ```
6. Keep your session ID secure and never share it
7. If using pairing code, make sure USE_PAIRING is set to "true"


## Troubleshooting

If you encounter any issues:
1. Check the Heroku logs: `heroku logs --tail`
2. Verify all environment variables are set correctly
3. Ensure your WhatsApp number format is correct
4. Try restarting the dyno: `heroku restart`
5. Make sure worker dyno is active (not web dyno)
6. Check if session ID is valid and properly formatted
7. If needed, reset the authentication:
   ```bash
   heroku run rm -rf auth_info_baileys/
   heroku restart
   ```

For support, create an issue in the GitHub repository.