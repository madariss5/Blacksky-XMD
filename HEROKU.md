# Heroku Deployment Guide

## Recent Updates
- Added proper credential handling for multi-device auth
- Added port binding for web process
- Improved error handling and reconnection
- Added detailed environment variable setup

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
- `OPENAI_API_KEY`: Your OpenAI API key for AI features
- `REPLICATE_API_TOKEN`: Your Replicate API token for image features
- `OWNER_NAME`: Your name as the bot owner
- `OWNER_NUMBER`: Your WhatsApp number (format: country code + number, e.g., 1234567890)

### Optional Variables
- `LOG_LEVEL`: Logging level (default: info)
- `NODE_ENV`: Should be set to "production"
- `BOT_NAME`: Name for your bot (default: BlackSky-MD)
- `PREFIX`: Command prefix (default: .)

## Deployment Steps

1. Login to Heroku CLI:
   ```bash
   heroku login
   ```

2. Add Heroku remote (if not already added):
   ```bash
   heroku git:remote -a your-app-name
   ```

3. Set buildpacks:
   ```bash
   heroku buildpacks:set heroku/nodejs
   ```

4. Set environment variables:
   ```bash
   heroku config:set NODE_ENV="production"
   heroku config:set OWNER_NAME="Your Name"
   heroku config:set OWNER_NUMBER="1234567890"
   ```

5. Deploy the code:
   ```bash
   git push heroku main
   ```

6. Scale dynos properly:
   ```bash
   heroku ps:scale web=0 worker=1
   ```

7. After first successful connection, check that creds.json is created:
   ```bash
   heroku run ls -la
   ```

## Verification Steps

1. Check the logs for proper connection:
   ```bash
   heroku logs --tail
   ```

2. Look for these success indicators:
   - "WhatsApp connection established successfully!"
   - "Credentials saved successfully"
   - "Bot is now active and ready to use!"

3. Verify credential handling:
   - Check for "creds.json" file in the app directory
   - Monitor auto-reconnection if connection drops

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
   heroku run rm creds.json
   heroku restart
   ```

4. Common Issues:
   - If bot disconnects frequently: Check your internet connection and Heroku dyno status
   - If credentials don't save: Check file permissions and Heroku logs
   - If commands don't work: Verify environment variables are set correctly

## Support
For support:
1. Open an issue in the GitHub repository
2. Check Heroku status page for service disruptions
3. Review logs for specific error messages

Remember to never share your credentials or API keys publicly!