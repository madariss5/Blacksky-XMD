FROM node:20-slim

# Set environment variables for better Docker and Node.js performance
ENV NODE_ENV=production \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    DEBIAN_FRONTEND=noninteractive \
    NODE_OPTIONS=--max_old_space_size=2560 \
    npm_config_unsafe_perm=true

# Install system dependencies including media processing tools
RUN apt-get update && apt-get install -y \
    python3 \
    git \
    ffmpeg \
    webp \
    imagemagick \
    neofetch \
    chromium \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with production flag and clean npm cache
RUN npm ci --only=production && \
    npm cache clean --force

# Copy project files
COPY . .

# Create directories for session storage
RUN mkdir -p \
    /app/auth_info_baileys \
    /app/auth_info \
    /app/temp \
    /app/database

# Create startup script
RUN echo '#!/bin/bash\n\
# Print system info\n\
neofetch\n\
\n\
# Cleanup session directories\n\
rm -rf /app/auth_info_baileys/* /app/auth_info/*\n\
\n\
# Create required directories\n\
mkdir -p /app/auth_info_baileys /app/auth_info /app/temp /app/database\n\
\n\
# Start the application\n\
exec node --max-old-space-size=2560 index.js\n\
' > /app/start.sh && chmod +x /app/start.sh

# Set default port
ENV PORT=5000
EXPOSE 5000

# Start command using the startup script
CMD ["/app/start.sh"]