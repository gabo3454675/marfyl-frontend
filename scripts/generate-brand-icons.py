#!/usr/bin/env python3
"""
Genera iconos PWA / iOS / Android desde logo-marfyl.png.

- any: emblema azul sobre fondo blanco (más padding para iOS/Android)
- maskable: emblema blanco sobre azul MARFYL (zona segura ~80%, sin recortes)
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
SOURCE = PUBLIC / "logo-marfyl.png"

# Azul marca (coincide con el flyer / icono de marca)
BRAND_BLUE = (34, 118, 210, 255)
BRAND_BLUE_HEX = "#2276D2"


def find_emblem_bottom(rgba: Image.Image) -> int:
    """Detecta dónde empieza el wordmark oscuro para no cortar el emblema."""
    w, h = rgba.size
    pixels = rgba.load()
    for y in range(int(h * 0.42), h):
        dark = 0
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a < 180:
                continue
            if r + g + b < 420 and max(r, g, b) < 120:
                dark += 1
        if dark > w * 0.08:
            return max(int(h * 0.55), y - int(h * 0.025))
    return int(h * 0.64)


def crop_emblem(img: Image.Image) -> Image.Image:
    """Recorta solo el emblema circular, sin el wordmark inferior."""
    rgba = img.convert("RGBA")
    w, h = rgba.size
    bottom = find_emblem_bottom(rgba)
    region = rgba.crop((0, 0, w, bottom))

    pixels = region.load()
    min_x, min_y, max_x, max_y = w, region.height, 0, 0
    for y in range(region.height):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a < 40:
                continue
            if r + g + b > 740:
                continue
            if b < max(r, g) + 5:
                continue
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x)
            max_y = max(max_y, y)

    if max_x <= min_x:
        return region

    pad = max(6, int(w * 0.025))
    return region.crop(
        (
            max(0, min_x - pad),
            max(0, min_y - pad),
            min(w, max_x + pad),
            min(region.height, max_y + pad),
        )
    )


def emblem_to_white(emblem: Image.Image) -> Image.Image:
    """Convierte el emblema azul a blanco (para icono maskable sobre fondo azul)."""
    rgba = emblem.convert("RGBA")
    out = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    src = rgba.load()
    dst = out.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = src[x, y]
            if a < 30:
                continue
            if r + g + b > 740:
                continue
            if b >= max(r, g) + 5:
                dst[x, y] = (255, 255, 255, a)
    return out


def fit_square(
    emblem: Image.Image,
    size: int,
    *,
    padding_ratio: float = 0.12,
    bg: tuple[int, int, int, int] = (255, 255, 255, 255),
) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), bg)
    pad = int(size * padding_ratio)
    inner = size - pad * 2
    ew, eh = emblem.size
    scale = min(inner / ew, inner / eh)
    nw, nh = max(1, int(ew * scale)), max(1, int(eh * scale))
    resized = emblem.resize((nw, nh), Image.Resampling.LANCZOS)
    ox = (size - nw) // 2
    oy = (size - nh) // 2
    if resized.mode == "RGBA":
        canvas.paste(resized, (ox, oy), resized)
    else:
        canvas.paste(resized, (ox, oy))
    return canvas


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"No se encontró {SOURCE}")

    img = Image.open(SOURCE).convert("RGBA")
    emblem_blue = crop_emblem(img)
    emblem_white = emblem_to_white(emblem_blue)

    # (filename, size, padding, background, emblem)
    specs: list[tuple[str, int, float, tuple[int, int, int, int], str]] = [
        ("logo-icon.png", 128, 0.16, (255, 255, 255, 255), "blue"),
        ("favicon.png", 32, 0.14, (255, 255, 255, 255), "blue"),
        ("favicon-16x16.png", 16, 0.12, (255, 255, 255, 255), "blue"),
        ("favicon-32x32.png", 32, 0.14, (255, 255, 255, 255), "blue"),
        ("apple-touch-icon.png", 180, 0.18, (255, 255, 255, 255), "blue"),
        ("android-chrome-192x192.png", 192, 0.17, (255, 255, 255, 255), "blue"),
        ("android-chrome-512x512.png", 512, 0.17, (255, 255, 255, 255), "blue"),
        ("maskable-icon-192x192.png", 192, 0.16, BRAND_BLUE, "white"),
        ("maskable-icon-512x512.png", 512, 0.16, BRAND_BLUE, "white"),
    ]

    for name, size, pad, bg, variant in specs:
        emblem = emblem_white if variant == "white" else emblem_blue
        out = fit_square(emblem, size, padding_ratio=pad, bg=bg)
        path = PUBLIC / name
        out.save(path, format="PNG", optimize=True)
        print(f"OK {path.name} ({size}x{size}, pad={pad:.0%}, {variant})")

    app_dir = ROOT / "src" / "app"
    for app_name, size, pad in [("icon.png", 32, 0.14), ("apple-icon.png", 180, 0.18)]:
        out = fit_square(emblem_blue, size, padding_ratio=pad)
        out.save(app_dir / app_name, format="PNG", optimize=True)
        print(f"OK src/app/{app_name}")

    print(f"Brand blue: {BRAND_BLUE_HEX}")


if __name__ == "__main__":
    main()
