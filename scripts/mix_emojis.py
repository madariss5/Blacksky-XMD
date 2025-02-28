#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import sys
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def find_emoji_font():
    """Try to find an available emoji font."""
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/TTF/DejaVuSans.ttf",
        "/usr/share/fonts/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/ubuntu/Ubuntu-Regular.ttf"
    ]

    for font_path in font_paths:
        if os.path.exists(font_path):
            logger.info(f"Found font: {font_path}")
            return font_path

    logger.warning("No specific emoji font found, using default font")
    return None

def create_emoji_mix(emoji1, emoji2, output_path):
    """Create an emoji mix image."""
    try:
        # Create a new image with transparent background
        width = 512
        height = 512
        image = Image.new('RGBA', (width, height), (255, 255, 255, 0))
        draw = ImageDraw.Draw(image)

        # Find and load font
        font_path = find_emoji_font()
        font_size = 200

        if font_path:
            try:
                font = ImageFont.truetype(font_path, font_size)
            except Exception as e:
                logger.error(f"Error loading font: {e}")
                font = ImageFont.load_default()
                font_size = 100
        else:
            font = ImageFont.load_default()
            font_size = 100

        # Calculate positions to center emojis
        left_x = width // 4
        right_x = (width * 3) // 4
        y = height // 3

        # Draw emojis
        draw.text((left_x, y), emoji1, font=font, fill=(0, 0, 0, 255), anchor="mm")
        draw.text((right_x, y), emoji2, font=font, fill=(0, 0, 0, 255), anchor="mm")

        # Add a plus sign between emojis
        plus_size = font_size // 2
        plus_font = ImageFont.truetype(font_path, plus_size) if font_path else ImageFont.load_default()
        draw.text((width // 2, y), "+", font=plus_font, fill=(0, 0, 0, 255), anchor="mm")

        # Save as WebP
        image.save(output_path, 'WebP')
        logger.info(f"Successfully created emoji mix at {output_path}")

    except Exception as e:
        logger.error(f"Error creating emoji mix: {e}")
        raise

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: mix_emojis.py <emoji1> <emoji2> <output_path>")
        sys.exit(1)

    emoji1 = sys.argv[1]
    emoji2 = sys.argv[2]
    output_path = sys.argv[3]

    try:
        create_emoji_mix(emoji1, emoji2, output_path)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)