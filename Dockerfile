FROM node:20-slim

# Set environment variables
ENV NODE_ENV=production \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    git \
    ffmpeg \
    webp \
    imagemagick \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with production flag and clean npm cache
RUN npm ci --only=production && \
    npm cache clean --force

# Copy project files
COPY . .

# Create directories for session storage
RUN mkdir -p /app/auth_info_baileys /app/auth_info

# Set default port
ENV PORT=5000

# Expose port
EXPOSE 5000

# Create startup script for better error handling
RUN echo '#!/bin/sh\n\
# Cleanup session directories\n\
rm -rf /app/auth_info_baileys/* /app/auth_info/*\n\
\n\
# Start the application\n\
exec node index.js\n\
' > /app/start.sh && chmod +x /app/start.sh

# Start command with session cleanup
CMD ["/app/start.sh"]