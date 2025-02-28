from PIL import Image
import sys
import os

def convert_to_webp(input_path, output_path):
    try:
        # Open and convert the image
        with Image.open(input_path) as img:
            # Convert to RGBA if necessary
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            # Resize if needed (512x512 is a good size for stickers)
            maxsize = (512, 512)
            ratio = min(maxsize[0]/img.size[0], maxsize[1]/img.size[1])
            newsize = (int(img.size[0]*ratio), int(img.size[1]*ratio))
            img = img.resize(newsize, Image.Resampling.LANCZOS)
            
            # Save as WebP
            img.save(output_path, 'WEBP')
            return True
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python convert_sticker.py input_path output_path")
        sys.exit(1)
    
    success = convert_to_webp(sys.argv[1], sys.argv[2])
    sys.exit(0 if success else 1)
