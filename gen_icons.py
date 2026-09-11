"""Genereert de Eduarte Tools app-iconen: afgeronde vierkante tegel met
een diagonale blauw->paars gradient en een eenvoudig wit glyph in het
midden, in dezelfde stijl als moderne Android/iOS app-iconen."""
from PIL import Image, ImageDraw
import math

def rounded_square_gradient(size, radius_ratio=0.24):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # Diagonale gradient: blauw (linksboven) -> paars (rechtsonder)
    grad = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    top_left = (37, 99, 235)     # #2563eb
    bottom_right = (147, 51, 234)  # #9333ea
    px = grad.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1))
            r = round(top_left[0] + (bottom_right[0] - top_left[0]) * t)
            g = round(top_left[1] + (bottom_right[1] - top_left[1]) * t)
            b = round(top_left[2] + (bottom_right[2] - top_left[2]) * t)
            px[x, y] = (r, g, b, 255)

    mask = Image.new("L", (size, size), 0)
    mdraw = ImageDraw.Draw(mask)
    radius = int(size * radius_ratio)
    mdraw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    img.paste(grad, (0, 0), mask)
    return img

def draw_spark(draw, cx, cy, s, color=(255, 255, 255, 255)):
    # Vierpuntige ster ("spark"), simpel en herkenbaar op klein formaat
    pts = [
        (cx, cy - s),
        (cx + s * 0.28, cy - s * 0.28),
        (cx + s, cy),
        (cx + s * 0.28, cy + s * 0.28),
        (cx, cy + s),
        (cx - s * 0.28, cy + s * 0.28),
        (cx - s, cy),
        (cx - s * 0.28, cy - s * 0.28),
    ]
    draw.polygon(pts, fill=color)

def make_icon(size):
    img = rounded_square_gradient(size)
    draw = ImageDraw.Draw(img)
    cx, cy = size / 2, size / 2
    draw_spark(draw, cx, cy, size * 0.26)
    # Klein tweede sparkeltje rechtsboven voor diepte, zoals bij moderne app-iconen
    if size >= 48:
        draw_spark(draw, size * 0.74, size * 0.28, size * 0.09, (255, 255, 255, 210))
    return img

for size in (16, 48, 128):
    icon = make_icon(size)
    icon.save(f"icons/icon{size}.png")

print("Iconen gegenereerd")
