import os
import sys
import urllib.request
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GIFS = {
    'roast': 'https://media.giphy.com/media/Ke3CM1NVkULWo/giphy.gif',
    'happy': 'https://media.giphy.com/media/DhstvI3zZ598Nb1rFf/giphy.gif',
    'sad': 'https://media.giphy.com/media/7SF5scGB2AFrgsXP63/giphy.gif'
}

def setup_directories():
    """Create necessary directories if they don't exist."""
    media_dir = Path.cwd() / 'media'
    temp_dir = Path.cwd() / 'temp'

    try:
        media_dir.mkdir(exist_ok=True)
        temp_dir.mkdir(exist_ok=True)
        logger.info(f"Directories created/verified: {media_dir}, {temp_dir}")
        return True
    except Exception as e:
        logger.error(f"Error creating directories: {str(e)}")
        return False

def download_test_gifs():
    """Download test GIFs for the bot."""
    if not setup_directories():
        return False

    success = True
    media_dir = Path.cwd() / 'media'

    for name, url in GIFS.items():
        output_path = media_dir / f"{name}.gif"
        logger.info(f"Downloading {name} GIF from {url}")

        try:
            urllib.request.urlretrieve(url, output_path)

            if output_path.exists() and output_path.stat().st_size > 0:
                logger.info(f"Successfully downloaded {name}.gif")
            else:
                logger.error(f"Download succeeded but {name}.gif is empty")
                success = False
        except Exception as e:
            logger.error(f"Error downloading {name}.gif: {str(e)}")
            success = False

    return success

if __name__ == "__main__":
    success = download_test_gifs()
    sys.exit(0 if success else 1)