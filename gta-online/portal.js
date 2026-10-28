// GTAO OS: the /gta-online/ portal. A small "desktop" whose apps are the
// site's pages: icons open a window with shortcuts, the dock and the start
// menu open the pages, and widgets show today's daily locations (same logic
// as the map, ../map/daily.js) and the in-game clock.
'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const t = (k, v) => I18N.t(k, v);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const LANG_KEY = 'gtaomap.lang';   // shared with the map and the heist planner
  const mobile = window.matchMedia('(max-width: 760px)');

  // ---------- apps (icons are original drawings) ----------
  const ICONS = {
    map:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"><path d="M3 6.5 8.5 4l7 2.5L21 4v13.5L15.5 20l-7-2.5L3 20z" fill="rgba(255,255,255,.15)"/><path d="M8.5 4v13.5M15.5 6.5V20"/><circle cx="12" cy="10" r="2.2" fill="#fff" stroke="none"/></svg>',
    heist:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"><rect x="3" y="3.5" width="18" height="17" rx="3" fill="rgba(255,255,255,.15)"/><circle cx="12" cy="12" r="4.5"/><path d="M12 7.5v2M12 14.5v2M7.5 12h2M14.5 12h2"/><circle cx="12" cy="12" r="1.2" fill="#fff"/><path d="M6.5 20.5v1.5M17.5 20.5v1.5" stroke-linecap="round"/></svg>',
    guide:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"><path d="M12 6.5C10 5 6.5 4.5 3.5 5v13c3-.5 6.5 0 8.5 1.5 2-1.5 5.5-2 8.5-1.5V5c-3-.5-6.5 0-8.5 1.5z" fill="rgba(255,255,255,.15)"/><path d="M12 6.5v13"/></svg>',
    credits:'<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" fill="#fff"/></svg>',
    about:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"><circle cx="12" cy="12" r="8.5" fill="rgba(255,255,255,.15)"/><path d="M12 11v6" stroke-linecap="round"/><circle cx="12" cy="7.6" r="1.2" fill="#fff" stroke="none"/></svg>'
  };
  const APPS = [
    {id:'map', href:'map/', bg:'linear-gradient(145deg,#3ccf8e,#14794b)', c:'#22a868', feats:3},
    {id:'heist', href:'heist/', bg:'linear-gradient(145deg,#ff9a55,#c93d1f)', c:'#e0632f', feats:3},
    {id:'guide', href:'heist/#guide', bg:'linear-gradient(145deg,#6cb8ff,#2e5fd6)', c:'#3d7be0', feats:3},
    {id:'credits', href:'map/credits.html', bg:'linear-gradient(145deg,#ff7aa8,#c2366b)', c:'#d84a7f', feats:0},
    {id:'about', href:null, bg:'linear-gradient(145deg,#9aa3b8,#4d556b)', c:'#5c667e', feats:0}
  ];
  const HEISTS = [['kortz', '🖼', 'Kortz Center'], ['cayo', '🏝', 'Cayo Perico'], ['casino', '💎', 'Diamond Casino'], ['doom', '🛰', 'Doomsday'], ['og', '🏦', 'Original Heists']];
  const CAYO_SCOPE = 'cayo_infiltration,cayo_entrances,cayo_escape,cayo_key_places,cayo_bolt_cutters,cayo_grapple,cayo_uniform,cayo_supply_truck,cayo_loot_island,cayo_loot_compound,cayo_paintings';
  let today = null;   // {gunVan, gunVanZone, dealers: [[n, zone]], start}

  function shortcuts(id){
    if(id === 'map') return [
      today && ['🔫', t('p.lnkGunVan') + ` #${today.gunVan + 1}`, 'map/#gun_van-' + (today.gunVan + 1)],
      ['🏝', t('p.lnkCayoScope'), 'map/#show:' + CAYO_SCOPE],
      ['🖼', t('p.lnkKortzScope'), 'map/#show:kortz_entry,kortz_poi'],
      ['📍', t('p.lnkAllMap'), 'map/']
    ].filter(Boolean);
    if(id === 'heist') return HEISTS.map(([k, ic, name]) => [ic, name, 'heist/#' + k]);
    if(id === 'guide') return [['📷', t('p.lnkGuideScope'), 'heist/#guide:scope'], ['🏆', t('p.lnkGuideCmm'), 'heist/#guide:cmm'],
      ['💰', t('p.lnkGuideCut'), 'heist/#guide:cut'], ['📘', t('p.lnkGuide'), 'heist/#guide']];
    return [];
  }
  const appIcon = (a, size) => `<span class="app-ic" style="background:${a.bg}${size ? `;width:${size}px;height:${size}px` : ''}">${ICONS[a.id]}</span>`;

  // ---------- desktop icons & dock ----------
  function renderIcons(){
    $('icons').innerHTML = APPS.map(a => `<button type="button" class="icon" data-app="${a.id}" title="${esc(t('p.' + a.id + 'Sub'))}">${appIcon(a)}<span>${esc(t('p.' + a.id))}</span></button>`).join('');
    $('dock').innerHTML = APPS.filter(a => a.href).map(a =>
      `<a href="${a.href}" data-dock="${a.id}">${appIcon(a)}<span class="tip">${esc(t('p.' + a.id))}</span><span class="dot"></span></a>`).join('') +
      `<span class="sep"></span><button type="button" data-app="about">${appIcon(APPS[4])}<span class="tip">${esc(t('p.about'))}</span><span class="dot"></span></button>`;
    markOpen();
  }
  $('icons').addEventListener('click', e => {
    const b = e.target.closest('[data-app]'); if(!b) return;
    document.querySelectorAll('.icon.sel').forEach(x => x.classList.remove('sel'));
    b.classList.add('sel');
    openWin(b.dataset.app);
  });
  $('icons').addEventListener('dblclick', e => {
    const b = e.target.closest('[data-app]'); if(!b) return;
    const a = APPS.find(x => x.id === b.dataset.app);
    if(a.href) location.href = a.href;
  });
  $('dock').addEventListener('click', e => { const b = e.target.closest('button[data-app]'); if(b) openWin(b.dataset.app); });

  // ---------- windows ----------
  let z = 10, opened = 0;
  const wins = {};
  function winHTML(a){
    const quick = shortcuts(a.id);
    let body = `<div class="win-head">${appIcon(a)}<div><h2>${esc(t('p.' + a.id))}</h2><p>${esc(t('p.' + a.id + 'Sub'))}</p></div></div>`;
    if(a.id === 'about') body += `<div class="about">${[1, 2, 3].map(i => `<p>${esc(t('p.about' + i))}</p>`).join('')}<p class="muted">${esc(t('p.legal'))}</p></div>`;
    if(a.feats) body += `<ul class="feat">${Array.from({length:a.feats}, (_, i) => `<li>${esc(t('p.' + a.id + 'F' + (i + 1)))}</li>`).join('')}</ul>`;
    if(quick.length) body += `<div class="quick"><h3>${esc(t('p.quick'))}</h3><div class="quick-grid">${quick.map(([ic, label, href]) => `<a href="${href}"><span aria-hidden="true">${ic}</span>${esc(label)}</a>`).join('')}</div></div>`;
    if(a.href) body += `<a class="open-btn" href="${a.href}" style="--c:${a.c}">${esc(t('p.open'))} ${esc(t('p.' + a.id))} →</a>`;
    return `<div class="win-bar"><span class="lights"><button type="button" class="x" data-close aria-label="${esc(t('p.close'))}" title="${esc(t('p.close'))}"></button>` +
      `<button type="button" class="m" data-max aria-label="${esc(t('p.maximize'))}" title="${esc(t('p.maximize'))}"></button></span>` +
      `<span class="win-title">${esc(t('p.' + a.id))}</span></div><div class="win-body">${body}</div>`;
  }
  function openWin(id){
    const a = APPS.find(x => x.id === id);
    let w = wins[id];
    if(!w){
      w = document.createElement('section');
      w.className = 'win'; w.dataset.win = id; w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', t('p.' + id));
      const d = $('desktop').getBoundingClientRect();
      const n = opened++ % 5;
      w.style.left = Math.max(8, Math.min(d.width - 480, d.width / 2 - 230 + n * 28 - 80)) + 'px';
      w.style.top = Math.max(8, 40 + n * 28) + 'px';
      $('windows').appendChild(w); wins[id] = w;
      w.addEventListener('pointerdown', () => focusWin(w));
      bindDrag(w);
    }
    w.innerHTML = winHTML(a);
    w.querySelector('[data-close]').addEventListener('click', () => closeWin(id));
    w.querySelector('[data-max]').addEventListener('click', () => w.classList.toggle('max'));
    focusWin(w); markOpen();
    const first = w.querySelector('.open-btn, .quick-grid a'); if(first && !mobile.matches) first.focus({preventScroll:true});
  }
  function closeWin(id){ const w = wins[id]; if(!w) return; w.remove(); delete wins[id]; markOpen(); setActive(); }
  function focusWin(w){ w.style.zIndex = ++z; setActive(w.dataset.win); }
  function setActive(id){
    if(!id){ const top = Object.values(wins).sort((a, b) => b.style.zIndex - a.style.zIndex)[0]; id = top && top.dataset.win; }
    $('activeApp').textContent = id ? t('p.' + id) : t('p.desktop');
  }
  function markOpen(){ document.querySelectorAll('#dock [data-dock], #dock [data-app]').forEach(el => el.classList.toggle('open', !!wins[el.dataset.dock || el.dataset.app])); }
  function bindDrag(w){
    let sx, sy, ox, oy, on = false;
    w.addEventListener('pointerdown', e => {
      if(mobile.matches || w.classList.contains('max') || !e.target.closest('.win-bar') || e.target.closest('button')) return;
      on = true; sx = e.clientX; sy = e.clientY; ox = w.offsetLeft; oy = w.offsetTop;
      w.setPointerCapture(e.pointerId);
    });
    w.addEventListener('pointermove', e => {
      if(!on) return;
      const d = $('desktop').getBoundingClientRect();
      w.style.left = Math.max(-w.offsetWidth + 80, Math.min(d.width - 80, ox + e.clientX - sx)) + 'px';
      w.style.top = Math.max(0, Math.min(d.height - 40, oy + e.clientY - sy)) + 'px';
    });
    w.addEventListener('pointerup', () => { on = false; });
    w.querySelector && w.addEventListener('dblclick', e => { if(e.target.closest('.win-bar') && !mobile.matches) w.classList.toggle('max'); });
  }
  document.addEventListener('keydown', e => {
    if(e.key !== 'Escape') return;
    if(!$('launcher').hidden) return toggleLauncher(false);
    const top = Object.values(wins).sort((a, b) => b.style.zIndex - a.style.zIndex)[0];
    if(top) closeWin(top.dataset.win);
  });

  // ---------- launcher ----------
  function launchItems(){
    const items = [];
    APPS.forEach(a => items.push({grp:'apps', ic:appIcon(a, 30), label:t('p.' + a.id), sub:t('p.' + a.id + 'Sub'), href:a.href, app:a.id}));
    APPS.forEach(a => shortcuts(a.id).forEach(([ic, label, href]) => items.push({grp:'quick', ic:`<span class="app-ic" style="background:${a.bg};width:30px;height:30px;font-size:15px">${ic}</span>`, label, sub:t('p.' + a.id), href})));
    return items;
  }
  function renderLauncher(){
    const q = $('launchSearch').value.trim().toLowerCase();
    const items = launchItems().filter(i => !q || (i.label + ' ' + i.sub).toLowerCase().includes(q));
    let html = '', grp = '';
    items.forEach(i => {
      if(i.grp !== grp){ grp = i.grp; html += `<div class="grp">${esc(t(grp === 'apps' ? 'p.apps' : 'p.quick'))}</div>`; }
      html += `<a href="${i.href || '#'}"${i.app && !i.href ? ` data-app="${i.app}"` : ''}>${i.ic}<span>${esc(i.label)}<small>${esc(i.sub)}</small></span></a>`;
    });
    $('launchList').innerHTML = html || `<p class="muted">${esc(t('p.noResults'))}</p>`;
  }
  function toggleLauncher(open){
    open = open === undefined ? $('launcher').hidden : open;
    $('launcher').hidden = !open; $('startBtn').setAttribute('aria-expanded', open);
    if(open){ $('launchSearch').value = ''; renderLauncher(); $('launchSearch').focus(); }
  }
  $('startBtn').addEventListener('click', () => toggleLauncher());
  $('launchSearch').addEventListener('input', renderLauncher);
  $('launchSearch').addEventListener('keydown', e => { if(e.key === 'Enter'){ const a = $('launchList').querySelector('a'); if(a) a.click(); } });
  $('launchList').addEventListener('click', e => {
    const a = e.target.closest('a[data-app]'); if(!a) return;
    e.preventDefault(); toggleLauncher(false); openWin(a.dataset.app);
  });
  document.addEventListener('pointerdown', e => {
    if(!$('launcher').hidden && !e.target.closest('#launcher') && !e.target.closest('#startBtn')) toggleLauncher(false);
  });

  // ---------- clocks & widgets ----------
  const pad = n => String(n).padStart(2, '0');
  let timeFmt;
  function tick(){
    const now = Date.now() / 1000, g = GTAODaily.gameTime(now);
    $('gameClock').textContent = `🎮 ${pad(g.hour)}:${pad(g.minute)}`;
    $('gameClock').title = t('p.gameTime');
    $('realClock').textContent = timeFmt ? timeFmt.format(new Date()) : '';
    const left = today ? Math.max(0, today.start + 86400 - now) : 0;
    const resetTxt = today ? t('p.resetIn', {h:Math.floor(left / 3600), m:pad(Math.floor(left % 3600 / 60))}) : '';
    $('resetIn').textContent = resetTxt ? '⟳ ' + resetTxt : '';
    const big = document.querySelector('.w-clock .big'); if(big) big.textContent = `${pad(g.hour)}:${pad(g.minute)}`;
    const rs = document.querySelector('[data-reset]'); if(rs) rs.textContent = resetTxt;
    if(today && now >= today.start + 86400) loadToday();   // a new day started
  }
  function renderWidgets(){
    let html = `<section class="widget w-clock"><h2><span>${esc(t('p.gameTime'))}</span><span>🎮</span></h2><div class="big"></div>` +
      `<div class="sub">${esc(t('p.clockHint'))}</div></section>`;
    if(today){
      html += `<section class="widget"><h2><span>${esc(t('p.today'))}</span><span data-reset></span></h2>` +
        `<div class="w-row"><span class="g">🔫</span><div><div class="n">${esc(t('p.gunVan'))}</div><div class="w-links"><a href="map/#gun_van-${today.gunVan + 1}">#${today.gunVan + 1} · ${esc(today.gunVanZone)}</a></div></div></div>` +
        `<div class="w-row"><span class="g">💊</span><div><div class="n">${esc(t('p.dealers'))}</div><div class="w-links">${today.dealers.map(([n, zone]) => `<a href="map/#street_dealers-${n + 1}">#${n + 1} · ${esc(zone)}</a>`).join('')}</div></div></div>` +
        `</section>`;
    }
    $('widgets').innerHTML = html;
    tick();
  }
  function loadToday(){
    const get = u => fetch(u, {cache:'no-cache'}).then(r => r.ok ? r.json() : null).catch(() => null);
    return Promise.all([get('map/data/daily.json?v=' + window.APP_VERSION), get('map/data/points.json?v=' + window.APP_VERSION), get('map/data/zones.json?v=' + window.APP_VERSION), get('map/data/tunables.json')])
      .then(([daily, points, zones, tun]) => {
        if(!daily || !points) return;
        daily.dealerXY = points.street_dealers;
        const r = GTAODaily.compute(Date.now() / 1000, daily, tun);
        const zone = (cat, i) => (zones && zones[cat] && zones[cat][i]) || '';
        today = {start:r.start, gunVan:r.lists.gun_van[0], gunVanZone:zone('gun_van', r.lists.gun_van[0]),
          dealers:(r.lists.street_dealers || []).map(i => [i, zone('street_dealers', i)])};
        renderWidgets();
        if(wins.map) openWin('map');
      });
  }

  // ---------- boot, language ----------
  function boot(){
    let seen = false;
    try{ seen = sessionStorage.getItem('gtaoos.booted') === '1'; sessionStorage.setItem('gtaoos.booted', '1'); }catch(e){}
    if(seen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const b = $('boot'); b.hidden = false;
    setTimeout(() => { b.classList.add('out'); setTimeout(() => { b.hidden = true; }, 400); }, 1100);
  }
  function applyLanguage(){
    I18N.apply(document);
    $('lang').value = I18N.code;
    document.title = 'GTAO OS – ' + t('p.title');
    timeFmt = new Intl.DateTimeFormat(I18N.code, {hour:'2-digit', minute:'2-digit'});
    renderIcons(); renderWidgets();
    Object.keys(wins).forEach(openWin);
    if(!$('launcher').hidden) renderLauncher();
    setActive();
  }
  boot();
  let saved = null;
  try{ saved = JSON.parse(localStorage.getItem(LANG_KEY)); }catch(e){}
  I18N.init().then(() => {
    const sel = $('lang');
    I18N.languages.forEach(l => { const o = document.createElement('option'); o.value = l.code; o.textContent = l.label; sel.appendChild(o); });
    sel.addEventListener('change', () => {
      try{ localStorage.setItem(LANG_KEY, JSON.stringify(sel.value)); }catch(e){}
      I18N.use(sel.value).then(applyLanguage);
    });
    return I18N.use(I18N.detect(saved));
  }).then(() => { applyLanguage(); loadToday(); setInterval(tick, 1000); }).catch(err => console.error(err));
})();
