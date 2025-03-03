#!/bin/bash

# Error handling
set -e
trap 'echo "Error on line $LINENO"' ERR

# Function to log messages with timestamp
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Print system info
log "Starting BlackSky-MD bot..."
log "System Information:"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
if command -v neofetch &> /dev/null; then
    neofetch --stdout
fi

# Create required directories with proper permissions
log "Setting up directories..."
for dir in auth_info_baileys auth_info temp database; do
    mkdir -p "$dir"
    chmod 755 "$dir"
    log "Created directory: $dir"
done

# Cleanup any existing session
log "Cleaning up existing sessions..."
if [ -d "auth_info_baileys" ]; then
    rm -rf auth_info_baileys/*
    log "Cleared auth_info_baileys/"
fi

if [ -d "auth_info" ]; then
    rm -rf auth_info/*
    log "Cleared auth_info/"
fi

# Verify environment variables (only in production)
if [ "$NODE_ENV" = "production" ]; then
    log "Verifying environment variables for production..."
    required_vars=("OWNER_NUMBER" "OWNER_NAME" "BOT_NAME" "SESSION_ID")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log "Error: Required environment variable $var is not set"
            exit 1
        fi
    done
else
    log "Running in development mode, skipping strict environment checks"
    # Set default values for development
    : ${OWNER_NUMBER:="1234567890"}
    : ${OWNER_NAME:="Dev User"}
    : ${BOT_NAME:="BlackSky-MD"}
    : ${SESSION_ID:="dev-session"}
fi

# Set Node.js flags for better performance
export NODE_OPTIONS="--max-old-space-size=2560 --expose-gc"

# Start the bot with optimized settings
log "Starting bot with optimized settings..."
if [ "$NODE_ENV" = "production" ]; then
    log "Running in production mode"
    exec node --optimize_for_size --max_old_space_size=2560 index.js
else
    log "Running in development mode"
    exec node index.js
fi