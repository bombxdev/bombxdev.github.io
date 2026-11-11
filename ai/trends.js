// GitHub Star Trends: which repos are the most starred, as a line chart.
//
// Data: stars.json on the `stars-data` branch, refreshed hourly by
// .github/workflows/star-trends.yml (ai/tools/fetch_stars.mjs). On top of
// that, today's counts are topped up live from the GitHub search API.
// Drawn as plain SVG (no chart library, nothing loaded from elsewhere).
//
// Used on /ai/ (mounted into #trends) and standalone in trends.html, which is
// the page the "Copy iframe" code points at. The filters live in the URL:
//   ?mode=date&d=YYYY-MM-DD | mode=month&m=YYYY-MM | mode=year&y=YYYY |
//   mode=range&from=YYYY-MM-DD&to=YYYY-MM-DD, plus &top=10|20|30 and
//   &metric=total|gain (stars at the end date, or stars gained in the period).
(function () {
  'use strict';

  var OWNER = 'bombxdev', REPO = 'bombxdev.github.io';
  var DATA_URL = 'https://raw.githubusercontent.com/' + OWNER + '/' + REPO + '/stars-data/stars.json';
  var EMBED_URL = 'https://' + OWNER + '.github.io/ai/trends.html';
  var LIVE_KEY = 'trends.live';
  var DAY = 864e5;
  var PALETTE = ['#1f6feb', '#a0785a', '#e3b505', '#2fb34a', '#d93a49', '#7b52d9', '#3aa0e8', '#b04fc9', '#ff8c00', '#17a2b8',
    '#e83e8c', '#5c6bc0', '#20c997', '#c0392b', '#34495e', '#f39c12', '#16a085', '#d35400', '#7f8c8d', '#9b59b6',
    '#27ae60', '#0057b8', '#b8860b', '#ff5e5b', '#00897b', '#ad1457', '#6d4c41', '#43a047', '#1e88e5', '#8d6e63'];
  var MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  var MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  var SVGNS = 'http://www.w3.org/2000/svg';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function num(s) { return Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / DAY; }
  function str(n) { return new Date(n * DAY).toISOString().slice(0, 10); }
  function todayNum() { var d = new Date(); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY; }
  function validDay(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !isNaN(num(s)); }
  function fmt(v) {
    var a = Math.abs(v);
    if (a >= 1e6) return (v / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
    if (a >= 1e3) return (v / 1e3).toFixed(a >= 1e4 ? 0 : 1).replace(/\.0$/, '') + 'K';
    return String(Math.round(v));
  }
  function thaiDate(n) { var d = new Date(n * DAY); return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); }
  function shortDate(n) { var d = new Date(n * DAY); return d.getUTCDate() + ' ' + MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); }

  // ---------------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------------
  var repos = [];          // [{ name, short, avatar, desc, bf, color, pts: [{x, v, e}] }]
  var updated = '';
  var loadState = 'loading';

  function load() {
    return fetch(DATA_URL, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(r.status === 404 ? 'nodata' : 'HTTP ' + r.status);
      return r.json();
    }).then(function (j) {
      updated = j.updated || '';
      repos = Object.keys(j.repos || {}).map(function (k) {
        var r = j.repos[k];
        return {
          name: k, short: k.split('/')[1], avatar: r.avatar || '', desc: r.desc || '', bf: !!r.bf, stars: r.stars || 0,
          pts: (r.pts || []).filter(function (p) { return validDay(p[0]); })
            .map(function (p) { return { x: num(p[0]), v: +p[1] || 0, e: !!p[2] }; })
            .sort(function (a, b) { return a.x - b.x; })
        };
      }).filter(function (r) { return r.pts.length; });
      repos.sort(function (a, b) { return b.stars - a.stars; });
      repos.forEach(function (r, i) { r.color = PALETTE[i % PALETTE.length]; });
      loadState = repos.length ? 'ok' : 'nodata';
    }).catch(function (e) { loadState = e.message === 'nodata' ? 'nodata' : 'error'; });
  }

  // Live top-up: current counts for the repos on screen, via the search API
  // (one request per ~8 repos, cached for 10 minutes in this tab).
  function live(names) {
    var cache = null;
    try { cache = JSON.parse(sessionStorage.getItem(LIVE_KEY) || 'null'); } catch (e) { cache = null; }
    if (cache && Date.now() - cache.t < 6e5 && names.every(function (n) { return n in cache.v; })) return Promise.resolve(cache.v);
    var chunks = [], cur = '';
    names.forEach(function (n) {
      var term = 'repo:' + n;
      if (cur && (cur + ' ' + term).length > 240) { chunks.push(cur); cur = ''; }
      cur = cur ? cur + ' ' + term : term;
    });
    if (cur) chunks.push(cur);
    var out = {};
    return Promise.all(chunks.map(function (q) {
      return fetch('https://api.github.com/search/repositories?per_page=100&q=' + encodeURIComponent(q))
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { (j && j.items || []).forEach(function (i) { out[i.full_name] = i.stargazers_count; }); })
        .catch(function () { /* rate limited / offline: keep the hourly data */ });
    })).then(function () {
      try { sessionStorage.setItem(LIVE_KEY, JSON.stringify({ t: Date.now(), v: out })); } catch (e) { /* ignore */ }
      return out;
    });
  }
  function applyLive(v) {
    var t = todayNum(), n = 0;
    repos.forEach(function (r) {
      if (!(r.name in v)) return;
      var last = r.pts[r.pts.length - 1];
      if (last.x === t) last.v = v[r.name];
      else if (last.x < t) r.pts.push({ x: t, v: v[r.name], e: false });
      n++;
    });
    return n;
  }

  // value at day x (linear between points). Before the first point: 0 when the
  // history is back-filled (no stars yet), unknown otherwise.
  function valueAt(r, x) {
    var p = r.pts;
    if (x < p[0].x) return r.bf ? 0 : null;
    if (x >= p[p.length - 1].x) return p[p.length - 1].v;
    for (var i = 1; i < p.length; i++) {
      if (x <= p[i].x) {
        var a = p[i - 1], b = p[i];
        return a.v + (b.v - a.v) * (x - a.x) / (b.x - a.x);
      }
    }
    return p[p.length - 1].v;
  }
  function estAt(r, x) {   // is the segment containing day x an estimate?
    for (var i = 1; i < r.pts.length; i++) if (x <= r.pts[i].x) return r.pts[i].e;
    return false;
  }

  // ---------------------------------------------------------------------------
  // Filters (kept in the URL so an iframe shows the same thing)
  // ---------------------------------------------------------------------------
  function readState(search) {
    var q = new URLSearchParams(search || '');
    var t = str(todayNum());
    var s = {
      mode: ({ date: 1, month: 1, year: 1, range: 1 })[q.get('mode')] ? q.get('mode') : 'date',
      d: validDay(q.get('d')) ? q.get('d') : '',
      m: /^\d{4}-\d{2}$/.test(q.get('m') || '') ? q.get('m') : t.slice(0, 7),
      y: /^\d{4}$/.test(q.get('y') || '') ? q.get('y') : t.slice(0, 4),
      from: validDay(q.get('from')) ? q.get('from') : str(todayNum() - 30),
      to: validDay(q.get('to')) ? q.get('to') : t,
      top: [10, 20, 30].indexOf(+q.get('top')) >= 0 ? +q.get('top') : 20,
      metric: q.get('metric') === 'total' || q.get('metric') === 'gain' ? q.get('metric') : ''
    };
    return s;
  }
  function stateQuery(s) {
    var q = ['mode=' + s.mode];
    if (s.mode === 'date' && s.d) q.push('d=' + s.d);
    if (s.mode === 'month') q.push('m=' + s.m);
    if (s.mode === 'year') q.push('y=' + s.y);
    if (s.mode === 'range') q.push('from=' + s.from, 'to=' + s.to);
    if (s.top !== 20) q.push('top=' + s.top);
    if (s.mode !== 'date' && s.metric === 'total') q.push('metric=total');
    return '?' + q.join('&');
  }
  function metricOf(s) { return s.mode === 'date' ? 'total' : (s.metric || 'gain'); }

  // { start, end, title, sub, metric } for the current filters
  function period(s) {
    var t = todayNum(), start, end, title, label;
    if (s.mode === 'date') {
      end = s.d ? Math.min(num(s.d), t) : t;
      return { start: null, end: end, title: thaiDate(end), sub: 'จำนวนดาวทั้งหมด ณ วันนี้', metric: 'total' };
    }
    if (s.mode === 'month') {
      var y = +s.m.slice(0, 4), m = +s.m.slice(5, 7) - 1;
      start = Date.UTC(y, m, 1) / DAY; end = Date.UTC(y, m + 1, 0) / DAY;
      title = MONTHS[m] + ' ' + y; label = 'เดือนนี้';
    } else if (s.mode === 'year') {
      start = Date.UTC(+s.y, 0, 1) / DAY; end = Date.UTC(+s.y, 11, 31) / DAY;
      title = 'ปี ' + s.y; label = 'ปีนี้';
    } else {
      start = num(s.from); end = num(s.to);
      if (end < start) { var x = start; start = end; end = x; }
      title = shortDate(start) + ' – ' + shortDate(end); label = 'ช่วงนี้';
    }
    end = Math.min(end, t);
    if (start > end) start = end;
    var metric = metricOf(s);
    return { start: start, end: end, title: title, metric: metric,
      sub: metric === 'gain' ? 'ดาวที่เพิ่มขึ้นใน' + label : 'จำนวนดาวทั้งหมด ณ วันสุดท้ายของ' + label };
  }

  // ---------------------------------------------------------------------------
  // Chart
  // ---------------------------------------------------------------------------
  function el(tag, attrs, parent) {
    var e = document.createElementNS(SVGNS, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(e);
    return e;
  }
  function niceStep(max, ticks) {
    var raw = max / ticks, p = Math.pow(10, Math.floor(Math.log10(raw || 1))), f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  }
  function xTicks(a, b, maxN) {
    var span = b - a, out = [];
    if (span <= 62) {
      var step = [1, 2, 3, 7, 14, 21].filter(function (st) { return span / st <= maxN; })[0] || 21;
      for (var x = a; x <= b; x += step) out.push({ x: x, t: (function (d) { return d.getUTCDate() + ' ' + MON[d.getUTCMonth()]; })(new Date(x * DAY)) });
      return out;
    }
    var months = span / 30.4, ms = [1, 2, 3, 4, 6, 12, 24].filter(function (m) { return months / m <= maxN; })[0] || 24;
    var d = new Date(a * DAY), y = d.getUTCFullYear(), m = d.getUTCMonth() + 1;
    m = Math.ceil(m / ms) * ms;
    for (;;) {
      var x2 = Date.UTC(y, m, 1) / DAY;
      if (x2 > b) break;
      var dd = new Date(x2 * DAY);
      out.push({ x: x2, t: MON[dd.getUTCMonth()] + ' ' + dd.getUTCFullYear() });
      m += ms;
    }
    return out;
  }

  function draw(box, tip, s) {
    var P = period(s);
    var gain = P.metric === 'gain';
    // rank
    var rows = repos.map(function (r) {
      var end = valueAt(r, P.end);
      if (end === null) return null;
      var base = 0;
      if (gain) { base = valueAt(r, P.start - 1); if (base === null) return null; }
      return { r: r, base: base, val: end - base };
    }).filter(function (x) { return x && x.val > 0; });
    rows.sort(function (a, b) { return b.val - a.val; });
    rows = rows.slice(0, s.top);

    var start = P.start;
    if (start === null) {   // "date" mode: from the first star of the oldest repo shown
      start = rows.reduce(function (m, x) { return Math.min(m, x.r.pts[0].x); }, P.end);
      start = Math.max(start, P.end - 365 * 4);
      if (P.end - start < 7) start = P.end - 7;
    }
    if (P.end === start) start = P.end - 1;

    var W = Math.max(320, box.clientWidth || 900);
    var narrow = W < 640;
    var H = Math.round(Math.min(680, Math.max(360, W * (narrow ? 1.05 : 0.6))));
    var M = { l: narrow ? 38 : 52, r: narrow ? 150 : 250, t: 14, b: 30 };
    var pw = W - M.l - M.r, ph = H - M.t - M.b;
    var maxY = rows.reduce(function (m, x) {
      return Math.max(m, x.r.pts.reduce(function (mm, p) { return p.x >= start && p.x <= P.end ? Math.max(mm, p.v - x.base) : mm; }, x.val));
    }, 0) || 10;
    var step = niceStep(maxY, narrow ? 4 : 5);
    var top = Math.ceil(maxY / step) * step;
    var sx = function (x) { return M.l + (x - start) / (P.end - start) * pw; };
    var sy = function (v) { return M.t + ph - Math.max(0, v) / top * ph; };

    box.innerHTML = '';
    tip.hidden = true;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'tr-svg', role: 'img', 'aria-label': 'กราฟดาว GitHub: ' + P.title }, box);
    if (!rows.length) {
      el('text', { x: W / 2, y: H / 2, 'text-anchor': 'middle', class: 'tr-empty' }, svg).textContent = 'ไม่มีข้อมูลในช่วงนี้';
      return { rows: rows, P: P };
    }
    // grid + axes
    var g = el('g', { class: 'tr-grid' }, svg);
    for (var v = 0; v <= top + 1e-9; v += step) {
      el('line', { x1: M.l, x2: M.l + pw, y1: sy(v), y2: sy(v) }, g);
      el('text', { x: M.l - 6, y: sy(v) + 4, 'text-anchor': 'end' }, g).textContent = fmt(v);
    }
    xTicks(start, P.end, Math.max(2, Math.min(7, Math.floor(pw / 85)))).forEach(function (t) {
      var x = sx(t.x);
      el('line', { x1: x, x2: x, y1: M.t + ph, y2: M.t + ph + 4 }, g);
      el('text', { x: x, y: H - 10, 'text-anchor': 'middle' }, g).textContent = t.t;
    });

    // lines (biggest drawn last = on top)
    var lines = el('g', { class: 'tr-lines' }, svg);
    rows.slice().reverse().forEach(function (row) {
      var r = row.r, pts = [], segs = [];
      // pts[i].e: is the segment from pts[i-1] to pts[i] an estimate
      var first = r.bf ? start : Math.max(start, r.pts[0].x);
      if (first <= P.end) {
        pts.push({ x: first, v: valueAt(r, first), e: false });
        r.pts.forEach(function (p) { if (p.x > first && p.x < P.end) pts.push(p); });
        pts.push({ x: P.end, v: valueAt(r, P.end), e: estAt(r, P.end) });
      }
      var xy = function (p) { return sx(p.x).toFixed(1) + ',' + sy(p.v - row.base).toFixed(1); };
      for (var i = 1; i < pts.length; i++) {
        var last = segs[segs.length - 1];
        if (last && last.e === pts[i].e) last.d += 'L' + xy(pts[i]);
        else segs.push({ e: pts[i].e, d: 'M' + xy(pts[i - 1]) + 'L' + xy(pts[i]) });
      }
      var grp = el('g', { class: 'tr-line', 'data-r': r.name, stroke: r.color }, lines);
      segs.forEach(function (sg) { el('path', { d: sg.d, class: sg.e ? 'est' : '' }, grp); });
      el('circle', { cx: sx(P.end), cy: sy(row.val), r: 4.5, fill: r.color }, grp);
    });

    // labels on the right, spread so they do not overlap
    var lh = Math.max(12, Math.min(26, ph / rows.length));
    var ys = rows.map(function (row) { return sy(row.val); });
    var pos = ys.slice();
    for (var i = 1; i < pos.length; i++) pos[i] = Math.max(pos[i], pos[i - 1] + lh);
    var bottom = M.t + ph + 6;
    if (pos[pos.length - 1] > bottom) {
      pos[pos.length - 1] = bottom;
      for (var j = pos.length - 2; j >= 0; j--) pos[j] = Math.min(pos[j], pos[j + 1] - lh);
    }
    var labels = el('g', { class: 'tr-labels' }, svg);
    var defs = el('defs', {}, svg);
    var lx = M.l + pw + 12, av = Math.min(18, lh - 3), fs = Math.max(10, Math.min(13.5, lh - 6));
    rows.forEach(function (row, k) {
      var r = row.r, y = pos[k];
      var a = el('a', { href: 'https://github.com/' + r.name, target: '_blank', rel: 'noopener noreferrer', class: 'tr-label', 'data-r': r.name }, labels);
      el('title', {}, a).textContent = r.name + (r.desc ? ' — ' + r.desc : '');
      if (Math.abs(y - ys[k]) > 2) el('path', { d: 'M' + (sx(P.end) + 5) + ',' + ys[k] + 'L' + (lx - 3) + ',' + y, stroke: r.color, class: 'tr-leader' }, a);
      var tx = lx;
      if (!narrow && r.avatar) {
        var id = 'trc' + k + Math.random().toString(36).slice(2, 6);
        el('circle', { cx: lx + av / 2, cy: y, r: av / 2 }, el('clipPath', { id: id }, defs));
        el('image', { href: r.avatar + (r.avatar.indexOf('?') >= 0 ? '&' : '?') + 's=48', x: lx, y: y - av / 2, width: av, height: av, 'clip-path': 'url(#' + id + ')', preserveAspectRatio: 'xMidYMid slice' }, a);
        el('circle', { cx: lx + av / 2, cy: y, r: av / 2, fill: 'none', stroke: r.color, 'stroke-width': 1.5 }, a);
        tx = lx + av + 5;
      } else {
        el('rect', { x: lx, y: y - 4, width: 8, height: 8, fill: r.color }, a);
        tx = lx + 12;
      }
      var t = el('text', { x: tx, y: y + fs * 0.36, 'font-size': fs }, a);
      var maxChars = narrow ? 11 : 20;
      el('tspan', { class: 'n' }, t).textContent = r.short.length > maxChars ? r.short.slice(0, maxChars - 1) + '…' : r.short;
      el('tspan', { class: 'v', dx: 5 }, t).textContent = (gain ? '+' : '') + fmt(row.val);
    });

    // hover: highlight a repo, crosshair with values
    var hover = el('rect', { x: M.l, y: M.t, width: pw, height: ph, class: 'tr-hover' }, svg);
    var cross = el('line', { y1: M.t, y2: M.t + ph, class: 'tr-cross' }, svg);
    cross.style.display = 'none';
    function focus(name) {
      box.classList.toggle('tr-focus', !!name);
      Array.prototype.forEach.call(box.querySelectorAll('[data-r]'), function (n) { n.classList.toggle('on', n.getAttribute('data-r') === name); });
    }
    labels.addEventListener('mouseover', function (e) { var a = e.target.closest('[data-r]'); if (a) focus(a.getAttribute('data-r')); });
    labels.addEventListener('mouseout', function () { focus(null); });
    lines.addEventListener('mouseover', function (e) { var a = e.target.closest('[data-r]'); if (a) focus(a.getAttribute('data-r')); });
    lines.addEventListener('mouseout', function () { focus(null); });
    function move(e) {
      var rect = svg.getBoundingClientRect(), k = W / rect.width;
      var px = (e.clientX - rect.left) * k;
      var x = Math.round(start + (px - M.l) / pw * (P.end - start));
      x = Math.max(start, Math.min(P.end, x));
      var X = sx(x);
      cross.setAttribute('x1', X); cross.setAttribute('x2', X); cross.style.display = '';
      var list = rows.map(function (row) { var v0 = valueAt(row.r, x); return { r: row.r, v: v0 === null ? null : v0 - row.base }; })
        .filter(function (o) { return o.v !== null && o.v > 0; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 10);
      tip.innerHTML = '<b>' + esc(shortDate(x)) + '</b>' + list.map(function (o) {
        return '<div><i style="background:' + o.r.color + '"></i>' + esc(o.r.short) + '<span>' + (gain ? '+' : '') + fmt(o.v) + (estAt(o.r, x) ? '*' : '') + '</span></div>';
      }).join('') + (list.some(function (o) { return estAt(o.r, x); }) ? '<small>* ประมาณการ</small>' : '');
      tip.hidden = false;
      var bx = box.getBoundingClientRect();
      var left = e.clientX - bx.left + 14;
      if (left + tip.offsetWidth > bx.width) left = e.clientX - bx.left - tip.offsetWidth - 14;
      tip.style.left = Math.max(0, left) + 'px';
      tip.style.top = Math.max(0, e.clientY - bx.top - 10) + 'px';
    }
    hover.addEventListener('mousemove', move);
    hover.addEventListener('mouseleave', function () { cross.style.display = 'none'; tip.hidden = true; });
    return { rows: rows, P: P };
  }

  // ---------------------------------------------------------------------------
  // Window UI
  // ---------------------------------------------------------------------------
  function mount(root, opts) {
    opts = opts || {};
    var s = readState(opts.embed ? location.search : '');
    var t = todayNum();
    root.innerHTML =
      '<div class="titlebar"><h2 class="title">📈 GitHub Star Trends</h2><span class="tb-btns" aria-hidden="true"><span>_</span><span>□</span><span>×</span></span></div>' +
      '<div class="toolbar tr-bar">' +
        '<label>ดู <select data-k="mode"><option value="date">วันที่</option><option value="month">เดือน</option><option value="year">ปี</option><option value="range">ช่วงวันที่</option></select></label>' +
        '<input type="date" data-k="d" data-show="date" max="' + str(t) + '" aria-label="วันที่">' +
        '<select data-k="mm" data-show="month" aria-label="เดือน">' + MONTHS.map(function (m, i) { return '<option value="' + ('0' + (i + 1)).slice(-2) + '">' + m + '</option>'; }).join('') + '</select>' +
        '<select data-k="yy" data-show="month year" aria-label="ปี"></select>' +
        '<span data-show="range" class="tr-rng"><input type="date" data-k="from" max="' + str(t) + '" aria-label="ตั้งแต่"> – <input type="date" data-k="to" max="' + str(t) + '" aria-label="ถึง"></span>' +
        '<select data-k="metric" data-show="month year range" aria-label="ค่าที่แสดง"><option value="gain">ดาวที่เพิ่มขึ้น</option><option value="total">ดาวทั้งหมด</option></select>' +
        '<label>Top <select data-k="top"><option>10</option><option>20</option><option>30</option></select></label>' +
        '<span class="tr-sp"></span>' +
        (opts.embed
          ? '<a class="chip" target="_blank" rel="noopener" data-k="open">เปิดเต็ม ↗</a>'
          : '<button type="button" class="chip" data-k="copy">📋 Copy iframe</button>') +
      '</div>' +
      '<div class="content tr-pane"><div class="tr-head"><div class="tr-title"></div><div class="tr-sub muted"></div></div>' +
        '<div class="tr-box"></div><div class="tr-tip" hidden></div></div>' +
      '<div class="statusbar"><span class="tr-status">กำลังโหลด…</span><span class="tr-upd"></span></div>';

    var $ = function (k) { return root.querySelector('[data-k="' + k + '"]'); };
    var box = root.querySelector('.tr-box'), tip = root.querySelector('.tr-tip');
    var status = root.querySelector('.tr-status'), upd = root.querySelector('.tr-upd');
    var liveCount = 0;

    function syncControls() {
      $('mode').value = s.mode;
      $('d').value = s.d || str(t);
      $('mm').value = s.m.slice(5, 7);
      var years = [];
      var y0 = repos.length ? new Date(repos.reduce(function (m, r) { return Math.min(m, r.pts[0].x); }, t) * DAY).getUTCFullYear() : new Date().getFullYear();
      for (var y = new Date().getFullYear(); y >= Math.min(y0, +s.y); y--) years.push(y);
      $('yy').innerHTML = years.map(function (y) { return '<option>' + y + '</option>'; }).join('');
      $('yy').value = s.mode === 'month' ? s.m.slice(0, 4) : s.y;
      $('from').value = s.from; $('to').value = s.to;
      $('metric').value = metricOf(s) === 'total' && s.mode !== 'date' ? 'total' : 'gain';
      $('top').value = String(s.top);
      Array.prototype.forEach.call(root.querySelectorAll('[data-show]'), function (n) {
        n.hidden = n.getAttribute('data-show').split(' ').indexOf(s.mode) < 0;
      });
      if ($('open')) $('open').href = EMBED_URL + stateQuery(s);
    }
    function render() {
      syncControls();
      if (loadState !== 'ok') {
        root.querySelector('.tr-title').textContent = '';
        root.querySelector('.tr-sub').textContent = '';
        box.innerHTML = '<p class="empty muted">' + (loadState === 'loading' ? 'กำลังโหลดข้อมูล…'
          : loadState === 'nodata' ? 'ยังไม่มีข้อมูล — รอ GitHub Actions เก็บข้อมูลรอบแรก (ทุกชั่วโมง)'
          : 'โหลดข้อมูลไม่สำเร็จ ลองรีเฟรชอีกครั้ง') + '</p>';
        status.textContent = loadState === 'loading' ? 'กำลังโหลด…' : 'ไม่มีข้อมูล';
        return;
      }
      var res = draw(box, tip, s);
      root.querySelector('.tr-title').textContent = res.P.title;
      root.querySelector('.tr-sub').textContent = res.P.sub;
      var est = res.rows.some(function (x) { return x.r.pts.some(function (p) { return p.e; }); });
      status.textContent = res.rows.length + ' / ' + repos.length + ' repos' + (est ? ' · เส้นประ = ประมาณการ' : '');
      upd.textContent = (liveCount && res.P.end === t ? '🟢 live · ' : '') + 'อัปเดต ' + (updated ? new Date(updated).toLocaleString('th-TH-u-ca-gregory', { dateStyle: 'short', timeStyle: 'short' }) : '-');
    }

    root.querySelector('.tr-bar').addEventListener('change', function (e) {
      var k = e.target.getAttribute('data-k');
      if (k === 'mode') s.mode = e.target.value;
      else if (k === 'd') s.d = e.target.value && e.target.value !== str(t) ? e.target.value : '';
      else if (k === 'mm' || k === 'yy') {
        if (s.mode === 'month') s.m = $('yy').value + '-' + $('mm').value;
        else s.y = $('yy').value;
      } else if (k === 'from' || k === 'to') { if (validDay(e.target.value)) s[k] = e.target.value; }
      else if (k === 'metric') s.metric = e.target.value;
      else if (k === 'top') s.top = +e.target.value;
      if (opts.embed) history.replaceState(null, '', stateQuery(s));
      render();
    });
    if ($('copy')) $('copy').addEventListener('click', function () { copyDialog(s); });

    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(render, 150); });

    render();
    load().then(function () {
      render();
      if (loadState !== 'ok') return;
      var shown = repos.slice(0, 40).map(function (r) { return r.name; });
      return live(shown).then(function (v) { liveCount = applyLive(v); if (liveCount) render(); });
    });
  }

  function copyDialog(s) {
    var dlg = document.getElementById('trDlg');
    if (!dlg) { dlg = document.createElement('dialog'); dlg.id = 'trDlg'; document.body.appendChild(dlg); }
    var code = '<iframe src="' + EMBED_URL + stateQuery(s) + '" width="100%" height="720" style="border:0;max-width:1100px" loading="lazy" title="GitHub Star Trends"></iframe>';
    dlg.innerHTML = '<form method="dialog" class="form"><h2 class="titlebar"><span class="title">📋 Copy iframe</span><button type="submit" class="tb-x" aria-label="ปิด">×</button></h2>' +
      '<p class="small">แปะโค้ดนี้ในเว็บอื่นเพื่อแสดงกราฟนี้ (ใช้ตัวกรองที่เลือกอยู่ตอนนี้' + (s.mode === 'date' && !s.d ? ' — แสดงวันปัจจุบันเสมอ' : '') + ')</p>' +
      '<textarea class="tr-code" rows="4" readonly spellcheck="false"></textarea>' +
      '<div class="actions"><button type="button" class="chip primary" data-copy>📋 คัดลอก</button><button type="submit" class="chip">ปิด</button></div></form>';
    var ta = dlg.querySelector('textarea');
    ta.value = code;
    dlg.querySelector('[data-copy]').addEventListener('click', function () {
      var btn = this;
      ta.select();
      var done = function () { btn.textContent = '✓ คัดลอกแล้ว'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, function () { try { document.execCommand('copy'); done(); } catch (e) { /* user copies by hand */ } });
      else { try { document.execCommand('copy'); done(); } catch (e) { /* user copies by hand */ } }
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.showModal();
    ta.select();
  }

  window.StarTrends = { mount: mount };
  var auto = document.querySelector('[data-star-trends]');
  if (auto) mount(auto, { embed: auto.getAttribute('data-star-trends') === 'embed' });
})();
