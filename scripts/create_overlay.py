from PIL import Image, ImageDraw, ImageFont
import os
import math

def create_trash_overlay():
    # Create assets directory if it doesn't exist
    assets_dir = os.path.join(os.path.dirname(__file__), 'assets')
    os.makedirs(assets_dir, exist_ok=True)

    # Create a transparent image
    img = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw enhanced trash can
    # Draw shadow first
    shadow_polygon = [(166, 366), (336, 366), (346, 376), (156, 376)]
    draw.polygon(shadow_polygon, fill=(0, 0, 0, 80))

    # Main body with perspective and gradient effect
    draw.polygon([(156, 156), (356, 156), (326, 356), (186, 356)], 
                outline=(0, 0, 0, 255), fill=(0, 0, 0, 50), width=6)

    # Side panel shading
    draw.polygon([(356, 156), (326, 356), (336, 346), (366, 146)],
                fill=(0, 0, 0, 30), outline=(0, 0, 0, 255), width=3)

    # Lid with 3D effect and highlight
    draw.polygon([(146, 126), (366, 126), (356, 156), (156, 156)], 
                fill=(0, 0, 0, 100), outline=(0, 0, 0, 255), width=6)

    # Save the overlay
    overlay_path = os.path.join(assets_dir, 'trash_overlay.png')
    img.save(overlay_path, 'PNG')
    print(f"Created trash overlay at: {overlay_path}")

def create_wanted_overlay():
    # Create assets directory if it doesn't exist
    assets_dir = os.path.join(os.path.dirname(__file__), 'assets')
    os.makedirs(assets_dir, exist_ok=True)

    # Create a large image for the wanted poster template
    img = Image.new('RGBA', (800, 1000), 'antiquewhite')
    draw = ImageDraw.Draw(img)

    # Border design
    border_width = 20
    draw.rectangle([(0, 0), (799, 999)], outline='brown', width=border_width)
    draw.rectangle([(40, 40), (759, 959)], outline='brown', width=2)

    # Add "WANTED" text
    font_size = 120
    try:
        font = ImageFont.truetype("Arial.ttf", font_size)
    except:
        font = ImageFont.load_default()

    # Draw "WANTED" text with shadow
    text = "WANTED"
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    x = (800 - text_width) // 2

    # Draw shadow
    draw.text((x+3, 53), text, fill='rgba(139, 69, 19, 128)', font=font)
    # Draw main text
    draw.text((x, 50), text, fill='brown', font=font)

    # Add "DEAD OR ALIVE" text
    font_size = 60
    try:
        font = ImageFont.truetype("Arial.ttf", font_size)
    except:
        font = ImageFont.load_default()

    text = "DEAD OR ALIVE"
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    x = (800 - text_width) // 2
    draw.text((x, 200), text, fill='brown', font=font)

    # Save the overlay
    overlay_path = os.path.join(assets_dir, 'wanted_template.png')
    img.save(overlay_path, 'PNG')
    print(f"Created wanted poster template at: {overlay_path}")

def create_beautiful_template():
    # Create assets directory if it doesn't exist
    assets_dir = os.path.join(os.path.dirname(__file__), 'assets')
    os.makedirs(assets_dir, exist_ok=True)

    # Create a new image with white background
    width = 800
    height = 600
    img = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(img)

    # Add decorative elements
    # Border
    draw.rectangle([(0, 0), (width-1, height-1)], outline='gold', width=5)

    # Add text "This is Beautiful"
    font_size = 60
    try:
        font = ImageFont.truetype("Arial.ttf", font_size)
    except:
        font = ImageFont.load_default()

    text = "This is Beautiful"
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    x = (width - text_width) // 2

    # Draw text with shadow
    draw.text((x+2, 502), text, fill='rgba(218, 165, 32, 128)', font=font)
    draw.text((x, 500), text, fill='gold', font=font)

    # Add sparkles
    for _ in range(20):
        x = int(width * 0.1) + int(math.random() * width * 0.8)
        y = int(height * 0.1) + int(math.random() * height * 0.6)
        r = 5
        draw.regular_polygon((x, y, r), 4, rotation=45, fill='gold')

    # Save the template
    template_path = os.path.join(assets_dir, 'beautiful_template.png')
    img.save(template_path, 'PNG')
    print(f"Created beautiful template at: {template_path}")

if __name__ == "__main__":
    create_trash_overlay()
    create_wanted_overlay()
    create_beautiful_template()