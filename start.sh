#!/bin/bash

# Print system info
echo "Starting BlackSky-MD bot..."
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Create required directories
mkdir -p auth_info_baileys auth_info temp database

# Cleanup any existing session
rm -rf auth_info_baileys/* auth_info/*

# Start the bot with optimized memory settings
exec node --max-old-space-size=2560 index.js
