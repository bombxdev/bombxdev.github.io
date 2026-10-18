// Location photos ("where exactly") shown in point popups, from data/hints.json.
//
// Admin mode (site owner only): open the map with ?admin and sign in with a
// GitHub fine-grained personal access token that can write this repository.
// Photos are committed straight to the repository through the GitHub API, so
// GitHub itself checks the permission: the code being public does not let
// anyone else upload. The token never leaves the owner's browser (it is not
// in the repository, the backup file or any request except to api.github.com).
(function () {
  'use strict';

  var OWNER = 'bombxdev', REPO = 'bombxdev.github.io', BRANCH = 'master', BASE = 'gta-online/map/';
  var HINTS_PATH = BASE + 'data/hints.json';
  var RAW = 'https://raw.githubusercontent.com/' + OWNER + '/' + REPO + '/' + BRANCH + '/';
  var API = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/';
  var TOKEN_KEY = 'gtaoadmin.token';   // outside the "gtaomap." prefix: never exported in backups
  var MAX_SIDE = 1600;

  var M, t = I18N.t;
  var hints = {};
  var fresh = {};      // src -> blob URL for photos uploaded in this session (Pages may not have rebuilt yet)
  var admin = null;    // { login } once the token is verified
  var busy = false;

  function esc(s) { return M.esc(s); }

  // ---------------------------------------------------------------------------
  // Public part: load and show photos
  // ---------------------------------------------------------------------------
  function loadHints() {
    var urls = ['data/hints.json', RAW + HINTS_PATH];
    return Promise.all(urls.map(function (u) {
      return fetch(u, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    })).then(function (list) {
      var best = null;
      list.forEach(function (d) { if (d && d.photos && (!best || (d.updated || '') > (best.updated || ''))) best = d; });
      if (best) hints = best.photos;
    });
  }

  function url(h) { return fresh[h.src] || h.src + '?v=' + encodeURIComponent(h.added || ''); }

  function popupPhotos(item) {
    var id = M.idOf(item);
    var list = hints[id] || [];
    if (!list.length && !admin) return '';
    return '<div class="hint-photos">' + list.map(function (h, i) {
      return '<figure><button type="button" class="hint-img" data-hint-view="' + esc(id) + '|' + i + '"><img src="' + esc(url(h)) + '" alt="' + esc(h.caption || '') + '" loading="lazy"></button>' +
        (h.caption ? '<figcaption>' + esc(h.caption) + '</figcaption>' : '') +
        (admin ? '<button type="button" class="chip hint-del" data-hint-del="' + esc(id) + '|' + i + '">🗑 ' + esc(t('hint.delete')) + '</button>' : '') +
        '</figure>';
    }).join('') +
      (admin ? '<label class="chip hint-add">📷 ' + esc(t('hint.add')) + '<input type="file" accept="image/*" data-hint-add="' + esc(id) + '" hidden></label>' : '') +
      '</div>';
  }

  // Full-size viewer.
  var viewer = document.createElement('div');
  viewer.className = 'hint-viewer';
  viewer.hidden = true;
  viewer.addEventListener('click', function () { viewer.hidden = true; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') viewer.hidden = true; });
  document.body.appendChild(viewer);

  document.addEventListener('click', function (e) {
    var v = e.target.closest && e.target.closest('[data-hint-view]');
    if (v) {
      var p = v.getAttribute('data-hint-view').split('|');
      var h = (hints[p[0]] || [])[Number(p[1])];
      if (!h) return;
      viewer.innerHTML = '<img src="' + esc(url(h)) + '" alt="">' + (h.caption ? '<div>' + esc(h.caption) + '</div>' : '');
      viewer.hidden = false;
      return;
    }
    var d = e.target.closest && e.target.closest('[data-hint-del]');
    if (d && admin) {
      var q = d.getAttribute('data-hint-del').split('|');
      removePhoto(q[0], Number(q[1]));
    }
  });
  document.addEventListener('change', function (e) {
    var id = e.target.getAttribute && e.target.getAttribute('data-hint-add');
    if (id && admin && e.target.files[0]) addPhoto(id, e.target.files[0]);
  });

  // ---------------------------------------------------------------------------
  // Admin part
  // ---------------------------------------------------------------------------
  function getToken() {
    try { return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
  }
  function setToken(tok, remember) {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
      if (tok) (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, tok);
    } catch (e) { /* storage unavailable */ }
  }

  function gh(method, path, body) {
    return fetch(path.indexOf('https://') === 0 ? path : API + path, {
      method: method,
      cache: 'no-store',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: 'Bearer ' + getToken(),
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      if (r.status === 404 && method === 'GET') return null;
      if (!r.ok) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          var err = new Error((j && j.message) || ('HTTP ' + r.status));
          err.status = r.status;
          throw err;
        });
      }
      return r.status === 204 ? {} : r.json();
    });
  }

  function verify() {
    return gh('GET', 'https://api.github.com/user').then(function (u) {
      if (!u || String(u.login).toLowerCase() !== OWNER) throw new Error(t('hint.notOwner'));
      admin = { login: u.login };
    });
  }

  function b64FromBytes(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function b64FromText(text) { return b64FromBytes(new TextEncoder().encode(text)); }
  function textFromB64(b64) {
    var bin = atob(b64.replace(/\s/g, ''));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  // Read-modify-write of data/hints.json, retried if it changed meanwhile.
  function updateHints(change, message, tries) {
    tries = tries || 0;
    return gh('GET', HINTS_PATH + '?ref=' + BRANCH).then(function (f) {
      var data = f ? JSON.parse(textFromB64(f.content)) : { photos: {} };
      data.photos = data.photos || {};
      change(data.photos);
      data.updated = new Date().toISOString();
      return gh('PUT', HINTS_PATH, {
        message: message, branch: BRANCH, sha: f ? f.sha : undefined,
        content: b64FromText(JSON.stringify(data, null, 1) + '\n')
      }).then(function () { hints = data.photos; });
    }).catch(function (err) {
      if ((err.status === 409 || err.status === 422) && tries < 3) return updateHints(change, message, tries + 1);
      throw err;
    });
  }

  // Resize and re-encode in the browser: smaller files, and the re-encode
  // drops EXIF metadata (GPS position, camera, ...).
  function shrink(file) {
    return createImageBitmap(file, { imageOrientation: 'from-image' }).catch(function () { return createImageBitmap(file); }).then(function (bmp) {
      var k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
      var c = document.createElement('canvas');
      c.width = Math.round(bmp.width * k);
      c.height = Math.round(bmp.height * k);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      return new Promise(function (res) { c.toBlob(res, 'image/webp', 0.82); }).then(function (blob) {
        if (blob && blob.type === 'image/webp') return { blob: blob, ext: 'webp' };
        return new Promise(function (res) { c.toBlob(res, 'image/jpeg', 0.85); }).then(function (b) { return { blob: b, ext: 'jpg' }; });
      });
    });
  }

  function refresh(id) {
    var item = M.findItem(id);
    if (item) M.refreshPopup(item);
  }

  function addPhoto(id, file) {
    if (busy) return;
    var caption = window.prompt(t('hint.captionPrompt'), '') || '';
    busy = true;
    M.toast(t('hint.uploading'));
    var src, blob;
    shrink(file).then(function (r) {
      blob = r.blob;
      src = 'hints/' + id + '-' + Date.now().toString(36) + '.' + r.ext;
      return blob.arrayBuffer();
    }).then(function (buf) {
      return gh('PUT', BASE + src, { message: 'Map photo for ' + id, branch: BRANCH, content: b64FromBytes(new Uint8Array(buf)) });
    }).then(function () {
      var entry = { src: src, caption: caption.slice(0, 200), added: new Date().toISOString() };
      return updateHints(function (photos) { (photos[id] = photos[id] || []).push(entry); }, 'Map photo list: add ' + id);
    }).then(function () {
      fresh[src] = URL.createObjectURL(blob);
      refresh(id);
      M.toast(t('hint.uploaded'));
    }).catch(function (err) {
      M.toast(t('hint.failed', { msg: err.message }));
    }).then(function () { busy = false; });
  }

  function removePhoto(id, i) {
    var h = (hints[id] || [])[i];
    if (!h || busy || !window.confirm(t('hint.confirmDelete'))) return;
    busy = true;
    updateHints(function (photos) {
      var list = (photos[id] || []).filter(function (x) { return x.src !== h.src; });
      if (list.length) photos[id] = list; else delete photos[id];
    }, 'Map photo list: remove ' + id).then(function () {
      return gh('GET', BASE + h.src + '?ref=' + BRANCH);
    }).then(function (f) {
      if (f) return gh('DELETE', BASE + h.src, { message: 'Remove map photo ' + h.src, branch: BRANCH, sha: f.sha });
    }).then(function () {
      refresh(id);
      M.toast(t('hint.deleted'));
    }).catch(function (err) {
      M.toast(t('hint.failed', { msg: err.message }));
    }).then(function () { busy = false; });
  }

  // Sign-in box in the sidebar, only shown with ?admin or a saved token.
  function renderAdmin() {
    var box = document.getElementById('adminBox');
    if (!box) {
      box = document.createElement('section');
      box.id = 'adminBox';
      box.className = 'admin-box';
      document.querySelector('#sidebar .foot').insertAdjacentElement('beforebegin', box);
    }
    if (admin) {
      box.innerHTML = '<div>🔐 ' + esc(t('hint.signedIn', { login: admin.login })) + '</div><p class="muted">' + esc(t('hint.howTo')) + '</p>' +
        '<button type="button" class="chip" id="adminOut">' + esc(t('hint.signOut')) + '</button>';
      box.querySelector('#adminOut').addEventListener('click', function () {
        setToken('');
        admin = null;
        renderAdmin();
        M.toast(t('hint.signedOut'));
      });
      return;
    }
    box.innerHTML = '<div>🔐 ' + esc(t('hint.adminTitle')) + '</div>' +
      '<p class="muted">' + esc(t('hint.tokenHelp')) + ' <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com/settings/personal-access-tokens</a></p>' +
      '<input type="password" id="adminToken" autocomplete="off" spellcheck="false" placeholder="github_pat_…">' +
      '<label class="chip toggle"><input type="checkbox" id="adminRemember"> ' + esc(t('hint.remember')) + '</label>' +
      '<button type="button" class="chip primary" id="adminIn">' + esc(t('hint.signIn')) + '</button>';
    box.querySelector('#adminIn').addEventListener('click', function () {
      var tok = box.querySelector('#adminToken').value.trim();
      if (!tok) return;
      setToken(tok, box.querySelector('#adminRemember').checked);
      verify().then(function () {
        renderAdmin();
        M.toast(t('hint.signedIn', { login: admin.login }));
      }).catch(function (err) {
        setToken('');
        M.toast(t('hint.failed', { msg: err.message }));
      });
    });
  }

  // The map may finish loading before this file runs (scripts load one by one).
  function onReady(fn) {
    if (window.GTAOMap && window.GTAOMap.ready) fn();
    else document.addEventListener('gtao:ready', fn, { once: true });
  }
  onReady(function () {
    M = window.GTAOMap;
    M.popupAll.push(popupPhotos);
    loadHints();
    var wanted = /[?&]admin\b/.test(location.search);
    if (getToken()) {
      verify().catch(function () { setToken(''); }).then(function () { if (admin || wanted) renderAdmin(); });
    } else if (wanted) {
      renderAdmin();
    }
  });
  document.addEventListener('gtao:lang', function () { if (document.getElementById('adminBox')) renderAdmin(); });
})();
