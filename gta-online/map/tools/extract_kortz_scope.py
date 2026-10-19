#!/usr/bin/env python3
"""Add the Kortz Center Heist Scope photo spots to data/points.json.

Usage: python3 extract_kortz_scope.py path/to/fm_content_kortz_scoping.c ../data/points.json

The Scope mission (fm_content_kortz_scoping, Title Update 1.73) keeps its photo
targets in one array ("data.TakePhotos.Photos", 63 slots). Slots 0-31 are the
paintings inside the museum and some slots are positions inside the instanced
interior (x > 0, far from the building); only the outside spots are kept.

When a photo is taken, one function sorts the slot into the Scope checklist:
    switch (iParam0) { case 32: func_A(0); ...  case 42: func_B(1); ... }
func_A(n) ticks entry point n (labels KSC_TCK_EPS0-3), func_B(n) a point of
interest (KSC_TCK_POI*). The game's English texts are not in the scripts, so
the entry names are worked out from the spots themselves:
    0  Staff Entrance  - only photo with its own blip label (KSC_BLP_TPSE), the
                         one used on the very first run; ground floor, east side
    1  Skylight        - the four spots on the roof
    2  Loading Bay     - west side, lower level (the remaining one)
    3  Sewer           - in the garden square south-west of the building ("maze")
Points of interest keep their checklist number (@kortz.POI<n>). Spots that only
differ in height (one marker per pole) are merged; a label used by several spots
gets a number (@kortz.SKYLIGHT1..4, @kortz.POI21..23).
"""
import json
import re
import sys

ENTRY_NAMES = {0: 'STAFF', 1: 'SKYLIGHT', 2: 'LOADING', 3: 'SEWER'}


def functions(src):
    heads = list(re.finditer(r"^\S+ (func_\d+)\([^)]*\)\s*$", src, re.M))
    for i, h in enumerate(heads):
        end = heads[i + 1].start() if i + 1 < len(heads) else len(src)
        yield h.group(1), src[h.start():end]


def main(src_path, out_path):
    src = open(src_path, encoding='latin1').read().replace('\r', '')
    funcs = dict(functions(src))

    # Photo slot -> position: the init function writes slots 32+ as literals.
    init = next(b for b in funcs.values() if re.search(r'\.f_1\[32 /\*4\*/\] = \{ -?[\d.]+f', b) and '.f_1[57 /*4*/]' in b)
    pos = {int(i): [round(float(x), 2), round(float(y), 2), round(float(z), 2)] for i, x, y, z in
           re.findall(r'\.f_1\[(\d+) /\*4\*/\] = \{ (-?[\d.]+)f, (-?[\d.]+)f, (-?[\d.]+)f \};', init)}

    # Photo slot -> checklist item: "if (iParam0 < 32) {...} else { switch ... }".
    sorter = next(b for b in funcs.values() if 'if (iParam0 < 32)' in b and re.search(r'case 32:\s*func_\d+\(0\);', b))
    by_slot = {}
    for block in re.split(r'\n\s*break;', sorter.split('switch (iParam0)')[1]):
        cases = [int(c) for c in re.findall(r'case (\d+):', block)]
        call = re.search(r'(func_\d+)\((\d+)\);', block)
        if call:
            for c in cases:
                by_slot[c] = (call.group(1), int(call.group(2)))
    entry_fn = by_slot[32][0]

    outside = lambda p: -2600 < p[0] < -1900 and 0 < p[1] < 600
    entries, pois = [], []
    for slot in sorted(by_slot):
        fn, n = by_slot[slot]
        p = pos.get(slot)
        if not p or not outside(p):
            continue
        if fn == entry_fn:
            entries.append(p + ['@kortz.' + ENTRY_NAMES[n]])
        else:
            key = '@kortz.POI%d' % n
            if not any(q[3] == key and abs(q[0] - p[0]) < 4 and abs(q[1] - p[1]) < 4 for q in pois):
                pois.append(p + [key])

    # The map only shows a label shared by several points as "#n": number them instead
    # (@kortz.SKYLIGHT -> @kortz.SKYLIGHT1..4; the site has a text for each).
    for lst in (entries, pois):
        for key in {q[3] for q in lst}:
            same = [q for q in lst if q[3] == key]
            if len(same) > 1:
                for i, q in enumerate(same, 1):
                    q[3] = key + str(i)
    out = {'kortz_entry': entries, 'kortz_poi': pois}
    points = json.load(open(out_path))
    points.update(out)
    json.dump(points, open(out_path, 'w'), separators=(',', ':'), ensure_ascii=False)
    print({k: len(v) for k, v in out.items()})


if __name__ == '__main__':
    main(*sys.argv[1:3])
