FROM node:18-slim

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Bundle app source
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PREFIX=.
ENV LOG_LEVEL=info
ENV SESSION_ID=blacksky-md

# Start the bot
CMD [ "node", "index.js" ]