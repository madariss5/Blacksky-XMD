FROM node:lts-buster

RUN apt-get update && \
    apt-get install -y \
    ffmpeg \
    imagemagick \
    webp && \
    apt-get upgrade -y && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Create required directories
RUN mkdir -p auth_info_baileys auth_info temp database && \
    chmod 755 auth_info_baileys auth_info temp database

EXPOSE 5000

CMD ["bash", "start.sh"]