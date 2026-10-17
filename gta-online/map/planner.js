// Planner: "I want $X / X RP / rank Y — what should I do on the map?"
// Uses the per-item rewards in data/info.json, what is available today, and
// user-editable time estimates. Picks the categories that pay the most per
// minute until the goal is reached.
(function () {
  'use strict';

  var M = window.GTAOMap;
  var t = I18N.t;
  var $ = function (id) { return document.getElementById(id); };
  var esc = M.esc;

  // Rough minutes per item (travel + pickup). Users can change them.
  var DEFAULT_MIN = {
    action_figures: 3, playing_cards: 3, signal_jammers: 3, peyote: 3, movie_props: 6, media_sticks: 5,
    radio_antennas: 5, ld_organics: 3, ls_tags: 4, hidden_caches: 4, shipwrecks: 5, treasure_chests: 8,
    buried_stashes: 8, jack_o_lanterns: 3, snowmen: 3, yuanbao: 3, gold_charms: 3, lucky_charms: 3,
    weed_packages: 3, ghosts: 4
  };
  var DEFAULTS = { goal: 'money', amount: 500000, rp: 50000, curRank: 50, curRp: '', targetRank: 100,
    events: false, skipCollected: true, bonus: true, multCash: 1, multRp: 1, minutes: {}, off: {} };

  var cfg = Object.assign({}, DEFAULTS, M.store.get('planner', {}));
  cfg.minutes = Object.assign({}, cfg.minutes);
  cfg.off = Object.assign({}, cfg.off);
  function save() { M.store.set('planner', cfg); }

  var ranks = null;
  fetch('data/ranks.json?v=' + window.APP_VERSION).then(function (r) { return r.json(); }).then(function (d) { ranks = d; render(); });

  function rpForRank(r) {
    if (!ranks) return 0;
    r = Math.max(1, Math.min(ranks.max_rank, Math.floor(r)));
    if (r < 100) return ranks.table[r];
    var d = r - 99;
    return 1555800 + d * 28500 + Math.floor((d * d + 1) / 2) * 50;
  }
  function rankForRp(rp) {
    var lo = 1, hi = ranks ? ranks.max_rank : 1;
    while (lo < hi) { var mid = Math.ceil((lo + hi) / 2); if (rpForRank(mid) <= rp) lo = mid; else hi = mid - 1; }
    return lo;
  }

  // ---------------------------------------------------------------------------
  // Calculation
  // ---------------------------------------------------------------------------
  function tunableOn(name) {
    var v = M.state.tunables && M.state.tunables.values ? M.state.tunables.values[name] : undefined;
    return v === true || v === 1;
  }
  function rewardText(cash, rp) {
    return [cash ? M.money(cash) : '', rp ? M.num(rp) + ' RP' : ''].filter(Boolean).join(' + ');
  }
  function minutesFor(key) { return Number(cfg.minutes[key]) > 0 ? Number(cfg.minutes[key]) : DEFAULT_MIN[key]; }

  // Items of a category you can still do (today's spots for daily ones).
  function available(cat) {
    var st = M.state;
    var items = cat.items;
    var today = st.todaySets[cat.key];
    if (today) return items.filter(function (it) { return today.has(it.n); });
    if (cat.key === 'ghosts') items = items.filter(function (it) { return /A$|^#10$/.test(it.label); });
    if (cfg.skipCollected) items = items.filter(function (it) { return !st.collected.has(M.idOf(it)); });
    return items;
  }

  function sources() {
    var st = M.state;
    return st.cats.map(function (cat) {
      var info = st.info[cat.key] || {};
      if (!(info.cash || info.rp || info.cash_first) || !DEFAULT_MIN[cat.key]) return null;
      if (cat.group === 'event' && !cfg.events) return null;
      // Peyote is switched on by a tunable (off by default in the scripts).
      if (cat.key === 'peyote' && !cfg.events && !tunableOn('VC_PEYOTE_ENABLE')) return null;
      if (cfg.off[cat.key]) return null;
      var items = available(cat);
      if (!items.length) return null;
      var done = cat.items.length - items.length;
      var units = items.map(function (it, i) {
        var cash = info.cash_first ? info.cash_first + info.cash_step * (done + i) : (info.cash || 0);
        return { item: it, cash: cash * cfg.multCash, rp: (info.rp || 0) * cfg.multRp };
      });
      var bonus = cfg.bonus && info.bonus_cash && cat.group !== 'daily' ? info.bonus_cash * cfg.multCash : 0;
      return { cat: cat, units: units, bonus: bonus, min: minutesFor(cat.key) };
    }).filter(Boolean);
  }

  function plan(field, need) {
    var srcs = sources();
    var value = function (u) { return u[field]; };
    srcs.forEach(function (s) {
      var all = s.units.reduce(function (a, u) { return a + value(u); }, 0) + (field === 'cash' ? s.bonus : 0);
      s.rate = all / (s.units.length * s.min);
    });
    srcs = srcs.filter(function (s) { return s.rate > 0; }).sort(function (a, b) { return b.rate - a.rate; });
    var left = need, steps = [];
    for (var i = 0; i < srcs.length && left > 0; i++) {
      var s = srcs[i], take = [], got = 0;
      for (var k = 0; k < s.units.length && left - got > 0; k++) { take.push(s.units[k]); got += value(s.units[k]); }
      var full = take.length === s.units.length;
      var bonus = full ? s.bonus : 0;
      if (field === 'cash') got += bonus;
      left -= got;
      steps.push({ src: s, take: take, bonus: bonus,
        cash: take.reduce(function (a, u) { return a + u.cash; }, 0) + bonus,
        rp: take.reduce(function (a, u) { return a + u.rp; }, 0),
        min: take.length * s.min });
    }
    return { steps: steps, left: Math.max(0, left) };
  }

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------
  var dlg = document.createElement('div');
  dlg.id = 'planner';
  dlg.className = 'planner';
  dlg.hidden = true;
  dlg.setAttribute('role', 'dialog');
  dlg.setAttribute('aria-modal', 'true');
  document.body.appendChild(dlg);

  function open() { dlg.hidden = false; render(); var f = dlg.querySelector('input'); if (f) f.focus(); }
  function close() { dlg.hidden = true; }
  $('openPlanner').addEventListener('click', open);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !dlg.hidden) close(); });

  function numInput(id, val, attrs) {
    return '<input id="' + id + '" type="number" inputmode="numeric" value="' + esc(val) + '" ' + (attrs || '') + '>';
  }

  function render() {
    if (dlg.hidden || !M.state.cats.length) return;
    var goalTabs = ['money', 'rp', 'rank'].map(function (g) {
      return '<button type="button" data-goal="' + g + '" class="' + (cfg.goal === g ? 'active' : '') + '">' +
        esc(t('plan.goal' + g.charAt(0).toUpperCase() + g.slice(1))) + '</button>';
    }).join('');

    var inputs = '';
    if (cfg.goal === 'money') {
      inputs = '<label class="pl-field"><span>' + esc(t('plan.amount')) + ' ($)</span>' + numInput('plAmount', cfg.amount, 'min="0" step="10000"') + '</label>' +
        '<div class="pl-quick">' + [100000, 500000, 1000000, 2000000].map(function (v) {
          return '<button type="button" class="chip" data-amount="' + v + '">' + esc(M.money(v)) + '</button>';
        }).join('') + '</div>';
    } else if (cfg.goal === 'rp') {
      inputs = '<label class="pl-field"><span>' + esc(t('plan.amount')) + ' (RP)</span>' + numInput('plRp', cfg.rp, 'min="0" step="1000"') + '</label>';
    } else {
      inputs = '<div class="pl-row">' +
        '<label class="pl-field"><span>' + esc(t('plan.curRank')) + '</span>' + numInput('plCur', cfg.curRank, 'min="1" max="8000"') + '</label>' +
        '<label class="pl-field"><span>' + esc(t('plan.targetRank')) + '</span>' + numInput('plTarget', cfg.targetRank, 'min="2" max="8000"') + '</label></div>' +
        '<label class="pl-field"><span>' + esc(t('plan.curRp')) + '</span>' + numInput('plCurRp', cfg.curRp, 'min="0" placeholder="' + esc(M.num(rpForRank(cfg.curRank))) + '"') + '</label>';
    }

    // Goal -> plan
    var field = cfg.goal === 'money' ? 'cash' : 'rp';
    var need = 0, head = '';
    if (cfg.goal === 'money') need = Number(cfg.amount) || 0;
    else if (cfg.goal === 'rp') need = Number(cfg.rp) || 0;
    else if (ranks) {
      var curRp = cfg.curRp !== '' && cfg.curRp !== null ? Number(cfg.curRp) : rpForRank(cfg.curRank);
      var from = cfg.curRp !== '' && cfg.curRp !== null ? rankForRp(curRp) : Number(cfg.curRank);
      need = Math.max(0, rpForRank(cfg.targetRank) - curRp);
      head = need > 0
        ? '<p class="pl-head">' + esc(t('plan.needRp', { from: from, to: cfg.targetRank, rp: M.num(need) })) + '</p>'
        : '<p class="pl-head">' + esc(t('plan.alreadyDone')) + '</p>';
    }

    var out = '';
    if (need > 0) {
      var p = plan(field, need);
      var tot = p.steps.reduce(function (a, s) { return { cash: a.cash + s.cash, rp: a.rp + s.rp, min: a.min + s.min }; }, { cash: 0, rp: 0, min: 0 });
      out = '<h3 class="pl-sub">' + esc(t('plan.result')) + '</h3><table class="pl-table">' +
        p.steps.map(function (s, i) {
          var cat = s.src.cat;
          return '<tr><td><span class="res-blip" style="--c:' + cat.color + '">' + M.blipImg(cat) + '</span></td>' +
            '<td class="pl-name">' + esc(I18N.catName(cat.key)) + (cat.group === 'daily' ? ' <span class="muted">(' + esc(t('plan.today')) + ')</span>' : '') +
            '<div class="muted">' + esc(t('plan.items', { n: s.take.length })) + ' · ' + esc(rewardText(s.cash, s.rp)) +
            (s.bonus ? ' · 🏆' : '') + ' · ' + esc(t('plan.minutes', { m: Math.round(s.min) })) + '</div></td>' +
            '<td><button type="button" class="icon-btn" data-show="' + i + '" title="' + esc(t('plan.showAll')) + '">📍</button></td></tr>';
        }).join('') + '</table>' +
        '<p class="pl-total">' + esc(t('plan.total', { cash: M.money(tot.cash), rp: M.num(tot.rp), min: Math.round(tot.min) })) + '</p>' +
        (p.left > 0
          ? '<p class="pl-warn">' + esc(t('plan.short', { left: field === 'cash' ? M.money(p.left) : M.num(p.left) + ' RP' })) + '</p>'
          : '<p class="pl-ok">' + esc(t('plan.reached')) + '</p>') +
        (p.steps.length ? '<button type="button" class="chip primary" id="plShowAll">' + esc(t('plan.showAll')) + '</button>' : '');
      dlg._plan = p;
    } else if (!head) {
      out = '<p class="muted">' + esc(t('plan.empty')) + '</p>';
    }

    // Customisation
    var rows = M.state.cats.filter(function (c) { return DEFAULT_MIN[c.key] && (M.state.info[c.key] || {}).purpose; }).map(function (c) {
      return '<tr><td><input type="checkbox" data-use="' + c.key + '"' + (cfg.off[c.key] ? '' : ' checked') + '></td><td>' + esc(I18N.catName(c.key)) +
        '</td><td><input type="number" min="0.5" step="0.5" data-min="' + c.key + '" value="' + minutesFor(c.key) + '"></td></tr>';
    }).join('');
    var custom = '<details class="pl-custom"' + (dlg._customOpen ? ' open' : '') + '><summary>⚙ ' + esc(t('plan.custom')) + '</summary>' +
      '<label class="pl-check"><input type="checkbox" id="plEvents"' + (cfg.events ? ' checked' : '') + '> ' + esc(t('plan.includeEvents')) + '</label>' +
      '<label class="pl-check"><input type="checkbox" id="plSkip"' + (cfg.skipCollected ? ' checked' : '') + '> ' + esc(t('plan.excludeCollected')) + '</label>' +
      '<label class="pl-check"><input type="checkbox" id="plBonus"' + (cfg.bonus ? ' checked' : '') + '> ' + esc(t('plan.useBonus')) + '</label>' +
      '<div class="pl-row"><label class="pl-field"><span>' + esc(t('plan.multCash')) + '</span>' + numInput('plMultCash', cfg.multCash, 'min="1" max="10" step="0.5"') + '</label>' +
      '<label class="pl-field"><span>' + esc(t('plan.multRp')) + '</span>' + numInput('plMultRp', cfg.multRp, 'min="1" max="10" step="0.5"') + '</label></div>' +
      '<table class="pl-table pl-min"><tr><th>' + esc(t('plan.colUse')) + '</th><th>' + esc(t('plan.colCat')) + '</th><th>' + esc(t('plan.colMin')) + '</th></tr>' + rows + '</table>' +
      '<button type="button" class="chip" id="plReset">' + esc(t('plan.reset')) + '</button></details>';

    dlg.innerHTML = '<div class="pl-box"><div class="pl-top"><h2>🧮 ' + esc(t('plan.title')) + '</h2>' +
      '<button type="button" class="icon-btn" id="plClose" aria-label="' + esc(t('plan.close')) + '">✕</button></div>' +
      '<div class="seg pl-goals">' + goalTabs + '</div>' + inputs + head + out + custom +
      '<p class="muted small">' + esc(t('plan.estimate')) + '</p></div>';
    bind();
  }

  function rerenderKeepFocus(id) {
    var el = document.activeElement, pos = el && el.selectionStart;
    render();
    var n = id && $(id);
    if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { /* number inputs */ } }
  }

  function bind() {
    $('plClose').addEventListener('click', close);
    dlg.querySelectorAll('[data-goal]').forEach(function (b) {
      b.addEventListener('click', function () { cfg.goal = b.getAttribute('data-goal'); save(); render(); });
    });
    dlg.querySelectorAll('[data-amount]').forEach(function (b) {
      b.addEventListener('click', function () { cfg.amount = Number(b.getAttribute('data-amount')); save(); render(); });
    });
    var fields = { plAmount: 'amount', plRp: 'rp', plCur: 'curRank', plTarget: 'targetRank', plCurRp: 'curRp', plMultCash: 'multCash', plMultRp: 'multRp' };
    Object.keys(fields).forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.addEventListener('input', function () {
        var v = el.value;
        cfg[fields[id]] = id === 'plCurRp' ? (v === '' ? '' : Math.max(0, Number(v))) : Math.max(0, Number(v) || 0);
        if (id === 'plMultCash' || id === 'plMultRp') cfg[fields[id]] = Math.max(1, cfg[fields[id]]);
        save();
        rerenderKeepFocus(id);
      });
    });
    var checks = { plEvents: 'events', plSkip: 'skipCollected', plBonus: 'bonus' };
    Object.keys(checks).forEach(function (id) {
      $(id).addEventListener('change', function (e) { cfg[checks[id]] = e.target.checked; save(); render(); });
    });
    dlg.querySelectorAll('[data-use]').forEach(function (c) {
      c.addEventListener('change', function () { var k = c.getAttribute('data-use'); if (c.checked) delete cfg.off[k]; else cfg.off[k] = true; save(); render(); });
    });
    dlg.querySelectorAll('[data-min]').forEach(function (inp) {
      inp.addEventListener('change', function () { cfg.minutes[inp.getAttribute('data-min')] = Number(inp.value); save(); render(); });
    });
    var det = dlg.querySelector('details');
    det.addEventListener('toggle', function () { dlg._customOpen = det.open; });
    $('plReset').addEventListener('click', function () {
      cfg = Object.assign({}, DEFAULTS, { goal: cfg.goal, minutes: {}, off: {} });
      save(); render();
    });
    dlg.querySelectorAll('[data-show]').forEach(function (b) {
      b.addEventListener('click', function () {
        var s = dlg._plan.steps[Number(b.getAttribute('data-show'))];
        showOnMap(s.take.map(function (u) { return u.item; }));
      });
    });
    var all = $('plShowAll');
    if (all) all.addEventListener('click', function () {
      var items = [];
      dlg._plan.steps.forEach(function (s) { s.take.forEach(function (u) { items.push(u.item); }); });
      showOnMap(items);
    });
  }

  function showOnMap(items) {
    close();
    M.showItemsOnMap(items, t('plan.mapTitle', { n: items.length }));
  }

  document.addEventListener('gtao:lang', function () { t = I18N.t; render(); });
  document.addEventListener('gtao:today', render);
})();
