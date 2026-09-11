"""Genereert de Eduarte Tools app-iconen: afgeronde vierkante tegel met
een diagonale blauw->magenta gradient, een wit "studiebuddy"-silhouet
(afgeronde hoodie/geest-vorm) en een wit maansikkeltje rechtsboven -
in dezelfde stijl als het aangeleverde referentielogo."""
from PIL import Image, ImageDraw, ImageChops

TOP_LEFT = (45, 103, 185)      # blauw
BOTTOM_RIGHT = (188, 60, 188)  # magenta/paars

def rounded_square_gradient(size, radius_ratio=0.24):
    grad = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = grad.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1))
            r = round(TOP_LEFT[0] + (BOTTOM_RIGHT[0] - TOP_LEFT[0]) * t)
            g = round(TOP_LEFT[1] + (BOTTOM_RIGHT[1] - TOP_LEFT[1]) * t)
            b = round(TOP_LEFT[2] + (BOTTOM_RIGHT[2] - TOP_LEFT[2]) * t)
            px[x, y] = (r, g, b, 255)

    mask = Image.new("L", (size, size), 0)
    mdraw = ImageDraw.Draw(mask)
    radius = int(size * radius_ratio)
    mdraw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    img.paste(grad, (0, 0), mask)
    return img

def draw_buddy(img, size):
    """Afgeronde 'hoodie/geest'-silhouet links-onder in het midden."""
    draw = ImageDraw.Draw(img)
    cx = size * 0.42
    head_r = size * 0.155
    head_cy = size * 0.40
    draw.ellipse(
        [cx - head_r, head_cy - head_r, cx + head_r, head_cy + head_r],
        fill=(255, 255, 255, 255),
    )
    body_top = head_cy
    body_bottom = size * 0.80
    top_half_w = head_r
    bottom_half_w = size * 0.205
    steps = 28
    left_pts = []
    right_pts = []
    for i in range(steps + 1):
        t = i / steps
        y = body_top + (body_bottom - body_top) * t
        eased = t ** 1.6
        half_w = top_half_w + (bottom_half_w - top_half_w) * eased
        left_pts.append((cx - half_w, y))
        right_pts.append((cx + half_w, y))
    polygon = left_pts + right_pts[::-1]
    draw.polygon(polygon, fill=(255, 255, 255, 255))
    draw.ellipse(
        [cx - bottom_half_w, body_bottom - bottom_half_w * 0.55,
         cx + bottom_half_w, body_bottom + bottom_half_w * 0.55],
        fill=(255, 255, 255, 255),
    )

def draw_moon(img, size):
    """Wit maansikkeltje rechtsboven, via cirkel-verschil masker."""
    mask = Image.new("L", (size, size), 0)
    mdraw = ImageDraw.Draw(mask)
    r = size * 0.145
    cx, cy = size * 0.685, size * 0.285
    mdraw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    cut_r = r * 0.92
    cut_cx, cut_cy = cx + r * 0.55, cy - r * 0.32
    cut_mask = Image.new("L", (size, size), 0)
    cdraw = ImageDraw.Draw(cut_mask)
    cdraw.ellipse(
        [cut_cx - cut_r, cut_cy - cut_r, cut_cx + cut_r, cut_cy + cut_r], fill=255
    )
    crescent_mask = ImageChops.subtract(mask, cut_mask)
    white = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    img.paste(white, (0, 0), crescent_mask)

def make_icon(size):
    img = rounded_square_gradient(size)
    draw_buddy(img, size)
    draw_moon(img, size)
    return img

for icon_size in (16, 48, 128):
    make_icon(icon_size).save(f"icons/icon{icon_size}.png")

print("Iconen gegenereerd")
