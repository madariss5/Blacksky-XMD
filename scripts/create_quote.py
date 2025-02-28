#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import sys
import textwrap
import os

def create_quote_sticker(text, sender, output_path):
    # Create a new image with a dark background
    width = 512
    # Calculate height based on text length
    height = max(512, len(text) // 30 * 40 + 200)
    
    image = Image.new('RGBA', (width, height), (44, 47, 51, 255))
    draw = ImageDraw.Draw(image)
    
    try:
        # Use a default system font if custom font not available
        font_size = 40
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", font_size)
        small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", font_size - 10)
    except:
        font = ImageFont.load_default()
        small_font = ImageFont.load_default()

    # Wrap text
    wrapper = textwrap.TextWrapper(width=30)
    word_list = wrapper.wrap(text=text)
    
    # Calculate text position
    y_text = 50
    for word in word_list:
        # Add quote text
        draw.text((30, y_text), word, font=font, fill=(255, 255, 255, 255))
        y_text += font_size + 10

    # Add sender name at bottom
    draw.text((30, height - 70), f"- {sender}", font=small_font, fill=(153, 170, 181, 255))
    
    # Save as WebP
    image.save(output_path, 'WebP')

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: create_quote.py <text> <sender> <output_path>")
        sys.exit(1)
        
    text = sys.argv[1]
    sender = sys.argv[2]
    output_path = sys.argv[3]
    
    create_quote_sticker(text, sender, output_path)
