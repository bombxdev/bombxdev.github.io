#!/usr/bin/env python3
"""Build tiles/game: the dark in-game pause-map look, recoloured from tiles/road.

Usage: python3 build_game_tiles.py ../tiles/road ../tiles/game

Road tiles: light grey-green land, black roads, blue water (light near the
coast, #1060a0 in deep sea). Here: land dark grey, roads light grey, water dark
navy (slightly lighter in shallow water), like the map in the game's pause menu.
"""
import os
import sys

import numpy as np
from PIL import Image

LAND_DARK, ROAD_LIGHT = 40.0, 205.0      # output grey for typical land / roads
DEEP, SHALLOW = np.array([12, 22, 36]), np.array([38, 58, 80])


def recolor(rgb):
    rgb = rgb.astype(np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    # Land/roads: inverted grey; land (~178) -> LAND_DARK, roads (~20) -> ROAD_LIGHT.
    k = (ROAD_LIGHT - LAND_DARK) / (178 - 20)
    grey = np.clip(LAND_DARK + (178 - lum) * k, 18, 235)
    land = np.stack([grey, grey, grey * 1.03], -1)
    # Water: blue clearly above red. Light (shallow) blue -> SHALLOW, deep -> DEEP.
    water_w = np.clip((b - r - 4) / 24, 0, 1)[..., None]
    t = np.clip((lum - 85) / (215 - 85), 0, 1)[..., None]
    water = DEEP + (SHALLOW - DEEP) * t
    out = land * (1 - water_w) + water * water_w
    return np.clip(out, 0, 255).astype(np.uint8)


def main(src, dst):
    n = 0
    for root, _, files in os.walk(src):
        for f in files:
            if not f.endswith('.webp'):
                continue
            rel = os.path.relpath(os.path.join(root, f), src)
            out = os.path.join(dst, rel)
            os.makedirs(os.path.dirname(out), exist_ok=True)
            im = np.array(Image.open(os.path.join(root, f)).convert('RGB'))
            Image.fromarray(recolor(im)).save(out, 'WEBP', quality=82, method=4)
            n += 1
    print(n, 'tiles')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
