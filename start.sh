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

# Production environment checks
if [ "$NODE_ENV" = "production" ]; then
    log "Running in production mode..."

    # Verify essential environment variables
    required_vars=("OWNER_NUMBER" "OWNER_NAME" "BOT_NAME" "SESSION_ID" "DATABASE_URL")
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

    # Set production Node.js flags
    export NODE_OPTIONS="--max-old-space-size=2560"
    log "Production Node.js flags set"
else
    # Development environment setup
    log "Setting up development environment..."
    export OWNER_NUMBER=${OWNER_NUMBER:-"1234567890"}
    export OWNER_NAME=${OWNER_NAME:-"Dev User"}
    export BOT_NAME=${BOT_NAME:-"BlackSky-MD"}
    export SESSION_ID=${SESSION_ID:-"dev-session"}
    export PREFIX=${PREFIX:-"."}
    export NODE_ENV="development"
fi

# Ensure the application uses port 5000
export PORT=5000
log "Port set to 5000"

# Start the bot
log "Starting bot in ${NODE_ENV} mode..."
exec node index.js