import os
import sys
import urllib.request
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def download_gif(url, filename):
    """Download GIFs for the bot."""
    try:
        media_dir = os.path.join(os.getcwd(), 'media')
        os.makedirs(media_dir, exist_ok=True)

        output_path = os.path.join(media_dir, filename)
        logger.info(f"Downloading GIF from {url} to {output_path}")

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            with open(output_path, 'wb') as f:
                f.write(response.read())

        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            logger.info(f"Successfully downloaded GIF to {output_path}")
            return True
        else:
            logger.error("Download succeeded but file is empty")
            return False
    except Exception as e:
        logger.error(f"Error downloading GIF: {str(e)}")
        return False

# Using anime reaction GIFs from GIPHY's CDN
gifs = {
    'slap': 'https://media1.giphy.com/media/Zau0yrl17uzdK/giphy.gif',
    'hug': 'https://media4.giphy.com/media/PHZ7v9tfQu0o0/giphy.gif',
    'pat': 'https://media1.giphy.com/media/5tmRHwTlHAA9WkVxTU/giphy.gif',
    'kiss': 'https://media2.giphy.com/media/bGm9FuBCGg4SY/giphy.gif',
    'punch': 'https://media3.giphy.com/media/arbHBoiUWUgmc/giphy.gif',
    'kill': 'https://media2.giphy.com/media/cH5BtPJqrBZxC/giphy.gif',
    'wasted': 'https://media1.giphy.com/media/TbONGqAdpTWQW3Hz5V/giphy.gif',
    'poke': 'https://media1.giphy.com/media/BiCIPU3XE9ePbqK3b0/giphy.gif',
    'cuddle': 'https://media2.giphy.com/media/l2QDM9Jnim1YVILXa/giphy.gif',
    'boop': 'https://media3.giphy.com/media/ZtB2l3jHiJsFa/giphy.gif',
    'bonk': 'https://media4.giphy.com/media/pVsn5LJEgMKlW/giphy.gif',
    'rip': 'https://media2.giphy.com/media/3oEjHCWdU7F4hkcudy/giphy.gif',
    'wave': 'https://media1.giphy.com/media/HoIrPgqTBiB2XBaJju/giphy.gif',
    'yeet': 'https://media3.giphy.com/media/WtDaSUB8GDiRW/giphy.gif',
    'smile': 'https://media4.giphy.com/media/ree8xCap5nHi/giphy.gif',
    'dance': 'https://media2.giphy.com/media/5rFbG39c8tLgY/giphy.gif',
    'highfive': 'https://media1.giphy.com/media/3oEjHV0z8S7WM4MwnK/giphy.gif',
    'thumbsup': 'https://media1.giphy.com/media/4xpB3eE00FfBm/giphy.gif',
    'thumbsdown': 'https://media1.giphy.com/media/108M7gCS1JSoO4/giphy.gif'
}

success = True
for name, url in gifs.items():
    if not download_gif(url, f"{name}.gif"):
        success = False

sys.exit(0 if success else 1)