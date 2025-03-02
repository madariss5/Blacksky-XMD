import os
import requests
from pathlib import Path

# GIF URLs and their corresponding filenames
gifs = {
    'poke.gif': 'https://media.tenor.com/6Gr-6QEQb3QAAAAM/poke-anime.gif',  # Small poke
    'boop.gif': 'https://media.tenor.com/3dOqO4vVlD8AAAAM/anime-poke.gif',  # Small boop
    'bonk.gif': 'https://media.tenor.com/CrmEU2LkTYEAAAAM/anime-bonk.gif',  # Small bonk
    'rip.gif': 'https://media.tenor.com/x8v1oNUOmg4AAAAM/anime-died.gif',   # Small RIP
    'wave.gif': 'https://media.tenor.com/INK5bl09DXMAAAAM/wave-anime.gif',  # Small wave
    'yeet.gif': 'https://media.tenor.com/XC6wMAuZj6QAAAAM/throw-yeet.gif',  # Small yeet
    'smile.gif': 'https://media.tenor.com/r_FZn-2LhsQAAAAM/anime-smile.gif', # Small smile
    'dance.gif': 'https://media.tenor.com/z2JE_Ou8FpwAAAAM/anime-dance.gif'  # Small dance
}

# Get the media directory path
media_dir = Path(__file__).parent.parent / 'media'

def download_gif(url, filename):
    """Download a GIF from URL and save it to the media directory"""
    print(f"Downloading {filename}...")
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, stream=True, headers=headers)
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