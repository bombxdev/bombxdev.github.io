// Daily rotation logic of GTA Online, ported from freemode.c.
// Exposes window.GTAODaily.compute(timeSeconds, daily, tunables).
(function () {
  'use strict';

  // Seeded RNG behind NETWORK_SEED_RANDOM_NUMBER_GENERATOR /
  // NETWORK_GET_RANDOM_INT_RANGED (implementation by gir489returns, via GTAO-Bot).
  function NetRng(seed) {
    var MASK = 0xFFFFFFFFn;
    var s = BigInt(seed);
    var rol = ((s << 16n) & MASK) | ((s >> 16n) & MASK);
    this.s0 = s || 1n;
    this.s1 = s ^ rol;
  }
  NetRng.prototype.next = function () {
    var n = 1557985959n * this.s0 + this.s1;
    this.s0 = n & 0xFFFFFFFFn;
    this.s1 = n >> 32n;
    return n;
  };
  NetRng.prototype.intRanged = function (min, max) {
    if (min === max) return min;
    if (min > max) return 0;
    return min + Number((this.next() & 0x7FFFFFFFn) % BigInt(max - min + 1));
  };

  function tun(tunables, name, fallback) {
    var v = tunables && tunables.values ? tunables.values[name] : undefined;
    if (v === undefined || v === null) return fallback;
    if (typeof v === 'boolean') return v ? 1 : 0;
    return Number(v);
  }

  // Start (UTC seconds) of the in-game "day" containing t.
  function dayStart(t, refreshHours) {
    var off = refreshHours * 3600;
    return Math.floor((t - off) / 86400) * 86400 + off;
  }

  function compute(t, daily, tunables) {
    var refresh = tun(tunables, 'DAILY_OBJ_TIME_REFRESH', 6);
    var result = { start: dayStart(t, refresh), lists: {}, overrides: [] };

    // Daily collectibles: fixed 84-day table, optionally overridden.
    var day = Math.floor(Math.abs(t - daily.epoch) / 86400);
    var idx = day % daily.cycle;
    var forced = tun(tunables, 'DAILY_COLLECTABLES_OVERRIDE_INDEX', -1);
    if (forced !== -1) {
      idx = forced;
      result.overrides.push('DAILY_COLLECTABLES_OVERRIDE_INDEX = ' + forced);
    }
    result.cycleIndex = idx;
    Object.keys(daily.tables).forEach(function (cat) {
      result.lists[cat] = daily.tables[cat][idx].slice();
    });
    var slotOverrides = {
      treasure_chests: 'DAILY_COLLECTABLES_OVERRIDE_TREASURE_CHEST',
      hidden_caches: 'DAILY_COLLECTABLES_OVERRIDE_HIDDEN_CACHE'
    };
    Object.keys(slotOverrides).forEach(function (cat) {
      result.lists[cat].forEach(function (_, i) {
        var v = tun(tunables, slotOverrides[cat] + i, -1);
        if (v !== -1) {
          result.lists[cat][i] = v;
          result.overrides.push(slotOverrides[cat] + i + ' = ' + v);
        }
      });
    });

    // Gun Van: seeded RNG, skipping disabled spots.
    var gv = daily.gun_van;
    var enabled = gv.enabled_default.map(function (d, i) {
      return tun(tunables, 'XM22_GUN_VAN_LOCATION_ENABLED_' + i, d) !== 0;
    });
    var seed = Math.floor((t - refresh * 3600) / 86400);
    var rng = new NetRng(seed);
    var loc = rng.intRanged(0, gv.count - 1);
    for (var guard = 0; !enabled[loc] && guard < 1000; guard++) loc = rng.intRanged(0, gv.count - 1);
    result.lists.gun_van = [loc];
    // Rockstar can pin the van per weekday; which weekday maps to which slot
    // is not known, so only flag it.
    var pinned = [];
    for (var d = 0; d < 7; d++) {
      var p = tun(tunables, 'GUN_VAN_DAY_' + d, -1);
      if (p !== -1) pinned.push(p);
    }
    if (pinned.length) {
      result.gunVanPinned = pinned;
      result.overrides.push('Gun Van ถูกกำหนดตำแหน่งรายวันในสัปดาห์นี้: #' + pinned.map(function (p) { return p + 1; }).join(', #'));
    }
    return result;
  }

  window.GTAODaily = { compute: compute, NetRng: NetRng };
})();
