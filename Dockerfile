# Use Node.js 16 as base image
FROM node:16-slim

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    git \
    python3 \
    ffmpeg \
    webp \
    imagemagick \
    chromium \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Create required directories
RUN mkdir -p \
    auth_info \
    auth_info_baileys \
    auth_info/sessions \
    auth_info/creds \
    temp \
    database

# Set permissions
RUN chmod -R 755 .

# Set environment variable for port
ENV PORT=5000

# Start the bot
CMD ["npm", "start"]
