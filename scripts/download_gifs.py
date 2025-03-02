import os
import requests
from pathlib import Path

# GIF URLs and their corresponding filenames
gifs = {
    'poke.gif': 'https://media1.giphy.com/media/pWd3gD577gOqs/giphy.gif',  # Anime girl poking
    'boop.gif': 'https://media2.giphy.com/media/ARSp9T7wwxNcs/giphy.gif',  # Cute anime nose boop
    'bonk.gif': 'https://media0.giphy.com/media/30lxTuJueXE7C/giphy.gif',  # Anime bonk
    'rip.gif': 'https://media3.giphy.com/media/xT1XGFuvjWbaF7Klq0/giphy.gif',  # Anime RIP scene
    'wave.gif': 'https://media2.giphy.com/media/FvVtnY82LPxrG/giphy.gif',  # Anime waving
    'yeet.gif': 'https://media.giphy.com/media/dZRlFW1sbFEzK/giphy.gif',  # Better anime throwing/yeet
    'smile.gif': 'https://media1.giphy.com/media/ellxlkgbPTiM0/giphy.gif',  # Anime smile
    'dance.gif': 'https://media3.giphy.com/media/mJIa7rg9VPEhzU1dyQ/giphy.gif'  # Anime dance
}

# Get the media directory path
media_dir = Path(__file__).parent.parent / 'media'

def download_gif(url, filename):
    """Download a GIF from URL and save it to the media directory"""
    print(f"Downloading {filename}...")
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()

        filepath = media_dir / filename
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"Downloaded {filename}")
    except Exception as e:
        print(f"Error downloading {filename}: {e}")

def main():
    """Download all GIFs"""
    print("Starting GIF downloads...")
    for filename, url in gifs.items():
        download_gif(url, filename)
    print("Download complete!")

if __name__ == "__main__":
    main()