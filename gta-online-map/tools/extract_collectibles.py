#!/usr/bin/env python3
"""Build data/collectibles.json from the decompiled GTA Online freemode script.

Source: https://github.com/Sainan/GTA-V-Decompiled-Scripts (decompiled_scripts/freemode.c)

Usage: python3 extract_collectibles.py path/to/freemode.c ../data/collectibles.json

Function names (func_NNNN) change between game builds. If a build renames them,
locate the new names via the "nearest collectible" helper that compares
distances to every collectible type, then update FLAT_FUNCS / TYPED_FUNC below.
"""
import json
import re
import sys

# Single-switch functions: Vector3 func(int index)
FLAT_FUNCS = {
    "action_figures": "func_2238",
    "playing_cards": "func_2237",
    "signal_jammers": "func_8088",
    "peyote": "func_2239",
}
# Nested-switch function: Vector3 func(int type, int index)
TYPED_FUNC = "func_2240"
TYPED = {
    "movie_props": [0],
    "hidden_caches": [1],
    "treasure_chests": [2],
    "radio_antennas": [3],
    "media_sticks": [4],
    "shipwrecks": [5],
    "buried_stashes": [6],
    "jack_o_lanterns": [8],
    "ld_organics": [9],
    "skydives": [10],
    "snowmen": [16],
    "ls_tags": [19, 20],
    "yuanbao": [21],
    "weed_packages": [22],
    "gold_charms": [23],
    "lucky_charms": [24],
}

NUM = r"(-?\d+(?:\.\d+)?)f?"
RET = re.compile(r"return " + NUM + ", " + NUM + ", " + NUM + ";")


def function_lines(lines, name):
    head = re.compile(r"^Vector3 " + name + r"\(")
    for i, line in enumerate(lines):
        if head.match(line):
            j = i + 1
            while not lines[j].startswith("}"):
                j += 1
            return lines[i:j]
    raise SystemExit(f"{name} not found")


def parse(body):
    """Return {(outer, inner): xyz}; outer is -1 for single-level switches."""
    out, outer = {}, -1
    for i, line in enumerate(body):
        m = re.match(r"^(\t+)case (\d+):", line)
        if not m:
            continue
        depth, idx = len(m.group(1)), int(m.group(2))
        if depth == 2:
            outer = idx
        for nxt in body[i + 1:i + 4]:
            r = RET.search(nxt)
            if r:
                key = (outer, idx) if depth >= 4 else (-1, idx)
                out[key] = [round(float(r.group(k)), 2) for k in (1, 2, 3)]
                break
            if "case " in nxt:
                break
    return out


def main():
    lines = open(sys.argv[1], encoding="utf-8", errors="replace").read().split("\n")
    items = {}
    for key, fn in FLAT_FUNCS.items():
        cases = parse(function_lines(lines, fn))
        items[key] = [cases[k] for k in sorted(cases, key=lambda k: k[1])]
    typed = parse(function_lines(lines, TYPED_FUNC))
    for key, types in TYPED.items():
        items[key] = [typed[k] for t in types for k in sorted(typed) if k[0] == t]
    json.dump(items, open(sys.argv[2], "w"), separators=(",", ":"))
    for key, pts in items.items():
        print(f"{key:16s} {len(pts)}")


if __name__ == "__main__":
    main()
