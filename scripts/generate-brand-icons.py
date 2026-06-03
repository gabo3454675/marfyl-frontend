#!/usr/bin/env python3
"""Genera iconos PWA y logo-icon cuadrado con padding desde logo-marfyl.png."""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
SOURCE = PUBLIC / "logo-marfyl.png"


def crop_emblem(img: Image.Image) -> Image.Image:
    """Recorta solo el emblema (parte superior, sin el wordmark inferior)."""
    w, h = img.size
    top = img.crop((0, 0, w, int(h * 0.62)))
    top = top.convert("RGBA")
    bg = Image.new("RGBA", top.size, (255, 255, 255, 255))
    merged = Image.alpha_composite(bg, top)
    bbox = merged.getbbox()
    if not bbox:
        return top
    return merged.crop(bbox)


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
    canvas.paste(resized, (ox, oy), resized if resized.mode == "RGBA" else None)
    return canvas


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"No se encontró {SOURCE}")

    img = Image.open(SOURCE).convert("RGBA")
    emblem = crop_emblem(img)

    outputs: dict[str, tuple[int, float, tuple[int, int, int, int] | None]] = {
        "logo-icon.png": (128, 0.14, None),
        "favicon.png": (32, 0.12, None),
        "favicon-16x16.png": (16, 0.1, None),
        "favicon-32x32.png": (32, 0.12, None),
        "apple-touch-icon.png": (180, 0.14, None),
        "android-chrome-192x192.png": (192, 0.14, None),
        "android-chrome-512x512.png": (512, 0.14, None),
        "maskable-icon-512x512.png": (512, 0.22, (15, 23, 42, 255)),
    }

    for name, (size, pad, bg) in outputs.items():
        background = bg if bg is not None else (255, 255, 255, 255)
        out = fit_square(emblem, size, padding_ratio=pad, bg=background)
        path = PUBLIC / name
        out.save(path, format="PNG", optimize=True)
        print(f"OK {path.name} ({size}x{size})")

    app_dir = ROOT / "src" / "app"
    for app_name in ("icon.png", "apple-icon.png"):
        size = 32 if app_name == "icon.png" else 180
        pad = 0.12 if app_name == "icon.png" else 0.14
        out = fit_square(emblem, size, padding_ratio=pad)
        out.save(app_dir / app_name, format="PNG", optimize=True)
        print(f"OK src/app/{app_name}")


if __name__ == "__main__":
    main()
