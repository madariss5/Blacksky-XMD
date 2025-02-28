from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageFilter
import os
import math
import sys

def create_frame(img, trash_overlay, offset, sparkles=True):
    # Create a new frame
    frame = Image.new('RGBA', img.size, (0,0,0,0))

    # Paste the original image
    frame.paste(img, (0,0))

    # Add animated overlay with offset
    overlay_with_offset = Image.new('RGBA', img.size, (0,0,0,0))
    overlay_with_offset.paste(trash_overlay, (offset, 0))

    # Merge with overlay
    frame = Image.alpha_composite(frame, overlay_with_offset)

    if sparkles:
        # Add sparkle effects
        draw = ImageDraw.Draw(frame)
        for i in range(5):
            x = (offset + i * 50) % img.size[0]
            y = (math.sin(offset/10.0 + i) * 20) + 200
            draw.ellipse([x-2, y-2, x+2, y+2], fill=(255,255,255,200))

    return frame

def create_anime_trash_gif(input_path, output_path):
    try:
        # Open and resize input image
        img = Image.open(input_path).convert('RGBA')
        base_width = 512
        w_percent = (base_width/float(img.size[0]))
        h_size = int((float(img.size[1])*float(w_percent)))
        img = img.resize((base_width, h_size), Image.Resampling.LANCZOS)

        # Create anime-style overlay
        overlay = Image.new('RGBA', img.size, (0,0,0,0))
        draw = ImageDraw.Draw(overlay)

        # Draw anime-style trash can
        can_width = 200
        can_height = 250
        x_center = img.size[0]//2
        y_bottom = img.size[1] - 50

        # Trash can base points
        points = [
            (x_center - can_width//2, y_bottom),  # bottom left
            (x_center + can_width//2, y_bottom),  # bottom right
            (x_center + can_width//3, y_bottom - can_height),  # top right
            (x_center - can_width//3, y_bottom - can_height)   # top left
        ]

        # Draw can with anime style
        draw.polygon(points, fill=(0,0,0,100), outline=(0,0,0,255))

        # Add lid
        lid_points = [
            (points[3][0] - 20, points[3][1]),  # left
            (points[2][0] + 20, points[2][1]),  # right
            (points[2][0], points[2][1] - 20),  # top right
            (points[3][0], points[3][1] - 20)   # top left
        ]
        draw.polygon(lid_points, fill=(0,0,0,150), outline=(0,0,0,255))

        # Create frames
        frames = []
        for i in range(30):  # 30 frames for smooth animation
            # Calculate image position for throwing animation
            progress = i / 29.0  # 0 to 1

            # Parabolic motion
            x_offset = int(progress * 100)  # Move right
            y_offset = int(-200 * math.sin(progress * math.pi))  # Up and down motion

            # Create frame with current position
            frame = Image.new('RGBA', img.size, (0,0,0,0))

            # Apply transformations to the input image
            # Scale down as it goes into trash
            scale = 1.0 - (progress * 0.5)  # Scale from 1.0 to 0.5
            new_size = (int(img.size[0] * scale), int(img.size[1] * scale))
            transformed_img = img.resize(new_size, Image.Resampling.LANCZOS)

            # Calculate position to paste transformed image
            paste_x = x_center - new_size[0]//2 + x_offset
            paste_y = y_bottom - new_size[1] - 100 + y_offset

            # Paste transformed image
            frame.paste(transformed_img, (paste_x, paste_y), transformed_img)

            # Add speed lines
            draw = ImageDraw.Draw(frame)
            for j in range(10):
                line_x = paste_x - j * 20
                line_y = paste_y + new_size[1]//2
                draw.line([(line_x, line_y), (line_x-20, line_y)], 
                         fill=(255,255,255,100), width=2)

            # Add the trash can
            frame = Image.alpha_composite(frame, overlay)

            # Add impact effects in last few frames
            if progress > 0.8:
                impact = int((progress - 0.8) * 5 * 50)  # 0 to 50
                draw = ImageDraw.Draw(frame)
                draw.ellipse([x_center-impact, y_bottom-impact, 
                            x_center+impact, y_bottom+impact],
                           outline=(255,255,255,150))

            frames.append(frame)

        # Save as animated GIF
        frames[0].save(
            output_path,
            save_all=True,
            append_images=frames[1:],
            duration=50,  # 50ms per frame = 20fps
            loop=0,
            format='GIF'
        )

        return True

    except Exception as e:
        print(f"Error creating anime trash effect: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python create_anime_trash.py <input_path> <output_path>")
        sys.exit(1)

    success = create_anime_trash_gif(sys.argv[1], sys.argv[2])
    sys.exit(0 if success else 1)