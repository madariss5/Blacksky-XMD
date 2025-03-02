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
        
        urllib.request.urlretrieve(url, output_path)
        
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

if __name__ == "__main__":
    gif_url = "https://media.tenor.com/CmRRZwm5L1EAAAAC/burned-burn.gif"
    success = download_gif(gif_url, "roast.gif")
    sys.exit(0 if success else 1)
