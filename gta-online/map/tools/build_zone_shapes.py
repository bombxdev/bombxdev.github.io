#!/usr/bin/env python3
"""Build data/zone_shapes.json (city/area zones for the highlight overlay) and
refresh data/zones.json (area name of every point) from the game's zone boxes.

Source: DurtyFree/gta-v-data-dumps zones.json (popzone bounds dumped from the
game). Zones are lists of axis-aligned boxes; where boxes overlap, the later
entry in the file wins (this matches GET_NAME_OF_ZONE for our labelled points).

Usage: python3 build_zone_shapes.py path/to/DurtyFree/zones.json ../data
"""
import json
import sys

import numpy as np
from scipy import ndimage

SKIP = {'Oceana', 'OCEANA', 'Prol', 'IsHeistZone'}   # open sea, North Yankton, Cayo bounding box
NAMES = {'BanhamCa': 'Banham Canyon'}
# Colour-blind-friendly-ish palette; neighbouring zones never share a colour.
PALETTE = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0',
           '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#aaffc3']
CELL = 20  # metres per raster cell (for colouring and label placement only)

src = json.load(open(sys.argv[1]))
data = sys.argv[2]

zones, boxes = [], []
for z in src:
    if z['Name'] in SKIP:
        continue
    zi = len(zones)
    zones.append({'id': z['Name'], 'name': NAMES.get(z['Name'], z['DisplayName'] or z['Name'])})
    for b in z['Bounds']:
        mn, mx = b['Minimum'], b['Maximum']
        boxes.append([zi, round(mn['X'], 1), round(mn['Y'], 1), round(mx['X'], 1), round(mx['Y'], 1)])

# Rasterise with "later box wins".
x0, y0 = min(b[1] for b in boxes), min(b[2] for b in boxes)
x1, y1 = max(b[3] for b in boxes), max(b[4] for b in boxes)
W, H = int((x1 - x0) / CELL) + 1, int((y1 - y0) / CELL) + 1
grid = np.full((H, W), -1, dtype=np.int16)
for zi, bx0, by0, bx1, by1 in boxes:
    c0, c1 = int((bx0 - x0) / CELL), int((bx1 - x0) / CELL)
    r0, r1 = int((by0 - y0) / CELL), int((by1 - y0) / CELL)
    grid[r0:r1 + 1, c0:c1 + 1] = zi

# Adjacency -> greedy colouring (largest zones first).
adj = {i: set() for i in range(len(zones))}
for a, b in ((grid[:, :-1], grid[:, 1:]), (grid[:-1, :], grid[1:, :])):
    m = (a != b) & (a >= 0) & (b >= 0)
    for p, q in set(zip(a[m].tolist(), b[m].tolist())):
        adj[p].add(q); adj[q].add(p)
area = np.bincount(grid[grid >= 0].ravel(), minlength=len(zones))
colour = {}
for zi in sorted(range(len(zones)), key=lambda i: -area[i]):
    used = {colour[n] for n in adj[zi] if n in colour}
    free = [i for i in range(len(PALETTE)) if i not in used]
    colour[zi] = min(free, key=lambda i: sum(1 for c in colour.values() if c == i))  # spread colours

# Label position: the cell deepest inside the zone's largest visible part.
for zi, z in enumerate(zones):
    z['color'] = PALETTE[colour[zi]]
    mask = grid == zi
    if not mask.any():
        z['label'] = None
        continue
    lab, n = ndimage.label(mask)
    biggest = 1 + int(np.argmax(ndimage.sum(mask, lab, range(1, n + 1))))
    dist = ndimage.distance_transform_edt(lab == biggest)
    r, c = np.unravel_index(int(np.argmax(dist)), dist.shape)
    z['label'] = [round(x0 + (c + 0.5) * CELL), round(y0 + (r + 0.5) * CELL)]
    z['area_km2'] = round(float(area[zi]) * CELL * CELL / 1e6, 2)

json.dump({'source': 'DurtyFree/gta-v-data-dumps zones.json (game popzone bounds)', 'zones': zones, 'boxes': boxes},
          open(f'{data}/zone_shapes.json', 'w'), separators=(',', ':'))
print(len(zones), 'zones,', len(boxes), 'boxes, colours used:', len(set(colour.values())))

# Area name of every point: same lookup, all zones incl. sea, later box wins.
allboxes = [(NAMES.get(z['Name'], z['DisplayName'] or z['Name']), b['Minimum'], b['Maximum'])
            for z in src if z['Name'] not in ('Prol', 'IsHeistZone') for b in z['Bounds']]

def zone_at(x, y, zc, use_z=True):
    if x > 3500 and y < -3800:
        return 'Cayo Perico'
    name = ''
    for n, mn, mx in allboxes:
        if mn['X'] <= x <= mx['X'] and mn['Y'] <= y <= mx['Y'] and (not use_z or mn['Z'] <= zc <= mx['Z']):
            name = n
    return name or (zone_at(x, y, zc, False) if use_z else '')

points = json.load(open(f'{data}/points.json'))
ghosts = json.load(open(f'{data}/ghosts.json'))
out = {k: [zone_at(*p) for p in v] for k, v in points.items()}
out['ghosts'] = {yr: [[zone_at(*s) for s in g['spots']] for g in st['ghosts']] for yr, st in ghosts['sets'].items()}
json.dump(out, open(f'{data}/zones.json', 'w'), separators=(',', ':'), ensure_ascii=False)
named = sum(1 for k, v in out.items() if k != 'ghosts' for n in v if n)
print(named, '/', sum(len(v) for v in points.values()), 'points named')
