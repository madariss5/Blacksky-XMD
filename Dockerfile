FROM node:lts-buster

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ffmpeg \
    imagemagick \
    webp && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source
COPY . .

# Create required directories
RUN mkdir -p \
    auth_info_baileys \
    auth_info \
    temp \
    database && \
    chmod -R 755 \
    auth_info_baileys \
    auth_info \
    temp \
    database

# Expose port 5000
EXPOSE 5000

# Start the bot
CMD ["bash", "start.sh"]