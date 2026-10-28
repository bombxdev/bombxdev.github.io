// AI Notes: folders of annotated links, data in data/resources.json.
//
// Everyone can read. Editing is for the site owner only: open the page with
// ?admin and sign in with a GitHub fine-grained personal access token that can
// write this repository (Contents: read & write). Changes are committed straight
// to the repository through the GitHub API, so GitHub itself checks the
// permission: the code being public does not let anyone else write. The token
// never leaves the owner's browser (only requests to api.github.com).
(function () {
  'use strict';

  var OWNER = 'bombxdev', REPO = 'bombxdev.github.io', BRANCH = 'master';
  var DATA_PATH = 'ai/data/resources.json';
  var RAW = 'https://raw.githubusercontent.com/' + OWNER + '/' + REPO + '/' + BRANCH + '/';
  var API = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/';
  var TOKEN_KEY = 'gtaoadmin.token';   // same key as the GTA pages: sign in once for the whole site

  var data = { updated: '', root: { id: 'root', name: 'AI', folders: [], links: [] } };
  var admin = null;      // { login } once the token is verified
  var busy = false;
  var currentId = 'root';
  var query = '';

  var $ = function (id) { return document.getElementById(id); };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function safeUrl(u) {
    try {
      var x = new URL(u);
      return (x.protocol === 'https:' || x.protocol === 'http:') ? x.href : '';
    } catch (e) { return ''; }
  }
  function host(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } }

  var toastTimer;
  function toast(msg) {
    var el = $('toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 3500);
  }

  // ---------------------------------------------------------------------------
  // Tree helpers
  // ---------------------------------------------------------------------------
  function find(id, node, path) {
    node = node || data.root;
    path = (path || []).concat(node);
    if (node.id === id) return { node: node, path: path, parent: path[path.length - 2] || null };
    for (var i = 0; i < node.folders.length; i++) {
      var r = find(id, node.folders[i], path);
      if (r) return r;
    }
    return null;
  }
  function findLink(id, node) {
    node = node || data.root;
    for (var i = 0; i < node.links.length; i++) if (node.links[i].id === id) return { link: node.links[i], folder: node };
    for (var j = 0; j < node.folders.length; j++) {
      var r = findLink(id, node.folders[j]);
      if (r) return r;
    }
    return null;
  }
  function countLinks(node) {
    return node.links.length + node.folders.reduce(function (n, f) { return n + countLinks(f); }, 0);
  }
  function flatFolders(node, depth, skipId, out) {
    out = out || [];
    if (node.id === skipId) return out;
    out.push({ id: node.id, label: new Array(depth + 1).join('  ') + (depth ? '└ ' : '') + node.name });
    node.folders.forEach(function (f) { flatFolders(f, depth + 1, skipId, out); });
    return out;
  }

  // ---------------------------------------------------------------------------
  // Thumbnails (computed in the browser, nothing to host)
  // ---------------------------------------------------------------------------
  function shot(u) { return 'https://s.wordpress.com/mshots/v1/' + encodeURIComponent(u) + '?w=640&h=360'; }
  function thumb(l) {
    if (l.image && safeUrl(l.image)) return l.image;
    var u;
    try { u = new URL(l.url); } catch (e) { return ''; }
    var h = u.hostname.replace(/^www\./, '');
    var seg = u.pathname.split('/').filter(Boolean);
    if (h === 'github.com' && seg.length >= 2) return 'https://opengraph.githubassets.com/1/' + encodeURIComponent(seg[0]) + '/' + encodeURIComponent(seg[1]);
    var yt = h === 'youtu.be' ? seg[0] : (/(^|\.)youtube\.com$/.test(h) ? u.searchParams.get('v') : '');
    if (yt && /^[\w-]{11}$/.test(yt)) return 'https://i.ytimg.com/vi/' + yt + '/hqdefault.jpg';
    return shot(l.url);
  }
  // A failed <img> becomes a plain placeholder (error does not bubble: capture it).
  document.addEventListener('error', function (e) {
    var img = e.target;
    if (img && img.tagName === 'IMG' && img.classList.contains('thumb-img')) {
      img.hidden = true;
      img.parentNode.classList.add('noimg');
    }
  }, true);

  // ---------------------------------------------------------------------------
  // Public part: load and render
  // ---------------------------------------------------------------------------
  function loadData() {
    var urls = ['data/resources.json', RAW + DATA_PATH];
    return Promise.all(urls.map(function (u) {
      return fetch(u, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    })).then(function (list) {
      var best = null;
      list.forEach(function (d) { if (d && d.root && (!best || (d.updated || '') > (best.updated || ''))) best = d; });
      if (best) data = best;
    });
  }

  function linkCard(l, folderPath, idx, total) {
    var href = safeUrl(l.url);
    var img = thumb(l);
    return '<article class="card link" data-id="' + esc(l.id) + '">' +
      '<a class="thumb" href="' + esc(href) + '" target="_blank" rel="noopener noreferrer"' + (href ? '' : ' tabindex="-1"') + '>' +
        (img ? '<img class="thumb-img" src="' + esc(img) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : '') +
        '<span class="ph" aria-hidden="true">🔗</span>' +
      '</a>' +
      '<div class="body">' +
        '<h3><a href="' + esc(href) + '" target="_blank" rel="noopener noreferrer">' + esc(l.title || host(l.url) || l.url) + '</a></h3>' +
        '<div class="host">' + esc(host(l.url)) + '</div>' +
        (l.remark ? '<p class="remark">' + esc(l.remark) + '</p>' : '') +
        (folderPath ? '<div class="where">📁 ' + folderPath + '</div>' : '') +
        (admin && !folderPath ? adminBtns('link', l.id, idx, total) : '') +
      '</div></article>';
  }
  function adminBtns(kind, id, idx, total) {
    return '<div class="row-admin">' +
      '<button type="button" class="chip" data-act="up" data-kind="' + kind + '" data-id="' + esc(id) + '"' + (idx === 0 ? ' disabled' : '') + ' title="เลื่อนขึ้น">↑</button>' +
      '<button type="button" class="chip" data-act="down" data-kind="' + kind + '" data-id="' + esc(id) + '"' + (idx === total - 1 ? ' disabled' : '') + ' title="เลื่อนลง">↓</button>' +
      '<button type="button" class="chip" data-act="edit-' + kind + '" data-id="' + esc(id) + '">✏️ แก้ไข</button>' +
      '<button type="button" class="chip danger" data-act="del-' + kind + '" data-id="' + esc(id) + '">🗑 ลบ</button>' +
      '</div>';
  }
  function folderCard(f, idx, total) {
    return '<article class="card folder">' +
      '<a class="folder-link" href="#' + esc(f.id) + '"><span class="ico" aria-hidden="true">📁</span>' +
        '<span><strong>' + esc(f.name) + '</strong><small>' + countLinks(f) + ' ลิงก์' + (f.folders.length ? ' · ' + f.folders.length + ' โฟลเดอร์ย่อย' : '') + '</small></span></a>' +
      (admin ? adminBtns('folder', f.id, idx, total) : '') +
      '</article>';
  }

  function render() {
    var cur = find(currentId);
    if (!cur) { currentId = 'root'; cur = find('root'); }
    document.title = (cur.node.id === 'root' ? '' : cur.node.name + ' · ') + 'AI Notes';

    $('crumbs').innerHTML = cur.path.map(function (n, i) {
      var label = i === 0 ? '🏠 AI' : esc(n.name);
      return i === cur.path.length - 1 ? '<span aria-current="page">' + label + '</span>' : '<a href="#' + (i === 0 ? '' : esc(n.id)) + '">' + label + '</a>';
    }).join('<span class="sep">/</span>');

    renderAdminBar();

    var q = query.trim().toLowerCase();
    if (q) { renderSearch(q); return; }

    var html = '';
    if (cur.node.folders.length) {
      html += '<div class="grid folders">' + cur.node.folders.map(function (f, i) { return folderCard(f, i, cur.node.folders.length); }).join('') + '</div>';
    }
    if (cur.node.links.length) {
      html += '<div class="grid links">' + cur.node.links.map(function (l, i) { return linkCard(l, '', i, cur.node.links.length); }).join('') + '</div>';
    }
    if (!html) html = '<p class="empty muted">ยังไม่มีอะไรในโฟลเดอร์นี้' + (admin ? ' — กดปุ่มด้านบนเพื่อเพิ่ม' : '') + '</p>';
    $('view').innerHTML = html;
  }

  function renderSearch(q) {
    var hits = [];
    (function walk(node, path) {
      node.links.forEach(function (l) {
        if ((l.title + ' ' + l.remark + ' ' + l.url).toLowerCase().indexOf(q) >= 0) hits.push({ l: l, path: path });
      });
      node.folders.forEach(function (f) { walk(f, path.concat(f)); });
    })(data.root, [data.root]);
    $('view').innerHTML = hits.length
      ? '<div class="grid links">' + hits.map(function (h) {
        var trail = h.path.map(function (n, i) { return '<a href="#' + (i === 0 ? '' : esc(n.id)) + '">' + esc(i === 0 ? 'AI' : n.name) + '</a>'; }).join(' / ');
        return linkCard(h.l, trail, 0, 1);
      }).join('') + '</div>'
      : '<p class="empty muted">ไม่พบ “' + esc(q) + '”</p>';
  }

  function renderAdminBar() {
    var bar = $('adminBar');
    bar.hidden = !admin;
    if (!admin) return;
    bar.innerHTML = '<button type="button" class="chip primary" data-act="add-folder">📁 + โฟลเดอร์</button>' +
      '<button type="button" class="chip primary" data-act="add-link">🔗 + ลิงก์</button>' +
      (currentId !== 'root' ? '<button type="button" class="chip" data-act="edit-folder" data-id="' + esc(currentId) + '">✏️ แก้โฟลเดอร์นี้</button>' : '');
  }

  function onHash() {
    currentId = decodeURIComponent(location.hash.replace(/^#/, '')) || 'root';
    render();
  }
  window.addEventListener('hashchange', onHash);
  $('search').addEventListener('input', function (e) { query = e.target.value; render(); });

  // ---------------------------------------------------------------------------
  // Admin: GitHub API
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
      if (!u || String(u.login).toLowerCase() !== OWNER) throw new Error('บัญชีนี้ไม่ใช่เจ้าของเว็บ');
      admin = { login: u.login };
    });
  }

  function b64FromText(text) {
    var bytes = new TextEncoder().encode(text), s = '';
    for (var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function textFromB64(b64) {
    var bin = atob(b64.replace(/\s/g, ''));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  // Re-read the latest file, apply fn(data) to it and commit. Editing the
  // fresh copy by id (not the one on screen) keeps edits from two devices safe;
  // the file sha makes GitHub reject a write if it changed in between (retried).
  function commit(fn, message, tries) {
    tries = tries === undefined ? 2 : tries;
    return gh('GET', DATA_PATH + '?ref=' + BRANCH).then(function (file) {
      var d = file ? JSON.parse(textFromB64(file.content)) : { root: { id: 'root', name: 'AI', folders: [], links: [] } };
      fn(d);
      d.updated = new Date().toISOString();
      return gh('PUT', DATA_PATH, {
        message: message,
        content: b64FromText(JSON.stringify(d, null, 2) + '\n'),
        sha: file ? file.sha : undefined,
        branch: BRANCH
      }).then(function () { data = d; });
    }).catch(function (err) {
      if ((err.status === 409 || err.status === 422) && tries > 0) return commit(fn, message, tries - 1);
      throw err;
    });
  }

  function save(fn, message) {
    if (busy) return Promise.resolve(false);
    busy = true;
    toast('กำลังบันทึก…');
    return commit(fn, message).then(function () {
      toast('บันทึกแล้ว ✓ (เว็บอัปเดตให้คนอื่นใน ~1 นาที)');
      render();
      return true;
    }).catch(function (err) {
      toast('บันทึกไม่สำเร็จ: ' + err.message);
      return false;
    }).then(function (ok) { busy = false; return ok; });
  }

  function need(d, id) {
    var r = find(id, d.root);
    if (!r) throw new Error('ไม่พบโฟลเดอร์ (ถูกลบไปแล้ว?)');
    return r;
  }
  function needLink(d, id) {
    var r = findLink(id, d.root);
    if (!r) throw new Error('ไม่พบลิงก์ (ถูกลบไปแล้ว?)');
    return r;
  }

  // ---------------------------------------------------------------------------
  // Admin: dialogs
  // ---------------------------------------------------------------------------
  var dlg = $('dlg');
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });

  function field(label, inner) { return '<label class="f"><span>' + esc(label) + '</span>' + inner + '</label>'; }
  function folderSelect(selectedId, skipId) {
    return '<select name="folder">' + flatFolders(data.root, 0, skipId).map(function (o) {
      return '<option value="' + esc(o.id) + '"' + (o.id === selectedId ? ' selected' : '') + '>' + esc(o.label) + '</option>';
    }).join('') + '</select>';
  }
  function openDialog(title, body, onSubmit) {
    dlg.innerHTML = '<form method="dialog" class="form"><h2>' + esc(title) + '</h2>' + body +
      '<div class="actions"><button type="button" class="chip" data-close>ยกเลิก</button><button type="submit" class="chip primary">บันทึก</button></div></form>';
    var form = dlg.querySelector('form');
    dlg.querySelector('[data-close]').addEventListener('click', function () { dlg.close(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = {};
      Array.prototype.forEach.call(form.elements, function (el) { if (el.name) v[el.name] = el.value.trim(); });
      if (onSubmit(v, form) !== false) dlg.close();
    });
    dlg.showModal();
    var first = form.querySelector('input,textarea');
    if (first) first.focus();
  }

  function folderDialog(existing) {
    var parentId = existing ? (find(existing.id).parent || data.root).id : currentId;
    openDialog(existing ? 'แก้ไขโฟลเดอร์' : 'เพิ่มโฟลเดอร์',
      field('ชื่อโฟลเดอร์', '<input name="name" required maxlength="80" value="' + esc(existing ? existing.name : '') + '">') +
      (existing && existing.id === 'root' ? '' : field(existing ? 'ย้ายไปอยู่ใน' : 'สร้างใน', folderSelect(parentId, existing && existing.id))),
      function (v) {
        if (!v.name) return false;
        if (existing) {
          save(function (d) {
            var r = need(d, existing.id);
            r.node.name = v.name;
            if (v.folder && r.parent && v.folder !== r.parent.id) {
              var dest = need(d, v.folder).node;
              if (find(dest.id, r.node)) throw new Error('ย้ายโฟลเดอร์เข้าไปในตัวเองไม่ได้');
              r.parent.folders.splice(r.parent.folders.indexOf(r.node), 1);
              dest.folders.push(r.node);
            }
          }, 'ai: แก้ไขโฟลเดอร์ ' + v.name);
        } else {
          save(function (d) {
            need(d, v.folder || currentId).node.folders.push({ id: uid(), name: v.name, folders: [], links: [] });
          }, 'ai: เพิ่มโฟลเดอร์ ' + v.name);
        }
      });
  }

  function linkDialog(existing) {
    var folderId = existing ? findLink(existing.id).folder.id : currentId;
    openDialog(existing ? 'แก้ไขลิงก์' : 'เพิ่มลิงก์',
      field('URL', '<div class="inline"><input name="url" type="url" required placeholder="https://github.com/owner/repo" value="' + esc(existing ? existing.url : '') + '"><button type="button" class="chip" id="fetchMeta">⚡ ดึงข้อมูล</button></div>') +
      field('ชื่อ', '<input name="title" maxlength="200" placeholder="(เว้นว่าง = ดึงอัตโนมัติ/ใช้โดเมน)" value="' + esc(existing ? existing.title : '') + '">') +
      field('Remark', '<textarea name="remark" rows="4" maxlength="2000" placeholder="จดว่าทำไมน่าสนใจ ใช้ทำอะไร">' + esc(existing ? existing.remark : '') + '</textarea>') +
      field('โฟลเดอร์', folderSelect(folderId)) +
      field('รูป thumbnail (เว้นว่าง = อัตโนมัติ)', '<div class="inline"><input name="image" type="url" placeholder="https://…" value="' + esc(existing ? existing.image : '') + '"><button type="button" class="chip" id="useShot">📸 ภาพหน้าเว็บ</button></div>') +
      '<p class="muted small" id="metaStatus">GitHub / YouTube ได้ thumbnail อัตโนมัติ เว็บอื่นใช้ og:image หรือภาพหน้าเว็บ</p>',
      function (v) {
        var url = safeUrl(v.url);
        if (!url) { toast('URL ต้องขึ้นต้นด้วย http:// หรือ https://'); return false; }
        if (v.image && !safeUrl(v.image)) { toast('URL รูปไม่ถูกต้อง'); return false; }
        var rec = { url: url, title: v.title || '', remark: v.remark || '', image: v.image ? safeUrl(v.image) : '' };
        save(function (d) {
          if (existing) {
            var r = needLink(d, existing.id);
            Object.keys(rec).forEach(function (k) { r.link[k] = rec[k]; });
            if (v.folder && v.folder !== r.folder.id) {
              r.folder.links.splice(r.folder.links.indexOf(r.link), 1);
              need(d, v.folder).node.links.push(r.link);
            }
          } else {
            rec.id = uid();
            rec.added = new Date().toISOString();
            need(d, v.folder || currentId).node.links.push(rec);
          }
        }, 'ai: ' + (existing ? 'แก้ไข' : 'เพิ่ม') + 'ลิงก์ ' + (rec.title || host(url)));
      });

    var form = dlg.querySelector('form');
    var status = $('metaStatus');
    $('useShot').addEventListener('click', function () {
      var u = safeUrl(form.elements.url.value.trim());
      if (u) form.elements.image.value = shot(u);
    });
    $('fetchMeta').addEventListener('click', function () {
      var u = safeUrl(form.elements.url.value.trim());
      if (!u) { status.textContent = 'ใส่ URL ก่อน'; return; }
      status.textContent = 'กำลังดึงข้อมูล…';
      fetch('https://api.microlink.io/?url=' + encodeURIComponent(u)).then(function (r) { return r.json(); }).then(function (j) {
        var m = j && j.data;
        if (!m) throw new Error('ไม่พบข้อมูล');
        if (!form.elements.title.value && m.title) form.elements.title.value = m.title;
        if (!form.elements.remark.value && m.description) form.elements.remark.value = m.description;
        if (!form.elements.image.value && m.image && safeUrl(m.image.url)) form.elements.image.value = m.image.url;
        status.textContent = 'ดึงข้อมูลแล้ว ✓ ตรวจ/แก้ได้ก่อนบันทึก';
      }).catch(function (err) { status.textContent = 'ดึงไม่ได้ (' + err.message + ') — กรอกเองได้ หรือปล่อยให้ใช้ thumbnail อัตโนมัติ'; });
    });
  }

  // ---------------------------------------------------------------------------
  // Admin: actions
  // ---------------------------------------------------------------------------
  function move(kind, id, delta) {
    save(function (d) {
      var list, i;
      if (kind === 'folder') { var r = need(d, id); list = r.parent.folders; i = list.indexOf(r.node); }
      else { var l = needLink(d, id); list = l.folder.links; i = list.indexOf(l.link); }
      var j = i + delta;
      if (j < 0 || j >= list.length) return;
      list.splice(j, 0, list.splice(i, 1)[0]);
    }, 'ai: จัดลำดับ');
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-act]');
    if (!b || !admin) return;
    var act = b.getAttribute('data-act'), id = b.getAttribute('data-id'), kind = b.getAttribute('data-kind');
    if (act === 'add-folder') folderDialog(null);
    else if (act === 'add-link') linkDialog(null);
    else if (act === 'edit-folder') { var f = find(id); if (f) folderDialog(f.node); }
    else if (act === 'edit-link') { var l = findLink(id); if (l) linkDialog(l.link); }
    else if (act === 'up') move(kind, id, -1);
    else if (act === 'down') move(kind, id, 1);
    else if (act === 'del-folder') {
      var fo = find(id);
      if (fo && confirm('ลบโฟลเดอร์ “' + fo.node.name + '” และทุกอย่างข้างใน (' + countLinks(fo.node) + ' ลิงก์)?')) {
        save(function (d) { var r = need(d, id); r.parent.folders.splice(r.parent.folders.indexOf(r.node), 1); }, 'ai: ลบโฟลเดอร์ ' + fo.node.name);
      }
    } else if (act === 'del-link') {
      var li = findLink(id);
      if (li && confirm('ลบลิงก์ “' + (li.link.title || li.link.url) + '”?')) {
        save(function (d) { var r = needLink(d, id); r.folder.links.splice(r.folder.links.indexOf(r.link), 1); }, 'ai: ลบลิงก์ ' + (li.link.title || host(li.link.url)));
      }
    }
  });

  // ---------------------------------------------------------------------------
  // Admin: sign-in box (only shown with ?admin or a saved token)
  // ---------------------------------------------------------------------------
  function renderAdmin() {
    var box = $('adminBox');
    box.hidden = false;
    if (admin) {
      box.innerHTML = '<div>🔐 ล็อกอินเป็น <strong>' + esc(admin.login) + '</strong> — แก้ไขได้</div>' +
        '<button type="button" class="chip" id="adminOut">ออกจากระบบ</button>';
      $('adminOut').addEventListener('click', function () {
        setToken('');
        admin = null;
        box.hidden = true;
        render();
        toast('ออกจากระบบแล้ว');
      });
    } else {
      box.innerHTML = '<div>🔐 โหมดเจ้าของ</div>' +
        '<p class="muted small">สร้าง fine-grained token ที่ <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com/settings/personal-access-tokens</a> ' +
        'เลือกเฉพาะ repo <code>' + esc(OWNER + '/' + REPO) + '</code> สิทธิ์ Contents: Read and write แล้ววางด้านล่าง (token ไม่ถูกส่งไปที่ไหนนอกจาก api.github.com)</p>' +
        '<input type="password" id="adminToken" autocomplete="off" spellcheck="false" placeholder="github_pat_…">' +
        '<label class="chip toggle"><input type="checkbox" id="adminRemember"> จำไว้ในเครื่องนี้</label>' +
        '<button type="button" class="chip primary" id="adminIn">เข้าสู่ระบบ</button>';
      $('adminIn').addEventListener('click', function () {
        var tok = $('adminToken').value.trim();
        if (!tok) return;
        setToken(tok, $('adminRemember').checked);
        verify().then(function () {
          renderAdmin();
          render();
          toast('ล็อกอินเป็น ' + admin.login);
        }).catch(function (err) {
          setToken('');
          toast('ล็อกอินไม่สำเร็จ: ' + err.message);
        });
      });
    }
  }

  // ---------------------------------------------------------------------------
  loadData().then(function () {
    onHash();
    var wanted = /[?&]admin\b/.test(location.search);
    if (getToken()) {
      verify().catch(function () { setToken(''); }).then(function () { if (admin || wanted) renderAdmin(); render(); });
    } else if (wanted) {
      renderAdmin();
    }
  });
})();
