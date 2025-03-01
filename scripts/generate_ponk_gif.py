from PIL import Image, ImageDraw, ImageFont
import os
import math

def create_ponk_gif():
    # Create directory if it doesn't exist
    os.makedirs("media", exist_ok=True)

    # Settings
    width = 200
    height = 100
    frames = []
    ball_size = 10
    paddle_width = 10
    paddle_height = height//2

    # Create frames
    for i in range(30):  # Increased frames for smoother animation
        # Create new frame
        frame = Image.new('RGB', (width, height), 'white')
        draw = ImageDraw.Draw(frame)

        # Calculate ball position with smoother movement
        x = (i * width // 30) if i < 15 else (width - ((i-15) * width // 30))
        y = height//2 + math.sin(i * math.pi/7) * 20  # Sinusoidal vertical movement

        # Draw paddle outlines
        paddle_left = (10, height//4, 20, 3*height//4)
        paddle_right = (width-20, height//4, width-10, 3*height//4)

        # Draw paddles with a slight bounce effect
        left_paddle_offset = math.sin(i * math.pi/6) * 5
        right_paddle_offset = math.sin((i + math.pi) * math.pi/6) * 5

        draw.rectangle((
            paddle_left[0],
            paddle_left[1] + left_paddle_offset,
            paddle_left[2],
            paddle_left[3] + left_paddle_offset
        ), fill='blue', outline='black')

        draw.rectangle((
            paddle_right[0],
            paddle_right[1] + right_paddle_offset,
            paddle_right[2],
            paddle_right[3] + right_paddle_offset
        ), fill='red', outline='black')

        # Draw ball with trail effect
        for j in range(3):
            trail_size = ball_size - (j * 2)
            trail_x = x - (j * 4 * (-1 if i < 15 else 1))
            alpha = 255 - (j * 60)  # Decreasing opacity for trail
            draw.ellipse(
                [trail_x-trail_size//2, y-trail_size//2, 
                 trail_x+trail_size//2, y+trail_size//2],
                fill=(255, 0, 0, alpha)
            )

        # Draw main ball
        draw.ellipse(
            [x-ball_size//2, y-ball_size//2, x+ball_size//2, y+ball_size//2],
            fill='red'
        )

        frames.append(frame)

    # Save as GIF with smoother animation
    frames[0].save(
        'media/anime-ponk.gif',
        save_all=True,
        append_images=frames[1:],
        duration=30,  # Reduced duration for smoother animation
        loop=0
    )

if __name__ == "__main__":
    create_ponk_gif()