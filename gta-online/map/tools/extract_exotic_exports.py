#!/usr/bin/env python3
"""Build data/exotic_exports.json: Simeon's Exotic Exports vehicles, where they
can be parked, and their performance stats.

Usage: python3 extract_exotic_exports.py path/to/freemode.c path/to/tuneables_processing.c \
           path/to/DurtyFree/vehicles.json ../data/exotic_exports.json [../data/points.json]

With points.json, the 100 spots are also written there as the "exotic_exports"
map category (high-end set first). Run it after extract_collectibles.py.

How the game works (freemode.c):
  * A fixed list of 100 export models (switch 0..99 returning joaat("adder"), ...).
  * Every day the list is shuffled with the network RNG seeded with
    (cloud_time - 6h) / 86400; the first 10 are the day's cars. Models listed in
    10 "blacklist" tunables are left out first, and 10 "override" tunables can
    replace single slots.
  * The order Simeon asks for them is a second shuffle of 0..9 using
    seed % (i + 1).
  * When a car is requested it is parked at a random one of 50 fixed spots.
    There are two sets of 50: one for the cheaper cars (a switch of models that
    returns 0) and one for everything else.

Stats come from DurtyFree/gta-v-data-dumps (values the game reports through
GET_VEHICLE_MODEL_ESTIMATED_MAX_SPEED / _ACCELERATION / _MAX_BRAKING /
_MAX_TRACTION, i.e. the in-game stat bars).
"""
import json
import re
import sys

LANGS = {  # site language -> DurtyFree DisplayName field
    'en': 'English', 'de': 'German', 'fr': 'French', 'it': 'Italian', 'ru': 'Russian', 'pl': 'Polish',
    'es': 'Spanish', 'pt-BR': 'Portuguese', 'zh-CN': 'SimplifiedChinese', 'zh-TW': 'TraditionalChinese',
    'ja': 'Japanese', 'ko': 'Korean',
}
# The dump has the base label for these; the game shows the longer name.
NAME_FIX = {'sentinel3': 'Sentinel Classic'}


def functions(src):
    heads = list(re.finditer(r"^\S+ (func_\d+)\([^)]*\)\s*$", src, re.M))
    for i, h in enumerate(heads):
        end = heads[i + 1].start() if i + 1 < len(heads) else len(src)
        yield h.group(1), src[h.start():end]


def joaat(s):
    h = 0
    for c in s.lower().encode():
        h = (h + c) & 0xFFFFFFFF
        h = (h + (h << 10)) & 0xFFFFFFFF
        h ^= h >> 6
    h = (h + (h << 3)) & 0xFFFFFFFF
    h ^= h >> 11
    h = (h + (h << 15)) & 0xFFFFFFFF
    return h - (1 << 32) if h & 0x80000000 else h


def main(fm_path, tp_path, veh_path, out_path, points_path=None):
    src = open(fm_path, encoding='latin1').read().replace('\r', '')
    tp = open(tp_path, encoding='latin1').read().replace('\r', '')
    funcs = dict(functions(src))

    # 100-model list: switch 0..99 of joaat() returns starting with the Adder.
    models = None
    for name, body in funcs.items():
        if 'case 0:\n\t\t\treturn joaat("adder");' in body:
            m = re.findall(r'case (\d+):\s*return joaat\("(\w+)"\)', body)
            if len(m) == 100:
                models, model_fn = [x[1] for x in m], name
                break
    assert models, 'export model list not found'

    # Daily shuffle (the function calling the model list inside a 100-loop):
    # gives the override and blacklist tunable getters.
    shuffle = next(b for n, b in funcs.items() if model_fn + '(iVar0[' in b)
    override_fn = re.search(r'= (func_\d+)\(iVar101\);\n\t\t}\n\t\telse', shuffle).group(1)
    black_fn = re.search(r'if \(!(func_\d+)\(' + model_fn, shuffle).group(1)
    black_get = re.search(r'== (func_\d+)\(iVar0\)', funcs[black_fn]).group(1)

    def tunable_hashes(fn):
        fields = re.findall(r'return Global_262145\.f_(\d+);', funcs[fn])
        out = []
        for f in fields:
            m = re.search(r'Global_262145\.f_' + f + r' = unk_0x\w+\((-?\d+|joaat\("(\w+)"\)), ', tp)
            out.append(joaat(m.group(2)) if m.group(2) else int(m.group(1)))
        assert len(out) == 10
        return out

    # Spot sets: Vector3 function with two 50-case switches.
    spots = None
    for name, body in funcs.items():
        if not body.startswith('Vector3') or 'bParam1' not in body:
            continue
        v = re.findall(r'case (\d+):\s*return (-?[\d.]+)f, (-?[\d.]+)f, (-?[\d.]+)f;', body)
        if len(v) == 100 and v[0][0] == '0' and v[50][0] == '0':
            spots = [[[round(float(c), 2) for c in x[1:]] for x in v[:50]],
                     [[round(float(c), 2) for c in x[1:]] for x in v[50:]]]
            break
    assert spots, 'spot sets not found'

    # Cheaper cars: switch of model hashes returning 0 (uses the std set).
    std = None
    for name, body in funcs.items():
        if 'case joaat("asbo"):' in body and body.rstrip().endswith('return 0;\n\t\t\n\t\tdefault:\n\t}\n\treturn 1;\n}'):
            cases = set(re.findall(r'case joaat\("(\w+)"\):', body))
            if 'tulip' in cases and 'adder' not in cases:
                std = cases
                break
    assert std, 'standard-car switch not found'

    dump = {v['Name'].lower(): v for v in json.load(open(veh_path, encoding='utf-8'))}
    vehicles = []
    for i, model in enumerate(models):
        d = dump[model]
        names = {}
        for code, field in LANGS.items():
            s = (d['DisplayName'] or {}).get(field)
            if s and (code == 'en' or s != names.get('en')):
                names[code] = s
        if model in NAME_FIX:
            names['en'] = NAME_FIX[model]
        maker = (d.get('ManufacturerDisplayName') or {}).get('English') or ''
        vehicles.append({
            'i': i, 'model': model, 'hash': d['SignedHash'], 'name': names,
            'maker': '' if maker == 'NULL' else maker, 'class': d['Class'], 'seats': d['Seats'],
            'tier': 'std' if model in std else 'high',
            'speed': round(d['MaxSpeed'], 3), 'accel': round(d['Acceleration'], 4),
            'brake': round(d['MaxBraking'], 4), 'traction': round(d['MaxTraction'], 4),
        })

    out = {
        '_comment': 'Built by tools/extract_exotic_exports.py from freemode.c, tuneables_processing.c and DurtyFree vehicles.json.',
        'spots': {'high': spots[0], 'std': spots[1]},
        'override_tunables': tunable_hashes(override_fn),
        'blacklist_tunables': tunable_hashes(black_get),
        'vehicles': vehicles,
    }
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
    if points_path:
        points = json.load(open(points_path))
        points['exotic_exports'] = spots[0] + spots[1]
        json.dump(points, open(points_path, 'w'), separators=(',', ':'))
    print(len(vehicles), 'vehicles,', sum(v['tier'] == 'std' for v in vehicles), 'standard')


if __name__ == '__main__':
    main(*sys.argv[1:6])
