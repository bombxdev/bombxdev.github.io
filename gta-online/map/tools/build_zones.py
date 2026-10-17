#!/usr/bin/env python3
"""Build data/zones.json: an area (zone) name for every point.

Zone names for the daily categories come from GTAO-Bot's src/data/zones.json
(ISC licence, same location order as the game scripts). Every other point
gets the zone of the nearest labelled point if one is within MAX_DIST metres.

Usage: python3 build_zones.py path/to/GTAO-Bot/zones.json ../data
"""
import json
import math
import sys

MAX_DIST = 700
# Open-water labels only describe points that are themselves underwater.
WATER = {'Pacific Ocean', 'Alamo Sea', 'San Andreas'}
# bot key -> our category key (only lists whose order matches ours)
EXACT = {
    'treasure_chests': 'treasure_chests', 'hidden_caches': 'hidden_caches', 'shipwrecked': 'shipwrecks',
    'buried_stashes': 'buried_stashes', 'skydives': 'skydives', 'street_dealers': 'street_dealers',
    'gun_van': 'gun_van', 'rc_time_trial': 'rc_time_trial', 'bike_time_trial': 'bike_time_trial',
}

bot = json.load(open(sys.argv[1]))
data = sys.argv[2]
points = json.load(open(f'{data}/points.json'))
ghosts = json.load(open(f'{data}/ghosts.json'))

labelled = []
out = {}
for bk, key in EXACT.items():
    names, pts = bot[bk], points[key]
    assert len(names) == len(pts), (key, len(names), len(pts))
    out[key] = names
    labelled += [(p[0], p[1], n) for p, n in zip(pts, names) if n]

def nearest(x, y, z):
    if x > 3500 and y < -3800:
        return 'Cayo Perico'
    pool = labelled if z < 0 else [l for l in labelled if l[2] not in WATER]
    best = min(pool, key=lambda l: (l[0] - x) ** 2 + (l[1] - y) ** 2)
    return best[2] if math.hypot(best[0] - x, best[1] - y) <= MAX_DIST else ''

for key, pts in points.items():
    if key not in out:
        out[key] = [nearest(p[0], p[1], p[2]) for p in pts]
out['ghosts'] = {year: [[nearest(s[0], s[1], s[2]) for s in g['spots']] for g in st['ghosts']]
                 for year, st in ghosts['sets'].items()}
json.dump(out, open(f'{data}/zones.json', 'w'), separators=(',', ':'), ensure_ascii=False)
filled = sum(1 for k, v in out.items() if k != 'ghosts' for n in v if n)
total = sum(len(v) for k, v in out.items() if k != 'ghosts')
print(f'{filled}/{total} points have a zone')
