#!/usr/bin/env python3
"""Build the Cayo Perico overlay in every map style from the atlas image.

Usage: python3 build_cayo_styles.py path/to/postal.webp ../tiles-cayo

Source: fivenet-app/livemap-tiles overlays/cayo-perico/postal.webp ("Cayo Perico
Atlas Postal Map" by DZ2024). Its postal-code numbers are not part of the game,
so the dark text is removed first (filled from the nearest surrounding colour),
giving atlas.webp. road.webp and game.webp recolour that atlas the same way the
main map's road / in-game tiles look: light land with dark roads, and dark land
with light roads on a navy sea.
"""
import sys

import numpy as np
from PIL import Image
from scipy import ndimage


def clean_atlas(a):
    rgb = a[..., :3].astype(np.float32)
    lum = rgb @ np.array([0.299, 0.587, 0.114])
    text = (lum < 85) & (a[..., 3] > 0)
    text = ndimage.binary_dilation(text, iterations=2)
    # Fill every text pixel with the colour of the nearest non-text pixel.
    _, (iy, ix) = ndimage.distance_transform_edt(text, return_indices=True)
    out = a.copy()
    out[..., :3] = a[iy, ix, :3]
    return out


def masks(a):
    rgb = a[..., :3].astype(np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    water = np.clip((b - r - 10) / 30, 0, 1)
    road = np.clip((lum - 200) / 30, 0, 1) * (1 - water)
    return lum, water[..., None], road[..., None]


def styled(a, land_rgb, road_rgb, deep, shallow, terrain):
    lum, water, road = masks(a)
    # Subtle terrain shading keeps hills and beaches readable.
    shade = ((lum - 150) * terrain)[..., None]
    land = np.array(land_rgb, np.float32) + shade
    t = np.clip((lum - 110) / 70, 0, 1)[..., None]
    sea = np.array(deep, np.float32) + (np.array(shallow, np.float32) - deep) * t
    out = land * (1 - road) + np.array(road_rgb, np.float32) * road
    out = out * (1 - water) + sea * water
    res = a.copy()
    res[..., :3] = np.clip(out, 0, 255).astype(np.uint8)
    return res


def atlas_sea(a, deep=(15, 168, 210), shallow=(150, 214, 232)):
    """Recolour the sea bands to the main atlas map's blue (land is kept)."""
    lum, water, _ = masks(a)
    t = np.clip((lum - 110) / 70, 0, 1)[..., None]
    sea = np.array(deep, np.float32) + (np.array(shallow, np.float32) - deep) * t
    res = a.copy()
    res[..., :3] = np.clip(a[..., :3] * (1 - water) + sea * water, 0, 255).astype(np.uint8)
    return res


def main(src, dst):
    a = np.array(Image.open(src).convert('RGBA'))
    atlas = clean_atlas(a)
    Image.fromarray(atlas_sea(atlas)).save(f'{dst}/atlas.webp', 'WEBP', quality=85, method=6)
    Image.fromarray(styled(atlas, (40, 40, 42), (205, 205, 210), (12, 22, 36), (38, 58, 80), 0.12)).save(
        f'{dst}/game.webp', 'WEBP', quality=85, method=6)
    Image.fromarray(styled(atlas, (170, 182, 170), (24, 24, 24), (24, 99, 174), (190, 214, 232), 0.15)).save(
        f'{dst}/road.webp', 'WEBP', quality=85, method=6)
    print('ok')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
