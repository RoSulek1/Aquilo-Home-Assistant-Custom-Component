"""Generates pixel-crisp brand assets for Aquilo integration and HACS."""
import struct
import zlib
import math
import os

def save_png(width, height, pixel_fn, filename):
    os.makedirs(os.path.dirname(os.path.abspath(filename)), exist_ok=True)
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # Filter byte 0 (None)
        for x in range(width):
            r, g, b, a = pixel_fn(x, y, width, height)
            raw_data.extend([r, g, b, a])
    
    compressed = zlib.compress(bytes(raw_data), 9)
    
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
    
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png.extend(chunk(b'IHDR', ihdr))
    png.extend(chunk(b'IDAT', compressed))
    png.extend(chunk(b'IEND', b''))
    
    with open(filename, 'wb') as f:
        f.write(png)
    print(f"Generated {filename} ({width}x{height})")


def in_rounded_rect(px, py, half_w, half_h, rad):
    if px <= (half_w - rad) and py <= half_h:
        return True
    if py <= (half_h - rad) and px <= half_w:
        return True
    if px > (half_w - rad) and py > (half_h - rad):
        dist = math.hypot(px - (half_w - rad), py - (half_h - rad))
        return dist <= rad
    return False


def get_square_icon_pixel(x, y, W, H):
    """Square 1:1 icon with centered Aquilo microchip/IoT symbol and text."""
    nx = x / W
    ny = y / H
    
    # Background gradient: deep blue #0E4387 to #083167
    bg_r = int(14 + (8 - 14) * ny)
    bg_g = int(67 + (49 - 67) * ny)
    bg_b = int(135 + (103 - 135) * ny)
    
    # Center chip icon at (0.5 * W, 0.36 * H)
    cx = 0.5 * W
    cy = 0.36 * H
    dx = x - cx
    dy = y - cy
    adx = abs(dx)
    ady = abs(dy)
    
    scale = W / 256.0
    chip_size = 42.0 * scale
    chip_thick = 7.0 * scale
    corner_r = 14.0 * scale
    
    is_white = False
    
    # Rounded chip body frame
    outer = in_rounded_rect(adx, ady, chip_size, chip_size, corner_r)
    inner = in_rounded_rect(adx, ady, chip_size - chip_thick, chip_size - chip_thick, max(1.0, corner_r - chip_thick))
    if outer and not inner:
        is_white = True
        
    # Pins: 2 top, 2 bottom, 2 left, 2 right
    pin_w = 7.0 * scale
    pin_len = 11.0 * scale
    pin_offset = 15.0 * scale
    
    # Top & Bottom pins
    if abs(ady - (chip_size + pin_len * 0.5 + 4 * scale)) <= pin_len * 0.5:
        if abs(adx - pin_offset) <= pin_w * 0.5:
            is_white = True
            
    # Left & Right pins
    if abs(adx - (chip_size + pin_len * 0.5 + 4 * scale)) <= pin_len * 0.5:
        if abs(ady - pin_offset) <= pin_w * 0.5:
            is_white = True

    # "Aquilo" text at bottom: center at (0.5 * W, 0.76 * H)
    tx = (x - 0.5 * W) / scale
    ty = (y - 0.76 * H) / scale
    
    # Rasterize letters for "Aquilo" (scale: tx in -80..80, ty in -25..25)
    # A (-65..-42)
    if -68 <= tx <= -38 and -24 <= ty <= 24:
        # left slant
        if abs((tx - (-66)) - (ty - 24) * (-14/48)) <= 3.2:
            is_white = True
        # right slant
        if abs((tx - (-40)) + (ty - 24) * (-14/48)) <= 3.2:
            is_white = True
        # crossbar
        if -60 <= tx <= -46 and abs(ty - 4) <= 2.5:
            is_white = True

    # q (-34..-12)
    if -36 <= tx <= -10 and -10 <= ty <= 36:
        if -10 <= ty <= 18:
            q_out = in_rounded_rect(abs(tx - (-24)), abs(ty - 4), 11, 11, 5)
            q_in = in_rounded_rect(abs(tx - (-24)), abs(ty - 4), 6, 6, 3)
            if q_out and not q_in:
                is_white = True
        if abs(tx - (-13)) <= 2.5 and -10 <= ty <= 36:
            is_white = True

    # u (-6..14)
    if -8 <= tx <= 16 and -10 <= ty <= 18:
        if abs(tx - (-4)) <= 2.5 and -10 <= ty <= 12:
            is_white = True
        if abs(tx - 12) <= 2.5 and -10 <= ty <= 18:
            is_white = True
        if -4 <= tx <= 12 and abs(ty - 16) <= 2.5:
            is_white = True

    # i (21..28)
    if 18 <= tx <= 30:
        if -10 <= ty <= 18 and abs(tx - 24) <= 2.5:
            is_white = True
        if abs(ty - (-22)) <= 3.5 and abs(tx - 24) <= 3.5:
            is_white = True

    # l (34..42)
    if 31 <= tx <= 44 and -26 <= ty <= 18:
        if abs(tx - 37) <= 2.5:
            is_white = True

    # o (48..74)
    if 46 <= tx <= 76 and -10 <= ty <= 18:
        o_out = in_rounded_rect(abs(tx - 61), abs(ty - 4), 11, 11, 5)
        o_in = in_rounded_rect(abs(tx - 61), abs(ty - 4), 6, 6, 3)
        if o_out and not o_in:
            is_white = True

    if is_white:
        return 255, 255, 255, 255
    return bg_r, bg_g, bg_b, 255


