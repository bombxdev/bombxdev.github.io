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
  var CAYO_BOUNDS = L.latLngBounds([[-6000, 3700], [-4100, 5800]]);

  var STYLES = {
    atlas: { name: 'Atlas', bg: '#0fa8d2' },
    road: { name: 'Road', bg: '#1862ad' },
    satellite: { name: 'Satellite', bg: '#143d6b' }
  };
  var GROUPS = ['permanent', 'daily', 'event'];
  var t = I18N.t;
  var LINKS = {
    rdo: '<a href="https://tunables.rdo.gg" target="_blank" rel="noopener">rdo.gg</a>',
    bot: '<a href="https://github.com/ShinyWasabi/GTAO-Bot" target="_blank" rel="noopener">GTAO-Bot</a>',
    scripts: '<a href="https://github.com/Sainan/GTA-V-Decompiled-Scripts" target="_blank" rel="noopener">decompiled scripts</a>',
    tiles: '<a href="https://github.com/CreepPork/GTAV-Maps" target="_blank" rel="noopener">CreepPork/GTAV-Maps</a>',
    blips: '<a href="https://docs.fivem.net/docs/game-references/blips/" target="_blank" rel="noopener">FiveM docs</a>',
    leaflet: '<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>'
  };

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
    todaySets: {}
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

  var baseLayers = {};
  Object.keys(STYLES).forEach(function (key) {
    baseLayers[STYLES[key].name] = L.tileLayer('tiles/' + key + '/{z}/{x}_{y}.webp', {
      minZoom: 2,
      maxZoom: 9,
      maxNativeZoom: 7,
      bounds: TILE_BOUNDS,
      noWrap: true,
      attribution: 'Map: <a href="https://github.com/CreepPork/GTAV-Maps" target="_blank" rel="noopener">GTAV-Maps</a>'
    }).on('add', function () {
      $('map').style.background = STYLES[key].bg;
      STORE.set('style', key);
    });
  });
  var startStyle = STYLES[STORE.get('style', 'atlas')] ? STORE.get('style', 'atlas') : 'atlas';
  baseLayers[STYLES[startStyle].name].addTo(map);
  L.control.layers(baseLayers, null, { position: 'topright' }).addTo(map);

  map.fitBounds(L.latLngBounds([[-3800, -3600], [7700, 4300]]));

  // Cayo Perico is not part of the tile set; mark the area so its pins make sense.
  L.rectangle(CAYO_BOUNDS, { color: '#fff', weight: 2, opacity: 0.7, dashArray: '8 10', fillOpacity: 0.06, interactive: false }).addTo(map);
  var cayoLabel = L.marker([-4180, 4750], { interactive: false }).addTo(map);
  function renderCayoLabel() {
    cayoLabel.setIcon(L.divIcon({ className: 'cayo-label', html: 'Cayo Perico<small>' + esc(t('cayo.note')) + '</small>', iconSize: [220, 34], iconAnchor: [110, 0] }));
  }

  function updateZoomClass() {
    var z = map.getZoom(), c = map.getContainer().classList;
    c.toggle('zoom-far', z < 4);
    c.toggle('zoom-mid', z >= 4 && z < 5);
  }
  map.on('zoomend', updateZoomClass);
  updateZoomClass();

  var markerLayer = L.layerGroup().addTo(map);
  var tempLayer = L.layerGroup().addTo(map);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function idOf(item) { return item.cat + '-' + item.n; }
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

  function popupHtml(item) {
    var cat = state.catByKey[item.cat];
    var done = state.collected.has(idOf(item));
    var name = I18N.catName(cat.key), note = I18N.catNote(cat.key);
    return '<div class="pop">' +
      '<h3><span class="pop-blip" style="--c:' + cat.color + '">' + blipImg(cat) + '</span>' + esc(name) + ' #' + item.n + '</h3>' +
      '<div class="sub">' + (name !== cat.en ? esc(cat.en) + ' · ' : '') + esc(t('group.' + cat.group)) +
      (state.todaySets[item.cat] && state.todaySets[item.cat].has(item.n) ? '<span class="today-badge">' + esc(t('pop.selectedDay')) + '</span>' : '') + '</div>' +
      (note ? '<div class="note">' + esc(note) + '</div>' : '') +
      '<div>' + esc(t('pop.coords')) + ': <code>' + coordText(item.x, item.y, item.z) + '</code></div>' +
      '<div class="actions">' +
      (item.cat === 'gun_van' ? '' : '<button class="chip primary" data-act="toggle">' + esc(t(done ? 'pop.markUndone' : 'pop.markDone')) + '</button>') +
      '<button class="chip" data-act="copy">' + esc(t('pop.copyCoords')) + '</button>' +
      '<button class="chip" data-act="link">' + esc(t('pop.copyLink')) + '</button>' +
      '</div></div>';
  }

  function buildMarkers() {
    state.items.forEach(function (item) {
      item.marker = L.marker([item.y, item.x], { icon: makeIcon(item), title: state.catByKey[item.cat].en + ' #' + item.n, riseOnHover: true });
      item.marker.bindPopup(function () { return popupHtml(item); }, { autoPanPadding: [40, 40] });
      item.marker.on('popupopen', function () {
        setActive(item);
        history.replaceState(null, '', '#' + idOf(item));
      });
      item.marker.on('popupclose', function () {
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

  function renderCategories() {
    var host = $('categories');
    host.innerHTML = '';
    GROUPS.forEach(function (g) {
      var cats = state.cats.filter(function (c) { return c.group === g; });
      if (!cats.length) return;
      var title = document.createElement('div');
      title.className = 'group-title';
      title.textContent = t('group.' + g);
      host.appendChild(title);
      cats.forEach(function (cat) {
        var total = cat.items.length;
        var got = cat.items.filter(function (it) { return state.collected.has(idOf(it)); }).length;
        var row = document.createElement('label');
        row.className = 'cat' + (state.visible[cat.key] ? ' on' : '');
        row.style.setProperty('--c', cat.color);
        var name = I18N.catName(cat.key);
        row.title = I18N.catNote(cat.key);
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
        host.appendChild(row);
      });
    });
  }

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
      if (nums.length && nums.indexOf(item.n) === -1) return false;
      var hay = state.catByKey[item.cat].hay;
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
    state.matches = new Set(found);
    refreshMarkers();
    var shown = found.slice(0, 300);
    box.innerHTML = '<div class="summary">' + esc(t('search.found', { n: found.length }) +
      (found.length > shown.length ? t('search.showingFirst', { n: shown.length }) : '') +
      (found.length ? t('search.mapFiltered') : '')) + '</div>';
    shown.forEach(function (item) {
      var cat = state.catByKey[item.cat];
      var b = document.createElement('button');
      b.className = 'result' + (state.collected.has(idOf(item)) ? ' done' : '');
      var name = I18N.catName(cat.key);
      b.innerHTML = '<span class="res-blip" style="--c:' + cat.color + '">' + blipImg(cat) + '</span><span><div class="name">' + esc(name) + ' #' + item.n +
        '</div><div class="meta">' + (name !== cat.en ? esc(cat.en) + ' · ' : '') + coordText(item.x, item.y) + '</div></span>';
      b.addEventListener('click', function () { focusItem(item); });
      box.appendChild(b);
    });
    if (found.length && found.length <= 300) {
      map.flyToBounds(L.latLngBounds(found.map(function (it) { return [it.y, it.x]; })).pad(0.15), { maxZoom: 6, duration: 0.6 });
    }
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
    $('cursor').textContent = 'X ' + fmt(e.latlng.lng) + '  Y ' + fmt(e.latlng.lat);
  });
  map.on('mouseout', function () { $('cursor').textContent = ''; });
  map.on('contextmenu', function (e) {
    var c = coordText(e.latlng.lng, e.latlng.lat);
    L.popup().setLatLng(e.latlng)
      .setContent('<div class="pop"><h3>📍 ' + esc(t('pop.gameCoords')) + '</h3><code>' + c + '</code><div class="actions"><button class="chip" data-copy="' + c + '">' + esc(t('pop.copy')) + '</button></div></div>')
      .openOn(map);
  });
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
      if (item.marker.isPopupOpen()) item.marker.setPopupContent(popupHtml(item));
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
  var TODAY_ORDER = ['gun_van', 'shipwrecks', 'treasure_chests', 'buried_stashes', 'hidden_caches', 'skydives', 'ls_tags', 'weed_packages'];
  var EVENT_ONLY = { weed_packages: true };
  var dateFmt, dayFmt;
  function setDateFormats() {
    dateFmt = new Intl.DateTimeFormat(I18N.code, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    dayFmt = new Intl.DateTimeFormat(I18N.code, { weekday: 'short', day: 'numeric', month: 'short' });
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
        b.textContent = '#' + item.n;
        if (state.collected.has(idOf(item))) b.className = 'done';
        b.title = I18N.catName(key) + ' #' + item.n + ' (' + coordText(item.x, item.y) + ')';
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
  }

  $('todayOnly').checked = state.todayOnly;
  $('todayOnly').addEventListener('change', function (e) { setTodayOnly(e.target.checked); });
  $('dayPrev').addEventListener('click', function () { state.dayOffset--; renderToday(); });
  $('dayNext').addEventListener('click', function () { state.dayOffset++; renderToday(); });
  $('dayLabel').addEventListener('click', function () { state.dayOffset = 0; renderToday(); });
  setInterval(renderToday, 30000);

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
    I18N.apply(document, LINKS);
    setDateFormats();
    renderCayoLabel();
    $('lang').value = I18N.code;
    map.closePopup();
    if (state.cats.length) {
      buildSearchIndex(state.allDicts);
      renderToday();
      if (state.query) renderResults();
    }
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

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------
  Promise.all([
    I18N.init().then(function () { return I18N.use(I18N.detect(STORE.get('lang', null))); }),
    fetch('data/categories.json').then(function (r) { return r.json(); }),
    fetch('data/points.json').then(function (r) { return r.json(); }),
    fetch('data/daily.json').then(function (r) { return r.json(); })
  ]).then(function (res) {
    var cats = res[1], points = res[2];
    state.daily = res[3];
    var savedVisible = STORE.get('visible', null);
    cats.forEach(function (cat) {
      cat.items = (points[cat.key] || []).map(function (p, i) {
        return { cat: cat.key, n: i + 1, x: p[0], y: p[1], z: p[2] };
      });
      state.catByKey[cat.key] = cat;
      state.items = state.items.concat(cat.items);
      state.visible[cat.key] = savedVisible && cat.key in savedVisible ? savedVisible[cat.key] : cat.group !== 'event';
    });
    state.cats = cats;
    initLanguagePicker();
    buildMarkers();
    applyLanguage();
    openFromHash();
    loadTunables().then(renderToday);
    I18N.loadAll().then(function (dicts) { state.allDicts = dicts; buildSearchIndex(dicts); });
    try {
      if (sessionStorage.getItem(PREFIX + 'imported')) {
        sessionStorage.removeItem(PREFIX + 'imported');
        toast(t('import.done'));
      }
    } catch (e) { /* ignore */ }
  }).catch(function (err) {
    console.error(err);
    toast(t('toast.loadError'));
  });
})();
