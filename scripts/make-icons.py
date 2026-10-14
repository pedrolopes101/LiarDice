"""Draws the app icon set into assets/: the brown dice cup from the app, on the
green felt, with a 3D die (red 1 on top) in front of it.

Run with:  python3 scripts/make-icons.py   (needs Pillow and numpy)
"""
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

GREEN = (11, 93, 59, 255)
CUP = (93, 58, 26, 255)
CUP_RIM = (62, 37, 16, 255)
RED = (229, 57, 53, 255)
PIP = (40, 40, 40, 255)
# Lit top, mid-gray left side, darker right side.
FACE_SHADES = {"top": (252, 252, 252, 255), "left": (226, 226, 226, 255), "right": (196, 196, 196, 255)}
SS = 4  # supersampling factor for smooth edges

PIPS = {
    1: [(0.5, 0.5)],
    2: [(0.25, 0.25), (0.75, 0.75)],
    3: [(0.25, 0.25), (0.5, 0.5), (0.75, 0.75)],
}

ASSETS = Path(__file__).resolve().parent.parent / "assets"


def face_square(size: int, face: int, fill, pip_color, mono: bool) -> Image.Image:
    """A flat die face. In mono mode the face is inset (so edges show as gaps)
    and the pips are holes."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    inset = size * 0.06 if mono else 0
    d.rounded_rectangle((inset, inset, size - 1 - inset, size - 1 - inset), size * 0.18, fill=fill)
    pip = size * (0.24 if face == 1 else 0.17)
    for px, py in PIPS[face]:
        x, y = px * size - pip / 2, py * size - pip / 2
        d.ellipse((x, y, x + pip, y + pip), fill=(0, 0, 0, 0) if mono else pip_color)
    return img


def warp(face: Image.Image, canvas_size: int, origin, u, v) -> Image.Image:
    """Maps the square `face` onto the parallelogram origin + s*u + t*v."""
    n = face.width
    m = np.array([[u[0], v[0]], [u[1], v[1]]]) / n
    inv = np.linalg.inv(m)
    a, b = inv[0]
    d, e = inv[1]
    c = -(a * origin[0] + b * origin[1])
    f = -(d * origin[0] + e * origin[1])
    return face.transform((canvas_size, canvas_size), Image.AFFINE, (a, b, c, d, e, f), resample=Image.BICUBIC)


def die_3d(canvas_size: int, center, edge: float, mono: bool) -> Image.Image:
    """An isometric die: 1 on top, 2 on the left side, 3 on the right side."""
    cx, cy = center
    cos30, sin30 = math.cos(math.radians(30)), 0.5
    # M is the front corner where the three visible faces meet.
    m = (cx, cy + edge * 0.0)
    ul = (-edge * cos30, -edge * sin30)
    ur = (edge * cos30, -edge * sin30)
    down = (0, edge)
    tex = 512
    white = (255, 255, 255, 255)

    faces = [
        ("top", 1, RED, m, ul, ur),
        ("left", 2, PIP, (m[0] + ul[0], m[1] + ul[1]), (-ul[0], -ul[1]), down),
        ("right", 3, PIP, m, ur, down),
    ]
    out = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    for name, value, pip_color, origin, u, v in faces:
        fill = white if mono else FACE_SHADES[name]
        out.alpha_composite(warp(face_square(tex, value, fill, pip_color, mono), canvas_size, origin, u, v))
    return out


def cup_mask(size: int, box) -> Image.Image:
    """The cup outline from the app: gently rounded top, deep rounded bottom."""
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    top_r = w * 0.16
    # Bottom corners are elliptical: wide and deep, like the cup in the app.
    rx, ry = w * 0.4, h * 0.5

    def arc(cx, cy, ax, ay, start, end, steps=48):
        return [
            (cx + ax * math.cos(math.radians(a)), cy + ay * math.sin(math.radians(a)))
            for a in np.linspace(start, end, steps)
        ]

    outline = (
        arc(x0 + top_r, y0 + top_r, top_r, top_r, 180, 270)
        + arc(x1 - top_r, y0 + top_r, top_r, top_r, 270, 360)
        + arc(x1 - rx, y1 - ry, rx, ry, 0, 90)
        + arc(x0 + rx, y1 - ry, rx, ry, 90, 180)
    )
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).polygon(outline, fill=255)
    return mask


def logo(size: int, mono: bool = False) -> Image.Image:
    """Cup + die filling a `size` px square (transparent background)."""
    big = size * SS
    out = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    box = (big * 0.02, big * 0.1, big * 0.98, big * 0.9)
    mask = cup_mask(big, box)
    rim = big * 0.035
    inner = cup_mask(big, (box[0] + rim, box[1] + rim, box[2] - rim, box[3] - rim))

    edge = big * 0.27
    die = die_3d(big, (big / 2, big * 0.53), edge, mono)

    if mono:
        # White cup with the die cut out, then the die's faces drawn back in.
        out.paste((255, 255, 255, 255), (0, 0), mask)
        die_shape = die.getchannel("A").point(lambda a: 255 if a else 0).filter(ImageFilter.MaxFilter(9))
        hull = Image.new("L", (big, big), 0)
        cx, cy = big / 2, big * 0.53
        cos30 = math.cos(math.radians(30))
        hex_pts = [(cx, cy + edge), (cx - edge * cos30, cy + edge / 2), (cx - edge * cos30, cy - edge / 2),
                   (cx, cy - edge), (cx + edge * cos30, cy - edge / 2), (cx + edge * cos30, cy + edge / 2)]
        ImageDraw.Draw(hull).polygon(hex_pts, fill=255)
        hull = hull.filter(ImageFilter.MaxFilter(2 * int(big * 0.012) + 1))
        out.putalpha(ImageChops.subtract(out.getchannel("A"), ImageChops.lighter(hull, die_shape)))
        out.alpha_composite(die)
    else:
        out.paste(CUP_RIM, (0, 0), mask)
        out.paste(CUP, (0, 0), inner)
        shadow = Image.new("RGBA", (big, big), (0, 0, 0, 0))
        shadow.paste((0, 0, 0, 120), (0, int(big * 0.02)), die.getchannel("A"))
        out.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(big * 0.012)))
        out.alpha_composite(die)
    return out.resize((size, size), Image.LANCZOS)


def with_cup_shadow(size: int, content: Image.Image) -> Image.Image:
    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    offset = (size - content.width) // 2
    shadow.paste((0, 0, 0, 110), (offset, offset + int(size * 0.025)), content.getchannel("A"))
    return shadow.filter(ImageFilter.GaussianBlur(size * 0.02))


def on_background(size: int, content_ratio: float) -> Image.Image:
    img = Image.new("RGBA", (size, size), GREEN)
    content = logo(int(size * content_ratio))
    img.alpha_composite(with_cup_shadow(size, content))
    offset = (size - content.width) // 2
    img.alpha_composite(content, (offset, offset))
    return img


def centered(size: int, content_ratio: float, mono: bool = False) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    content = logo(int(size * content_ratio), mono)
    if not mono:
        img.alpha_composite(with_cup_shadow(size, content))
    offset = (size - content.width) // 2
    img.alpha_composite(content, (offset, offset))
    return img


# iOS / default icon: opaque, full bleed.
on_background(1024, 0.74).convert("RGB").save(ASSETS / "icon.png")
# Android adaptive icon: launchers crop to the central ~66%, so keep the logo inside it.
centered(512, 0.5).save(ASSETS / "android-icon-foreground.png")
Image.new("RGBA", (512, 512), GREEN).save(ASSETS / "android-icon-background.png")
centered(432, 0.5, mono=True).save(ASSETS / "android-icon-monochrome.png")
centered(1024, 0.6).save(ASSETS / "splash-icon.png")
on_background(48, 0.86).save(ASSETS / "favicon.png")
print("icons written to", ASSETS)
