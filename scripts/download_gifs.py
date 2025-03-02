import os
import requests
from pathlib import Path

# GIF URLs and their corresponding filenames
gifs = {
    'poke.gif': 'https://media.tenor.com/G5xQ1CEXXNoAAAAC/poke-anime.gif',
    'boop.gif': 'https://media.tenor.com/3dOqO4vVlD8AAAAC/anime-poke.gif',
    'bonk.gif': 'https://media.tenor.com/VrWzG0DyFGIAAAAC/bonk-anime.gif',
    'rip.gif': 'https://media.tenor.com/x8v1oNUOmg4AAAAC/anime-died.gif',
    'wave.gif': 'https://media.tenor.com/1VEnq_xQu4QAAAAC/anime-wave.gif',
    'yeet.gif': 'https://media.tenor.com/1NP0qdI8KPkAAAAC/yeet-anime.gif',
    'smile.gif': 'https://media.tenor.com/OGnxKFGdhQIAAAAC/anime-smile.gif',
    'dance.gif': 'https://media.tenor.com/mpOGZ5-gZpYAAAAC/anime-dance.gif'
}

# Get the media directory path
media_dir = Path(__file__).parent.parent / 'media'

def download_gif(url, filename):
    """Download a GIF from URL and save it to the media directory"""
    response = requests.get(url, stream=True)
    response.raise_for_status()

    filepath = media_dir / filename
    with open(filepath, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    print(f"Downloaded {filename}")

def main():
    """Download all GIFs"""
    print("Starting GIF downloads...")
    for filename, url in gifs.items():
        try:
            print(f"Downloading {filename}...")
            download_gif(url, filename)
        except Exception as e:
            print(f"Error downloading {filename}: {e}")
    print("Download complete!")

if __name__ == "__main__":
    main()