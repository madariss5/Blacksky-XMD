from PIL import Image, ImageDraw
import os

def generate_jail_bars(size=(512, 512)):
    # Create a transparent image for jail bars
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw vertical bars
    bar_width = 10
    spacing = 40
    for x in range(0, size[0], spacing):
        draw.rectangle([x, 0, x + bar_width, size[1]], fill=(0, 0, 0, 180))

    # Save the image
    assets_dir = os.path.join(os.path.dirname(__file__), '../assets')
    os.makedirs(assets_dir, exist_ok=True)
    img.save(os.path.join(assets_dir, 'jail_bars.png'))

def generate_wasted_text(size=(512, 100)):
    # Create a transparent image for "WASTED" text
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Add semi-transparent black background
    draw.rectangle([0, 0, size[0], size[1]], fill=(0, 0, 0, 128))
    
    # Add "WASTED" text (this is a placeholder - you'll need to add proper font handling)
    text = "WASTED"
    # draw.text((size[0]/2, size[1]/2), text, fill=(255, 0, 0, 255), anchor="mm")
    
    # Save the image
    assets_dir = os.path.join(os.path.dirname(__file__), '../assets')
    os.makedirs(assets_dir, exist_ok=True)
    img.save(os.path.join(assets_dir, 'wasted.png'))

if __name__ == "__main__":
    generate_jail_bars()
    generate_wasted_text()
