"""Builds the landing-page feature pictures from the raw files of feature-assets.playwright.js.

    python3 tests/feature-assets.py        (macOS: uses `qlmanage` to rasterise the PDF pages; needs Pillow)

Output (repo root): feat-levels.jpg, feat-paint.jpg, feat-print.jpg
"""
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "tests" / ".out"
BG = (236, 234, 229)       # --surface-2 of the light theme: reads as a desk in both themes
W, H = 1200, 760


def font(size, bold=False):
    for f in ("/System/Library/Fonts/SFNS.ttf", "/System/Library/Fonts/Helvetica.ttc"):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            pass
    return ImageFont.load_default(size)


def sheet(canvas, img, box, angle=0):
    """Paste img fitted into box as a sheet of paper with a soft shadow."""
    x0, y0, x1, y1 = box
    scale = min((x1 - x0) / img.width, (y1 - y0) / img.height)
    img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS).convert("RGBA")
    if angle:
        img = img.rotate(angle, expand=True, resample=Image.BICUBIC)
    px, py = x0 + ((x1 - x0) - img.width) // 2, y0 + ((y1 - y0) - img.height) // 2
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    mask = img.split()[3].point(lambda a: a * 0.28)
    shadow.paste((40, 30, 20, 255), (px + 6, py + 14), mask)
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(14)))
    canvas.alpha_composite(img, (px, py))
    return px, py, img.width, img.height


def label(canvas, text, cx, y):
    d = ImageDraw.Draw(canvas)
    f = font(26)
    w = d.textlength(text, font=f)
    d.rounded_rectangle([cx - w / 2 - 18, y, cx + w / 2 + 18, y + 46], 23, fill=(28, 24, 21, 255))
    d.text((cx - w / 2, y + 8), text, font=f, fill=(255, 255, 255, 255))


def pdf_page(n):
    subprocess.run(["qlmanage", "-t", "-s", "1600", "-o", str(OUT), str(OUT / f"print-{n}.pdf")],
                   check=True, capture_output=True)
    return Image.open(OUT / f"print-{n}.pdf.png").convert("RGB")


# 1) detail levels: same photo, lowest vs highest level
c = Image.new("RGBA", (W, 540), BG + (255,))
for name, text, x in (("kids", "Kids · 8 colors", 36), ("fine", "Fine · 50 colors", 612)):
    px, py, w, h = sheet(c, Image.open(OUT / f"levels-{name}.png"), (x, 50, x + 552, 50 + 368))
    label(c, text, px + w // 2, py + h + 24)
c.convert("RGB").save(ROOT / "feat-levels.jpg", quality=84, optimize=True, progressive=True)

# 2) paint screen as captured
Image.open(OUT / "feat-paint.png").convert("RGB").save(ROOT / "feat-paint.jpg", quality=84, optimize=True, progressive=True)

# 3) the two pages of the exported PDF
c = Image.new("RGBA", (W, 640), BG + (255,))
sheet(c, pdf_page(2), (740, 30, 1150, 610), angle=-3)
sheet(c, pdf_page(1), (40, 90, 780, 600), angle=2)
c.convert("RGB").save(ROOT / "feat-print.jpg", quality=84, optimize=True, progressive=True)
print("ok")
