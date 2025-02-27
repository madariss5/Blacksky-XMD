from PIL import Image, ImageDraw
import os

def create_media_dir():
    if not os.path.exists('./media'):
        os.makedirs('./media')

def create_wasted_gif():
    # Create a simple red-tinted "WASTED" animation
    frames = []
    for i in range(10):
        img = Image.new('RGB', (200, 100), 'black')
        draw = ImageDraw.Draw(img)
        draw.text((50, 40), 'WASTED', fill='red')
        frames.append(img)
    
    frames[0].save('./media/wasted.gif', save_all=True, append_images=frames[1:], duration=100, loop=0)

def create_jail_gif():
    # Create a simple jail bars animation
    frames = []
    for i in range(10):
        img = Image.new('RGB', (200, 100), 'white')
        draw = ImageDraw.Draw(img)
        offset = i * 2
        for x in range(0, 200, 20):
            draw.line([(x + offset, 0), (x + offset, 100)], fill='black', width=3)
        frames.append(img)
    
    frames[0].save('./media/jail.gif', save_all=True, append_images=frames[1:], duration=100, loop=0)

def create_triggered_gif():
    # Create a simple "TRIGGERED" animation with red flashing
    frames = []
    for i in range(10):
        color = 'red' if i % 2 == 0 else 'white'
        img = Image.new('RGB', (200, 100), color)
        draw = ImageDraw.Draw(img)
        draw.text((40, 40), 'TRIGGERED', fill='black')
        frames.append(img)
    
    frames[0].save('./media/triggered.gif', save_all=True, append_images=frames[1:], duration=100, loop=0)

def create_rip_gif():
    # Create a simple RIP tombstone animation
    frames = []
    for i in range(10):
        img = Image.new('RGB', (200, 100), 'gray')
        draw = ImageDraw.Draw(img)
        offset = i
        draw.text((80 + offset, 40), 'RIP', fill='white')
        frames.append(img)
    
    frames[0].save('./media/rip.gif', save_all=True, append_images=frames[1:], duration=100, loop=0)

def main():
    create_media_dir()
    create_wasted_gif()
    create_jail_gif()
    create_triggered_gif()
    create_rip_gif()

if __name__ == '__main__':
    main()
