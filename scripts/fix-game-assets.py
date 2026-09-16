#!/usr/bin/env python3
"""Normalize LienzoEfimero raster assets: true PNG, chroma-key alpha, matching sizes."""

from __future__ import annotations

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "src" / "assets"

CHROMA_PATHS = [
    "sprites/lienzo-spritesheet.png",
    "sprites/the-collector-sprite.png",
    "sprites/lienzo-idle-restaurar-hurt.png",
    "sprites/props/caja-madera.png",
    "sprites/props/camara-seguridad.png",
    "sprites/props/laser-hazards.png",
    "sprites/props/marco-vacio.png",
    "ui/marco-mensaje.png",
    "obras/obra-memoria-color.png",
    "obras/obra-memoria-gris.png",
    "obras/obra-inspiracion-color.png",
    "obras/obra-inspiracion-gris.png",
    "obras/obra-maestra-color.png",
    "obras/obra-maestra-gris.png",
]

REENCODE_PATHS = [
    "cinematics/titulo.png",
    "cinematics/vineta1-museo.png",
    "cinematics/vineta2-sombra.png",
    "cinematics/vineta3-porton.png",
    "cinematics/vineta4-lienzo.png",
    "cinematics/vineta5-redencion.png",
    "backgrounds/nivel1-almacen.png",
    "backgrounds/nivel2-galeria.png",
    "backgrounds/nivel3-coleccion.png",
    "backgrounds/nivel3-coleccion-color.png",
]

KEY = np.array([0, 255, 0], dtype=np.int32)
MAX_DIST = 92.0
GREENNESS = 68


def is_chroma(rgb: np.ndarray) -> np.ndarray:
    r = rgb[:, :, 0].astype(np.int32)
    g = rgb[:, :, 1].astype(np.int32)
    b = rgb[:, :, 2].astype(np.int32)
    dist = np.sqrt((r - KEY[0]) ** 2 + (g - KEY[1]) ** 2 + (b - KEY[2]) ** 2)
    greenness = g - np.maximum(r, b)
    return (dist <= MAX_DIST) | ((greenness >= GREENNESS) & (g >= 160) & (r < 110) & (b < 110))


def flood_background(mask: np.ndarray) -> np.ndarray:
    h, w = mask.shape
    vis = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()

    def push(y: int, x: int) -> None:
        if x < 0 or y < 0 or x >= w or y >= h or vis[y, x] or not mask[y, x]:
            return
        vis[y, x] = True
        q.append((y, x))

    for x in range(w):
        push(0, x)
        push(h - 1, x)
    for y in range(h):
        push(y, 0)
        push(y, w - 1)

    while q:
        y, x = q.popleft()
        push(y - 1, x)
        push(y + 1, x)
        push(y, x - 1)
        push(y, x + 1)
    return vis


def punch_interior_chroma(arr: np.ndarray) -> np.ndarray:
    """Drop leftover chroma islands that never touch the image border (armpits, boot specks)."""
    opaque = arr[:, :, 3] > 8
    holes = is_chroma(arr[:, :, :3]) & opaque
    out = arr.copy()
    out[holes, 3] = 0
    # Despill pixels that now border a punched hole.
    h, w = holes.shape
    neigh = np.zeros((h, w), dtype=bool)
    neigh[1:, :] |= holes[:-1, :]
    neigh[:-1, :] |= holes[1:, :]
    neigh[:, 1:] |= holes[:, :-1]
    neigh[:, :-1] |= holes[:, 1:]
    edge = neigh & (out[:, :, 3] > 8) & ~holes
    r = out[:, :, 0].astype(np.int16)
    g = out[:, :, 1].astype(np.int16)
    b = out[:, :, 2].astype(np.int16)
    cap = np.maximum(r, b)
    g = np.where(edge & (g > cap), cap, g)
    out[:, :, 1] = np.clip(g, 0, 255).astype(np.uint8)
    return out


def chroma_to_alpha(im: Image.Image) -> Image.Image:
    rgb = np.asarray(im.convert("RGB"))
    keyed = is_chroma(rgb)
    bg = flood_background(keyed) | keyed
    h, w = bg.shape
    edge = np.zeros((h, w), dtype=bool)
    edge[1:, :] |= bg[:-1, :]
    edge[:-1, :] |= bg[1:, :]
    edge[:, 1:] |= bg[:, :-1]
    edge[:, :-1] |= bg[:, 1:]
    edge &= ~bg

    out = np.zeros((h, w, 4), dtype=np.uint8)
    out[:, :, :3] = rgb
    out[:, :, 3] = np.where(bg, 0, 255)

    r = out[:, :, 0].astype(np.int16)
    g = out[:, :, 1].astype(np.int16)
    b = out[:, :, 2].astype(np.int16)
    cap = np.maximum(r, b)
    despill = edge & (g > cap)
    g = np.where(despill, cap, g)
    out[:, :, 1] = np.clip(g, 0, 255).astype(np.uint8)
    # Soften remaining JPEG fringe on the cut edge.
    dist = np.sqrt(
        (r.astype(np.int32) - 0) ** 2
        + (out[:, :, 1].astype(np.int32) - 255) ** 2
        + (b.astype(np.int32) - 0) ** 2
    )
    fringe = edge & (dist < 130)
    alpha = out[:, :, 3].astype(np.int16)
    alpha = np.where(fringe, np.clip((dist - 50) * (255 / 80), 0, 255), alpha)
    out[:, :, 3] = alpha.astype(np.uint8)
    return Image.fromarray(out)


def save_png(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, format="PNG", optimize=True)


def report(path: Path, im: Image.Image) -> None:
    arr = np.asarray(im)
    if im.mode == "RGBA":
        opaque = int((arr[:, :, 3] > 8).sum())
        total = arr.shape[0] * arr.shape[1]
        print(f"  {path.relative_to(ROOT)}  {im.size[0]}x{im.size[1]} RGBA  opaque={opaque}/{total}")
    else:
        print(f"  {path.relative_to(ROOT)}  {im.size[0]}x{im.size[1]} {im.mode}")


def main() -> None:
    print("chroma-key → alpha")
    for rel in CHROMA_PATHS:
        path = ROOT / rel
        im = chroma_to_alpha(Image.open(path))
        save_png(im, path)
        report(path, im)

    print("nivel3 512 → 1024 nearest")
    n3 = ROOT / "backgrounds/nivel3-coleccion.png"
    grey = Image.open(n3).convert("RGBA").resize((1024, 1024), Image.Resampling.NEAREST)
    save_png(grey, n3)
    report(n3, grey)

    print("reencode lossless PNG")
    for rel in REENCODE_PATHS:
        path = ROOT / rel
        im = Image.open(path).convert("RGBA")
        save_png(im, path)
        report(path, im)


if __name__ == "__main__":
    main()
