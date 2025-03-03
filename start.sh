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

# Create required directories with proper permissions
log "Setting up directories..."
for dir in auth_info_baileys auth_info temp database; do
    mkdir -p "$dir"
    chmod 755 "$dir"
    log "Created directory: $dir"
done

# Production-specific checks and configurations
if [ "$NODE_ENV" = "production" ]; then
    log "Running in production mode (Heroku)"

    # Verify critical environment variables
    required_vars=("OWNER_NUMBER" "OWNER_NAME" "BOT_NAME" "SESSION_ID")
    missing_vars=()

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done

    if [ ${#missing_vars[@]} -ne 0 ]; then
        log "Error: Missing required environment variables: ${missing_vars[*]}"
        exit 1
    fi

    # Set production-specific Node.js flags
    export NODE_OPTIONS="--max-old-space-size=2560"
    log "Node.js production flags set"


    # Start the bot with production optimizations
    log "Starting bot in production mode..."
    exec node index.js
else
    log "Running in development mode"
    # Set development defaults
    : ${OWNER_NUMBER:="1234567890"}
    : ${OWNER_NAME:="Dev User"}
    : ${BOT_NAME:="BlackSky-MD"}
    : ${SESSION_ID:="dev-session"}

    # Start in development mode
    log "Starting bot in development mode..."
    exec node index.js
fi