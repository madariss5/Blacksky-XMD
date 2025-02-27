# Heroku Deployment Guide

## Environment Variables Setup

1. Go to your Heroku Dashboard and select your app
2. Click on "Settings" tab
3. Under "Config Vars", click "Reveal Config Vars"
4. Add the following required variables:

### Required Variables
- `SESSION_ID`: Your WhatsApp session ID (will be provided after first local run)
- `OWNER_NAME`: Your name as the bot owner
- `OWNER_NUMBER`: Your WhatsApp number with country code (format: 1234567890@s.whatsapp.net)

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
2. Create a new Heroku app
3. Connect your GitHub repository to Heroku
4. Set up the environment variables as described above
5. Deploy the app

## Important Notes

- The bot requires a worker dyno, not a web dyno
- Make sure you have the proper buildpacks installed (heroku/nodejs)
- Keep your session ID secure and never share it
- If using pairing code, make sure USE_PAIRING is set to "true"

## Troubleshooting

If you encounter any issues:
1. Check the Heroku logs for errors
2. Verify all environment variables are set correctly
3. Ensure your WhatsApp number format is correct
4. Try restarting the dyno if the bot becomes unresponsive

For support, create an issue in the GitHub repository.