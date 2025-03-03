FROM node:lts-buster as builder

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ffmpeg \
    imagemagick \
    webp && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with cache mount
RUN --mount=type=cache,target=/root/.npm \
    npm install --legacy-peer-deps

# Copy source
COPY . .

# Create required directories with proper permissions
RUN mkdir -p auth_info_baileys auth_info temp database && \
    chmod 755 auth_info_baileys auth_info temp database

# Expose port 5000
EXPOSE 5000

# Use start.sh as entrypoint
CMD ["bash", "start.sh"]