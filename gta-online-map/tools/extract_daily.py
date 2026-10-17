#!/usr/bin/env python3
"""Build data/daily.json: the daily rotation tables used by GTA Online.

Usage: python3 extract_daily.py path/to/freemode.c path/to/tuneables_processing.c ../data/daily.json

How the game picks daily locations (freemode.c):
  * Daily collectibles: day = (cloud_time - 1555999200) / 86400, then a fixed
    84-entry switch (day % 84) lists which location indices are active.
    Rockstar can override the day or single slots through tunables
    (DAILY_COLLECTABLES_OVERRIDE_*).
  * Gun Van: seeded network RNG with seed = (cloud_time - 6h) / 86400, rerolled
    while the location is disabled (XM22_GUN_VAN_LOCATION_ENABLED_n), unless a
    per-weekday tunable forces a location.

The rotation functions are found by the stats they write, which have stayed
stable across builds (function names do not).
"""
import json
import re
import sys

# category -> (stat written for each slot, in slot order)
TABLES = {
    "treasure_chests": [9559, 9560],
    "hidden_caches": list(range(9561, 9571)),
    "shipwrecks": [9606],
    "buried_stashes": [9604, 9605],
    "skydives": list(range(10366, 10376)),
    "ls_tags": list(range(51546, 51551)),
    "weed_packages": list(range(24936, 24946)),
}


def functions(src):
    heads = list(re.finditer(r"^\S+ (func_\d+)\([^)]*\)\s*$", src, re.M))
    for i, h in enumerate(heads):
        end = heads[i + 1].start() if i + 1 < len(heads) else len(src)
        yield h.group(1), src[h.start():end]


def slot_vars(body, stats):
    """Map each stat to the variable expression stored into it."""
    out = []
    for stat in stats:
        m = re.search(r"func_\d+\(" + str(stat) + r", (iVar\d+(?:\[\d+\])?)", body)
        if not m:
            return None
        out.append(m.group(1))
    return out


def parse_days(body, variables):
    sw = re.search(r"switch \((iVar\d+)\)\s*\{(.*?)\n\t\}", body, re.S)
    days, pending, cur = {}, [], None
    for line in sw.group(2).split("\n"):
        line = line.strip()
        m = re.match(r"case (\d+):", line)
        if m:
            if cur is not None:
                pending = []
            pending.append(int(m.group(1)))
            cur = None
            continue
        m = re.match(r"(iVar\d+(?:\[\d+\])?) = (-?\d+);", line)
        if m and m.group(1) in variables:
            if cur is None:
                cur = {}
                for d in pending:
                    days[d] = cur
            cur[m.group(1)] = int(m.group(2))
        if line == "break;":
            pending, cur = [], None
    table = []
    for d in range(84):
        row = days.get(d)
        table.append([row.get(v) if row else None for v in variables])
    return table


def tunable_defaults(tp):
    out = {}
    for m in re.finditer(r'= unk_0x\w+\(joaat\("(xm22_gun_van_location_enabled_\d+)"\), (\d+)\)', tp):
        out[m.group(1).upper()] = int(m.group(2))
    return out


def main():
    src = open(sys.argv[1], encoding="utf-8", errors="replace").read()
    tp = open(sys.argv[2], encoding="utf-8", errors="replace").read()
    result = {"epoch": 1555999200, "cycle": 84, "tables": {}}
    for name, body in functions(src):
        if "% 84)" not in body:
            continue
        for cat, stats in TABLES.items():
            variables = slot_vars(body, stats)
            if variables and "switch" in body:
                result["tables"][cat] = parse_days(body, variables)
                print(f"{cat:16s} {name} slots={len(stats)}")
    missing = set(TABLES) - set(result["tables"])
    if missing:
        raise SystemExit(f"tables not found: {sorted(missing)}")
    enabled = tunable_defaults(tp)
    result["gun_van"] = {
        "count": 30,
        "seed_offset": 6 * 3600,
        "enabled_default": [enabled.get(f"XM22_GUN_VAN_LOCATION_ENABLED_{i}", 1) for i in range(30)],
    }
    json.dump(result, open(sys.argv[3], "w"), separators=(",", ":"))


if __name__ == "__main__":
    main()
