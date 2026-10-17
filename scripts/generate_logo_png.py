"""Generates pixel-crisp PNG logo and icon for Aquilo without third-party dependencies."""
import struct
import zlib
import math

def save_png(width, height, pixel_fn, filename):
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


def get_aquilo_logo_pixel(x, y, W, H):
    # Normalized coordinates
    nx = x / W
    ny = y / H
    
    # Background gradient: deep blue to navy
    bg_r = int(18 + (10 - 18) * ny)
    bg_g = int(72 + (45 - 72) * ny)
    bg_b = int(145 + (102 - 145) * ny)
    
    # Microchip center is at (0.5 * W, 0.30 * H)
    cx = 0.5 * W
    cy = 0.30 * H
    dx = x - cx
    dy = y - cy
    
    is_white = False
    
    # Outer chip frame: 40x40 with rounded corners (r=8), border thickness 6
    chip_size = 22
    chip_thick = 3.5
    corner_r = 7.0
    
    adx = abs(dx)
    ady = abs(dy)
    
    # Check if point is inside rounded square frame
    def in_rounded_rect(px, py, half_w, half_h, rad):
        if px <= (half_w - rad) and py <= half_h:
            return True
        if py <= (half_h - rad) and px <= half_w:
            return True
        if px > (half_w - rad) and py > (half_h - rad):
            dist = math.hypot(px - (half_w - rad), py - (half_h - rad))
            return dist <= rad
        return False

    outer = in_rounded_rect(adx, ady, chip_size, chip_size, corner_r)
    inner = in_rounded_rect(adx, ady, chip_size - chip_thick, chip_size - chip_thick, max(1.0, corner_r - chip_thick))
    
    if outer and not inner:
        is_white = True
        
    # Chip pins: 2 on top, 2 on bottom, 2 on left, 2 on right
    pin_w = 3.5
    pin_len = 5.0
    pin_offset = 7.5
    pin_dist = chip_size + pin_len + 1.0
    
    # Top & Bottom pins
    if abs(ady - (chip_size + pin_len * 0.5 + 2)) <= pin_len * 0.5:
        if abs(adx - pin_offset) <= pin_w * 0.5:
            is_white = True
            
    # Left & Right pins
    if abs(adx - (chip_size + pin_len * 0.5 + 2)) <= pin_len * 0.5:
        if abs(ady - pin_offset) <= pin_w * 0.5:
            is_white = True

    # Aquilo text rendering bitmap (simplified clean geometric raster)
    # Text region: Y around 0.58*H to 0.88*H
    tx = x - (0.5 * W)
    ty = y - (0.75 * H)
    
    # Letter segments for "Aquilo"
    # letters: A(-48..-30), q(-26..-10), u(-6..+8), i(+13..+17), l(+22..+26), o(+31..+47)
    # A
    if -49 <= tx <= -31 and -16 <= ty <= 16:
        # Left leg
        if abs((tx - (-49)) - (ty - 16) * (-9/32)) <= 2:
            is_white = True
        # Right leg
        if abs((tx - (-31)) + (ty - 16) * (-9/32)) <= 2:
            is_white = True
        # Crossbar
        if -44 <= tx <= -36 and abs(ty - 3) <= 1.5:
            is_white = True
            
    # q
    if -27 <= tx <= -11 and -7 <= ty <= 24:
        # circle body (-7..11)
        if -7 <= ty <= 11:
            q_out = in_rounded_rect(abs(tx - (-19)), abs(ty - 2), 7, 7, 3)
            q_in = in_rounded_rect(abs(tx - (-19)), abs(ty - 2), 4, 4, 2)
            if q_out and not q_in:
                is_white = True
        # descender bar
        if abs(tx - (-12)) <= 1.5 and -7 <= ty <= 24:
            is_white = True

    # u
    if -7 <= tx <= 7 and -7 <= ty <= 11:
        # left bar
        if abs(tx - (-5)) <= 1.5 and -7 <= ty <= 8:
            is_white = True
        # right bar
        if abs(tx - 5) <= 1.5 and -7 <= ty <= 11:
            is_white = True
        # bottom curve
        if -5 <= tx <= 5 and abs(ty - 10) <= 1.5:
            is_white = True

    # i
    if 10 <= tx <= 16:
        # stem
        if -7 <= ty <= 11 and abs(tx - 13) <= 1.5:
            is_white = True
        # dot
        if abs(ty - (-14)) <= 2 and abs(tx - 13) <= 2:
            is_white = True

    # l
    if 19 <= tx <= 25 and -18 <= ty <= 11:
        if abs(tx - 22) <= 1.5:
            is_white = True

    # o
    if 28 <= tx <= 46 and -7 <= ty <= 11:
        o_out = in_rounded_rect(abs(tx - 37), abs(ty - 2), 7, 7, 3.5)
        o_in = in_rounded_rect(abs(tx - 37), abs(ty - 2), 4, 4, 2)
        if o_out and not o_in:
            is_white = True

    if is_white:
        return 255, 255, 255, 255
    return bg_r, bg_g, bg_b, 255


if __name__ == '__main__':
    save_png(240, 160, get_aquilo_logo_pixel, 'logo.png')
    save_png(240, 160, get_aquilo_logo_pixel, 'custom_components/aquilo/logo.png')
    save_png(128, 128, get_aquilo_logo_pixel, 'custom_components/aquilo/icon.png')
    save_png(240, 160, get_aquilo_logo_pixel, 'public/logo.png')
