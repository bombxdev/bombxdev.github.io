(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Map projection
  // Game world (x east, y north, metres) -> zoom-0 pixel of the CreepPork tiles.
  // Fitted against the 30 sea-level shipwreck positions (mean error ~5 m).
  // ---------------------------------------------------------------------------
  var AX = 0.0069329164, BX = 39.385831;
  var AY = 0.0069134440, CY = 57.919678;
  var CRS = L.extend({}, L.CRS.Simple, {
    transformation: new L.Transformation(AX, BX, -AY, CY)
  });

  // Extent of the tile image (86 px at zoom 0), expressed in game coordinates.
  var TILE_BOUNDS = L.latLngBounds([[(CY - 86) / AY, -BX / AX], [CY / AY, (86 - BX) / AX]]);
  var MAX_BOUNDS = L.latLngBounds([[-6600, -6200], [8800, 7400]]);
  // Cayo Perico image (FiveNet livemap-tiles), placed in game coordinates.
  var CAYO_BOUNDS = L.latLngBounds([[-6144.05, 3666.78], [-4144.05, 5723.78]]);

  var STYLES = {
    atlas: { name: 'Atlas', bg: '#0fa8d2' },
    road: { name: 'Road', bg: '#1862ad' },
    satellite: { name: 'Satellite', bg: '#143d6b' }
  };
  var GROUPS = ['permanent', 'daily', 'event'];
  var PURPOSES = ['money', 'unlock', 'service', 'activity', 'timed', 'event'];
  var t = I18N.t;

  var PREFIX = 'gtaomap.';
  var STORE = {
    get: function (k, d) {
      try { var v = localStorage.getItem(PREFIX + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set: function (k, v) {
      try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ }
    },
    // Every saved setting, without the prefix (used for backups).
    all: function () {
      var out = {};
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k.indexOf(PREFIX) === 0) out[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k));
        }
      } catch (e) { /* storage unavailable */ }
      return out;
    },
    replaceAll: function (data) {
      Object.keys(STORE.all()).forEach(function (k) { localStorage.removeItem(PREFIX + k); });
      Object.keys(data).forEach(function (k) { STORE.set(k, data[k]); });
    }
  };

  var $ = function (id) { return document.getElementById(id); };
  var state = {
    cats: [],
    catByKey: {},
    items: [],
    visible: {},
    collected: new Set(STORE.get('collected', [])),
    hideCollected: STORE.get('hideCollected', false),
    query: '',
    matches: null,
    active: null,
    todayOnly: STORE.get('todayOnly', true),
    dayOffset: 0,
    daily: null,
    tunables: null,
    today: null,
    todaySets: {},
    info: {},
    groupBy: STORE.get('groupBy', 'type'),
    openInfo: {},
    notes: STORE.get('notes', {})
  };

  // ---------------------------------------------------------------------------
  // Map setup
  // ---------------------------------------------------------------------------
  var map = L.map('map', {
    crs: CRS,
    minZoom: 2,
    maxZoom: 9,
    zoomSnap: 0.5,
    maxBounds: MAX_BOUNDS,
    maxBoundsViscosity: 0.8,
    attributionControl: true,
    zoomControl: true
  });
  map.attributionControl.setPrefix(false);
  // All sources are listed on the credits page; keep the map corner tidy.
  map.attributionControl.addAttribution('<a href="credits.html" data-i18n="credits.link">Credits</a>');

  var baseLayers = {};
  Object.keys(STYLES).forEach(function (key) {
    baseLayers[STYLES[key].name] = L.tileLayer('tiles/' + key + '/{z}/{x}_{y}.webp', {
      minZoom: 2,
      maxZoom: 9,
      maxNativeZoom: 7,
      bounds: TILE_BOUNDS,
      noWrap: true
    }).on('add', function () {
      $('map').style.background = STYLES[key].bg;
      STORE.set('style', key);
    });
  });
  var startStyle = STYLES[STORE.get('style', 'atlas')] ? STORE.get('style', 'atlas') : 'atlas';
  baseLayers[STYLES[startStyle].name].addTo(map);
  L.control.layers(baseLayers, null, { position: 'topright' }).addTo(map);

  map.fitBounds(L.latLngBounds([[-3800, -3600], [7700, 4300]]));

  // Cayo Perico is not part of the main tile set; it has its own image.
  L.imageOverlay('tiles-cayo/satellite.webp?v=' + window.APP_VERSION, CAYO_BOUNDS, {
    interactive: false
  }).addTo(map);

  function updateZoomClass() {
    var z = map.getZoom(), c = map.getContainer().classList;
    c.toggle('zoom-far', z < 4);
    c.toggle('zoom-mid', z >= 4 && z < 5);
  }
  map.on('zoomend', updateZoomClass);
  updateZoomClass();

  // ---------------------------------------------------------------------------
  // City zones overlay: game zone boxes drawn opaque inside a pane whose own
  // opacity makes them see-through, so overlapping boxes don't stack colour.
  // The pane sits above the tiles and below all markers.
  // ---------------------------------------------------------------------------
  map.createPane('zones').style.zIndex = 350;
  map.createPane('zoneLabels').style.zIndex = 450;
  map.getPane('zoneLabels').style.pointerEvents = 'none';
  var zoneLayer = L.layerGroup(), zoneLabelLayer = L.layerGroup();
  var zoneShapes = null;
  function buildZones(data) {
    zoneShapes = data;
    data.boxes.forEach(function (b) {   // file order: later boxes win, so draw them on top
      L.rectangle([[b[2], b[1]], [b[4], b[3]]], {
        pane: 'zones', stroke: false, fillColor: data.zones[b[0]].color, fillOpacity: 1, interactive: false
      }).addTo(zoneLayer);
    });
    data.zones.forEach(function (z) {
      if (!z.label) return;
      z.marker = L.marker([z.label[1], z.label[0]], {
        pane: 'zoneLabels', interactive: false, keyboard: false,
        icon: L.divIcon({ className: 'zone-label', html: '<span>' + esc(z.name) + '</span>', iconSize: [0, 0] })
      });
    });
  }
  // Show labels of big zones when zoomed out, all of them when zoomed in.
  function updateZoneLabels() {
    if (!zoneShapes) return;
    var zoom = map.getZoom();
    var minArea = zoom < 3.5 ? Infinity : zoom < 4.5 ? 6 : zoom < 5.5 ? 1.2 : 0;
    zoneShapes.zones.forEach(function (z) {
      if (!z.marker) return;
      var show = z.area_km2 >= minArea;
      if (show && !zoneLabelLayer.hasLayer(z.marker)) zoneLabelLayer.addLayer(z.marker);
      if (!show && zoneLabelLayer.hasLayer(z.marker)) zoneLabelLayer.removeLayer(z.marker);
    });
  }
  map.on('zoomend', updateZoneLabels);
  function zoneNameAt(x, y) {
    if (!zoneShapes) return '';
    var hit = '';
    for (var i = 0; i < zoneShapes.boxes.length; i++) {
      var b = zoneShapes.boxes[i];
      if (x >= b[1] && x <= b[3] && y >= b[2] && y <= b[4]) hit = zoneShapes.zones[b[0]].name;
    }
    return hit;
  }
  function setZonesVisible(on) {
    $('zonesOn').checked = on;
    $('zonesOpacityWrap').hidden = !on;
    STORE.set('zonesOn', on);
    if (on) { zoneLayer.addTo(map); zoneLabelLayer.addTo(map); updateZoneLabels(); }
    else { map.removeLayer(zoneLayer); map.removeLayer(zoneLabelLayer); }
  }
  function setZonesOpacity(pct) {
    map.getPane('zones').style.opacity = pct / 100;
    $('zonesOpacity').value = pct;
    STORE.set('zonesOpacity', pct);
  }

  var markerLayer = L.layerGroup().addTo(map);
  var tempLayer = L.layerGroup().addTo(map);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function idOf(item) { return item.cat + '-' + item.n; }
  // Shops/services move daily; there is nothing to "collect".
  var NOT_COLLECTABLE = { gun_van: true, street_dealers: true, exotic_exports: true };
  // Extension points for other modules (exports.js): extra popup HTML per
  // category, and extra search results shown above the map points.
  var POPUP_EXTRA = {};
  var SEARCH_EXTRA = [];
  var POPUP_ALL = [];   // extra popup HTML for every point (photos)
  function itemLabel(item) { return item.label || '#' + item.n; }
  function fmt(n) { return (Math.round(n * 100) / 100).toFixed(2); }
  function coordText(x, y, z) { return fmt(x) + ', ' + fmt(y) + (z === undefined ? '' : ', ' + fmt(z)); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // In-game radar blip (white silhouette) for a category; see data/categories.json.
  function blipImg(cat, extraClass) {
    return '<img class="blip' + (extraClass ? ' ' + extraClass : '') + '" src="blips/' + cat.blip + '.png" alt="" draggable="false">';
  }
  function norm(s) { return String(s).toLowerCase().replace(/[’']/g, '').trim(); }

  var toastTimer;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 1800);
  }

  function copy(text) {
    var done = function () { toast(t('toast.copied', { text: text })); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
    } else {
      fallbackCopy(text);
      done();
    }
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    ta.remove();
  }

  // ---------------------------------------------------------------------------
  // Markers
  // ---------------------------------------------------------------------------
  function makeIcon(item) {
    var cat = state.catByKey[item.cat];
    var cls = 'pin' + (state.collected.has(idOf(item)) ? ' done' : '') + (state.active === item ? ' active' : '');
    return L.divIcon({
      className: '',
      html: '<div class="' + cls + '" style="--c:' + cat.color + '">' + blipImg(cat) + '</div>',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -12]
    });
  }

  // Reward summary for a category, from data/info.json (game default values).
  var money = function (n) { return '$' + Number(n).toLocaleString(I18N.code); };
  var num = function (n) { return Number(n).toLocaleString(I18N.code); };
  function rewardHtml(cat) {
    var r = state.info[cat.key] || {};
    var parts = [];
    var cash = r.cash ? money(r.cash) : '';
    if (r.cash_first) {
      var total = 0, n = cat.items.length;
      for (var i = 0; i < n; i++) total += r.cash_first + r.cash_step * i;
      cash = t('info.escalating', { first: money(r.cash_first), step: money(r.cash_step), total: money(total) });
    }
    var each = [cash, r.rp ? num(r.rp) + ' RP' : ''].filter(Boolean).join(' + ');
    if (each) parts.push('<div class="rw"><span class="rw-k">💵 ' + esc(t('info.perItem')) + '</span> ' + esc(each) + (r.chips ? ' ' + esc(t('info.chips')) : '') + '</div>');
    else if (r.chips) parts.push('<div class="rw">' + esc(t('info.chips')) + '</div>');
    if (r.bonus_cash) parts.push('<div class="rw"><span class="rw-k">🏆 ' + esc(t('info.bonus')) + '</span> ' + esc(money(r.bonus_cash)) + '</div>');
    return parts.join('');
  }
  // --- Ghosts Exposed: each ghost shows up during one in-game hour ---------
  var timeFmt;
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function ghostTimingHtml(g) {
    var now = Date.now() / 1000;
    var nx = GTAODaily.nextGameHour(now, g.start_hour);
    var when = nx.active
      ? t('ghost.now', { m: Math.ceil((nx.start + 120 - now) / 60) })
      : t('ghost.next', { m: Math.ceil((nx.start - now) / 60), time: timeFmt.format(new Date(nx.start * 1000)) });
    return '<div class="rw"><span class="rw-k">🕐 ' + esc(t('ghost.window', { from: pad2(g.start_hour) + ':00', to: pad2(g.end_hour) + ':00' })) + '</span></div>' +
      '<div class="rw' + (nx.active ? ' live' : '') + '">' + esc(when) + '</div>' +
      (g.spots.length > 1 ? '<div class="rw muted">' + esc(t('ghost.spots', { n: g.spots.length })) + '</div>' : '');
  }
  function ghostScheduleHtml() {
    var now = Date.now() / 1000;
    var rows = (state.ghostSet ? state.ghostSet.ghosts : []).map(function (g) {
      return { g: g, nx: GTAODaily.nextGameHour(now, g.start_hour) };
    }).sort(function (a, b) { return a.nx.start - b.nx.start; });
    return '<p class="rw-k">' + esc(t('ghost.schedule')) + (state.ghostSetKey ? ' (' + state.ghostSetKey + ')' : '') + '</p><table class="sched">' +
      rows.map(function (r) {
        return '<tr' + (r.nx.active ? ' class="live"' : '') + '><td>#' + r.g.n + '</td><td>' + pad2(r.g.start_hour) + ':00</td><td>' +
          (r.nx.active ? esc(t('ghost.nowShort')) : timeFmt.format(new Date(r.nx.start * 1000))) + '</td></tr>';
      }).join('') + '</table>';
  }

  function infoHtml(cat) {
    var info = I18N.catInfo(cat.key), note = I18N.catNote(cat.key), rw = rewardHtml(cat);
    return (info ? '<p>' + esc(info) + '</p>' : '') + (note ? '<p class="muted">' + esc(note) + '</p>' : '') + rw +
      (rw ? '<p class="muted small">' + esc(t('info.defaults')) + '</p>' : '') +
      (cat.key === 'ghosts' ? ghostScheduleHtml() : '');
  }

  // "Where exactly": area name + height above sea level / depth under water.
  function whereHtml(item) {
    var parts = [];
    if (item.zone) parts.push('📍 ' + esc(t('pop.near', { zone: item.zone })));
    if (item.z < -1) parts.push('🌊 ' + esc(t('pop.underwater', { m: Math.round(-item.z) })));
    else parts.push('⛰ ' + esc(t('pop.altitude', { m: Math.round(item.z) })));
    return '<div class="pop-where">' + parts.join(' · ') + '</div>';
  }

  // Close-up satellite view inside the popup, with the spot circled.
  var miniMap = null;
  function attachMini(item, popupEl) {
    if (miniMap) { miniMap.remove(); miniMap = null; }
    var el = popupEl && popupEl.querySelector('[data-mini]');
    if (!el) return;
    miniMap = L.map(el, {
      crs: CRS, zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false,
      doubleClickZoom: false, boxZoom: false, keyboard: false, touchZoom: false, tap: false
    }).setView([item.y, item.x], 7);
    L.tileLayer('tiles/satellite/{z}/{x}_{y}.webp', { maxZoom: 9, maxNativeZoom: 7, bounds: TILE_BOUNDS, noWrap: true }).addTo(miniMap);
    if (CAYO_BOUNDS.contains([item.y, item.x])) L.imageOverlay('tiles-cayo/satellite.webp?v=' + window.APP_VERSION, CAYO_BOUNDS).addTo(miniMap);
    L.circleMarker([item.y, item.x], { radius: 18, color: '#ff3b3b', weight: 3, fill: false, className: 'mini-ring' }).addTo(miniMap);
    L.circleMarker([item.y, item.x], { radius: 3, color: '#ff3b3b', weight: 1, fillOpacity: 1 }).addTo(miniMap);
  }

  function popupHtml(item) {
    var cat = state.catByKey[item.cat];
    var done = state.collected.has(idOf(item));
    var name = I18N.catName(cat.key), note = I18N.catNote(cat.key);
    return '<div class="pop">' +
      '<h3><span class="pop-blip" style="--c:' + cat.color + '">' + blipImg(cat) + '</span>' + esc(name) + ' ' + esc(itemLabel(item)) + '</h3>' +
      '<div class="sub">' + (name !== cat.en ? esc(cat.en) + ' · ' : '') + esc(t('group.' + cat.group)) +
      (state.todaySets[item.cat] && state.todaySets[item.cat].has(item.n) ? '<span class="today-badge">' + esc(t('pop.selectedDay')) + '</span>' : '') + '</div>' +
      (note ? '<div class="note">' + esc(note) + '</div>' : '') +
      (item.ghost ? '<div class="pop-rw">' + ghostTimingHtml(item.ghost) + '</div>' : '') +
      (rewardHtml(cat) ? '<div class="pop-rw">' + rewardHtml(cat) + '</div>' : '') +
      (POPUP_EXTRA[item.cat] ? POPUP_EXTRA[item.cat](item) : '') +
      POPUP_ALL.map(function (fn) { return fn(item); }).join('') +
      whereHtml(item) +
      '<div class="pop-mini" data-mini="' + idOf(item) + '"></div>' +
      '<div class="muted small">' + esc(t('pop.closeup')) + '</div>' +
      '<div>' + esc(t('pop.coords')) + ': <code>' + coordText(item.x, item.y, item.z) + '</code></div>' +
      '<label class="pop-note"><span>📝 ' + esc(t('pop.myNote')) + ' <span class="note-saved" hidden>✓ ' + esc(t('pop.noteSaved')) + '</span></span><textarea rows="2" data-note="' + idOf(item) + '" placeholder="' +
        esc(t('pop.notePh')) + '">' + esc(state.notes[idOf(item)] || '') + '</textarea></label>' +
      '<div class="actions">' +
      (NOT_COLLECTABLE[item.cat] ? '' : '<button class="chip primary" data-act="toggle">' + esc(t(done ? 'pop.markUndone' : 'pop.markDone')) + '</button>') +
      '<button class="chip" data-act="copy">' + esc(t('pop.copyCoords')) + '</button>' +
      '<button class="chip" data-act="link">' + esc(t('pop.copyLink')) + '</button>' +
      '</div></div>';
  }

  function buildMarkers(list) {
    (list || state.items).forEach(function (item) {
      item.marker = L.marker([item.y, item.x], { icon: makeIcon(item), title: state.catByKey[item.cat].en + ' ' + itemLabel(item), riseOnHover: true });
      item.marker.bindPopup(function () { return popupHtml(item); }, { autoPanPadding: [40, 40] });
      item.marker.on('popupopen', function (e) {
        attachMini(item, e.popup.getElement());
        setActive(item);
        history.replaceState(null, '', '#' + idOf(item));
      });
      item.marker.on('popupclose', function (e) {
        var el = e.popup.getElement();
        if (el) saveNote(el.querySelector('[data-note]'));
        if (miniMap) { miniMap.remove(); miniMap = null; }
        if (state.active === item) setActive(null);
        if (location.hash === '#' + idOf(item)) history.replaceState(null, '', location.pathname + location.search);
      });
    });
  }

  function setActive(item) {
    var prev = state.active;
    state.active = item;
    if (prev && prev.marker) prev.marker.setIcon(makeIcon(prev));
    if (item && item.marker) item.marker.setIcon(makeIcon(item));
  }

  function isShown(item) {
    if (state.matches) return state.matches.has(item);
    if (!state.visible[item.cat]) return false;
    var today = state.todaySets[item.cat];
    if (state.todayOnly && today && !today.has(item.n)) return false;
    if (state.hideCollected && state.collected.has(idOf(item))) return false;
    return true;
  }

  function refreshMarkers() {
    state.items.forEach(function (item) {
      var on = isShown(item);
      if (on && !markerLayer.hasLayer(item.marker)) markerLayer.addLayer(item.marker);
      if (!on && markerLayer.hasLayer(item.marker)) markerLayer.removeLayer(item.marker);
    });
  }

  function toggleCollected(item) {
    var id = idOf(item);
    if (state.collected.has(id)) state.collected.delete(id); else state.collected.add(id);
    STORE.set('collected', Array.from(state.collected));
    item.marker.setIcon(makeIcon(item));
    renderCategories();
    if (state.query) renderResults();
    refreshMarkers();
  }

  function focusItem(item) {
    if (!markerLayer.hasLayer(item.marker)) {
      state.visible[item.cat] = true;
      saveVisible();
      renderCategories();
      refreshMarkers();
    }
    if (!markerLayer.hasLayer(item.marker) && state.todayOnly) {
      setTodayOnly(false);
    }
    map.flyTo([item.y, item.x], Math.max(map.getZoom(), 6), { duration: 0.6 });
    map.once('moveend', function () { item.marker.openPopup(); });
    if (isMobile()) setSidebar(false);
  }

  // ---------------------------------------------------------------------------
  // Sidebar: categories
  // ---------------------------------------------------------------------------
  function saveVisible() { STORE.set('visible', state.visible); }

  function catGroup(cat) {
    return state.groupBy === 'purpose' ? ((state.info[cat.key] || {}).purpose || 'unlock') : cat.group;
  }

  function renderCategories() {
    var host = $('categories');
    host.innerHTML = '';
    document.querySelectorAll('#groupBy button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-v') === state.groupBy);
    });
    var groups = state.groupBy === 'purpose' ? PURPOSES : GROUPS;
    groups.forEach(function (g) {
      var cats = state.cats.filter(function (c) { return catGroup(c) === g; });
      if (!cats.length) return;
      var title = document.createElement('div');
      title.className = 'group-title';
      title.textContent = t((state.groupBy === 'purpose' ? 'purpose.' : 'group.') + g);
      host.appendChild(title);
      cats.forEach(function (cat) {
        var total = cat.items.length;
        var got = cat.items.filter(function (it) { return state.collected.has(idOf(it)); }).length;
        var wrap = document.createElement('div');
        wrap.className = 'cat-wrap';
        var row = document.createElement('label');
        row.className = 'cat' + (state.visible[cat.key] ? ' on' : '');
        row.style.setProperty('--c', cat.color);
        var name = I18N.catName(cat.key);
        row.innerHTML =
          '<input type="checkbox"' + (state.visible[cat.key] ? ' checked' : '') + '>' +
          '<span class="dot">' + blipImg(cat) + '</span>' +
          '<span class="label"><div class="th">' + esc(name) + '</div>' + (name !== cat.en ? '<div class="en">' + esc(cat.en) + '</div>' : '') + '</span>' +
          '<span class="count">' + got + '/' + total + '</span>' +
          '<span class="bar"><span style="width:' + (total ? (100 * got / total) : 0) + '%"></span></span>';
        row.querySelector('input').addEventListener('change', function (e) {
          state.visible[cat.key] = e.target.checked;
          row.classList.toggle('on', e.target.checked);
          saveVisible();
          refreshMarkers();
        });
        var btn = document.createElement('button');
        btn.className = 'info-btn' + (state.openInfo[cat.key] ? ' active' : '');
        btn.type = 'button';
        btn.textContent = 'i';
        btn.setAttribute('aria-label', t('info.open') + ': ' + name);
        btn.setAttribute('aria-expanded', state.openInfo[cat.key] ? 'true' : 'false');
        btn.title = t('info.open');
        var panel = document.createElement('div');
        panel.className = 'cat-info';
        panel.hidden = !state.openInfo[cat.key];
        panel.innerHTML = infoHtml(cat);
        btn.addEventListener('click', function () {
          state.openInfo[cat.key] = !state.openInfo[cat.key];
          panel.hidden = !state.openInfo[cat.key];
          btn.classList.toggle('active', !panel.hidden);
          btn.setAttribute('aria-expanded', panel.hidden ? 'false' : 'true');
        });
        wrap.appendChild(row);
        wrap.appendChild(btn);
        wrap.appendChild(panel);
        host.appendChild(wrap);
      });
    });
  }

  document.querySelectorAll('#groupBy button').forEach(function (b) {
    b.addEventListener('click', function () {
      state.groupBy = b.getAttribute('data-v');
      STORE.set('groupBy', state.groupBy);
      renderCategories();
    });
  });

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------
  // "x, y" or "x y" in game coordinates
  var COORD_RE = /^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)(?:\s*[, ]\s*-?\d+(?:\.\d+)?)?\s*$/;

  function searchItems(q) {
    var tokens = norm(q).split(/\s+/).filter(Boolean);
    var nums = [], words = [];
    tokens.forEach(function (t) {
      var m = t.match(/^#?(\d+)$/);
      if (m) nums.push(+m[1]); else words.push(t);
    });
    return state.items.filter(function (item) {
      if (nums.length && nums.indexOf(item.num || item.n) === -1) return false;
      var hay = state.catByKey[item.cat].hay + ' | ' + norm(item.zone || '') + ' | ' + norm(state.notes[idOf(item)] || '');
      return words.every(function (w) { return hay.indexOf(w) !== -1; });
    });
  }

  function renderResults() {
    var box = $('results');
    var q = state.query;
    tempLayer.clearLayers();
    if (!q) {
      box.hidden = true;
      state.matches = null;
      refreshMarkers();
      return;
    }
    box.hidden = false;
    var cm = q.match(COORD_RE);
    if (cm) {
      var x = +cm[1], y = +cm[2];
      state.matches = null;
      refreshMarkers();
      box.innerHTML = '<div class="summary">' + esc(t('search.gotoCoord')) + '</div>';
      var btn = document.createElement('button');
      btn.className = 'result';
      btn.innerHTML = '<span>📍</span><span><div class="name">X ' + fmt(x) + ', Y ' + fmt(y) + '</div><div class="meta">' + esc(t('search.clickToGo')) + '</div></span>';
      btn.addEventListener('click', function () { gotoCoord(x, y); });
      box.appendChild(btn);
      return;
    }
    var found = searchItems(q);
    var extra = SEARCH_EXTRA.map(function (fn) { return fn(q); }).filter(Boolean);
    state.matches = new Set(found);
    // An extra result can bring its own points (e.g. where a car can be parked).
    var extraItems = [].concat.apply([], extra.map(function (x) { return x.items || []; }));
    extraItems.forEach(function (it) { state.matches.add(it); });
    refreshMarkers();
    var shown = found.slice(0, 300);
    box.innerHTML = '';
    extra.forEach(function (x) { box.appendChild(x.el); });
    if (found.length || !extra.length) box.insertAdjacentHTML('beforeend', '<div class="summary">' + esc(t('search.found', { n: found.length }) +
      (found.length > shown.length ? t('search.showingFirst', { n: shown.length }) : '') +
      (found.length ? t('search.mapFiltered') : '')) + '</div>');
    shown.forEach(function (item) {
      var cat = state.catByKey[item.cat];
      var b = document.createElement('button');
      b.className = 'result' + (state.collected.has(idOf(item)) ? ' done' : '');
      var name = I18N.catName(cat.key);
      b.innerHTML = '<span class="res-blip" style="--c:' + cat.color + '">' + blipImg(cat) + '</span><span><div class="name">' + esc(name) + ' ' + esc(itemLabel(item)) +
        '</div><div class="meta">' + (name !== cat.en ? esc(cat.en) + ' · ' : '') + (item.zone ? esc(item.zone) + ' · ' : '') + coordText(item.x, item.y) + '</div></span>';
      b.addEventListener('click', function () { focusItem(item); });
      box.appendChild(b);
    });
    var fit = found.length ? found : extraItems;
    if (fit.length && fit.length <= 300) {
      map.flyToBounds(L.latLngBounds(fit.map(function (it) { return [it.y, it.x]; })).pad(0.15), { maxZoom: 6, duration: 0.6 });
    }
  }

  // Show only `items` on the map with a list in the results box (planner).
  function showItemsOnMap(items, title, extraEl) {
    $('search').value = '';
    $('clearSearch').hidden = false;
    state.query = '';
    tempLayer.clearLayers();
    state.matches = new Set(items);
    refreshMarkers();
    var box = $('results');
    box.hidden = false;
    box.innerHTML = '<div class="summary">' + esc(title) + '</div>';
    if (extraEl) box.appendChild(extraEl);
    box.scrollTop = 0;
    $('sidebar').scrollTo({ top: 0, behavior: 'smooth' });   // results box sits at the top
    items.forEach(function (item) {
      var cat = state.catByKey[item.cat];
      var b = document.createElement('button');
      b.className = 'result' + (state.collected.has(idOf(item)) ? ' done' : '');
      b.innerHTML = '<span class="res-blip" style="--c:' + cat.color + '">' + blipImg(cat) + '</span><span><div class="name">' +
        esc(I18N.catName(cat.key)) + ' ' + esc(itemLabel(item)) + '</div><div class="meta">' + (item.zone ? esc(item.zone) + ' · ' : '') + coordText(item.x, item.y) + '</div></span>';
      b.addEventListener('click', function () { focusItem(item); });
      box.appendChild(b);
    });
    if (items.length) {
      map.flyToBounds(L.latLngBounds(items.map(function (it) { return [it.y, it.x]; })).pad(0.15), { maxZoom: 6, duration: 0.6 });
    }
    if (isMobile()) setSidebar(true);
  }

  // Show a custom panel in the results box without filtering the map.
  function showPanel(title, el) {
    $('search').value = '';
    $('clearSearch').hidden = false;
    state.query = '';
    tempLayer.clearLayers();
    state.matches = null;
    refreshMarkers();
    var box = $('results');
    box.hidden = false;
    box.innerHTML = '<div class="summary">' + esc(title) + '</div>';
    box.appendChild(el);
    box.scrollTop = 0;
    $('sidebar').scrollTo({ top: 0, behavior: 'smooth' });
    if (isMobile()) setSidebar(true);
  }

  function gotoCoord(x, y) {
    tempLayer.clearLayers();
    var m = L.marker([y, x]).addTo(tempLayer);
    m.bindPopup('<div class="pop"><h3>📍 ' + esc(t('pop.coords')) + '</h3><code>' + coordText(x, y) + '</code></div>').openPopup();
    map.flyTo([y, x], 6, { duration: 0.6 });
  }

  var searchTimer;
  $('search').addEventListener('input', function (e) {
    $('clearSearch').hidden = !e.target.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      state.query = e.target.value.trim();
      renderResults();
    }, 150);
  });
  $('search').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      var first = $('results').querySelector('.result');
      if (first) first.click();
    } else if (e.key === 'Escape') {
      clearSearch();
    }
  });
  function clearSearch() {
    $('search').value = '';
    $('clearSearch').hidden = true;
    state.query = '';
    renderResults();
  }
  $('clearSearch').addEventListener('click', clearSearch);

  // ---------------------------------------------------------------------------
  // Toolbar & misc UI
  // ---------------------------------------------------------------------------
  $('showAll').addEventListener('click', function () {
    state.cats.forEach(function (c) { state.visible[c.key] = true; });
    saveVisible(); renderCategories(); refreshMarkers();
  });
  $('hideAll').addEventListener('click', function () {
    state.cats.forEach(function (c) { state.visible[c.key] = false; });
    saveVisible(); renderCategories(); refreshMarkers();
  });
  $('hideCollected').checked = state.hideCollected;
  $('hideCollected').addEventListener('change', function (e) {
    state.hideCollected = e.target.checked;
    STORE.set('hideCollected', state.hideCollected);
    refreshMarkers();
  });
  // Sidebar: overlay drawer on phones, collapsible column on wider screens.
  var mobileQuery = window.matchMedia('(max-width: 760px)');
  function isMobile() { return mobileQuery.matches; }
  function sidebarOpen() {
    return isMobile() ? $('sidebar').classList.contains('open') : !$('app').classList.contains('sidebar-collapsed');
  }
  function setSidebar(open) {
    if (isMobile()) {
      $('sidebar').classList.toggle('open', open);
    } else {
      $('app').classList.toggle('sidebar-collapsed', !open);
      STORE.set('sidebarCollapsed', !open);
      map.invalidateSize();
    }
    $('openSidebar').hidden = sidebarOpen();
  }
  $('openSidebar').addEventListener('click', function () { setSidebar(true); });
  $('closeSidebar').addEventListener('click', function () { setSidebar(false); });
  $('backdrop').addEventListener('click', function () { setSidebar(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isMobile() && sidebarOpen()) setSidebar(false);
  });
  mobileQuery.addEventListener('change', function () {
    $('app').classList.toggle('sidebar-collapsed', !isMobile() && STORE.get('sidebarCollapsed', false));
    $('openSidebar').hidden = sidebarOpen();
    map.invalidateSize();
  });
  $('app').classList.toggle('sidebar-collapsed', !isMobile() && STORE.get('sidebarCollapsed', false));
  $('openSidebar').hidden = sidebarOpen();
  map.invalidateSize();

  map.on('mousemove', function (e) {
    var zn = zoneNameAt(e.latlng.lng, e.latlng.lat);
    $('cursor').textContent = 'X ' + fmt(e.latlng.lng) + '  Y ' + fmt(e.latlng.lat) + (zn ? '  ·  ' + zn : '');
  });
  map.on('mouseout', function () { $('cursor').textContent = ''; });
  map.on('contextmenu', function (e) {
    var c = coordText(e.latlng.lng, e.latlng.lat);
    L.popup().setLatLng(e.latlng)
      .setContent('<div class="pop"><h3>📍 ' + esc(t('pop.gameCoords')) + '</h3><code>' + c + '</code><div class="actions"><button class="chip" data-copy="' + c + '">' + esc(t('pop.copy')) + '</button></div></div>')
      .openOn(map);
  });
  // Personal notes typed in a popup (saved locally, included in backups).
  // Notes: saved on every keystroke, on change/blur and when the popup closes
  // (some mobile keyboards only report the text at the end).
  function saveNote(el) {
    var id = el && el.getAttribute && el.getAttribute('data-note');
    if (!id) return;
    var v = el.value;
    if ((state.notes[id] || '') === (v.trim() ? v : '')) return;
    if (v.trim()) state.notes[id] = v; else delete state.notes[id];
    STORE.set('notes', state.notes);
    var ok = el.parentNode && el.parentNode.querySelector('.note-saved');
    if (ok) { ok.hidden = false; clearTimeout(ok._t); ok._t = setTimeout(function () { ok.hidden = true; }, 1500); }
  }
  ['input', 'change', 'compositionend', 'focusout'].forEach(function (type) {
    document.addEventListener(type, function (ev) { saveNote(ev.target); }, true);
  });
  map.getContainer().addEventListener('keydown', function (ev) {
    if (ev.target.tagName === 'TEXTAREA') ev.stopPropagation();
  }, true);

  // Buttons inside popups (popup DOM is reused, so delegate from the container).
  map.getContainer().addEventListener('click', function (ev) {
    var btn = ev.target.closest && ev.target.closest('.pop button');
    if (!btn) return;
    if (btn.hasAttribute('data-copy')) return copy(btn.getAttribute('data-copy'));
    var item = state.active;
    if (!item) return;
    var act = btn.getAttribute('data-act');
    if (act === 'toggle') {
      toggleCollected(item);
      if (item.marker.isPopupOpen()) {
        item.marker.setPopupContent(popupHtml(item));
        attachMini(item, item.marker.getPopup().getElement());
      }
    }
    if (act === 'copy') copy(coordText(item.x, item.y, item.z));
    if (act === 'link') copy(location.href.split('#')[0] + '#' + idOf(item));
  });

  function openFromHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var item = state.items.find(function (it) { return idOf(it) === id; });
    if (item) focusItem(item);
  }
  window.addEventListener('hashchange', openFromHash);

  // ---------------------------------------------------------------------------
  // Daily locations
  // ---------------------------------------------------------------------------
  var TODAY_ORDER = ['gun_van', 'street_dealers', 'bike_time_trial', 'rc_time_trial', 'shipwrecks', 'treasure_chests', 'buried_stashes', 'hidden_caches', 'skydives', 'ls_tags', 'weed_packages'];
  var EVENT_ONLY = { weed_packages: true };
  var dateFmt, dayFmt;
  function setDateFormats() {
    dateFmt = new Intl.DateTimeFormat(I18N.code, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    dayFmt = new Intl.DateTimeFormat(I18N.code, { weekday: 'short', day: 'numeric', month: 'short' });
    timeFmt = new Intl.DateTimeFormat(I18N.code, { hour: '2-digit', minute: '2-digit' });
  }

  function setTodayOnly(on) {
    state.todayOnly = on;
    $('todayOnly').checked = on;
    STORE.set('todayOnly', on);
    refreshMarkers();
  }

  function renderToday() {
    if (!state.daily) return;
    var now = Date.now() / 1000;
    var r = GTAODaily.compute(now + state.dayOffset * 86400, state.daily, state.tunables);
    state.today = r;
    state.todaySets = {};
    Object.keys(r.lists).forEach(function (cat) {
      state.todaySets[cat] = new Set(r.lists[cat].map(function (i) { return i + 1; }));
    });

    var start = new Date(r.start * 1000), end = new Date((r.start + 86400) * 1000);
    var rel = state.dayOffset === 0 ? t('today.today')
      : state.dayOffset > 0 ? t('today.ahead', { n: state.dayOffset }) : t('today.behind', { n: state.dayOffset });
    $('dayLabel').textContent = rel + ' · ' + dayFmt.format(start);
    var left = Math.max(0, r.start + 86400 - now);
    $('dayReset').textContent = state.dayOffset === 0
      ? t('today.resetIn', { h: Math.floor(left / 3600), m: Math.floor(left % 3600 / 60), time: dateFmt.format(end) })
      : dateFmt.format(start) + ' – ' + dateFmt.format(end);

    var list = $('todayList');
    list.innerHTML = '';
    TODAY_ORDER.forEach(function (key) {
      var cat = state.catByKey[key];
      var idxs = r.lists[key];
      if (!cat || !idxs) return;
      var row = document.createElement('div');
      row.className = 'today-row';
      row.style.setProperty('--c', cat.color);
      var label = I18N.catName(key);
      if (EVENT_ONLY[key]) label = t('today.eventOnly', { name: label });
      row.innerHTML = '<span class="g">' + blipImg(cat) + '</span><div><div class="n">' + esc(label) + '</div><div class="chips"></div></div>';
      var chips = row.querySelector('.chips');
      idxs.forEach(function (i) {
        var item = cat.items[i];
        if (!item) return;
        var b = document.createElement('button');
        b.textContent = itemLabel(item);
        if (state.collected.has(idOf(item))) b.className = 'done';
        b.title = I18N.catName(key) + ' ' + itemLabel(item) + ' (' + coordText(item.x, item.y) + ')';
        b.addEventListener('click', function () { focusItem(item); });
        chips.appendChild(b);
      });
      list.appendChild(row);
    });

    var st = $('todayStatus');
    var tv = state.tunables;
    var notes = r.overrides.slice();
    if (r.gunVanPinned) {
      notes.push(t('status.gunVanPinned', { list: r.gunVanPinned.map(function (p) { return '#' + (p + 1); }).join(', ') }));
    }
    if (!tv) {
      st.className = 'today-status';
      st.textContent = t('status.noTunables');
    } else if (notes.length) {
      st.className = 'today-status warn';
      st.textContent = t('status.override', { list: notes.join(' · ') });
    } else {
      st.className = 'today-status';
      st.textContent = t('status.ok', { time: dateFmt.format(new Date(tv.fetched_at)) });
    }
    renderCategories();
    refreshMarkers();
    document.dispatchEvent(new CustomEvent('gtao:today'));
  }

  $('todayOnly').checked = state.todayOnly;
  $('todayOnly').addEventListener('change', function (e) { setTodayOnly(e.target.checked); });
  $('dayPrev').addEventListener('click', function () { state.dayOffset--; renderToday(); });
  $('dayNext').addEventListener('click', function () { state.dayOffset++; renderToday(); });
  $('dayLabel').addEventListener('click', function () { state.dayOffset = 0; renderToday(); });
  setInterval(renderToday, 30000);
  function renderClock() {
    var g = GTAODaily.gameTime(Date.now() / 1000);
    $('gameClock').textContent = '🕐 ' + t('clock.game', { time: pad2(g.hour) + ':' + pad2(g.minute) });
  }
  setInterval(renderClock, 2000);

  // Tunables are refreshed daily by a GitHub Action. Read both the deployed copy
  // and the repository copy (in case Pages has not rebuilt yet); use the newest.
  var TUNABLES_URLS = [
    'data/tunables.json',
    'https://raw.githubusercontent.com/bombxdev/bombxdev.github.io/master/gta-online/map/data/tunables.json'
  ];
  function loadTunables() {
    return Promise.all(TUNABLES_URLS.map(function (u) {
      return fetch(u, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    })).then(function (list) {
      list.filter(Boolean).forEach(function (tv) {
        if (tv.values && (!state.tunables || tv.fetched_at > state.tunables.fetched_at)) state.tunables = tv;
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Language
  // ---------------------------------------------------------------------------
  function buildSearchIndex(dicts) {
    state.cats.forEach(function (cat) {
      var names = [cat.key.replace(/_/g, ' '), cat.en, I18N.catName(cat.key)].concat(cat.aliases || []);
      (dicts || []).forEach(function (d) { if (d.cats[cat.key]) names.push(d.cats[cat.key].name); });
      cat.hay = norm(names.join(' | '));
    });
  }

  function applyLanguage() {
    I18N.apply(document);
    setDateFormats();
    $('lang').value = I18N.code;
    map.closePopup();
    if (state.cats.length) {
      buildSearchIndex(state.allDicts);
      renderToday();
      if (state.query) renderResults();
    }
    document.dispatchEvent(new CustomEvent('gtao:lang'));
  }

  function initLanguagePicker() {
    var sel = $('lang');
    I18N.languages.forEach(function (l) {
      var o = document.createElement('option');
      o.value = l.code;
      o.textContent = l.label;
      sel.appendChild(o);
    });
    sel.addEventListener('change', function () {
      STORE.set('lang', sel.value);
      I18N.use(sel.value).then(applyLanguage);
    });
  }

  // ---------------------------------------------------------------------------
  // Backup: export / import every saved setting as a JSON file (no account)
  // ---------------------------------------------------------------------------
  var BACKUP_APP = 'bombxdev-gta-online-map';

  $('exportBtn').addEventListener('click', function () {
    var payload = { app: BACKUP_APP, version: 1, exported_at: new Date().toISOString(), data: STORE.all() };
    var blob = new Blob([JSON.stringify(payload, null, 1)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gta-online-map-backup-' + payload.exported_at.slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast(t('export.done'));
  });

  $('importBtn').addEventListener('click', function () { $('importFile').click(); });
  $('importFile').addEventListener('change', function (e) {
    var file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    file.text().then(function (text) {
      var b = JSON.parse(text);
      if (!b || b.app !== BACKUP_APP || typeof b.data !== 'object' || b.data === null) throw new Error('invalid');
      var collected = Array.isArray(b.data.collected) ? b.data.collected.length : 0;
      var date = b.exported_at ? dateFmt.format(new Date(b.exported_at)) : '?';
      if (!confirm(t('import.confirm', { date: date, n: collected }))) return;
      STORE.replaceAll(b.data);
      try { sessionStorage.setItem(PREFIX + 'imported', '1'); } catch (err) { /* ignore */ }
      location.reload();
    }).catch(function () { toast(t('import.invalid')); });
  });

  // Ghosts Exposed has one location set per year; a tunable switches the
  // live one on. Without tunables, assume the newest set.
  var GHOST_TUNABLE = { '2023': 'GHOSTS_SET_2023', '2024': 'GHOSTS_SET_2024', '2025': 'GHOSTS_SET_2025', '2026': 'GHOSTS_SET_2026' };
  function pickGhostSet() {
    var keys = Object.keys(state.ghostData.sets).sort();
    var vals = state.tunables && state.tunables.values;
    if (vals) {
      var on = keys.filter(function (k) { var v = vals[GHOST_TUNABLE[k]]; return v === true || v === 1; });
      if (on.length) return on[on.length - 1];
    }
    return keys[keys.length - 1];
  }
  function setGhostSet(key) {
    var cat = state.catByKey.ghosts;
    var set = state.ghostData.sets[key];
    var items = [], seq = 0;
    set.ghosts.forEach(function (g) {
      g.spots.forEach(function (p, si) {
        seq++;
        var gz = ((state.zones.ghosts || {})[key] || [])[g.n - 1] || [];
        items.push({ cat: 'ghosts', n: seq, num: g.n, label: '#' + g.n + (g.spots.length > 1 ? 'AB'[si] : ''), ghost: g, x: p[0], y: p[1], z: p[2], zone: gz[si] || '' });
      });
    });
    state.items = state.items.filter(function (it) { return it.cat !== 'ghosts'; }).concat(items);
    cat.items = items;
    state.ghostSet = set;
    state.ghostSetKey = key;
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------
  Promise.all([
    I18N.init().then(function () { return I18N.use(I18N.detect(STORE.get('lang', null))); }),
    fetch('data/categories.json?v=' + window.APP_VERSION).then(function (r) { return r.json(); }),
    fetch('data/points.json?v=' + window.APP_VERSION).then(function (r) { return r.json(); }),
    fetch('data/daily.json?v=' + window.APP_VERSION).then(function (r) { return r.json(); }),
    fetch('data/info.json?v=' + window.APP_VERSION).then(function (r) { return r.json(); }),
    fetch('data/ghosts.json?v=' + window.APP_VERSION).then(function (r) { return r.json(); }),
    fetch('data/zones.json?v=' + window.APP_VERSION).then(function (r) { return r.json(); }),
    fetch('data/zone_shapes.json?v=' + window.APP_VERSION).then(function (r) { return r.json(); })
  ]).then(function (res) {
    var cats = res[1], points = res[2];
    state.daily = res[3];
    state.info = res[4];
    state.ghostData = res[5];
    state.zones = res[6];
    buildZones(res[7]);
    setZonesOpacity(STORE.get('zonesOpacity', 35));
    setZonesVisible(STORE.get('zonesOn', false));
    $('zonesOn').addEventListener('change', function (e) { setZonesVisible(e.target.checked); });
    $('zonesOpacity').addEventListener('input', function (e) { setZonesOpacity(Number(e.target.value)); });
    state.daily.dealerXY = points.street_dealers;
    var savedVisible = STORE.get('visible', null);
    cats.forEach(function (cat) {
      cat.items = cat.key === 'ghosts' ? [] : (points[cat.key] || []).map(function (p, i) {
        return { cat: cat.key, n: i + 1, x: p[0], y: p[1], z: p[2], zone: (state.zones[cat.key] || [])[i] || zoneNameAt(p[0], p[1]) };
      });
      state.catByKey[cat.key] = cat;
      state.items = state.items.concat(cat.items);
      state.visible[cat.key] = savedVisible && cat.key in savedVisible ? savedVisible[cat.key] : cat.group !== 'event' && !cat.hidden;
    });
    state.cats = cats;
    setGhostSet(pickGhostSet());
    initLanguagePicker();
    buildMarkers();
    applyLanguage();
    renderClock();
    openFromHash();
    loadTunables().then(function () {
      var key = pickGhostSet();
      if (key !== state.ghostSetKey) {
        state.catByKey.ghosts.items.forEach(function (it) { markerLayer.removeLayer(it.marker); });
        setGhostSet(key);
        buildMarkers(state.catByKey.ghosts.items);
        buildSearchIndex(state.allDicts);
      }
      renderToday();
    });
    I18N.loadAll().then(function (dicts) { state.allDicts = dicts; buildSearchIndex(dicts); });
    try {
      if (sessionStorage.getItem(PREFIX + 'imported')) {
        sessionStorage.removeItem(PREFIX + 'imported');
        toast(t('import.done'));
      }
    } catch (e) { /* ignore */ }
    window.GTAOMap.ready = true;   // for scripts that load after this point
    document.dispatchEvent(new CustomEvent('gtao:ready'));
  }).catch(function (err) {
    console.error(err);
    toast(t('toast.loadError'));
  });

  // Small API for planner.js and exports.js.
  window.GTAOMap = {
    state: state, store: STORE, idOf: idOf, itemLabel: itemLabel, blipImg: blipImg, esc: esc, norm: norm,
    money: function (n) { return money(n); }, num: function (n) { return num(n); },
    showItemsOnMap: showItemsOnMap, showPanel: showPanel, setSidebar: function (open) { setSidebar(open); },
    focusItem: function (item) { focusItem(item); }, isMobile: function () { return isMobile(); },
    dayFmt: function () { return dayFmt; },
    popupExtra: POPUP_EXTRA, searchExtra: SEARCH_EXTRA, popupAll: POPUP_ALL, toast: function (m) { toast(m); },
    findItem: function (id) { return state.items.find(function (it) { return idOf(it) === id; }); },
    refreshPopup: function (item) {
      if (!item || !item.marker || !item.marker.isPopupOpen()) return;
      item.marker.setPopupContent(popupHtml(item));
      attachMini(item, item.marker.getPopup().getElement());
    }
  };
})();
