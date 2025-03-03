FROM node:20-slim

# Set environment variables
ENV NODE_ENV=production \
    PORT=5000

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Bundle app source
COPY . .

# Create required directories
RUN mkdir -p \
    /app/auth_info_baileys \
    /app/auth_info \
    /app/temp \
    /app/database

EXPOSE 5000

CMD ["node", "index.js"]