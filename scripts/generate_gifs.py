from PIL import Image, ImageDraw, ImageFont, ImageSequence
import os
import math

def create_media_dir():
    if not os.path.exists('./media'):
        os.makedirs('./media')

def create_wasted_gif():
    # Create a more dynamic "WASTED" animation with fade effect
    frames = []
    width, height = 400, 200
    for i in range(20):
        img = Image.new('RGB', (width, height), 'black')
        draw = ImageDraw.Draw(img)

        # Create fade-in effect
        alpha = min(255, i * 25)  # Gradually increase opacity
        red_tint = Image.new('RGB', (width, height), (min(255, i * 20), 0, 0))

        # Add text with growing size effect
        text_size = 30 + i
        draw.text((width//4, height//3), 'WASTED', 
                 fill=(255, min(255, i * 25), min(255, i * 25)),
                 stroke_width=3,
                 stroke_fill='black')

        # Add visual effects
        for j in range(5):
            x = width//2 + math.sin(i/3 + j) * 20
            y = height//2 + math.cos(i/3 + j) * 20
            draw.ellipse([x-20, y-20, x+20, y+20], fill='red')

        frames.append(img)

    frames[0].save('./media/wasted.gif', 
                  save_all=True, 
                  append_images=frames[1:], 
                  duration=80, 
                  loop=0)

def create_jail_gif():
    # Create a more dynamic jail bars animation
    frames = []
    width, height = 400, 200
    for i in range(20):
        img = Image.new('RGB', (width, height), (50, 50, 50))
        draw = ImageDraw.Draw(img)

        # Moving jail bars effect
        offset = i * 3
        bar_spacing = 40
        bar_width = 10

        for x in range(-bar_width + offset % bar_spacing, width + bar_width, bar_spacing):
            # Draw animated bars with gradient
            for w in range(bar_width):
                color = int(150 + w * 10)
                draw.line([(x + w, 0), (x + w, height)], 
                         fill=(color, color, color), 
                         width=1)

        # Add "JAIL" text with shadow effect
        draw.text((width//4 + 2, height//3 + 2), 'JAIL', 
                 fill='black', 
                 stroke_width=2)
        draw.text((width//4, height//3), 'JAIL', 
                 fill='white', 
                 stroke_width=2)

        frames.append(img)

    frames[0].save('./media/jail.gif', 
                  save_all=True, 
                  append_images=frames[1:], 
                  duration=50, 
                  loop=0)

def create_triggered_gif():
    # Create a more dynamic "TRIGGERED" animation
    frames = []
    width, height = 400, 200
    for i in range(20):
        # Create shaking effect
        shake_x = math.sin(i) * 10
        shake_y = math.cos(i) * 10

        img = Image.new('RGB', (width, height), 'white')
        draw = ImageDraw.Draw(img)

        # Red overlay with varying intensity
        red_intensity = abs(math.sin(i/3)) * 255
        draw.rectangle([0, 0, width, height], 
                      fill=(int(red_intensity), 0, 0))

        # Shaking text effect
        draw.text((width//4 + shake_x, height//3 + shake_y), 
                 'TRIGGERED', 
                 fill='white',
                 stroke_width=3,
                 stroke_fill='black')

        # Add visual effects
        for j in range(3):
            x = width//2 + math.sin(i/2 + j) * 30
            y = height//2 + math.cos(i/2 + j) * 30
            draw.ellipse([x-10, y-10, x+10, y+10], 
                        fill='yellow')

        frames.append(img)

    frames[0].save('./media/triggered.gif', 
                  save_all=True, 
                  append_images=frames[1:], 
                  duration=50, 
                  loop=0)

def create_rip_gif():
    # Create a more elaborate RIP tombstone animation
    frames = []
    width, height = 400, 200
    for i in range(20):
        img = Image.new('RGB', (width, height), (100, 100, 100))
        draw = ImageDraw.Draw(img)

        # Animated sky background
        for y in range(height):
            color = int(50 + math.sin(y/20 + i/3) * 30)
            draw.line([(0, y), (width, y)], 
                     fill=(color, color, color+20))

        # Draw animated tombstone
        stone_x = width//4
        stone_y = height//4
        stone_width = width//2
        stone_height = height//2

        # Add 3D effect to tombstone
        for depth in range(10):
            shadow_offset = depth * 2
            color = 150 - depth * 10
            draw.rectangle([stone_x + shadow_offset, 
                          stone_y + shadow_offset,
                          stone_x + stone_width - shadow_offset, 
                          stone_y + stone_height - shadow_offset],
                         fill=(color, color, color))

        # Animated RIP text with glow effect
        text_x = stone_x + stone_width//3
        text_y = stone_y + stone_height//3
        glow = abs(math.sin(i/3)) * 50

        draw.text((text_x+2, text_y+2), 'R.I.P', 
                 fill=(50, 50, 50))
        draw.text((text_x, text_y), 'R.I.P', 
                 fill=(200 + int(glow), 
                      200 + int(glow), 
                      200 + int(glow)))

        # Add floating particles
        for j in range(5):
            particle_x = width//2 + math.sin(i/3 + j) * 50
            particle_y = height//2 + math.cos(i/3 + j) * 30 - i * 2
            draw.ellipse([particle_x-3, particle_y-3, 
                         particle_x+3, particle_y+3],
                        fill=(200, 200, 220))

        frames.append(img)

    frames[0].save('./media/rip.gif', 
                  save_all=True, 
                  append_images=frames[1:], 
                  duration=100, 
                  loop=0)

def create_neko_gif():
    frames = []
    width, height = 400, 200
    for i in range(20):
        img = Image.new('RGB', (width, height), 'white')
        draw = ImageDraw.Draw(img)

        # Draw cat ears
        ear_x = width//2
        ear_y = height//2
        ear_size = 30 + math.sin(i/3) * 5  # Animated ear size

        # Left ear
        draw.polygon([
            (ear_x - 40, ear_y - 20),
            (ear_x - 20, ear_y - 40 - ear_size),
            (ear_x, ear_y - 20)
        ], fill='black')

        # Right ear
        draw.polygon([
            (ear_x + 40, ear_y - 20),
            (ear_x + 20, ear_y - 40 - ear_size),
            (ear_x, ear_y - 20)
        ], fill='black')

        # Draw face
        face_size = 60
        draw.ellipse([
            ear_x - face_size//2, ear_y - face_size//2,
            ear_x + face_size//2, ear_y + face_size//2
        ], fill='white', outline='black')

        # Draw eyes
        eye_blink = max(0, abs(math.sin(i/5))) * 10
        draw.ellipse([ear_x - 20, ear_y - 10, ear_x - 5, ear_y - 10 + eye_blink], fill='black')
        draw.ellipse([ear_x + 5, ear_y - 10, ear_x + 20, ear_y - 10 + eye_blink], fill='black')

        # Draw whiskers with animation
        whisker_wave = math.sin(i/3) * 5
        for x_offset in [-1, 0, 1]:
            y_offset = x_offset * whisker_wave
            # Left whiskers
            draw.line([
                (ear_x - 30, ear_y + x_offset * 5),
                (ear_x - 60, ear_y + x_offset * 5 + y_offset)
            ], fill='black', width=2)
            # Right whiskers
            draw.line([
                (ear_x + 30, ear_y + x_offset * 5),
                (ear_x + 60, ear_y + x_offset * 5 + y_offset)
            ], fill='black', width=2)

        frames.append(img)

    frames[0].save(
        './media/anime-neko.gif',
        save_all=True,
        append_images=frames[1:],
        duration=50,
        loop=0
    )

def create_awoo_gif():
    frames = []
    width, height = 400, 200
    for i in range(20):
        img = Image.new('RGB', (width, height), 'white')
        draw = ImageDraw.Draw(img)

        # Draw wolf ears with animation
        ear_x = width//2
        ear_y = height//2
        ear_size = 40 + math.sin(i/3) * 10  # Animated ear size

        # Left ear
        draw.polygon([
            (ear_x - 50, ear_y - 20),
            (ear_x - 30, ear_y - 50 - ear_size),
            (ear_x - 10, ear_y - 20)
        ], fill='gray')

        # Right ear
        draw.polygon([
            (ear_x + 50, ear_y - 20),
            (ear_x + 30, ear_y - 50 - ear_size),
            (ear_x + 10, ear_y - 20)
        ], fill='gray')

        # Draw howling mouth
        mouth_open = 20 + math.sin(i/2) * 10  # Animated mouth
        draw.ellipse([
            ear_x - 20, ear_y,
            ear_x + 20, ear_y + mouth_open
        ], fill='black')

        # Draw sound waves
        for j in range(3):
            wave_size = 20 + j * 15 + math.sin(i/3) * 5
            draw.arc([
                ear_x - wave_size, ear_y - wave_size,
                ear_x + wave_size, ear_y + wave_size
            ], 220, 320, fill='blue', width=2)

        frames.append(img)

    frames[0].save(
        './media/anime-awoo.gif',
        save_all=True,
        append_images=frames[1:],
        duration=50,
        loop=0
    )

def main():
    create_media_dir()
    create_wasted_gif()
    create_jail_gif()
    create_triggered_gif()
    create_rip_gif()
    create_neko_gif()
    create_awoo_gif()

if __name__ == '__main__':
    main()