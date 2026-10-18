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

  function img(v, cls) {
    return '<img class="' + cls + '" src="vehicles/' + v.model + '.webp?v=' + window.APP_VERSION + '" alt="" loading="lazy" decoding="async">';
  }
  function badge(v, list) {
    var pos = list.indexOf(v);
    return pos === -1 ? '' : ' <span class="ee-badge">' + esc(t('ee.badge', { n: pos + 1 })) + '</span>';
  }

  // Car details and the full car list open in a dialog (like the planner), so
  // they are always in view, also on phones.
  var dlg = document.createElement('div');
  dlg.className = 'planner ee-dlg';
  dlg.hidden = true;
  dlg.setAttribute('role', 'dialog');
  dlg.setAttribute('aria-modal', 'true');
  document.body.appendChild(dlg);
  function closeDlg() { dlg.hidden = true; }
  dlg.addEventListener('click', function (e) { if (e.target === dlg) closeDlg(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !dlg.hidden) closeDlg(); });
  function showDlg(title, body) {
    dlg.innerHTML = '<div class="pl-box ee-box"><div class="pl-top"><h2>' + title + '</h2>' +
      '<button type="button" class="icon-btn" data-close aria-label="' + esc(t('plan.close')) + '">✕</button></div>' + body + '</div>';
    dlg.querySelector('[data-close]').addEventListener('click', closeDlg);
    dlg.hidden = false;
    dlg.querySelector('.pl-box').scrollTop = 0;
  }

  function openCar(v, fromList) {
    if (!v || v.unknown) return;
    showDlg('🚗 ' + esc(fullName(v)),
      '<div class="ee-hero">' + img(v, 'ee-img') + '</div>' +
      (carName(v) !== v.name.en ? '<div class="muted">' + esc(v.name.en) + '</div>' : '') +
      '<div class="ee-meta">' + esc(className(v)) + ' · ' + esc(t('ee.seats', { n: v.seats })) + ' · ' + esc(t('ee.fastest', { n: speedRank[v.i], total: data.vehicles.length })) + '</div>' +
      whenHtml(v) + statBars(v) +
      '<div class="ee-overall">🏆 ' + esc(t('ee.overall', { score: Math.round(score(v, rankCfg())), n: rankOf(v), total: data.vehicles.length })) + '</div>' +
      '<p class="muted">' + esc(t('ee.statsNote')) + '</p>' +
      '<p class="ee-spots">📍 ' + esc(t('ee.spots', { n: spotItems[v.tier].length, set: t('ee.set.' + v.tier) })) + '</p>' +
      '<div class="ee-actions"><button type="button" class="chip primary" data-map>🗺 ' + esc(t('ee.showSpots', { n: spotItems[v.tier].length })) + '</button>' +
      '<button type="button" class="chip" data-all>☰ ' + esc(t('ee.all', { n: data.vehicles.length })) + '</button></div>');
    dlg.querySelector('[data-map]').addEventListener('click', function () {
      closeDlg();
      M.showItemsOnMap(spotItems[v.tier], t('ee.spotsTitle', { name: carName(v) }));
      if (M.isMobile()) M.setSidebar(false);   // phones: show the map, the list stays in the menu
    });
    dlg.querySelector('[data-all]').addEventListener('click', function () { openAll(); });
  }

  // Search result row (sidebar).
  function carButton(v, extra) {
    var b = document.createElement('button');
    b.className = 'result ee-result';
    b.innerHTML = img(v, 'ee-thumb') + '<span><div class="name">' + esc(fullName(v)) + (extra || '') + '</div>' +
      '<div class="meta">' + esc(className(v)) + ' · 🏁 ' + kmh(v) + ' km/h · ' + esc(t('ee.set.' + v.tier)) + '</div></span>';
    b.addEventListener('click', function () { openCar(v); });
    return b;
  }

  // Ranking: "score" = weighted sum of the stats (each as % of the best export
  // car) by the chosen priority; "strict" = sort by priority 1, ties by 2, 3, 4.
  // Default: speed and acceleration first, braking and traction second.
  var RANK_DEFAULT = { mode: 'score', prio: ['speed', 'accel', 'brake', 'traction'], w: [40, 30, 20, 10] };
  function rankCfg() {
    var c = M.store.get('eeRank', null);
    var ok = c && ['score', 'strict', 'name', 'today'].indexOf(c.mode) !== -1 && Array.isArray(c.prio) && c.prio.length === 4 &&
      STATS.every(function (k) { return c.prio.indexOf(k) !== -1; }) && Array.isArray(c.w) && c.w.length === 4;
    return ok ? c : JSON.parse(JSON.stringify(RANK_DEFAULT));
  }
  function pct(v, k) { return v[k] / best[k] * 100; }
  function score(v, c) {
    var sum = 0, tot = 0;
    c.prio.forEach(function (k, i) { var w = Math.max(0, Number(c.w[i]) || 0); sum += w * pct(v, k); tot += w; });
    return tot ? sum / tot : 0;
  }
  function rankSort(cars, c, list) {
    var byName = function (a, b) { return carName(a).localeCompare(carName(b), I18N.code); };
    var strict = function (a, b) {
      for (var i = 0; i < 4; i++) { var d = b[c.prio[i]] - a[c.prio[i]]; if (d) return d; }
      return byName(a, b);
    };
    return cars.sort(c.mode === 'name' ? byName
      : c.mode === 'today' ? function (a, b) {
        var pa = list.indexOf(a), pb = list.indexOf(b);
        return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb) || byName(a, b);
      }
      : c.mode === 'strict' ? strict
      : function (a, b) { return score(b, c) - score(a, c) || strict(a, b); });
  }
  // Rank of a car with the saved settings (score mode unless strict is chosen).
  function rankOf(v) {
    var c = rankCfg();
    if (c.mode !== 'strict') c.mode = 'score';
    return rankSort(data.vehicles.slice(), c, []).indexOf(v) + 1;
  }

  // Every export car as a grid of cards: ranked, filterable.
  function openAll() {
    var c = rankCfg();
    var statOpts = function (sel) {
      return STATS.map(function (k) { return '<option value="' + k + '"' + (k === sel ? ' selected' : '') + '>' + esc(t('ee.' + k)) + '</option>'; }).join('');
    };
    showDlg('🏆 ' + esc(t('ee.allTitle', { n: data.vehicles.length })),
      '<div class="ee-tools"><input type="search" class="ee-filter" placeholder="' + esc(t('ee.filter')) + '">' +
      '<label class="ee-sort"><span class="muted">' + esc(t('ee.sort')) + '</span> <select data-mode>' +
      ['score', 'strict', 'name', 'today'].map(function (k) {
        return '<option value="' + k + '"' + (k === c.mode ? ' selected' : '') + '>' + esc(t('ee.mode.' + k)) + '</option>';
      }).join('') + '</select></label></div>' +
      '<div class="ee-prio">' + c.prio.map(function (k, i) {
        return '<label><span class="muted">' + esc(t('ee.prio', { n: i + 1 })) + '</span><select data-prio="' + i + '">' + statOpts(k) + '</select>' +
          '<span class="ee-w"><input type="number" min="0" max="100" step="5" data-w="' + i + '" value="' + esc(c.w[i]) + '"> %</span></label>';
      }).join('') + '<button type="button" class="chip" data-reset>↺ ' + esc(t('plan.reset')) + '</button></div>' +
      '<div class="muted ee-legend" data-hint></div>' +
      '<div class="ee-grid"></div>');
    var grid = dlg.querySelector('.ee-grid'), filter = dlg.querySelector('.ee-filter');
    function save() { M.store.set('eeRank', c); }
    function draw() {
      dlg.querySelectorAll('.ee-w').forEach(function (el) { el.hidden = c.mode !== 'score'; });
      dlg.querySelector('.ee-prio').classList.toggle('off', c.mode === 'name' || c.mode === 'today');
      dlg.querySelector('[data-hint]').textContent = t('ee.hint.' + c.mode) + ' · ' + t('ee.legend') + ' ' +
        c.prio.map(function (k) { return t('ee.' + k); }).join(' · ');
      var list = todayList();
      var cars = rankSort(data.vehicles.slice(), c, list);
      var words = M.norm(filter.value).split(/\s+/).filter(Boolean);
      grid.innerHTML = '';
      cars.forEach(function (v, idx) {
        if (!words.every(function (w) { return hay[v.i].indexOf(w) !== -1; })) return;
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'ee-tile' + (list.indexOf(v) !== -1 ? ' on' : '');
        var top = c.mode === 'score' || c.mode === 'strict'
          ? '<div class="ee-rank">#' + (idx + 1) + (c.mode === 'score' ? ' · ' + esc(t('ee.score')) + ' ' + score(v, c).toFixed(1) : '') + '</div>' : '';
        b.innerHTML = top + img(v, 'ee-tile-img') + '<div class="ee-tile-n">' + esc(carName(v)) + badge(v, list) + '</div>' +
          '<div class="muted">' + esc(v.maker) + ' · ' + esc(className(v)) + '</div>' + miniBars(v, c.prio);
        b.addEventListener('click', function () { openCar(v, true); });
        grid.appendChild(b);
      });
    }
    dlg.querySelector('[data-mode]').addEventListener('change', function (e) { c.mode = e.target.value; save(); draw(); });
    dlg.querySelectorAll('[data-prio]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var i = Number(sel.getAttribute('data-prio')), k = sel.value, j = c.prio.indexOf(k);
        c.prio[j] = c.prio[i];          // swap, so each stat is used once
        c.prio[i] = k;
        dlg.querySelectorAll('[data-prio]').forEach(function (s2, n) { s2.value = c.prio[n]; });
        save(); draw();
      });
    });
    dlg.querySelectorAll('[data-w]').forEach(function (inp) {
      inp.addEventListener('input', function () { c.w[Number(inp.getAttribute('data-w'))] = Math.max(0, Number(inp.value) || 0); save(); draw(); });
    });
    dlg.querySelector('[data-reset]').addEventListener('click', function () { M.store.set('eeRank', null); openAll(); });
    filter.addEventListener('input', draw);
    draw();
  }

  function miniBars(v, order) {
    return '<div class="ee-mini">' + (order || STATS).map(function (k) {
      return '<span title="' + esc(t('ee.' + k)) + (k === 'speed' ? ' ' + kmh(v) + ' km/h' : ' ' + Math.round(pct(v, k)) + '%') + '"><i style="width:' + Math.round(pct(v, k)) + '%"></i></span>';
    }).join('') + '</div><div class="ee-kmh">🏁 ' + kmh(v) + ' km/h</div>';
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

  // The map may finish loading before this file runs (scripts load one by one).
  function onReady(fn) {
    if (window.GTAOMap && window.GTAOMap.ready) fn();
    else document.addEventListener('gtao:ready', fn, { once: true });
  }
  onReady(function () {
    M = window.GTAOMap;
    fetch('data/exotic_exports.json?v=' + window.APP_VERSION).then(function (r) { return r.json(); }).then(init)
      .catch(function (err) { console.error('exotic exports', err); });
  });
  document.addEventListener('gtao:today', renderToday);
})();
