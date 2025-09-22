from PIL import Image, ImageDraw, ImageFont
import math

def create_splash_screen():
    # Create a 1284x2778 image (iPhone Pro Max resolution)
    width, height = 1284, 2778
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)
    
    # Create gradient background
    for y in range(height):
        # Gradient from dark purple to light purple
        ratio = y / height
        r = int(46 + (168 - 46) * ratio)  # 2E073F to A855F7
        g = int(7 + (85 - 7) * ratio)
        b = int(63 + (247 - 63) * ratio)
        
        for x in range(width):
            draw.point((x, y), (r, g, b))
    
    # Draw decorative circles
    circles = [
        (200, 300, 60, (255, 255, 255, 25)),
        (1000, 400, 45, (255, 255, 255, 35)),
        (150, 2200, 75, (255, 255, 255, 20)),
        (1100, 2000, 50, (255, 255, 255, 30))
    ]
    
    for x, y, r, color in circles:
        draw.ellipse([x-r, y-r, x+r, y+r], fill=color)
    
    # Draw main logo circle
    center_x, center_y = width // 2, height // 2 - 200
    logo_radius = 200
    
    # Outer glow circles
    for i in range(3):
        alpha = 50 - i * 15
        radius = logo_radius + i * 20
        draw.ellipse([
            center_x - radius, center_y - radius,
            center_x + radius, center_y + radius
        ], fill=(255, 255, 255, alpha))
    
    # Main logo circle
    draw.ellipse([
        center_x - logo_radius, center_y - logo_radius,
        center_x + logo_radius, center_y + logo_radius
    ], fill=(255, 255, 255))
    
    # Draw stylized hair curl in the center
    curl_center_x, curl_center_y = center_x, center_y - 30
    
    # Main curl (purple)
    curl_points = []
    for angle in range(0, 270, 5):
        radius = 80 + 30 * math.sin(math.radians(angle * 2))
        x = curl_center_x + radius * math.cos(math.radians(angle))
        y = curl_center_y + radius * math.sin(math.radians(angle))
        curl_points.append((x, y))
    
    if len(curl_points) > 2:
        draw.polygon(curl_points, fill=(114, 9, 183))
    
    # Secondary curl (lighter purple)
    curl2_points = []
    for angle in range(30, 200, 8):
        radius = 50 + 20 * math.sin(math.radians(angle * 1.5))
        x = curl_center_x + 60 + radius * math.cos(math.radians(angle))
        y = curl_center_y - 20 + radius * math.sin(math.radians(angle))
        curl2_points.append((x, y))
    
    if len(curl2_points) > 2:
        draw.polygon(curl2_points, fill=(168, 85, 247))
    
    # Scissors accent
    scissors_x = center_x + 80
    scissors_y = center_y + 80
    
    # Scissors blades
    draw.ellipse([scissors_x - 15, scissors_y - 15, scissors_x + 15, scissors_y + 15], fill=(255, 107, 107))
    draw.ellipse([scissors_x + 20, scissors_y - 15, scissors_x + 50, scissors_y + 15], fill=(255, 107, 107))
    
    # Try to add text (may need font adjustment)
    try:
        # App name
        title_y = center_y + 300
        draw.text((center_x, title_y), "CurlMap", fill=(255, 255, 255), 
                 anchor="mm", font=None)  # Will use default font
        
        # Subtitle
        subtitle_y = title_y + 60
        draw.text((center_x, subtitle_y), "Hair Stylist Platform", fill=(255, 255, 255), 
                 anchor="mm", font=None)
        
        # Loading dots
        dot_y = subtitle_y + 100
        for i, x_offset in enumerate([-45, 0, 45]):
            alpha = 150 + (i * 30) % 105  # Animated effect simulation
            draw.ellipse([
                center_x + x_offset - 8, dot_y - 8,
                center_x + x_offset + 8, dot_y + 8
            ], fill=(255, 255, 255, alpha))
            
    except Exception as e:
        print(f"Text rendering failed: {e}")
    
    # Save the image
    img.save('splash.png', 'PNG')
    print("Splash screen created as splash.png")
    
    # Create smaller versions
    # Adaptive icon (1024x1024)
    adaptive_img = img.resize((1024, 1024), Image.Resampling.LANCZOS)
    adaptive_img.save('adaptive-icon.png', 'PNG')
    
    # Icon (512x512)
    icon_img = img.resize((512, 512), Image.Resampling.LANCZOS)
    icon_img.save('icon.png', 'PNG')
    
    # Notification icon (96x96)
    notification_img = img.resize((96, 96), Image.Resampling.LANCZOS)
    notification_img.save('notification-icon.png', 'PNG')
    
    print("All splash screen assets created successfully!")

if __name__ == "__main__":
    create_splash_screen()