def get_rect_logo_pixel(x, y, W, H):
    """Rectangular logo (approx 3:2 ratio) with microchip symbol and Aquilo text."""
    nx = x / W
    ny = y / H
    
    bg_r = int(14 + (8 - 14) * ny)
    bg_g = int(67 + (49 - 67) * ny)
    bg_b = int(135 + (103 - 135) * ny)
    
    scale = W / 320.0
    cx = 0.5 * W
    cy = 0.32 * H
    dx = x - cx
    dy = y - cy
    adx = abs(dx)
    ady = abs(dy)
    
    chip_size = 35.0 * scale
    chip_thick = 6.0 * scale
    corner_r = 12.0 * scale
    
    is_white = False
    
    outer = in_rounded_rect(adx, ady, chip_size, chip_size, corner_r)
    inner = in_rounded_rect(adx, ady, chip_size - chip_thick, chip_size - chip_thick, max(1.0, corner_r - chip_thick))
    if outer and not inner:
        is_white = True
        
    pin_w = 6.0 * scale
    pin_len = 10.0 * scale
    pin_offset = 12.0 * scale
    
    if abs(ady - (chip_size + pin_len * 0.5 + 3 * scale)) <= pin_len * 0.5:
        if abs(adx - pin_offset) <= pin_w * 0.5:
            is_white = True
            
    if abs(adx - (chip_size + pin_len * 0.5 + 3 * scale)) <= pin_len * 0.5:
        if abs(ady - pin_offset) <= pin_w * 0.5:
            is_white = True

    # "Aquilo" text at bottom: center at (0.5 * W, 0.74 * H)
    tx = (x - 0.5 * W) / scale
    ty = (y - 0.74 * H) / scale
    
    # A
    if -68 <= tx <= -38 and -24 <= ty <= 24:
        if abs((tx - (-66)) - (ty - 24) * (-14/48)) <= 3.2:
            is_white = True
        if abs((tx - (-40)) + (ty - 24) * (-14/48)) <= 3.2:
            is_white = True
        if -60 <= tx <= -46 and abs(ty - 4) <= 2.5:
            is_white = True

    # q
    if -36 <= tx <= -10 and -10 <= ty <= 36:
        if -10 <= ty <= 18:
            q_out = in_rounded_rect(abs(tx - (-24)), abs(ty - 4), 11, 11, 5)
            q_in = in_rounded_rect(abs(tx - (-24)), abs(ty - 4), 6, 6, 3)
            if q_out and not q_in:
                is_white = True
        if abs(tx - (-13)) <= 2.5 and -10 <= ty <= 36:
            is_white = True

    # u
    if -8 <= tx <= 16 and -10 <= ty <= 18:
        if abs(tx - (-4)) <= 2.5 and -10 <= ty <= 12:
            is_white = True
        if abs(tx - 12) <= 2.5 and -10 <= ty <= 18:
            is_white = True
        if -4 <= tx <= 12 and abs(ty - 16) <= 2.5:
            is_white = True

    # i
    if 18 <= tx <= 30:
        if -10 <= ty <= 18 and abs(tx - 24) <= 2.5:
            is_white = True
        if abs(ty - (-22)) <= 3.5 and abs(tx - 24) <= 3.5:
            is_white = True

    # l
    if 31 <= tx <= 44 and -26 <= ty <= 18:
        if abs(tx - 37) <= 2.5:
            is_white = True

    # o
    if 46 <= tx <= 76 and -10 <= ty <= 18:
        o_out = in_rounded_rect(abs(tx - 61), abs(ty - 4), 11, 11, 5)
        o_in = in_rounded_rect(abs(tx - 61), abs(ty - 4), 6, 6, 3)
        if o_out and not o_in:
            is_white = True

    if is_white:
        return 255, 255, 255, 255
    return bg_r, bg_g, bg_b, 255


if __name__ == '__main__':
    # Home Assistant brand folder (2026.3+ requirement)
    save_png(256, 256, get_square_icon_pixel, 'custom_components/aquilo/brand/icon.png')
    save_png(512, 512, get_square_icon_pixel, 'custom_components/aquilo/brand/icon@2x.png')
    save_png(256, 256, get_square_icon_pixel, 'custom_components/aquilo/brand/dark_icon.png')
    save_png(512, 512, get_square_icon_pixel, 'custom_components/aquilo/brand/dark_icon@2x.png')
    save_png(320, 200, get_rect_logo_pixel, 'custom_components/aquilo/brand/logo.png')
    save_png(640, 400, get_rect_logo_pixel, 'custom_components/aquilo/brand/logo@2x.png')
    save_png(320, 200, get_rect_logo_pixel, 'custom_components/aquilo/brand/dark_logo.png')

    # Root of custom_components/aquilo (compatibility with older HA & HACS)
    save_png(256, 256, get_square_icon_pixel, 'custom_components/aquilo/icon.png')
    save_png(512, 512, get_square_icon_pixel, 'custom_components/aquilo/icon@2x.png')
    save_png(320, 200, get_rect_logo_pixel, 'custom_components/aquilo/logo.png')

    # Repository Root for HACS and GitHub brand display
    save_png(256, 256, get_square_icon_pixel, 'icon.png')
    save_png(512, 512, get_square_icon_pixel, 'icon@2x.png')
    save_png(320, 200, get_rect_logo_pixel, 'logo.png')

    # images/ directory
    save_png(256, 256, get_square_icon_pixel, 'images/icon.png')
    save_png(320, 200, get_rect_logo_pixel, 'images/logo.png')

    # public/ for Vite web preview
    save_png(256, 256, get_square_icon_pixel, 'public/icon.png')
    save_png(320, 200, get_rect_logo_pixel, 'public/logo.png')
