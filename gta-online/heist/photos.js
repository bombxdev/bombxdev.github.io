// Photos for the heist planner (data/photos.json), e.g. an in-game screenshot
// of an entry point or of a step in the beginner guide.
//
// Admin mode works like the map's (../map/hints.js): open the page with ?admin
// and sign in with the same GitHub fine-grained token (it is shared with the
// map, so signing in on one page is enough). Photos are committed straight to
// the repository through the GitHub API, so GitHub itself checks the
// permission; the token never leaves the owner's browser.
//
// Slots (where a photo belongs):
//   hero:<heist>              top of a heist
//   step:<heist>.<sN>         a step of the "step by step" card
//   opt:<heist>.<group>.<v>   a choice on the board (shown while it is selected)
'use strict';
const HeistPhotos = (() => {
  const OWNER = 'bombxdev', REPO = 'bombxdev.github.io', BRANCH = 'master', BASE = 'gta-online/heist/';
  const PHOTOS_PATH = BASE + 'data/photos.json';
  const RAW = 'https://raw.githubusercontent.com/' + OWNER + '/' + REPO + '/' + BRANCH + '/';
  const API = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/';
  const TOKEN_KEY = 'gtaoadmin.token';   // same key as the map: one sign-in for both pages
  const MAX_SIDE = 1600;

  let photos = {};
  const fresh = {};    // src -> blob URL for photos uploaded in this session (Pages may not have rebuilt yet)
  let admin = null;    // { login } once the token is verified
  let busy = false;
  let onChange = () => {};

  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const tt = (k, v) => I18N.t(k, v);

  function toast(msg){
    let el = document.getElementById('toast');
    if(!el){ el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg; el.hidden = false;
    clearTimeout(toast.timer); toast.timer = setTimeout(() => { el.hidden = true; }, 3500);
  }

  // ---------- public part: load and show ----------
  function load(){
    // The local copy is what Pages serves; the raw copy is newer right after an upload.
    return Promise.all(['data/photos.json', RAW + PHOTOS_PATH].map(u =>
      fetch(u, {cache:'no-cache'}).then(r => r.ok ? r.json() : null).catch(() => null)
    )).then(list => {
      let best = null;
      list.forEach(d => { if(d && d.photos && (!best || (d.updated || '') > (best.updated || ''))) best = d; });
      if(best){ photos = best.photos; onChange(); }
    });
  }
  const url = h => fresh[h.src] || h.src + '?v=' + encodeURIComponent(h.added || '');

  function html(slot){
    const list = photos[slot] || [];
    if(!list.length && !admin) return '';
    return `<div class="hint-photos" data-slot="${esc(slot)}">` + list.map((h, i) =>
      `<figure><button type="button" class="hint-img" data-photo-view="${esc(slot)}|${i}"><img src="${esc(url(h))}" alt="${esc(h.caption || '')}" loading="lazy"></button>` +
      (h.caption ? `<figcaption>${esc(h.caption)}</figcaption>` : '') +
      (admin ? `<button type="button" class="chip hint-del" data-photo-del="${esc(slot)}|${i}">🗑 ${esc(tt('hint.delete'))}</button>` : '') +
      '</figure>').join('') +
      (admin ? `<label class="chip hint-add">📷 ${esc(tt('hint.add'))}<input type="file" accept="image/*" data-photo-add="${esc(slot)}" hidden></label>` : '') +
      '</div>';
  }

  const viewer = document.createElement('div');
  viewer.className = 'hint-viewer'; viewer.hidden = true;
  viewer.addEventListener('click', () => { viewer.hidden = true; });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') viewer.hidden = true; });
  document.body.appendChild(viewer);

  document.addEventListener('click', e => {
    const v = e.target.closest && e.target.closest('[data-photo-view]');
    if(v){
      const [slot, i] = v.getAttribute('data-photo-view').split('|'), h = (photos[slot] || [])[Number(i)];
      if(!h) return;
      viewer.innerHTML = `<img src="${esc(url(h))}" alt="">` + (h.caption ? `<div>${esc(h.caption)}</div>` : '');
      viewer.hidden = false;
      return;
    }
    const d = e.target.closest && e.target.closest('[data-photo-del]');
    if(d && admin){ const [slot, i] = d.getAttribute('data-photo-del').split('|'); removePhoto(slot, Number(i)); }
  });
  document.addEventListener('change', e => {
    const slot = e.target.getAttribute && e.target.getAttribute('data-photo-add');
    if(slot && admin && e.target.files[0]) addPhoto(slot, e.target.files[0]);
  });

  // ---------- admin part ----------
  function getToken(){ try{ return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || ''; }catch(e){ return ''; } }
  function setToken(tok, remember){
    try{
      sessionStorage.removeItem(TOKEN_KEY); localStorage.removeItem(TOKEN_KEY);
      if(tok) (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, tok);
    }catch(e){}
  }
  function gh(method, path, body){
    return fetch(path.startsWith('https://') ? path : API + path, {
      method, cache:'no-store',
      headers:{Accept:'application/vnd.github+json', Authorization:'Bearer ' + getToken(), 'X-GitHub-Api-Version':'2022-11-28'},
      body:body ? JSON.stringify(body) : undefined
    }).then(r => {
      if(r.status === 404 && method === 'GET') return null;
      if(!r.ok) return r.json().catch(() => ({})).then(j => { const err = new Error((j && j.message) || ('HTTP ' + r.status)); err.status = r.status; throw err; });
      return r.status === 204 ? {} : r.json();
    });
  }
  function verify(){
    return gh('GET', 'https://api.github.com/user').then(u => {
      if(!u || String(u.login).toLowerCase() !== OWNER) throw new Error(tt('hint.notOwner'));
      admin = {login:u.login};
    });
  }
  function b64FromBytes(bytes){
    let s = '';
    for(let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  const b64FromText = text => b64FromBytes(new TextEncoder().encode(text));
  function textFromB64(b64){
    const bin = atob(b64.replace(/\s/g, '')), bytes = new Uint8Array(bin.length);
    for(let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  // Read-modify-write of data/photos.json, retried if it changed meanwhile.
  function update(change, message, tries = 0){
    return gh('GET', PHOTOS_PATH + '?ref=' + BRANCH).then(f => {
      const data = f ? JSON.parse(textFromB64(f.content)) : {photos:{}};
      data.photos = data.photos || {};
      change(data.photos);
      data.updated = new Date().toISOString();
      return gh('PUT', PHOTOS_PATH, {message, branch:BRANCH, sha:f ? f.sha : undefined, content:b64FromText(JSON.stringify(data, null, 1) + '\n')})
        .then(() => { photos = data.photos; });
    }).catch(err => {
      if((err.status === 409 || err.status === 422) && tries < 3) return update(change, message, tries + 1);
      throw err;
    });
  }

  // Resize and re-encode in the browser: smaller files, and the re-encode drops EXIF metadata.
  function shrink(file){
    return createImageBitmap(file, {imageOrientation:'from-image'}).catch(() => createImageBitmap(file)).then(bmp => {
      const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height)), c = document.createElement('canvas');
      c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      return new Promise(res => c.toBlob(res, 'image/webp', 0.82)).then(blob => {
        if(blob && blob.type === 'image/webp') return {blob, ext:'webp'};
        return new Promise(res => c.toBlob(res, 'image/jpeg', 0.85)).then(b => ({blob:b, ext:'jpg'}));
      });
    });
  }

  const fileName = slot => slot.replace(/[^a-z0-9.-]+/gi, '_');
  function addPhoto(slot, file){
    if(busy) return;
    const caption = window.prompt(tt('hint.captionPrompt'), '') || '';
    busy = true; toast(tt('hint.uploading'));
    let src, blob;
    shrink(file).then(r => {
      blob = r.blob; src = 'photos/' + fileName(slot) + '-' + Date.now().toString(36) + '.' + r.ext;
      return blob.arrayBuffer();
    }).then(buf => gh('PUT', BASE + src, {message:'Heist photo for ' + slot, branch:BRANCH, content:b64FromBytes(new Uint8Array(buf))}))
      .then(() => update(p => { (p[slot] = p[slot] || []).push({src, caption:caption.slice(0, 200), added:new Date().toISOString()}); }, 'Heist photo list: add ' + slot))
      .then(() => { fresh[src] = URL.createObjectURL(blob); onChange(); toast(tt('hint.uploaded')); })
      .catch(err => toast(tt('hint.failed', {msg:err.message})))
      .then(() => { busy = false; });
  }
  function removePhoto(slot, i){
    const h = (photos[slot] || [])[i];
    if(!h || busy || !window.confirm(tt('hint.confirmDelete'))) return;
    busy = true;
    update(p => { const list = (p[slot] || []).filter(x => x.src !== h.src); if(list.length) p[slot] = list; else delete p[slot]; }, 'Heist photo list: remove ' + slot)
      .then(() => gh('GET', BASE + h.src + '?ref=' + BRANCH))
      .then(f => { if(f) return gh('DELETE', BASE + h.src, {message:'Remove heist photo ' + h.src, branch:BRANCH, sha:f.sha}); })
      .then(() => { onChange(); toast(tt('hint.deleted')); })
      .catch(err => toast(tt('hint.failed', {msg:err.message})))
      .then(() => { busy = false; });
  }

  // Sign-in box in the sidebar, only shown with ?admin or a saved token.
  let wanted = false;
  function renderAdmin(){
    if(!admin && !wanted) return;
    let box = document.getElementById('adminBox');
    if(!box){
      box = document.createElement('section'); box.id = 'adminBox'; box.className = 'admin-box';
      document.querySelector('#sidebar .foot').insertAdjacentElement('beforebegin', box);
    }
    if(admin){
      box.innerHTML = `<div>🔐 ${esc(tt('hint.signedIn', {login:admin.login}))}</div><p class="muted">${esc(tt('photo.howTo'))}</p>` +
        `<button type="button" class="chip" id="adminOut">${esc(tt('hint.signOut'))}</button>`;
      box.querySelector('#adminOut').addEventListener('click', () => { setToken(''); admin = null; renderAdmin(); onChange(); toast(tt('hint.signedOut')); });
      return;
    }
    box.innerHTML = `<div>🔐 ${esc(tt('hint.adminTitle'))}</div>` +
      `<p class="muted">${esc(tt('hint.tokenHelp'))} <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com/settings/personal-access-tokens</a></p>` +
      '<input type="password" id="adminToken" autocomplete="off" spellcheck="false" placeholder="github_pat_…">' +
      `<label class="chip toggle"><input type="checkbox" id="adminRemember"> ${esc(tt('hint.remember'))}</label>` +
      `<button type="button" class="chip primary" id="adminIn">${esc(tt('hint.signIn'))}</button>`;
    box.querySelector('#adminIn').addEventListener('click', () => {
      const tok = box.querySelector('#adminToken').value.trim();
      if(!tok) return;
      setToken(tok, box.querySelector('#adminRemember').checked);
      verify().then(() => { renderAdmin(); onChange(); toast(tt('hint.signedIn', {login:admin.login})); })
        .catch(err => { setToken(''); toast(tt('hint.failed', {msg:err.message})); });
    });
  }

  // Called by heist.js once the language is loaded; `rerender` redraws the page.
  function init(rerender){
    onChange = rerender;
    wanted = /[?&]admin\b/.test(location.search);
    load();
    if(getToken()) verify().catch(() => setToken('')).then(() => { renderAdmin(); if(admin) onChange(); });
    else renderAdmin();
  }
  return {init, html, renderAdmin};
})();
