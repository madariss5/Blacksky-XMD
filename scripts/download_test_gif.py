import os
import sys
import urllib.request
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GIFS = {
    'roast': 'https://media.giphy.com/media/Ke3CM1NVkULWo/giphy.gif',
    'slap': 'https://media.giphy.com/media/uG3lKkAuh53wc/giphy.gif',
    'hug': 'https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif',
    'pat': 'https://media.giphy.com/media/5tmRHwTlHAA9WkVxTU/giphy.gif',
    'kiss': 'https://media.giphy.com/media/G3va31oEEnIkM/giphy.gif',
    'punch': 'https://media.giphy.com/media/arbHBoiUWUgmc/giphy.gif',
    'kill': 'https://media.giphy.com/media/ZKZiW6GSx8eSA/giphy.gif',
    'wasted': 'https://media.giphy.com/media/Tim0q7zolF3fa/giphy.gif'
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

    # Clear existing GIFs
    for file in media_dir.glob('*.gif'):
        try:
            file.unlink()
            logger.info(f"Removed existing GIF: {file}")
        except Exception as e:
            logger.error(f"Error removing file {file}: {str(e)}")

    for name, url in GIFS.items():
        output_path = media_dir / f"{name}.gif"
        logger.info(f"Downloading {name} GIF from {url}")

        try:
            urllib.request.urlretrieve(url, output_path)

            if output_path.exists() and output_path.stat().st_size > 0:
                logger.info(f"Successfully downloaded {name}.gif (Size: {output_path.stat().st_size} bytes)")
            else:
                logger.error(f"Download succeeded but {name}.gif is empty")
                success = False
        except Exception as e:
            logger.error(f"Error downloading {name}.gif: {str(e)}")
            success = False

    # Verify all files
    downloaded_files = list(media_dir.glob('*.gif'))
    logger.info(f"Downloaded GIFs in media directory: {[f.name for f in downloaded_files]}")

    return success

if __name__ == "__main__":
    success = download_test_gifs()
    sys.exit(0 if success else 1)