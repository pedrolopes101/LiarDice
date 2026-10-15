"""Draws the app icon set into assets/: the brown dice cup from the app, on the
green felt, with the Noto Emoji game die (🎲) in front of it.

The die comes from assets/source/noto-game-die.png, rendered from
assets/source/noto-game-die.svg (Noto Emoji, Copyright Google LLC, Apache
License 2.0). To re-render the PNG, open the SVG in a browser at 1024x1024 with
a transparent background and save it.

Run with:  python3 scripts/make-icons.py   (needs Pillow and numpy)
"""
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

GREEN = (11, 93, 59, 255)
CUP = (93, 58, 26, 255)
CUP_RIM = (62, 37, 16, 255)
SS = 4  # supersampling factor for smooth edges

ASSETS = Path(__file__).resolve().parent.parent / "assets"
DIE = Image.open(ASSETS / "source/noto-game-die.png").convert("RGBA")
DIE = DIE.crop(DIE.getbbox())


def die_image(width: int, mono: bool) -> Image.Image:
    """The die scaled to `width`. In mono mode it is white, with the pips as holes."""
    die = DIE.resize((width, round(DIE.height * width / DIE.width)), Image.LANCZOS)
    if not mono:
        return die
    light = die.convert("L").point(lambda v: 255 if v > 120 else 0)
    white = Image.new("RGBA", die.size, (255, 255, 255, 255))
    white.putalpha(ImageChops.multiply(die.getchannel("A"), light))
    return white


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

    die = die_image(int(big * 0.5), mono)
    die_pos = ((big - die.width) // 2, int(big * 0.5 - die.height / 2))
    die_layer = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    die_layer.alpha_composite(die, die_pos)

    if mono:
        # White cup with a gap cut around the die, so the die reads on its own.
        out.paste((255, 255, 255, 255), (0, 0), mask)
        outline = Image.new("L", (big, big), 0)
        outline.paste(DIE.getchannel("A").resize(die.size), die_pos)
        # Grow the die outline by a few percent (at quarter size, for speed), then re-sharpen it.
        small = outline.resize((big // 4, big // 4), Image.BILINEAR).filter(ImageFilter.MaxFilter(9))
        gap = small.resize((big, big), Image.BILINEAR).point(lambda v: 255 if v > 127 else 0)
        out.putalpha(ImageChops.subtract(out.getchannel("A"), gap))
    else:
        out.paste(CUP_RIM, (0, 0), mask)
        out.paste(CUP, (0, 0), inner)
        shadow = Image.new("RGBA", (big, big), (0, 0, 0, 0))
        shadow.paste((0, 0, 0, 120), (0, int(big * 0.02)), die_layer.getchannel("A"))
        out.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(big * 0.012)))
    out.alpha_composite(die_layer)
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
