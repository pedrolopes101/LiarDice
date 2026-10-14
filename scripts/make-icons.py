"""Draws the app icon set into assets/: two dice (a red 1 in front of a black 6)
on the green felt used in the app.

Run with:  python3 scripts/make-icons.py   (needs Pillow)
"""
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

GREEN = (11, 93, 59, 255)
WHITE = (253, 253, 253, 255)
EDGE = (200, 200, 200, 255)
RED = (211, 47, 47, 255)
BLACK = (33, 33, 33, 255)
SS = 4  # supersampling factor for smooth edges

PIPS = {
    1: [(1, 1)],
    6: [(0, 0), (0, 2), (1, 0), (1, 2), (2, 0), (2, 2)],
}

ASSETS = Path(__file__).resolve().parent.parent / "assets"


def die(size: int, face: int, pip_color, mono: bool) -> Image.Image:
    """One die, `size` px square. In mono mode the die is white and pips are holes."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    radius = size * 0.2
    border = max(1, int(size * 0.035))
    if mono:
        d.rounded_rectangle((0, 0, size - 1, size - 1), radius, fill=(255, 255, 255, 255))
    else:
        d.rounded_rectangle((0, 0, size - 1, size - 1), radius, fill=EDGE)
        d.rounded_rectangle((border, border, size - 1 - border, size - 1 - border), radius - border, fill=WHITE)
    cell = size / 3
    pip = size * 0.19
    for row, col in PIPS[face]:
        x = col * cell + (cell - pip) / 2
        y = row * cell + (cell - pip) / 2
        d.ellipse((x, y, x + pip, y + pip), fill=(0, 0, 0, 0) if mono else pip_color)
    return img


def dice_group(size: int, mono: bool = False) -> Image.Image:
    """Both dice, scaled to fill a `size` px square (transparent background)."""
    big = size * SS
    canvas = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    die_size = int(big * 0.56)

    back = die(die_size, 6, BLACK, mono).rotate(14, resample=Image.BICUBIC, expand=True)
    front = die(die_size, 1, RED, mono).rotate(-12, resample=Image.BICUBIC, expand=True)
    back_pos = (big - back.width, 0)
    front_pos = (0, big - front.width)

    canvas.alpha_composite(back, back_pos)

    front_mask = Image.new("L", (big, big), 0)
    front_mask.paste(front.getchannel("A"), front_pos)

    # Cut a gap around the front die so the two dice read separately: the same
    # rotated rounded square, a little larger, centered on the front die.
    g = int(big * 0.025)
    halo = Image.new("L", (die_size + 2 * g, die_size + 2 * g), 0)
    ImageDraw.Draw(halo).rounded_rectangle((0, 0, halo.width - 1, halo.height - 1), die_size * 0.2 + g, fill=255)
    halo = halo.rotate(-12, resample=Image.BICUBIC, expand=True)
    gap = Image.new("L", (big, big), 0)
    cx = front_pos[0] + front.width // 2
    cy = front_pos[1] + front.height // 2
    gap.paste(halo, (cx - halo.width // 2, cy - halo.height // 2))
    canvas.putalpha(ImageChops.subtract(canvas.getchannel("A"), gap))

    if not mono:
        shadow = Image.new("RGBA", (big, big), (0, 0, 0, 0))
        shadow.paste((0, 0, 0, 110), (int(big * 0.015), int(big * 0.03)), front_mask)
        canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(big * 0.015)))
    canvas.alpha_composite(front, front_pos)
    return canvas.resize((size, size), Image.LANCZOS)


def on_background(size: int, content_ratio: float) -> Image.Image:
    img = Image.new("RGBA", (size, size), GREEN)
    group = dice_group(int(size * content_ratio))
    offset = (size - group.width) // 2
    img.alpha_composite(group, (offset, offset))
    return img


def centered(size: int, content_ratio: float, mono: bool = False) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    group = dice_group(int(size * content_ratio), mono)
    offset = (size - group.width) // 2
    img.alpha_composite(group, (offset, offset))
    return img


# iOS / default icon: opaque, full bleed.
on_background(1024, 0.68).convert("RGB").save(ASSETS / "icon.png")
# Android adaptive icon: launchers crop to the central ~66%, so keep the dice inside it.
centered(512, 0.48).save(ASSETS / "android-icon-foreground.png")
Image.new("RGBA", (512, 512), GREEN).save(ASSETS / "android-icon-background.png")
centered(432, 0.48, mono=True).save(ASSETS / "android-icon-monochrome.png")
centered(1024, 0.6).save(ASSETS / "splash-icon.png")
on_background(48, 0.8).save(ASSETS / "favicon.png")
print("icons written to", ASSETS)
