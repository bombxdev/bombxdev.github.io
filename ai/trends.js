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
  // Link previews on social networks need a ready-made image: the hourly
  // workflow screenshots these filters (ai/tools/render_og.cjs) and the static
  // pages ai/share/<preset>[-en].html point their og:image at them.
  var SHARE_URL = 'https://' + OWNER + '.github.io/ai/share/';
  var OG_URL = 'https://raw.githubusercontent.com/' + OWNER + '/' + REPO + '/stars-data/og/';
  var LIVE_KEY = 'trends.live';
  var DAY = 864e5;
  var PALETTE = ['#1f6feb', '#a0785a', '#e3b505', '#2fb34a', '#d93a49', '#7b52d9', '#3aa0e8', '#b04fc9', '#ff8c00', '#17a2b8',
    '#e83e8c', '#5c6bc0', '#20c997', '#c0392b', '#34495e', '#f39c12', '#16a085', '#d35400', '#7f8c8d', '#9b59b6',
    '#27ae60', '#0057b8', '#b8860b', '#ff5e5b', '#00897b', '#ad1457', '#6d4c41', '#43a047', '#1e88e5', '#8d6e63'];
  var MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  var MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  var MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var MON_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var SVGNS = 'http://www.w3.org/2000/svg';
  var CREDIT = 'Bomb x AI';
  var TOPIC_LABEL = '# Artificial Intelligence';   // data: repos with the GitHub topic 'ai'
  var SITE = 'bombxdev.github.io/ai';
  var T = window.T || function (s, v) { return v ? s.replace(/\{(\w+)\}/g, function (m, k) { return k in v ? v[k] : m; }) : s; };
  function en() { return !!window.I18N && window.I18N.lang === 'en'; }
  function months() { return en() ? MONTHS_EN : MONTHS; }
  function mon() { return en() ? MON_EN : MON; }

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
  function longDate(n) { var d = new Date(n * DAY); return d.getUTCDate() + ' ' + months()[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); }
  function shortDate(n) { var d = new Date(n * DAY); return d.getUTCDate() + ' ' + mon()[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); }

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
      // No back-filled history yet: assume growth from 0 at creation up to the
      // first real data point, drawn dashed as an estimate.
      repos.forEach(function (r, i) {
        var c = j.repos[r.name].created;
        if (r.bf || !validDay(c) || num(c) >= r.pts[0].x) return;
        r.pts[0].e = true;
        r.pts.unshift({ x: num(c), v: 0, e: false });
        r.bf = true;
      });
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
    if (en()) q.push('lang=en');
    return '?' + q.join('&');
  }
  function metricOf(s) { return s.mode === 'date' ? 'total' : (s.metric || 'gain'); }

  // { start, end, title, sub, metric } for the current filters
  function period(s) {
    var t = todayNum(), start, end, title, label;
    if (s.mode === 'date') {
      end = s.d ? Math.min(num(s.d), t) : t;
      return { start: null, end: end, title: longDate(end), sub: T('จำนวนดาวทั้งหมด ณ วันนี้'), metric: 'total' };
    }
    if (s.mode === 'month') {
      var y = +s.m.slice(0, 4), m = +s.m.slice(5, 7) - 1;
      start = Date.UTC(y, m, 1) / DAY; end = Date.UTC(y, m + 1, 0) / DAY;
      title = months()[m] + ' ' + y; label = 'เดือนนี้';
    } else if (s.mode === 'year') {
      start = Date.UTC(+s.y, 0, 1) / DAY; end = Date.UTC(+s.y, 11, 31) / DAY;
      title = T('ปี {y}', { y: s.y }); label = 'ปีนี้';
    } else {
      start = num(s.from); end = num(s.to);
      if (end < start) { var x = start; start = end; end = x; }
      title = shortDate(start) + ' – ' + shortDate(end); label = 'ช่วงนี้';
    }
    end = Math.min(end, t);
    if (start > end) start = end;
    var metric = metricOf(s);
    return { start: start, end: end, title: title, metric: metric,
      sub: T(metric === 'gain' ? 'ดาวที่เพิ่มขึ้นใน' + label : 'จำนวนดาวทั้งหมด ณ วันสุดท้ายของ' + label) };
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
      for (var x = a; x <= b; x += step) out.push({ x: x, t: (function (d) { return d.getUTCDate() + ' ' + mon()[d.getUTCMonth()]; })(new Date(x * DAY)) });
      return out;
    }
    var months = span / 30.4, ms = [1, 2, 3, 4, 6, 12, 24].filter(function (m) { return months / m <= maxN; })[0] || 24;
    var d = new Date(a * DAY), y = d.getUTCFullYear(), m = d.getUTCMonth() + 1;
    m = Math.ceil(m / ms) * ms;
    for (;;) {
      var x2 = Date.UTC(y, m, 1) / DAY;
      if (x2 > b) break;
      var dd = new Date(x2 * DAY);
      out.push({ x: x2, t: mon()[dd.getUTCMonth()] + ' ' + dd.getUTCFullYear() });
      m += ms;
    }
    return out;
  }

  // Smooth path through screen points [[x, y], ...] (x increasing).
  // Monotone cubic (Fritsch–Carlson): bends like a curve but never overshoots,
  // so a line never dips below or rises above the real values. A two-point
  // estimate is drawn as an accelerating growth curve instead of a straight line.
  function curve(p, est) {
    var q = [p[0]];
    for (var i = 1; i < p.length; i++) if (p[i][0] - q[q.length - 1][0] > 0.05) q.push(p[i]);
    var f = function (n) { return n.toFixed(1); };
    var d = 'M' + f(q[0][0]) + ',' + f(q[0][1]);
    var n = q.length;
    if (n < 2) return d + 'l0,0';
    if (n === 2) {
      var a = q[0], b = q[1], w = b[0] - a[0];
      return est
        ? d + 'C' + f(a[0] + w * 0.55) + ',' + f(a[1]) + ' ' + f(b[0] - w * 0.12) + ',' + f(a[1] + (b[1] - a[1]) * 0.45) + ' ' + f(b[0]) + ',' + f(b[1])
        : d + 'L' + f(b[0]) + ',' + f(b[1]);
    }
    var dk = [], m = [];
    for (var k = 0; k < n - 1; k++) dk.push((q[k + 1][1] - q[k][1]) / (q[k + 1][0] - q[k][0]));
    m[0] = dk[0]; m[n - 1] = dk[n - 2];
    for (k = 1; k < n - 1; k++) m[k] = dk[k - 1] * dk[k] <= 0 ? 0 : (dk[k - 1] + dk[k]) / 2;
    for (k = 0; k < n - 1; k++) {
      if (dk[k] === 0) { m[k] = 0; m[k + 1] = 0; continue; }
      var al = m[k] / dk[k], be = m[k + 1] / dk[k], h = al * al + be * be;
      if (h > 9) { var t = 3 / Math.sqrt(h); m[k] = t * al * dk[k]; m[k + 1] = t * be * dk[k]; }
    }
    for (k = 0; k < n - 1; k++) {
      var dx = (q[k + 1][0] - q[k][0]) / 3;
      d += 'C' + f(q[k][0] + dx) + ',' + f(q[k][1] + m[k] * dx) + ' ' + f(q[k + 1][0] - dx) + ',' + f(q[k + 1][1] - m[k + 1] * dx) + ' ' + f(q[k + 1][0]) + ',' + f(q[k + 1][1]);
    }
    return d;
  }

  function draw(box, tip, s, o) {
    o = o || {};
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
      start = Math.max(start, P.end - 730);
      if (P.end - start < 7) start = P.end - 7;
    }
    if (P.end === start) start = P.end - 1;

    var W = Math.max(320, box.clientWidth || 900);
    var narrow = W < 640;
    var H = o.fitH ? Math.max(240, 44 + rows.length * 12, Math.round(o.fitH)) : Math.round(Math.min(680, Math.max(360, W * (narrow ? 1.05 : 0.6))));
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
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'tr-svg', role: 'img', 'aria-label': T('กราฟดาว GitHub: {t}', { t: P.title }) }, box);
    if (!rows.length) {
      el('text', { x: W / 2, y: H / 2, 'text-anchor': 'middle', class: 'tr-empty' }, svg).textContent = T('ไม่มีข้อมูลในช่วงนี้');
      return { rows: rows, P: P, svg: svg, W: W, H: H };
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
      var first = Math.max(start, r.pts[0].x);   // nothing to draw before the repo existed
      if (first <= P.end) {
        pts.push({ x: first, v: valueAt(r, first), e: false });
        r.pts.forEach(function (p) { if (p.x > first && p.x < P.end) pts.push(p); });
        pts.push({ x: P.end, v: valueAt(r, P.end), e: estAt(r, P.end) });
      }
      var xy = function (p) { return [sx(p.x), sy(p.v - row.base)]; };
      for (var i = 1; i < pts.length; i++) {
        var last = segs[segs.length - 1];
        if (last && last.e === pts[i].e) last.p.push(xy(pts[i]));
        else segs.push({ e: pts[i].e, p: [xy(pts[i - 1]), xy(pts[i])] });
      }
      var grp = el('g', { class: 'tr-line', 'data-r': r.name, stroke: r.color }, lines);
      segs.forEach(function (sg) { el('path', { d: curve(sg.p, sg.e), class: sg.e ? 'est' : '' }, grp); });
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
    if (o.credit) el('text', { x: W - 4, y: H - 5, 'text-anchor': 'end', class: 'tr-credit' }, svg).textContent = CREDIT;
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
      }).join('') + (list.some(function (o) { return estAt(o.r, x); }) ? '<small>' + T('* ประมาณการ') + '</small>' : '');
      tip.hidden = false;
      var bx = box.getBoundingClientRect();
      var left = e.clientX - bx.left + 14;
      if (left + tip.offsetWidth > bx.width) left = e.clientX - bx.left - tip.offsetWidth - 14;
      tip.style.left = Math.max(0, left) + 'px';
      tip.style.top = Math.max(0, e.clientY - bx.top - 10) + 'px';
    }
    hover.addEventListener('mousemove', move);
    hover.addEventListener('mouseleave', function () { cross.style.display = 'none'; tip.hidden = true; });
    return { rows: rows, P: P, svg: svg, W: W, H: H };
  }

  // ---------------------------------------------------------------------------
  // Window UI
  // ---------------------------------------------------------------------------
  // "updated" time, shown in the viewer's own time zone with its name
  function tzName() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; } }
  function fmtUpdated() {
    if (!updated) return '-';
    var d = new Date(updated);
    try {
      return d.toLocaleString(en() ? 'en-GB' : 'th-TH-u-ca-gregory', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
    } catch (e) { return d.toLocaleString(); }
  }

  // ---------------------------------------------------------------------------
  // Save as image / share
  // ---------------------------------------------------------------------------
  var STYLE_PROPS = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'font-size', 'font-weight', 'font-family'];
  var avatarCache = {};
  function avatarData(url) {   // avatars.githubusercontent.com sends CORS headers, so the canvas stays clean
    if (!avatarCache[url]) {
      avatarCache[url] = new Promise(function (resolve) {
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function () {
          try {
            var c = document.createElement('canvas'); c.width = c.height = 48;
            c.getContext('2d').drawImage(img, 0, 0, 48, 48);
            resolve(c.toDataURL('image/png'));
          } catch (e) { resolve(''); }
        };
        img.onerror = function () { resolve(''); };
        img.src = url;
      });
    }
    return avatarCache[url];
  }
  function xmlEsc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // PNG of the current chart: title + chart + footer (site, updated time, credit)
  function exportPng(res, root) {
    var src = res.svg;
    root.querySelector('.tr-box').classList.remove('tr-focus');
    Array.prototype.forEach.call(src.querySelectorAll('.on'), function (n) { n.classList.remove('on'); });
    var clone = src.cloneNode(true);
    var a = src.querySelectorAll('*'), b = clone.querySelectorAll('*');
    for (var i = 0; i < a.length; i++) {
      var cs = getComputedStyle(a[i]), st = '';
      STYLE_PROPS.forEach(function (p) { var v = cs.getPropertyValue(p); if (v) st += p + ':' + v + ';'; });
      b[i].setAttribute('style', st);
    }
    Array.prototype.forEach.call(clone.querySelectorAll('.tr-hover, .tr-cross, .tr-credit, title'), function (n) { n.parentNode.removeChild(n); });
    var images = Array.prototype.slice.call(clone.querySelectorAll('image'));
    return Promise.all(images.map(function (im) {
      return avatarData(im.getAttribute('href')).then(function (d) {
        if (d) im.setAttribute('href', d); else im.parentNode.removeChild(im);
      });
    })).then(function () {
      var pad = 24, head = 78, foot = 34, W = res.W + pad * 2, H = res.H + head + foot;
      var font = getComputedStyle(root).fontFamily.replace(/"/g, "'");
      clone.setAttribute('x', pad); clone.setAttribute('y', head);
      clone.setAttribute('width', res.W); clone.setAttribute('height', res.H);
      clone.removeAttribute('class');
      var xml = '<svg xmlns="' + SVGNS + '" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" font-family="' + xmlEsc(font) + '">' +
        '<rect width="100%" height="100%" fill="#ffffff"/>' +
        '<text x="' + pad + '" y="42" font-size="28" font-weight="bold" fill="#000">' + xmlEsc(res.P.title) + '</text>' +
        '<text x="' + pad + '" y="64" font-size="14" fill="#555">' + xmlEsc(res.P.sub) + ' · GitHub Star Trends ' + TOPIC_LABEL + '</text>' +
        new XMLSerializer().serializeToString(clone) +
        '<line x1="' + pad + '" x2="' + (W - pad) + '" y1="' + (H - foot + 4) + '" y2="' + (H - foot + 4) + '" stroke="#e6e6e6"/>' +
        '<text x="' + pad + '" y="' + (H - 12) + '" font-size="12" fill="#888">' + xmlEsc(SITE + ' · ' + T('อัปเดต {t}', { t: fmtUpdated() })) + '</text>' +
        '<text x="' + (W - pad) + '" y="' + (H - 12) + '" font-size="12" fill="#c4c4c4" text-anchor="end">' + CREDIT + '</text>' +
        '</svg>';
      return new Promise(function (resolve, reject) {
        var img = new Image();
        img.onload = function () {
          var k = 2, c = document.createElement('canvas');
          c.width = W * k; c.height = H * k;
          var ctx = c.getContext('2d');
          ctx.scale(k, k);
          ctx.drawImage(img, 0, 0, W, H);
          try { c.toBlob(function (bl) { bl ? resolve(bl) : reject(new Error('toBlob')); }, 'image/png'); } catch (e) { reject(e); }
        };
        img.onerror = function () { reject(new Error('SVG')); };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
      });
    });
  }
  function fileName(s) {
    var tag = s.mode === 'date' ? (s.d || str(todayNum())) : s.mode === 'month' ? s.m : s.mode === 'year' ? s.y : s.from + '_' + s.to;
    return 'github-star-trends-' + tag + '.png';
  }
  function download(blob, name) {
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  // today / this month / this year with the default options have a preview image
  function presetOf(s) {
    if (s.top !== 20) return null;
    var t = str(todayNum());
    if (s.mode === 'date' && !s.d) return 'today';
    if (s.metric === 'total') return null;
    if (s.mode === 'month' && s.m === t.slice(0, 7)) return 'month';
    if (s.mode === 'year' && s.y === t.slice(0, 4)) return 'year';
    return null;
  }
  function shareDialog(s, res, root) {
    var preset = presetOf(s), key = preset ? preset + (en() ? '-en' : '') : '';
    var link = preset ? SHARE_URL + key + '.html' : EMBED_URL + stateQuery(s);
    var text = T('GitHub repo ที่ได้ดาวมากที่สุด — {t}', { t: res.P.title });
    var u = encodeURIComponent(link), tx = encodeURIComponent(text);
    var nets = [
      ['𝕏', 'X', 'https://twitter.com/intent/tweet?text=' + tx + '&url=' + u],
      ['f', 'Facebook', 'https://www.facebook.com/sharer/sharer.php?u=' + u],
      ['L', 'LINE', 'https://social-plugins.line.me/lineit/share?url=' + u + '&text=' + tx],
      ['in', 'LinkedIn', 'https://www.linkedin.com/sharing/share-offsite/?url=' + u],
      ['✈', 'Telegram', 'https://t.me/share/url?url=' + u + '&text=' + tx],
      ['r', 'Reddit', 'https://www.reddit.com/submit?url=' + u + '&title=' + tx]
    ];
    var dlg = document.getElementById('trDlg');
    if (!dlg) { dlg = document.createElement('dialog'); dlg.id = 'trDlg'; document.body.appendChild(dlg); }
    dlg.innerHTML = '<form method="dialog" class="form"><h2 class="titlebar"><span class="title">' + T('📤 แชร์') + '</span><button type="submit" class="tb-x" aria-label="' + T('ปิด') + '">×</button></h2>' +
      '<p class="small">' + esc(text) + '</p>' +
      (preset
        ? '<figure class="tr-og"><img alt="" src="' + OG_URL + key + '.png?t=' + Math.floor(Date.now() / 36e5) + '"><figcaption class="small muted">' + T('ภาพนี้จะแสดงเป็นพรีวิวเมื่อแชร์ลิงก์ (อัปเดตทุกชั่วโมง)') + '</figcaption></figure>'
        : '<p class="small muted">' + T('ตัวกรองนี้ไม่มีภาพพรีวิวอัตโนมัติ (มีเฉพาะ วันนี้ / เดือนนี้ / ปีนี้) — ใช้ 📱 หรือ 💾 เพื่อแนบภาพกราฟที่ตรงกับตัวกรองนี้') + '</p>') +
      '<div class="tr-share-native" hidden><button type="button" class="chip primary" data-native>' + T('📱 แชร์รูปผ่านแอปในเครื่อง') + '</button></div>' +
      '<p class="small muted">' + T('แชร์ลิงก์ไปที่') + '</p>' +
      '<div class="tr-nets">' + nets.map(function (n) {
        return '<a class="chip" target="_blank" rel="noopener noreferrer" href="' + esc(n[2]) + '"><b class="tr-net">' + n[0] + '</b>' + n[1] + '</a>';
      }).join('') + '</div>' +
      '<div class="inline"><input class="tr-link" readonly value="' + esc(link) + '"><button type="button" class="chip" data-copylink>' + T('🔗 คัดลอกลิงก์') + '</button></div>' +
      '<p class="small muted">' + T('โซเชียลส่วนใหญ่แชร์ได้แค่ลิงก์ ถ้าอยากโพสต์เป็นรูป ให้กด 💾 บันทึกรูป แล้วแนบรูปเอง') + '</p>' +
      '<div class="actions"><button type="button" class="chip" data-save>' + T('💾 บันทึกรูป') + '</button><button type="submit" class="chip">' + T('ปิด') + '</button></div></form>';
    var blobP = null;
    var getBlob = function () { return blobP || (blobP = exportPng(res, root)); };
    // native share sheet with the image (phones, some desktops)
    if (navigator.canShare && window.File) {
      var probe = new File([''], 'x.png', { type: 'image/png' });
      if (navigator.canShare({ files: [probe] })) dlg.querySelector('.tr-share-native').hidden = false;
    }
    dlg.querySelector('[data-native]').addEventListener('click', function () {
      var btn = this;
      btn.textContent = T('กำลังสร้างรูป…');
      getBlob().then(function (bl) {
        var f = new File([bl], fileName(s), { type: 'image/png' });
        return navigator.share({ files: [f], title: 'GitHub Star Trends', text: text + ' ' + link });
      }).then(function () { btn.textContent = T('📱 แชร์รูปผ่านแอปในเครื่อง'); }, function () { btn.textContent = T('📱 แชร์รูปผ่านแอปในเครื่อง'); });
    });
    dlg.querySelector('[data-copylink]').addEventListener('click', function () {
      var btn = this, inp = dlg.querySelector('.tr-link');
      inp.select();
      var done = function () { btn.textContent = T('✓ คัดลอกแล้ว'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(done, function () { try { document.execCommand('copy'); done(); } catch (e) { /* by hand */ } });
      else { try { document.execCommand('copy'); done(); } catch (e) { /* by hand */ } }
    });
    dlg.querySelector('[data-save]').addEventListener('click', function () {
      var btn = this;
      btn.textContent = T('กำลังสร้างรูป…');
      getBlob().then(function (bl) { download(bl, fileName(s)); btn.textContent = T('บันทึกรูปแล้ว ✓'); },
        function (e) { btn.textContent = T('สร้างรูปไม่สำเร็จ: {e}', { e: e.message }); });
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.showModal();
  }

  function mount(root, opts) {
    opts = opts || {};
    // filters: the page URL, then the page's own preset (data-query, share pages)
    var s = readState(opts.embed ? location.search.slice(1) + '&' + String(opts.query || '').replace(/^\?/, '') : '');
    var t = todayNum();
    var box, tip, status, upd;
    var $ = function (k) { return root.querySelector('[data-k="' + k + '"]'); };
    function chrome() {   // (re)builds the window, e.g. after a language switch
      root.innerHTML =
      '<div class="titlebar"><h2 class="title">📈 GitHub Star Trends <span class="tr-topic">' + TOPIC_LABEL + '</span></h2><span class="tb-btns" aria-hidden="true"><span>_</span><span>□</span><span>×</span></span></div>' +
      '<div class="toolbar tr-bar">' +
        '<label>' + T('ดู') + ' <select data-k="mode"><option value="date">' + T('วันที่') + '</option><option value="month">' + T('เดือน') + '</option><option value="year">' + T('ปี') + '</option><option value="range">' + T('ช่วงวันที่') + '</option></select></label>' +
        '<input type="date" data-k="d" data-show="date" max="' + str(t) + '" aria-label="' + T('วันที่') + '">' +
        '<select data-k="mm" data-show="month" aria-label="' + T('เดือน') + '">' + months().map(function (m, i) { return '<option value="' + ('0' + (i + 1)).slice(-2) + '">' + m + '</option>'; }).join('') + '</select>' +
        '<select data-k="yy" data-show="month year" aria-label="' + T('ปี') + '"></select>' +
        '<span data-show="range" class="tr-rng"><input type="date" data-k="from" max="' + str(t) + '" aria-label="' + T('ตั้งแต่') + '"> – <input type="date" data-k="to" max="' + str(t) + '" aria-label="' + T('ถึง') + '"></span>' +
        '<select data-k="metric" data-show="month year range" aria-label="' + T('ค่าที่แสดง') + '"><option value="gain">' + T('ดาวที่เพิ่มขึ้น') + '</option><option value="total">' + T('ดาวทั้งหมด') + '</option></select>' +
        '<label>Top <select data-k="top"><option>10</option><option>20</option><option>30</option></select></label>' +
        '<span class="tr-sp"></span>' +
        '<button type="button" class="chip" data-k="save" title="' + T('บันทึกกราฟเป็นไฟล์ PNG') + '">' + T('💾 บันทึกรูป') + '</button>' +
        '<button type="button" class="chip" data-k="share">' + T('📤 แชร์') + '</button>' +
        (opts.embed
          ? '<a class="chip" target="_blank" rel="noopener" data-k="open">' + T('เปิดเต็ม ↗') + '</a>'
          : '<button type="button" class="chip" data-k="copy">📋 Copy iframe</button>') +
      '</div>' +
      '<div class="content tr-pane"><div class="tr-head"><div class="tr-title"></div><div class="tr-sub muted"></div></div>' +
        '<div class="tr-box"></div><div class="tr-tip" hidden></div></div>' +
      '<div class="statusbar"><span class="tr-status">' + T('กำลังโหลด…') + '</span><span class="tr-upd"></span></div>';
      box = root.querySelector('.tr-box'); tip = root.querySelector('.tr-tip');
      status = root.querySelector('.tr-status'); upd = root.querySelector('.tr-upd');
    }
    chrome();
    var liveCount = 0;
    var last = null;   // last drawn chart (for save / share)

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
        box.innerHTML = '<p class="empty muted">' + T(loadState === 'loading' ? 'กำลังโหลดข้อมูล…'
          : loadState === 'nodata' ? 'ยังไม่มีข้อมูล — รอ GitHub Actions เก็บข้อมูลรอบแรก (ทุกชั่วโมง)'
          : 'โหลดข้อมูลไม่สำเร็จ ลองรีเฟรชอีกครั้ง') + '</p>';
        status.textContent = T(loadState === 'loading' ? 'กำลังโหลด…' : 'ไม่มีข้อมูล');
        return;
      }
      var P0 = period(s);   // title first: its height matters when fitting the chart
      root.querySelector('.tr-title').textContent = P0.title;
      root.querySelector('.tr-sub').textContent = P0.sub;
      var fitH = null;
      if (opts.embed) {   // fill the iframe exactly: no scrollbar unless it is really tiny
        var below = root.getBoundingClientRect().bottom - box.getBoundingClientRect().bottom;
        fitH = window.innerHeight - box.getBoundingClientRect().top - below - 2;
      }
      var res = draw(box, tip, s, { fitH: fitH, credit: !!opts.embed });
      last = res;
      root.querySelector('.tr-title').textContent = res.P.title;
      root.querySelector('.tr-sub').textContent = res.P.sub;
      var est = res.rows.some(function (x) { return x.r.pts.some(function (p) { return p.e; }); });
      status.textContent = res.rows.length + ' / ' + repos.length + ' repos' + (est ? T(' · เส้นประ = ประมาณการ') : '');
      upd.textContent = (liveCount && res.P.end === t ? '🟢 live · ' : '') + T('อัปเดต {t}', { t: fmtUpdated() });
      upd.title = T('เวลาตามเครื่องของคุณ ({tz})', { tz: tzName() });
    }

    root.addEventListener('change', function (e) {
      var k = e.target.getAttribute('data-k');
      if (!k) return;
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
    root.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-k]');
      if (!b) return;
      var k = b.getAttribute('data-k');
      if (k === 'copy') copyDialog(s);
      else if ((k === 'save' || k === 'share') && last && last.rows.length) {
        if (k === 'share') return shareDialog(s, last, root);
        var label = b.textContent;
        b.textContent = T('กำลังสร้างรูป…');
        exportPng(last, root).then(function (bl) { download(bl, fileName(s)); b.textContent = label; },
          function (err) { b.textContent = label; window.alert(T('สร้างรูปไม่สำเร็จ: {e}', { e: err.message })); });
      }
    });
    if (window.I18N) window.I18N.on(function () {
      chrome();
      render();
      if (opts.embed) history.replaceState(null, '', stateQuery(s));
    });

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
    dlg.innerHTML = '<form method="dialog" class="form"><h2 class="titlebar"><span class="title">📋 Copy iframe</span><button type="submit" class="tb-x" aria-label="' + T('ปิด') + '">×</button></h2>' +
      '<p class="small">' + T('แปะโค้ดนี้ในเว็บอื่นเพื่อแสดงกราฟนี้ (ใช้ตัวกรองที่เลือกอยู่ตอนนี้{note})', { note: s.mode === 'date' && !s.d ? T(' — แสดงวันปัจจุบันเสมอ') : '' }) + '</p>' +
      '<textarea class="tr-code" rows="4" readonly spellcheck="false"></textarea>' +
      '<div class="actions"><button type="button" class="chip primary" data-copy>' + T('📋 คัดลอก') + '</button><button type="submit" class="chip">' + T('ปิด') + '</button></div></form>';
    var ta = dlg.querySelector('textarea');
    ta.value = code;
    dlg.querySelector('[data-copy]').addEventListener('click', function () {
      var btn = this;
      ta.select();
      var done = function () { btn.textContent = T('✓ คัดลอกแล้ว'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, function () { try { document.execCommand('copy'); done(); } catch (e) { /* user copies by hand */ } });
      else { try { document.execCommand('copy'); done(); } catch (e) { /* user copies by hand */ } }
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.showModal();
    ta.select();
  }

  window.StarTrends = { mount: mount };
  var auto = document.querySelector('[data-star-trends]');
  if (auto) mount(auto, { embed: auto.getAttribute('data-star-trends') === 'embed', query: auto.getAttribute('data-query') || '' });
})();
