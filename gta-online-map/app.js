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
  var GROUPS = { permanent: 'ถาวร', daily: 'รายวัน', event: 'อีเวนต์ตามเทศกาล' };

  var STORE = {
    get: function (k, d) {
      try { var v = localStorage.getItem('gtaomap.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set: function (k, v) {
      try { localStorage.setItem('gtaomap.' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ }
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
    active: null
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
  L.marker([-4180, 4750], {
    interactive: false,
    icon: L.divIcon({ className: 'cayo-label', html: 'Cayo Perico<small>(ไม่มีภาพแผนที่เกาะ)</small>', iconSize: [200, 34], iconAnchor: [100, 0] })
  }).addTo(map);

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
    var done = function () { toast('คัดลอกแล้ว: ' + text); };
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
      html: '<div class="' + cls + '" style="--c:' + cat.color + '">' + cat.glyph + '</div>',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -12]
    });
  }

  function popupHtml(item) {
    var cat = state.catByKey[item.cat];
    var done = state.collected.has(idOf(item));
    return '<div class="pop">' +
      '<h3>' + cat.glyph + ' ' + esc(cat.en) + ' #' + item.n + '</h3>' +
      '<div class="sub">' + esc(cat.th) + ' · ' + GROUPS[cat.group] + '</div>' +
      (cat.note ? '<div class="note">' + esc(cat.note) + '</div>' : '') +
      '<div>พิกัด: <code>' + coordText(item.x, item.y, item.z) + '</code></div>' +
      '<div class="actions">' +
      '<button class="chip primary" data-act="toggle">' + (done ? '↩︎ ยังไม่ได้เก็บ' : '✔ เก็บแล้ว') + '</button>' +
      '<button class="chip" data-act="copy">คัดลอกพิกัด</button>' +
      '<button class="chip" data-act="link">คัดลอกลิงก์</button>' +
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
    map.flyTo([item.y, item.x], Math.max(map.getZoom(), 6), { duration: 0.6 });
    map.once('moveend', function () { item.marker.openPopup(); });
    if (window.matchMedia('(max-width: 760px)').matches) $('sidebar').classList.remove('open');
  }

  // ---------------------------------------------------------------------------
  // Sidebar: categories
  // ---------------------------------------------------------------------------
  function saveVisible() { STORE.set('visible', state.visible); }

  function renderCategories() {
    var host = $('categories');
    host.innerHTML = '';
    Object.keys(GROUPS).forEach(function (g) {
      var cats = state.cats.filter(function (c) { return c.group === g; });
      if (!cats.length) return;
      var title = document.createElement('div');
      title.className = 'group-title';
      title.textContent = GROUPS[g];
      host.appendChild(title);
      cats.forEach(function (cat) {
        var total = cat.items.length;
        var got = cat.items.filter(function (it) { return state.collected.has(idOf(it)); }).length;
        var row = document.createElement('label');
        row.className = 'cat' + (state.visible[cat.key] ? ' on' : '');
        row.style.setProperty('--c', cat.color);
        row.title = cat.note || '';
        row.innerHTML =
          '<input type="checkbox"' + (state.visible[cat.key] ? ' checked' : '') + '>' +
          '<span class="dot">' + cat.glyph + '</span>' +
          '<span class="label"><div class="th">' + esc(cat.th) + '</div><div class="en">' + esc(cat.en) + '</div></span>' +
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
      box.innerHTML = '<div class="summary">ไปยังพิกัดในเกม</div>';
      var btn = document.createElement('button');
      btn.className = 'result';
      btn.innerHTML = '<span>📍</span><span><div class="name">X ' + fmt(x) + ', Y ' + fmt(y) + '</div><div class="meta">คลิกเพื่อไปยังจุดนี้</div></span>';
      btn.addEventListener('click', function () { gotoCoord(x, y); });
      box.appendChild(btn);
      return;
    }
    var found = searchItems(q);
    state.matches = new Set(found);
    refreshMarkers();
    var shown = found.slice(0, 300);
    box.innerHTML = '<div class="summary">พบ ' + found.length + ' รายการ' +
      (found.length > shown.length ? ' (แสดง ' + shown.length + ' รายการแรก)' : '') +
      (found.length ? ' · แผนที่แสดงเฉพาะผลค้นหา' : '') + '</div>';
    shown.forEach(function (item) {
      var cat = state.catByKey[item.cat];
      var b = document.createElement('button');
      b.className = 'result' + (state.collected.has(idOf(item)) ? ' done' : '');
      b.innerHTML = '<span>' + cat.glyph + '</span><span><div class="name">' + esc(cat.en) + ' #' + item.n +
        '</div><div class="meta">' + esc(cat.th) + ' · ' + coordText(item.x, item.y) + '</div></span>';
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
    m.bindPopup('<div class="pop"><h3>📍 พิกัด</h3><code>' + coordText(x, y) + '</code></div>').openPopup();
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
  $('openSidebar').addEventListener('click', function () { $('sidebar').classList.add('open'); });
  $('closeSidebar').addEventListener('click', function () { $('sidebar').classList.remove('open'); });

  map.on('mousemove', function (e) {
    $('cursor').textContent = 'X ' + fmt(e.latlng.lng) + '  Y ' + fmt(e.latlng.lat);
  });
  map.on('mouseout', function () { $('cursor').textContent = ''; });
  map.on('contextmenu', function (e) {
    var t = coordText(e.latlng.lng, e.latlng.lat);
    L.popup().setLatLng(e.latlng)
      .setContent('<div class="pop"><h3>📍 พิกัดในเกม</h3><code>' + t + '</code><div class="actions"><button class="chip" data-copy="' + t + '">คัดลอก</button></div></div>')
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
  // Boot
  // ---------------------------------------------------------------------------
  Promise.all([
    fetch('data/categories.json').then(function (r) { return r.json(); }),
    fetch('data/points.json').then(function (r) { return r.json(); })
  ]).then(function (res) {
    var cats = res[0], points = res[1];
    var savedVisible = STORE.get('visible', null);
    cats.forEach(function (cat) {
      cat.items = (points[cat.key] || []).map(function (p, i) {
        return { cat: cat.key, n: i + 1, x: p[0], y: p[1], z: p[2] };
      });
      cat.hay = norm([cat.key.replace(/_/g, ' '), cat.en, cat.th].concat(cat.aliases || []).join(' | '));
      state.catByKey[cat.key] = cat;
      state.items = state.items.concat(cat.items);
      state.visible[cat.key] = savedVisible && cat.key in savedVisible ? savedVisible[cat.key] : cat.group !== 'event';
    });
    state.cats = cats;
    buildMarkers();
    renderCategories();
    refreshMarkers();
    openFromHash();
  }).catch(function (err) {
    console.error(err);
    toast('โหลดข้อมูลไม่สำเร็จ');
  });
})();
