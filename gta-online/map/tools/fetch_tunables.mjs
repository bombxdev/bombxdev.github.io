// Fetch GTA Online tunables (decrypted by api.rdo.gg) and keep only the values
// that change daily locations. Writes data/tunables.json.
// Usage: node tools/fetch_tunables.mjs data/tunables.json
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const SOURCE = 'https://api.rdo.gg/tunables/gta/pcros/';
const out = process.argv[2] || 'data/tunables.json';

// Tunable names from tuneables_processing.c. The Gun Van weekday overrides
// have no known name, only their joaat hash.
const NAMED = [
  'DAILY_OBJ_TIME_REFRESH',
  'DAILY_COLLECTABLES_OVERRIDE_INDEX',
  'DAILY_COLLECTABLES_OVERRIDE_TREASURE_CHEST0',
  'DAILY_COLLECTABLES_OVERRIDE_TREASURE_CHEST1',
  ...Array.from({ length: 10 }, (_, i) => `DAILY_COLLECTABLES_OVERRIDE_HIDDEN_CACHE${i}`),
  'VC_PEYOTE_ENABLE',
  'XM22_GUN_VAN_AVAILABLE',
  ...Array.from({ length: 30 }, (_, i) => `XM22_GUN_VAN_LOCATION_ENABLED_${i}`),
];
const HASHED = {
  GUN_VAN_DAY_0: -292994779,
  GUN_VAN_DAY_1: 13297064,
  GUN_VAN_DAY_2: -502421466,
  GUN_VAN_DAY_3: 876399747,
  GUN_VAN_DAY_4: -22453923,
  GUN_VAN_DAY_5: -791771736,
  GUN_VAN_DAY_6: 722680368,
  // Ghosts Exposed location sets (fm_content_ghosthunt.c); the enabled one is live.
  GHOSTS_SET_2023: 1275644823,
  GHOSTS_SET_2024: -818123201,
  GHOSTS_SET_2025: -817993986,
  GHOSTS_SET_2026: -1235590925,
  // Exotic Exports (freemode.c): per-slot model overrides and model blacklist.
  EXOTIC_EXPORTS_OVERRIDE_0: -1029774024,
  EXOTIC_EXPORTS_OVERRIDE_1: -1327742541,
  EXOTIC_EXPORTS_OVERRIDE_2: -435246057,
  EXOTIC_EXPORTS_OVERRIDE_3: -733017960,
  EXOTIC_EXPORTS_OVERRIDE_4: -1018927453,
  EXOTIC_EXPORTS_OVERRIDE_5: -1333608160,
  EXOTIC_EXPORTS_OVERRIDE_6: -431149900,
  EXOTIC_EXPORTS_OVERRIDE_7: -738686965,
  EXOTIC_EXPORTS_OVERRIDE_8: 193591085,
  EXOTIC_EXPORTS_OVERRIDE_9: -95529802,
  EXOTIC_EXPORTS_BLACKLIST_0: 1819218494,
  EXOTIC_EXPORTS_BLACKLIST_1: 1973658787,
  EXOTIC_EXPORTS_BLACKLIST_2: 1877514541,
  EXOTIC_EXPORTS_BLACKLIST_3: -1710985884,
  EXOTIC_EXPORTS_BLACKLIST_4: -2083634952,
  EXOTIC_EXPORTS_BLACKLIST_5: 942188974,
  EXOTIC_EXPORTS_BLACKLIST_6: 702221587,
  EXOTIC_EXPORTS_BLACKLIST_7: -318205073,
  EXOTIC_EXPORTS_BLACKLIST_8: 1590097642,
  EXOTIC_EXPORTS_BLACKLIST_9: -654972126,
};

function joaat(s) {
  let h = 0;
  for (const c of s.toLowerCase()) {
    h = (h + c.charCodeAt(0)) >>> 0;
    h = (h + (h << 10)) >>> 0;
    h = (h ^ (h >>> 6)) >>> 0;
  }
  h = (h + (h << 3)) >>> 0;
  h = (h ^ (h >>> 11)) >>> 0;
  return (h + (h << 15)) >>> 0;
}

function keyForms(name, hash) {
  const u = hash >>> 0;
  const forms = [String(u), String(u | 0), '0x' + u.toString(16), '0x' + u.toString(16).toUpperCase(),
    u.toString(16).toUpperCase().padStart(8, '0')];
  return name ? [name, name.toLowerCase(), ...forms] : forms;
}

// Values can sit in BASE_GLOBALS or other contexts; BASE_GLOBALS wins.
function lookup(tunables, forms) {
  const contexts = Object.keys(tunables).sort((a, b) => (b === 'BASE_GLOBALS') - (a === 'BASE_GLOBALS'));
  for (const ctx of contexts) {
    const table = tunables[ctx];
    if (!table || typeof table !== 'object') continue;
    for (const k of forms) {
      if (k in table) {
        const v = table[k];
        return typeof v === 'object' && v !== null && 'value' in v ? v.value : v;
      }
    }
  }
  return undefined;
}

async function load() {
  // TUNABLES_FILE lets the script run against a saved response (testing).
  if (process.env.TUNABLES_FILE) return JSON.parse(readFileSync(process.env.TUNABLES_FILE, 'utf8'));
  const res = await fetch(SOURCE, { headers: { 'user-agent': 'bombxdev.github.io gta-online/map' } });
  if (!res.ok) throw new Error(`${SOURCE} -> HTTP ${res.status}`);
  return res.json();
}
const body = await load();
const tunables = body?.contents?.tunables ?? body?.tunables;
if (!tunables) throw new Error('unexpected response shape: ' + Object.keys(body).join(','));

const values = {};
for (const name of NAMED) {
  const v = lookup(tunables, keyForms(name, joaat(name)));
  if (v !== undefined) values[name] = v;
}
for (const [name, hash] of Object.entries(HASHED)) {
  const v = lookup(tunables, keyForms(null, hash));
  if (v !== undefined) values[name] = v;
}

const result = {
  source: SOURCE,
  tunables_updated: body?.meta?.updated ?? body?.updated ?? null,
  values,
};

// Keep the file (and the commit history) quiet when nothing changed.
const prev = existsSync(out) ? JSON.parse(readFileSync(out, 'utf8')) : null;
if (prev && JSON.stringify(prev.values) === JSON.stringify(values) && prev.tunables_updated === result.tunables_updated) {
  console.log('unchanged');
} else {
  result.fetched_at = new Date().toISOString();
  writeFileSync(out, JSON.stringify(result, null, 1) + '\n');
  console.log('updated', Object.keys(values).length, 'values');
}
