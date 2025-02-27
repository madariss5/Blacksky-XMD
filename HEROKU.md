# Heroku Deployment Guide

## Environment Variables Setup

1. Go to your Heroku Dashboard and select your app
2. Click on "Settings" tab
3. Under "Config Vars", click "Reveal Config Vars"
4. Add the following required variables:

### Required Variables
- `OWNER_NAME`: Your name as the bot owner
- `OWNER_NUMBER`: Your WhatsApp number with country code (format: 1234567890@s.whatsapp.net)

### Optional Variables
- `BOT_NAME`: Name for your bot (default: BlackSky-MD)
- `PREFIX`: Command prefix (default: !)
- `USE_PAIRING`: Enable pairing code authentication (default: true)

## Deployment Steps

1. Fork the repository
2. Create a new Heroku app
3. Connect your GitHub repository to Heroku
4. Set up the environment variables as described above
5. Deploy the app
6. Check the logs for the QR code or pairing code
7. Scan the QR code with WhatsApp to authenticate

## Important Notes

- The bot requires a worker dyno, not a web dyno
- Make sure you have the proper buildpacks installed (heroku/nodejs)
- Keep your creds.json file secure and never commit it to version control
- If using pairing code, make sure USE_PAIRING is set to "true"

## Troubleshooting

If you encounter any issues:
1. Check the Heroku logs for errors
2. Verify all environment variables are set correctly
3. Ensure your WhatsApp number format is correct
4. Try restarting the dyno if the bot becomes unresponsive

For support, create an issue in the GitHub repository.
