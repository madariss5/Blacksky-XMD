from PIL import Image, ImageDraw
import os

def create_trash_overlay():
    # Create assets directory if it doesn't exist
    assets_dir = os.path.join(os.path.dirname(__file__), 'assets')
    os.makedirs(assets_dir, exist_ok=True)
    
    # Create a transparent image
    img = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw trash can
    draw.rectangle((156, 156, 356, 356), outline=(0, 0, 0, 255), width=5)  # body
    draw.rectangle((186, 126, 326, 156), fill=(0, 0, 0, 255))  # lid
    
    # Add some trash lines for effect
    draw.line([(186, 206), (326, 206)], fill=(0, 0, 0, 255), width=3)
    draw.line([(186, 256), (326, 256)], fill=(0, 0, 0, 255), width=3)
    draw.line([(186, 306), (326, 306)], fill=(0, 0, 0, 255), width=3)
    
    # Save the overlay
    overlay_path = os.path.join(assets_dir, 'trash_overlay.png')
    img.save(overlay_path, 'PNG')
    print(f"Created trash overlay at: {overlay_path}")

if __name__ == "__main__":
    create_trash_overlay()
