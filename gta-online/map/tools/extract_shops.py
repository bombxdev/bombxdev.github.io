#!/usr/bin/env python3
"""Add the in-game shop blips (landmarks) to data/points.json.

Usage: python3 extract_shops.py path/to/shop_controller.c path/to/freemode.c ../data/points.json

* shop_controller.c: one function returns each shop's blip position (switch on
  the shop index) and another its blip sprite; the sprite tells the shop type.
  Shops below ground (interiors, z < 0) are skipped.
* freemode.c: convenience stores (hold-ups) are a Vector3 switch starting with
  the 24/7 at 25.03, -1344.96.
"""
import json
import re
import sys

# blip sprite -> map category
SPRITES = {
    71: 'barbers', 73: 'clothes_stores', 362: 'clothes_stores', 75: 'tattoo_parlors',
    110: 'ammunation', 313: 'ammunation', 72: 'ls_customs',
}


def functions(src):
    heads = list(re.finditer(r"^\S+ (func_\d+)\([^)]*\)\s*$", src, re.M))
    for i, h in enumerate(heads):
        end = heads[i + 1].start() if i + 1 < len(heads) else len(src)
        yield h.group(1), src[h.start():end]


def main(shop_path, fm_path, out_path):
    shop = open(shop_path, encoding='latin1').read().replace('\r', '')
    funcs = dict(functions(shop))
    pos_fn = next(b for b in funcs.values() if b.startswith('Vector3') and 'return -821.9946f, -187.1776f' in b)
    spr_fn = next(b for b in funcs.values() if b.startswith('int') and re.search(r'case 0:\s*return 71;', b))
    pos = {int(k): [float(x), float(y), float(z)] for k, x, y, z in
           re.findall(r'case (\d+):\s*return (-?[\d.]+)f, (-?[\d.]+)f, (-?[\d.]+)f;', pos_fn)}
    # Per case, the last return wins: conditional cases return the online sprite in the else branch.
    spr = {}
    for k, block in re.findall(r'case (-?\d+):(.*?)(?=\n\t\tcase |\n\t\tdefault:)', spr_fn, re.S):
        rets = re.findall(r'return (\d+);', block)
        if rets:
            spr[int(k)] = int(rets[-1])
    out = {}
    for k in sorted(pos):
        x, y, z = pos[k]
        if z < 0:
            continue
        sprite = spr.get(k)
        cat = SPRITES.get(sprite)
        if cat:
            out.setdefault(cat, []).append([round(x, 2), round(y, 2), round(z, 2)])

    fm = open(fm_path, encoding='latin1').read().replace('\r', '')
    stores_fn = next(b for _, b in functions(fm) if b.startswith('Vector3') and 'return 25.03f, -1344.96f' in b)
    out['convenience_stores'] = [[float(x), float(y), round(float(z), 2)] for _, x, y, z in
                                 re.findall(r'case (\d+):\s*return (-?[\d.]+)f, (-?[\d.]+)f, \((-?[\d.]+)f', stores_fn)]

    points = json.load(open(out_path))
    points.update(out)
    json.dump(points, open(out_path, 'w'), separators=(',', ':'))
    print({k: len(v) for k, v in out.items()})


if __name__ == '__main__':
    main(*sys.argv[1:4])
