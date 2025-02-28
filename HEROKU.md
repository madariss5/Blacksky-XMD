# Heroku Deployment Guide

## Recent Updates
- Added proper port binding for web process
- Fixed duplicate status messages
- Improved credential handling

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
- `PREFIX`: Command prefix (default: .)
- `USE_PAIRING`: Enable pairing code authentication (default: true)

## Deployment Steps

1. Login to Heroku CLI:
   ```bash
   heroku login
   ```

2. Add Heroku remote (if not already added):
   ```bash
   heroku git:remote -a your-app-name
   ```

3. Set environment variables:
   ```bash
   heroku config:set NODE_ENV="production"
   heroku config:set OWNER_NAME="Your Name"
   heroku config:set OWNER_NUMBER="1234567890"
   heroku config:set LOG_LEVEL="info"
   ```

4. Deploy the code:
   ```bash
   git push heroku main
   ```

5. Scale dynos properly:
   ```bash
   heroku ps:scale web=1 worker=0
   ```

6. Verify deployment:
   ```bash
   heroku logs --tail
   ```

## Verification Steps

1. Check the logs for proper port binding:
   - Look for: "Server is running on port [PORT]"

2. Monitor status messages:
   - Should see only one "Bot connected successfully" message
   - Status updates should not be duplicated

3. Verify credential handling:
   - The session ID should only be sent once to the bot's own chat
   - Check for "Credentials were already sent, skipping" message


## Troubleshooting

If you encounter issues:

1. Check logs for errors:
   ```bash
   heroku logs --tail
   ```

2. Restart the application:
   ```bash
   heroku restart
   ```

3. Clear credentials and restart if needed:
   ```bash
   heroku run rm -rf auth_info_baileys/
   heroku restart
   ```

For support, please create an issue in the GitHub repository.