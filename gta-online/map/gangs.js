// Gang areas: pick gangs to highlight their (approximate) areas on the map,
// with a card per gang (in-game picture + emblem) next to the map.
// Areas are game zones from data/gangs.json, drawn with the zone boxes.
(function () {
  'use strict';

  var M, t = I18N.t, data = null;
  var layers = {}, selected = [];

  function esc(s) { return M.esc(s); }
  function $(id) { return document.getElementById(id); }

  // Emblem: our own badge in the gang's colour (no official logos are available).
  function emblem(g, size) {
    var id = 'em-' + g.key + '-' + size;
    var fs = g.short.length > 3 ? 7.5 : g.short.length > 2 ? 9 : g.short.length > 1 ? 11 : 15;
    return '<svg class="gang-emblem" width="' + size + '" height="' + size + '" viewBox="0 0 40 40" aria-hidden="true">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + g.color + '"/>' +
      '<stop offset="1" stop-color="#111318"/></linearGradient></defs>' +
      '<path d="M20 2 L36 8 V19 C36 29 29 35 20 38 C11 35 4 29 4 19 V8 Z" fill="url(#' + id + ')" stroke="' + g.color + '" stroke-width="2"/>' +
      '<path d="M20 6 L32 10.5 V19 C32 26.5 27 31 20 33.6 C13 31 8 26.5 8 19 V10.5 Z" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1"/>' +
      '<text x="20" y="23" text-anchor="middle" dominant-baseline="middle" font-family="Impact, Haettenschweiler, Arial Black, sans-serif" font-size="' + fs +
      '" fill="#fff" letter-spacing=".5">' + esc(g.short) + '</text></svg>';
  }

  function zonesOf(g) {
    var zs = M.zoneShapes();
    return zs ? zs.zones.map(function (z, i) { return { z: z, i: i }; }).filter(function (o) { return g.zones.indexOf(o.z.id) !== -1; }) : [];
  }

  function build(g) {
    var map = M.map, zs = M.zoneShapes();
    var pane = map.createPane('gang-' + g.key);
    pane.style.zIndex = 360;
    pane.style.opacity = 0.42;
    pane.style.pointerEvents = 'none';
    var group = L.layerGroup();
    var idx = zonesOf(g).map(function (o) { return o.i; });
    var bounds = L.latLngBounds([]);
    zs.boxes.forEach(function (b) {
      if (idx.indexOf(b[0]) === -1) return;
      var r = [[b[2], b[1]], [b[4], b[3]]];
      bounds.extend(r);
      L.rectangle(r, { pane: 'gang-' + g.key, stroke: false, fillColor: g.color, fillOpacity: 1, interactive: false }).addTo(group);
    });
    zonesOf(g).forEach(function (o) {
      if (!o.z.label) return;
      L.marker([o.z.label[1], o.z.label[0]], {
        pane: 'zoneLabels', interactive: false, keyboard: false,
        icon: L.divIcon({ className: 'gang-mark', html: emblem(g, 34), iconSize: [34, 34], iconAnchor: [17, 17] })
      }).addTo(group);
    });
    layers[g.key] = { group: group, bounds: bounds };
  }

  function setSelected(list) {
    selected = list;
    M.store.set('gangs', selected);
    data.gangs.forEach(function (g) {
      var on = selected.indexOf(g.key) !== -1;
      if (!layers[g.key]) build(g);
      if (on && !M.map.hasLayer(layers[g.key].group)) layers[g.key].group.addTo(M.map);
      if (!on && M.map.hasLayer(layers[g.key].group)) M.map.removeLayer(layers[g.key].group);
    });
    renderPanel();
    renderCards();
  }
  function toggle(key) {
    var i = selected.indexOf(key);
    var next = selected.slice();
    if (i === -1) next.push(key); else next.splice(i, 1);
    setSelected(next);
    if (i === -1) focus(key);
  }
  function focus(key) {
    var l = layers[key];
    if (l && l.bounds.isValid()) M.map.flyToBounds(l.bounds.pad(0.25), { maxZoom: 5, duration: 0.6 });
  }

  // Sidebar: a chip per gang.
  function renderPanel() {
    var box = $('gangPanel');
    if (!box) {
      box = document.createElement('section');
      box.id = 'gangPanel';
      box.className = 'gang-panel';
      document.querySelector('#sidebar .zones-ctl').insertAdjacentElement('afterend', box);
    }
    box.innerHTML = '<div class="gang-head">🔫 <span>' + esc(t('gang.title')) + '</span></div><div class="gang-chips"></div>';
    var chips = box.querySelector('.gang-chips');
    data.gangs.forEach(function (g) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'gang-chip' + (selected.indexOf(g.key) !== -1 ? ' on' : '');
      b.style.setProperty('--g', g.color);
      b.setAttribute('aria-pressed', selected.indexOf(g.key) !== -1 ? 'true' : 'false');
      b.innerHTML = emblem(g, 22) + '<span>' + esc(g.name) + '</span>';
      b.addEventListener('click', function () { toggle(g.key); });
      chips.appendChild(b);
    });
  }

  // Cards beside the map for the highlighted gangs.
  function renderCards() {
    var wrap = $('gangCards');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'gangCards';
      wrap.className = 'gang-cards';
      $('mapWrap').appendChild(wrap);
      L.DomEvent.disableClickPropagation(wrap);
      L.DomEvent.disableScrollPropagation(wrap);
    }
    var list = data.gangs.filter(function (g) { return selected.indexOf(g.key) !== -1; });
    wrap.hidden = !list.length;
    wrap.innerHTML = list.length ? '<div class="gang-note">' + esc(t('gang.hint')) + '</div>' : '';
    list.forEach(function (g) {
      var areas = zonesOf(g).map(function (o) { return o.z.name; }).join(', ');
      var c = document.createElement('div');
      c.className = 'gang-card';
      c.style.setProperty('--g', g.color);
      c.innerHTML = '<img class="gang-ped" src="gangs/' + g.ped + '.webp?v=' + window.APP_VERSION + '" alt="" loading="lazy">' +
        '<div class="gang-info">' + emblem(g, 40) + '<div class="gang-name">' + esc(g.name) + '</div>' +
        '<div class="gang-areas">📍 ' + esc(areas) + '</div>' +
        '<div class="gang-btns"><button type="button" data-go>🎯 ' + esc(t('gang.show')) + '</button>' +
        '<button type="button" data-x aria-label="' + esc(t('plan.close')) + '">✕</button></div></div>';
      c.querySelector('[data-go]').addEventListener('click', function () { focus(g.key); });
      c.querySelector('[data-x]').addEventListener('click', function () { toggle(g.key); });
      wrap.appendChild(c);
    });
  }

  function onReady(fn) {
    if (window.GTAOMap && window.GTAOMap.ready) fn();
    else document.addEventListener('gtao:ready', fn, { once: true });
  }
  onReady(function () {
    M = window.GTAOMap;
    fetch('data/gangs.json?v=' + window.APP_VERSION).then(function (r) { return r.json(); }).then(function (d) {
      data = d;
      var saved = M.store.get('gangs', []);
      setSelected(Array.isArray(saved) ? saved.filter(function (k) { return d.gangs.some(function (g) { return g.key === k; }); }) : []);
    }).catch(function (err) { console.error('gangs', err); });
  });
  document.addEventListener('gtao:lang', function () { if (data) { renderPanel(); renderCards(); } });
})();
