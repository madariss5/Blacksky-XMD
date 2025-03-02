import os
import sys
import urllib.request
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def download_gif(url, filename):
    try:
        media_dir = os.path.join(os.getcwd(), 'media')
        os.makedirs(media_dir, exist_ok=True)

        output_path = os.path.join(media_dir, filename)
        logger.info(f"Downloading GIF from {url} to {output_path}")

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            with open(output_path, 'wb') as f:
                f.write(response.read())

        # Verify file exists and has content
        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            logger.info(f"Successfully downloaded GIF to {output_path}")
            return True
        else:
            logger.error("Download succeeded but file is empty or missing")
            return False
    except Exception as e:
        logger.error(f"Error downloading GIF: {str(e)}")
        return False

# Let's try these URLs from the test data that we know work
wave_url = "https://media.giphy.com/media/FvVtnY82LPxrG/giphy.gif"
yeet_url = "https://media.giphy.com/media/WJjLyXCVvro2I/giphy.gif"

success_wave = download_gif(wave_url, "wave.gif")
success_yeet = download_gif(yeet_url, "yeet.gif")
sys.exit(0 if success_wave and success_yeet else 1)