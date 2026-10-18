// Exotic Exports: the day's 10 cars, where each can be parked, and how fast
// they are. Data: data/exotic_exports.json (tools/extract_exotic_exports.py).
//
// Game logic (freemode.c): the 100 export models (minus blacklisted ones) are
// shuffled with the network RNG seeded with the daily seed; the first 10 are
// the day's cars, single slots can be replaced by tunables. A second shuffle
// (seed % (i + 1)) gives the order they are asked for. Each time a car is
// asked for it is parked at a random one of 50 spots of its set.
(function () {
  'use strict';

  var M, t = I18N.t, data = null;
  var byHash = {}, best = {}, speedRank = {};
  var spotItems = { high: [], std: [] };
  var LOOKAHEAD = 180;   // days searched for a car's next appearance
  var STATS = ['speed', 'accel', 'brake', 'traction'];

  function $(id) { return document.getElementById(id); }
  function esc(s) { return M.esc(s); }
  function carName(v) { return v.name[I18N.code] || v.name.en; }
  function fullName(v) { return (v.maker ? v.maker + ' ' : '') + carName(v); }
  function className(v) {
    var key = 'ee.class.' + v.class;
    var s = t(key);
    return s === key ? v.class : s;
  }
  function kmh(v) { return Math.round(v.speed * 3.6); }
  function mph(v) { return Math.round(v.speed * 2.23694); }

  function tun(name, fallback) {
    var vals = M.state.tunables && M.state.tunables.values;
    var v = vals ? vals[name] : undefined;
    if (v === undefined || v === null) return fallback;
    return Number(v);
  }

  // Daily seed used by the game: whole days since epoch, shifted by the reset hour.
  function seedOf(dayStart) {
    return Math.round((dayStart - tun('DAILY_OBJ_TIME_REFRESH', 6) * 3600) / 86400);
  }

  var cache = {};
  function carsFor(seed) {
    var key = seed + '|' + (M.state.tunables ? M.state.tunables.fetched_at : '');
    if (cache[key]) return cache[key];
    var black = {};
    for (var b = 0; b < 10; b++) {
      var h = tun('EXOTIC_EXPORTS_BLACKLIST_' + b, 0);
      if (h) black[h | 0] = true;
    }
    var pool = data.vehicles.filter(function (v) { return !black[v.hash]; });
    var rng = new GTAODaily.NetRng(seed);
    for (var i = pool.length - 1; i >= 1; i--) {
      var j = rng.intRanged(0, i);
      var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    var slots = [];
    for (var s = 0; s < 10; s++) {
      var o = tun('EXOTIC_EXPORTS_OVERRIDE_' + s, 0);
      slots.push(o ? (byHash[o | 0] || { unknown: o }) : pool[s]);
    }
    var order = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (var k = 9; k >= 1; k--) {
      var m = seed % (k + 1);
      var t2 = order[k]; order[k] = order[m]; order[m] = t2;
    }
    var list = order.map(function (n) { return slots[n]; });
    cache[key] = list;
    return list;
  }

  function todayList() {
    return M.state.today ? carsFor(seedOf(M.state.today.start)) : [];
  }

  // Next day (from the selected day) on which `v` is on the list.
  function nextAppearance(v) {
    var start = M.state.today.start, seed = seedOf(start);
    for (var d = 0; d <= LOOKAHEAD; d++) {
      var pos = carsFor(seed + d).indexOf(v);
      if (pos !== -1) return { days: d, pos: pos + 1, start: start + d * 86400 };
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------
  function statBars(v) {
    return '<div class="ee-stats">' + STATS.map(function (k) {
      var pct = Math.round(v[k] / best[k] * 100);
      var val = k === 'speed' ? kmh(v) + ' km/h · ' + mph(v) + ' mph' : pct + '%';
      return '<div class="ee-stat"><span>' + esc(t('ee.' + k)) + '</span><span class="ee-bar"><i style="width:' + pct + '%"></i></span><span class="ee-val">' + esc(val) + '</span></div>';
    }).join('') + '</div>';
  }

  function whenHtml(v) {
    var pos = todayList().indexOf(v);
    if (pos !== -1) return '<div class="ee-when live">✅ ' + esc(t('ee.onList', { n: pos + 1 })) + '</div>';
    var nx = nextAppearance(v);
    if (!nx) return '<div class="ee-when">' + esc(t('ee.notSoon', { n: LOOKAHEAD })) + '</div>';
    return '<div class="ee-when">📅 ' + esc(t('ee.next', { date: M.dayFmt().format(new Date(nx.start * 1000)), n: nx.days, pos: nx.pos })) + '</div>';
  }

  function cardEl(v) {
    var el = document.createElement('div');
    el.className = 'ee-card';
    el.innerHTML = '<div class="ee-h"><b>' + esc(fullName(v)) + '</b>' + (carName(v) !== v.name.en ? ' <span class="muted">(' + esc(v.name.en) + ')</span>' : '') + '</div>' +
      '<div class="muted">' + esc(className(v)) + ' · ' + esc(t('ee.seats', { n: v.seats })) + ' · ' + esc(t('ee.fastest', { n: speedRank[v.i], total: data.vehicles.length })) + '</div>' +
      whenHtml(v) + statBars(v) +
      '<p class="muted">' + esc(t('ee.statsNote')) + '</p>' +
      '<p class="ee-spots">📍 ' + esc(t('ee.spots', { n: spotItems[v.tier].length, set: t('ee.set.' + v.tier) })) + '</p>';
    return el;
  }

  function openCar(v) {
    if (!v || v.unknown) return;
    M.showItemsOnMap(spotItems[v.tier], t('ee.spotsTitle', { name: carName(v) }), cardEl(v));
  }

  function carButton(v, extra) {
    var b = document.createElement('button');
    b.className = 'result';
    var cat = M.state.catByKey.exotic_exports;
    b.innerHTML = '<span class="res-blip" style="--c:' + cat.color + '">' + M.blipImg(cat) + '</span><span><div class="name">' + esc(fullName(v)) + (extra || '') + '</div>' +
      '<div class="meta">' + esc(className(v)) + ' · 🏁 ' + kmh(v) + ' km/h · ' + esc(t('ee.set.' + v.tier)) + '</div></span>';
    b.addEventListener('click', function () { openCar(v); });
    return b;
  }

  function badge(v, list) {
    var pos = list.indexOf(v);
    return pos === -1 ? '' : ' <span class="ee-badge">' + esc(t('ee.badge', { n: pos + 1 })) + '</span>';
  }

  // Every export car, sortable.
  function openAll(sortBy) {
    sortBy = sortBy || M.store.get('eeSort', 'name');
    var list = todayList();
    var el = document.createElement('div');
    var sel = '<label class="ee-sort"><span class="muted">' + esc(t('ee.sort')) + '</span> <select>' +
      ['name', 'speed', 'accel', 'today'].map(function (k) {
        return '<option value="' + k + '"' + (k === sortBy ? ' selected' : '') + '>' + esc(t('ee.sort.' + k)) + '</option>';
      }).join('') + '</select></label>';
    el.innerHTML = sel;
    var cars = data.vehicles.slice();
    var byName = function (a, b) { return carName(a).localeCompare(carName(b), I18N.code); };
    cars.sort(sortBy === 'name' ? byName
      : sortBy === 'today' ? function (a, b) {
        var pa = list.indexOf(a), pb = list.indexOf(b);
        return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb) || byName(a, b);
      }
      : function (a, b) { return b[sortBy] - a[sortBy]; });
    cars.forEach(function (v) { el.appendChild(carButton(v, badge(v, list))); });
    el.querySelector('select').addEventListener('change', function (e) {
      M.store.set('eeSort', e.target.value);
      openAll(e.target.value);
    });
    M.showPanel(t('ee.allTitle', { n: data.vehicles.length }), el);
  }

  // Today panel row: the 10 cars in the order they are asked for.
  var lastKey = '';
  function renderToday() {
    if (!data || !M.state.today) return;
    var list = todayList();
    var key = list.map(function (v) { return v.i; }).join(',') + I18N.code;
    var box = $('eeToday');
    if (!box) {
      box = document.createElement('div');
      box.id = 'eeToday';
      box.className = 'today-row ee-today';
      $('todayList').insertAdjacentElement('afterend', box);
    }
    if (key === lastKey && box.isConnected) return;
    lastKey = key;
    var cat = M.state.catByKey.exotic_exports;
    box.style.setProperty('--c', cat.color);
    box.innerHTML = '<span class="g">' + M.blipImg(cat) + '</span><div><div class="n">' + esc(t('ee.title')) + '</div><div class="chips"></div>' +
      '<button type="button" class="ee-all">🔍 ' + esc(t('ee.all', { n: data.vehicles.length })) + '</button></div>';
    var chips = box.querySelector('.chips');
    list.forEach(function (v, i) {
      var b = document.createElement('button');
      if (v.unknown) {
        b.textContent = (i + 1) + '. ?';
        b.title = String(v.unknown);
      } else {
        b.textContent = (i + 1) + '. ' + carName(v);
        b.title = fullName(v) + ' · ' + kmh(v) + ' km/h';
        b.addEventListener('click', function () { openCar(v); });
      }
      chips.appendChild(b);
    });
    box.querySelector('.ee-all').addEventListener('click', function () { openAll(); });
  }

  // Search by model name (any language, maker or game model id).
  var hay = [];
  function buildHay() {
    hay = data.vehicles.map(function (v) {
      var names = [v.model, v.maker, v.maker + ' ' + v.name.en];
      Object.keys(v.name).forEach(function (k) { names.push(v.name[k]); });
      return M.norm(names.join(' | '));
    });
  }
  function search(q) {
    if (!data) return null;
    var words = M.norm(q).split(/\s+/).filter(function (w) { return w && !/^#?\d+$/.test(w); });
    if (!words.length || words.join('').length < 2) return null;
    var hits = data.vehicles.filter(function (v, i) {
      return words.every(function (w) { return hay[i].indexOf(w) !== -1; });
    });
    if (!hits.length) return null;
    var list = todayList();
    var el = document.createElement('div');
    el.innerHTML = '<div class="summary">🚗 ' + esc(t('ee.found', { n: hits.length })) + '</div>';
    hits.slice(0, 12).forEach(function (v) { el.appendChild(carButton(v, badge(v, list))); });
    var items = [];
    var tiers = {};
    hits.forEach(function (v) { tiers[v.tier] = true; });
    if (hits.length <= 3) Object.keys(tiers).forEach(function (k) { items = items.concat(spotItems[k]); });
    return { el: el, items: items };
  }

  // Popup of a parking spot: which of the day's cars can be parked here.
  function popupExtra(item) {
    var tier = item.tier;
    var cars = todayList().filter(function (v) { return v.tier === tier; });
    return '<div class="pop-rw"><div class="rw"><span class="rw-k">' + esc(t('ee.set.' + tier)) + '</span></div>' +
      '<div class="rw">' + esc(t('ee.popHere')) + '</div><div class="ee-pop">' +
      (cars.length ? cars.map(function (v) {
        return '<button type="button" class="chip" data-ee="' + v.i + '">' + (todayList().indexOf(v) + 1) + '. ' + esc(carName(v)) + '</button>';
      }).join('') : '<span class="muted">' + esc(t('ee.popNone')) + '</span>') + '</div></div>';
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-ee]');
    if (b && data) openCar(data.vehicles[Number(b.getAttribute('data-ee'))]);
  });

  function init(res) {
    data = res;
    data.vehicles.forEach(function (v) { byHash[v.hash] = v; });
    STATS.forEach(function (k) { best[k] = Math.max.apply(null, data.vehicles.map(function (v) { return v[k]; })); });
    data.vehicles.slice().sort(function (a, b) { return b.speed - a.speed; }).forEach(function (v, i) { speedRank[v.i] = i + 1; });
    var nHigh = data.spots.high.length;
    M.state.catByKey.exotic_exports.items.forEach(function (it) {
      it.tier = it.n <= nHigh ? 'high' : 'std';
      spotItems[it.tier].push(it);
      // ★ = high-end car spot, # = regular car spot (numbered within the set).
      it.label = (it.tier === 'high' ? '★' : '#') + spotItems[it.tier].length;
    });
    buildHay();
    M.popupExtra.exotic_exports = popupExtra;
    M.searchExtra.push(search);
    renderToday();
  }

  document.addEventListener('gtao:ready', function () {
    M = window.GTAOMap;
    fetch('data/exotic_exports.json?v=' + window.APP_VERSION).then(function (r) { return r.json(); }).then(init)
      .catch(function (err) { console.error('exotic exports', err); });
  });
  document.addEventListener('gtao:today', renderToday);
})();
