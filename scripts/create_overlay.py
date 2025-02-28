from PIL import Image, ImageDraw
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

    # Lid highlight
    draw.line([(146, 126), (366, 126)], fill=(255, 255, 255, 100), width=2)

    # Handle on lid with 3D effect
    draw.ellipse([236, 106, 276, 126], fill=(0, 0, 0, 150), outline=(0, 0, 0, 255), width=4)
    draw.arc([236, 106, 276, 116], 0, 180, fill=(255, 255, 255, 100), width=2)

    # Add texture lines with wave effect
    for y in range(186, 326, 40):
        # Wavy line effect
        points = []
        for x in range(186, 326, 5):
            offset = math.sin((x - 186) / 20) * 5
            points.append((x, y + offset))

        # Draw the line with proper perspective
        for i in range(len(points) - 1):
            draw.line([points[i], points[i + 1]], fill=(0, 0, 0, 150), width=3)

    # Add various trash elements
    # Crumpled paper effect
    for pos in [(196, 216), (276, 236), (236, 276)]:
        draw.arc([pos[0], pos[1], pos[0]+40, pos[1]+40], 0, 360, fill=(0, 0, 0, 100), width=3)
        draw.line([(pos[0]+10, pos[1]+10), (pos[0]+30, pos[1]+30)], fill=(0, 0, 0, 150), width=2)
        draw.line([(pos[0]+30, pos[1]+10), (pos[0]+10, pos[1]+30)], fill=(0, 0, 0, 150), width=2)

    # Banana peels
    peel_points = [
        [(276, 266), (296, 256), (306, 276), (286, 286)],
        [(196, 296), (216, 286), (226, 306), (206, 316)]
    ]
    for points in peel_points:
        draw.polygon(points, fill=(0, 0, 0, 100), outline=(0, 0, 0, 255), width=3)
        # Add curved lines for peel texture
        draw.arc([points[0][0], points[0][1], points[2][0], points[2][1]], 0, 180, fill=(0, 0, 0, 150), width=2)

    # Add some flies circling the trash
    for pos in [(200, 180), (300, 200), (250, 150)]:
        # Body
        draw.ellipse([pos[0]-5, pos[1]-5, pos[0]+5, pos[1]+5], fill=(0, 0, 0, 200))
        # Wings
        draw.arc([pos[0]-8, pos[1]-8, pos[0]+8, pos[1]], 0, 180, fill=(0, 0, 0, 150), width=2)

    # Save the overlay
    overlay_path = os.path.join(assets_dir, 'trash_overlay.png')
    img.save(overlay_path, 'PNG')
    print(f"Created enhanced trash overlay at: {overlay_path}")

if __name__ == "__main__":
    create_trash_overlay()