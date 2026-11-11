// AI Notes: anonymous usage stats via GoatCounter (free, no cookies).
//
// No third-party script runs on this page: this file only sends "pixel" hits
// (an <img> request to GoatCounter's /count endpoint) and reads the public
// visitor counter, so the page CSP stays 'self'-only for scripts and the admin
// token cannot be reached by outside code.
//
// What gets recorded (see the dashboard at https://<GC_CODE>.goatcounter.com):
//   pageviews  /ai/            the page itself
//              /ai/#<folder>   each folder opened (title = folder name)
//   events     visit/new, visit/back-<gap>    how long since this browser's last visit
//              visit/n-<bucket>               how many visits this browser has made
//              out/<url>                       a link was opened (title = link title)
//              search/<term>, search-miss/<term>   what people search for / don't find
// The site owner (signed in with a GitHub token) and ?nostat browsers are not counted.
(function () {
  'use strict';

  var GC_CODE = 'bombxdev';                       // GoatCounter site code
  var GC = 'https://' + GC_CODE + '.goatcounter.com';
  var TOKEN_KEY = 'gtaoadmin.token';              // same key ai.js uses for the admin token
  var OPT_OUT_KEY = 'aistats.off';
  var VISIT_KEY = 'aistats.visits';               // { n, last } — stays in this browser only
  var SESSION_KEY = 'aistats.session';

  function store(kind) { try { return window[kind]; } catch (e) { return null; } }
  function get(kind, key) { try { var s = store(kind); return s ? s.getItem(key) : null; } catch (e) { return null; } }
  function set(kind, key, val) { try { var s = store(kind); if (s) s.setItem(key, val); } catch (e) { /* storage unavailable */ } }
  function del(kind, key) { try { var s = store(kind); if (s) s.removeItem(key); } catch (e) { /* storage unavailable */ } }

  // ?nostat turns counting off in this browser, ?stat turns it back on.
  if (/[?&]nostat\b/.test(location.search)) set('localStorage', OPT_OUT_KEY, '1');
  if (/[?&]stat\b/.test(location.search)) del('localStorage', OPT_OUT_KEY);

  function skipReason() {
    if (!/\.github\.io$/.test(location.hostname)) return 'not on github.io (localhost / preview)';
    if (navigator.webdriver) return 'automated browser';
    if (get('localStorage', OPT_OUT_KEY)) return 'opted out with ?nostat (open ?stat to undo)';
    if (get('sessionStorage', TOKEN_KEY) || get('localStorage', TOKEN_KEY)) return 'admin token saved in this browser (owner is not counted)';
    return '';
  }
  var reason = skipReason();
  if (window.console) console.info('[stats] ' + (reason ? 'not counted: ' + reason : 'counting via GoatCounter'));
  function enabled() { return !skipReason(); }

  function send(path, title, isEvent) {
    if (!enabled()) return;
    var q = {
      p: path,
      t: title || '',
      e: isEvent ? 'true' : 'false',
      r: isEvent ? '' : document.referrer,
      s: [screen.width, screen.height, window.devicePixelRatio || 1].join(','),
      rnd: Math.random().toString(36).slice(2)
    };
    var qs = Object.keys(q).map(function (k) { return k + '=' + encodeURIComponent(q[k]); }).join('&');
    var img = new Image();
    img.referrerPolicy = 'no-referrer-when-downgrade';
    img.src = GC + '/count?' + qs;
  }

  // --- how often people come back -------------------------------------------
  function visitBuckets() {
    if (get('sessionStorage', SESSION_KEY)) return;   // once per browser session
    set('sessionStorage', SESSION_KEY, '1');
    var v = {};
    try { v = JSON.parse(get('localStorage', VISIT_KEY) || '{}') || {}; } catch (e) { v = {}; }
    var now = Date.now(), n = (v.n || 0) + 1;
    var gap;
    if (!v.last) gap = 'new';
    else {
      var days = (now - v.last) / 864e5;
      gap = 'back-' + (days < 1 ? '1d' : days < 7 ? '1-7d' : days < 30 ? '7-30d' : '30d+');
    }
    var nb = n === 1 ? '1' : n <= 4 ? '2-4' : n <= 9 ? '5-9' : n <= 24 ? '10-24' : '25+';
    set('localStorage', VISIT_KEY, JSON.stringify({ n: n, last: now }));
    send('visit/' + gap, gap === 'new' ? 'ครั้งแรก' : 'กลับมาอีก', true);
    send('visit/n-' + nb, 'เข้ามาครั้งที่ ' + nb, true);
  }

  // --- link clicks (which links are actually useful) -------------------------
  function outbound(e) {
    if (e.type === 'auxclick' && e.button !== 1) return;   // middle-click opens a tab without "click"
    var a = e.target.closest && e.target.closest('.card.link a[href^="http"]');
    if (!a) return;
    var h = a.closest('.card.link').querySelector('h3');
    send('out/' + a.href.replace(/^https?:\/\/(www\.)?/, '').slice(0, 200), h ? h.textContent : '', true);
  }
  document.addEventListener('click', outbound, true);
  document.addEventListener('auxclick', outbound, true);

  // --- searches (debounced: only the term people stopped typing at) ----------
  var searchTimer, lastTerm = '';
  document.addEventListener('input', function (e) {
    if (!e.target || e.target.id !== 'search') return;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      var term = e.target.value.trim().toLowerCase().slice(0, 50);
      if (term.length < 2 || term === lastTerm) return;
      lastTerm = term;
      var miss = !!document.querySelector('#view .empty');
      send((miss ? 'search-miss/' : 'search/') + term, miss ? 'ค้นหาแล้วไม่เจอ' : 'ค้นหา', true);
    }, 1500);
  });

  // --- public visitor counter in the footer ---------------------------------
  function showCounter() {
    var el = document.getElementById('visits');
    if (!el || !window.fetch) return;
    fetch(GC + '/counter/' + encodeURIComponent('/ai/') + '.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.count) return;
        el.textContent = '👀 ผู้เข้าชม ' + j.count + ' คน';
        el.hidden = false;
      })
      .catch(function () { /* counter off or blocked: just hide it */ });
  }

  // Called by ai.js whenever the visible folder changes.
  var lastView = null;
  window.aiStats = {
    view: function (folderId, folderName) {
      var path = folderId && folderId !== 'root' ? '/ai/#' + folderId : '/ai/';
      if (path === lastView) return;
      lastView = path;
      send(path, folderName ? folderName + ' · AI Notes' : 'AI Notes', false);
    }
  };

  visitBuckets();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showCounter);
  else showCounter();
})();
