#!/usr/bin/env python3
"""Add the Cayo Perico Heist planning points to data/points.json.

Usage: python3 extract_cayo_heist.py path/to/heist_island_planning.c ../data/points.json

The Kosatka planning screen draws its map icons with one call per icon:
func(board, ICON, ..., x, y, z). A label function maps every ICON to its text
label (H4P_INT3_AIRS = infiltration: airstrip, ...). Each group of points comes
from its own Vector3 switch; the groups are found by the icon numbers they are
drawn with, so the script survives function renames between game builds.
Each point gets a label key ("@cayo.<LABEL>") that the site translates.
"""
import json
import re
import sys


def functions(src):
    heads = list(re.finditer(r"^\S+ (func_\d+)\([^)]*\)\s*$", src, re.M))
    for i, h in enumerate(heads):
        end = heads[i + 1].start() if i + 1 < len(heads) else len(src)
        yield h.group(1), src[h.start():end]


def split_args(s):
    out, depth, cur = [], 0, ''
    for ch in s:
        if ch == ',' and depth == 0:
            out.append(cur.strip())
            cur = ''
            continue
        depth += ch == '('
        depth -= ch == ')'
        cur += ch
    out.append(cur.strip())
    return out


def vectors(body):
    """{case: [x, y, z]} of a Vector3 switch (the default 0,0,0 is left out)."""
    return {int(k): [round(float(x), 2), round(float(y), 2), round(float(z), 2)] for k, x, y, z in
            re.findall(r'case (\d+):\s*return (-?[\d.]+)f, (-?[\d.]+)f, (-?[\d.]+)f;', body)}


def main(src_path, out_path):
    src = open(src_path, encoding='latin1').read().replace('\r', '')
    funcs = dict(functions(src))
    label_fn = next(b for b in funcs.values() if 'return "H4P_INT3_AIRS_T";' in b and 'return "H4P_INT0_COMP_T";' in b)
    icon_label = {int(k): v for k, v in re.findall(r'case (\d+):\s*return "H4P_(\w+)_T"', label_fn)}
    # The function drawing every planning icon (it draws the compound at a fixed spot).
    draw = next(b for b in funcs.values() if re.search(r', 5, -1, 8, 0, 50\d\d\.\d+f, -57\d\d\.\d+f', b))
    calls = []   # (icon argument, position argument) of every icon drawn
    for line in draw.split('\n'):
        m = re.match(r'\s*func_\d+\(uParam0->f_\d+, (.*)\);$', line)
        if m:
            args = split_args(m.group(1))
            calls.append((args[0], ', '.join(args[4:])))

    def by_case(pos_arg):
        return vectors(funcs[re.match(r'(func_\d+)', pos_arg).group(1)])

    def pts(pos_arg):
        v = by_case(pos_arg)
        return [v[k] for k in sorted(v)]

    out = {}
    fixed = {'33': 'cayo_grapple', '34': 'cayo_uniform', '32': 'cayo_bolt_cutters', '35': 'cayo_supply_truck',
             '11': 'cayo_paintings'}
    group_cat = {'INT3': 'cayo_infiltration', 'INT4': 'cayo_escape', 'INT5': 'cayo_entrances'}
    loot = []
    keys = []
    for icon, pos in calls:
        if icon in fixed:
            out[fixed[icon]] = [p + ['@cayo.' + icon_label[int(icon)]] for p in pts(pos)]
        elif re.match(r'func_\d+\(iVar4, 0\)$', icon):
            # Indexed group: icon = icon_fn(i, 0) gives one icon (and label) per point.
            body = funcs[icon.split('(')[0]]
            icons = {int(k): int(v) for k, v in re.findall(r'case (\d+):\s*return (\d+);', body.split('else')[-1])}
            cat = group_cat[icon_label[icons[0]].split('_')[0]]
            # Paired by case number: a point without a position (e.g. HALO jump) is skipped.
            pos_by_case = by_case(pos)
            out[cat] = [pos_by_case[i] + ['@cayo.' + icon_label[icons[i]]] for i in sorted(pos_by_case) if i in icons]
        elif re.match(r'func_\d+\(iVar3\)$', icon):
            loot.append(pts(pos))          # secondary loot: icon depends on the loot type
        elif re.match(r'-?[\d.]+f', pos):
            x, y, z = [round(float(v.rstrip('f')), 2) for v in split_args(pos)]
            keys.append([x, y, z, '@cayo.' + icon_label[int(icon)]])
    island, compound = sorted(loot, key=len, reverse=True)
    out['cayo_loot_island'] = [p + ['@cayo.LOOT_OUT'] for p in island]
    out['cayo_loot_compound'] = [p + ['@cayo.LOOT_IN'] for p in compound]
    out['cayo_key_places'] = keys

    points = json.load(open(out_path))
    points.update(out)
    json.dump(points, open(out_path, 'w'), separators=(',', ':'), ensure_ascii=False)
    print({k: len(v) for k, v in out.items()})


if __name__ == '__main__':
    main(*sys.argv[1:3])
