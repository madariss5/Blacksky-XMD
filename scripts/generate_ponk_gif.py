from PIL import Image, ImageDraw, ImageFont
import os

def create_ponk_gif():
    # Create directory if it doesn't exist
    os.makedirs("media", exist_ok=True)
    
    # Settings
    width = 200
    height = 100
    frames = []
    ball_size = 10
    
    # Create frames
    for i in range(20):
        # Create new frame
        frame = Image.new('RGB', (width, height), 'white')
        draw = ImageDraw.Draw(frame)
        
        # Calculate ball position
        x = (i * width // 20) if i < 10 else (width - ((i-10) * width // 20))
        y = height//2 + (10 * (i % 5))
        
        # Draw paddle outlines
        draw.rectangle([10, height//4, 20, 3*height//4], outline='black')
        draw.rectangle([width-20, height//4, width-10, 3*height//4], outline='black')
        
        # Draw ball
        draw.ellipse([x-ball_size//2, y-ball_size//2, x+ball_size//2, y+ball_size//2], fill='red')
        
        frames.append(frame)
    
    # Save as GIF
    frames[0].save(
        'media/anime-ponk.gif',
        save_all=True,
        append_images=frames[1:],
        duration=50,
        loop=0
    )

if __name__ == "__main__":
    create_ponk_gif()
