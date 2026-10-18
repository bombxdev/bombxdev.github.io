// Tiny i18n helper: loads i18n/<code>.json (falls back to English per key)
// and fills elements marked with data-i18n / data-i18n-* attributes.
(function () {
  'use strict';

  // index.html carries the version on <html data-app-version> (no inline scripts there).
  window.APP_VERSION = window.APP_VERSION || document.documentElement.getAttribute('data-app-version') || '';

  var FALLBACK = 'en';
  var cache = {};
  var I18N = { code: FALLBACK, languages: [], dict: null, base: null };

  function load(code) {
    if (!cache[code]) {
      cache[code] = fetch('i18n/' + code + '.json?v=' + window.APP_VERSION).then(function (r) {
        if (!r.ok) throw new Error('i18n ' + code + ' ' + r.status);
        return r.json();
      });
    }
    return cache[code];
  }

  // Best match for the browser's preferred languages: exact code, then base language.
  I18N.detect = function (saved) {
    var codes = I18N.languages.map(function (l) { return l.code; });
    var wanted = [saved].concat(navigator.languages || [navigator.language]).filter(Boolean);
    for (var i = 0; i < wanted.length; i++) {
      var w = wanted[i];
      if (codes.indexOf(w) !== -1) return w;
      var lower = w.toLowerCase();
      if (lower === 'zh-hk' || lower === 'zh-mo' || lower.indexOf('zh-hant') === 0) return 'zh-TW';
      if (lower.indexOf('zh') === 0) return 'zh-CN';
      var baseMatch = codes.filter(function (c) { return c.split('-')[0] === lower.split('-')[0]; })[0];
      if (baseMatch) return baseMatch;
    }
    return FALLBACK;
  };

  I18N.init = function () {
    return fetch('i18n/index.json?v=' + window.APP_VERSION).then(function (r) { return r.json(); }).then(function (list) {
      I18N.languages = list;
      return load(FALLBACK);
    }).then(function (base) { I18N.base = base; });
  };

  I18N.use = function (code) {
    return load(code).catch(function () { code = FALLBACK; return I18N.base; }).then(function (dict) {
      I18N.code = code;
      I18N.dict = dict;
      document.documentElement.lang = code;
      return code;
    });
  };

  I18N.t = function (key, vars) {
    var s = (I18N.dict && I18N.dict.ui[key]) || (I18N.base && I18N.base.ui[key]) || key;
    if (vars) {
      s = s.replace(/\{(\w+)\}/g, function (m, k) { return k in vars ? vars[k] : m; });
    }
    return s;
  };

  function catEntry(key) {
    return (I18N.dict && I18N.dict.cats[key]) || (I18N.base && I18N.base.cats[key]) || {};
  }
  I18N.catName = function (key) { return catEntry(key).name || (I18N.base.cats[key] || {}).name || key; };
  I18N.catInfo = function (key) { return catEntry(key).info || (I18N.base.cats[key] || {}).info || ''; };
  I18N.catNote = function (key) { return catEntry(key).note || (I18N.base.cats[key] || {}).note || ''; };
  // Every language file, so a search in any language finds its category.
  I18N.loadAll = function () {
    return Promise.all(I18N.languages.map(function (l) { return load(l.code).catch(function () { return null; }); }))
      .then(function (dicts) { return dicts.filter(Boolean); });
  };

  // data-i18n="key" -> textContent, data-i18n-html="key" -> innerHTML (with
  // {link} placeholders from `links`), data-i18n-attr="attr:key;attr:key".
  I18N.apply = function (root, links) {
    root.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = I18N.t(el.getAttribute('data-i18n')); });
    root.querySelectorAll('[data-i18n-html]').forEach(function (el) { el.innerHTML = I18N.t(el.getAttribute('data-i18n-html'), links); });
    root.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var p = pair.split(':');
        el.setAttribute(p[0], I18N.t(p[1]));
      });
    });
  };

  window.I18N = I18N;
})();
