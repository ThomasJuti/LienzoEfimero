#!/usr/bin/env python3
"""Snap Lienzo walk/jump frames to a shared per-cell ground baseline."""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

SHEET = Path(__file__).resolve().parents[1] / "src/assets/sprites/lienzo-spritesheet.png"
COLS, ROWS = 4, 2
# Grounded poses sit on this Y inside each 256x512 cell (matches the walk row).
GROUNDED_FEET_Y = 395
# Jump row: crouch, takeoff, apex, land.
JUMP_FEET_Y = (GROUNDED_FEET_Y, 320, 205, GROUNDED_FEET_Y)


def opaque_mask(cell: np.ndarray) -> np.ndarray:
    return cell[:, :, 3] > 24


def foot_anchor(cell: np.ndarray) -> tuple[int, int] | None:
    ys, xs = np.where(opaque_mask(cell))
    if xs.size == 0:
        return None
    foot_y = int(np.percentile(ys, 99.2))
    band = (ys >= foot_y - 8) & (ys <= foot_y)
    if not np.any(band):
        band = ys == ys.max()
    foot_x = int(np.median(xs[band]))
    return foot_x, foot_y


def main() -> None:
    im = Image.open(SHEET).convert("RGBA")
    arr = np.asarray(im)
    h, w = arr.shape[:2]
    cw, ch = w // COLS, h // ROWS
    out = np.zeros_like(arr)

    print(f"{SHEET.name}  cell {cw}x{ch}")
    for r in range(ROWS):
        for c in range(COLS):
            cell = arr[r * ch : (r + 1) * ch, c * cw : (c + 1) * cw]
            anchor = foot_anchor(cell)
            if anchor is None:
                print(f"  r{r}c{c}: empty")
                continue
            fx, fy = anchor
            target_fy = GROUNDED_FEET_Y if r == 0 else JUMP_FEET_Y[c]
            dy = target_fy - fy
            dx = 0

            ys, xs = np.where(opaque_mask(cell))
            dest_y = ys + dy
            dest_x = xs + dx
            valid = (dest_y >= 0) & (dest_y < ch) & (dest_x >= 0) & (dest_x < cw)
            src_y, src_x = ys[valid], xs[valid]
            dst_y, dst_x = dest_y[valid], dest_x[valid]
            out[r * ch + dst_y, c * cw + dst_x] = cell[src_y, src_x]
            clipped = int((~valid).sum())
            print(
                f"  r{r}c{c}: feet {fy}->{target_fy}  dx={dx:+d} dy={dy:+d}  clipped={clipped}"
            )

    Image.fromarray(out).save(SHEET, format="PNG", optimize=True)

    arr2 = np.asarray(Image.open(SHEET).convert("RGBA"))
    print("after")
    for r in range(ROWS):
        for c in range(COLS):
            cell = arr2[r * ch : (r + 1) * ch, c * cw : (c + 1) * cw]
            a = foot_anchor(cell)
            if a:
                print(f"  r{r}c{c}: feetY={a[1]} footX={a[0]}")


if __name__ == "__main__":
    main()
