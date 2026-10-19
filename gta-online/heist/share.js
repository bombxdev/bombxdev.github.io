// Share a plan with friends (loaded after heist.js; uses its H, S, cur, t, fmt, gl, ...).
//
// Link: the whole plan lives in the address itself (#plan=<base64url JSON>),
// so nothing is stored on a server: {h: heist, s: settings that differ from the
// defaults, n: optional message}. The friend sees a summary card in their own
// language and can load the plan onto their board.
// Image: the same summary drawn on a canvas as a PNG for chats.
'use strict';
const SharePlan = (() => {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const plain = s => String(s).replace(/<[^>]*>/g, '').replace(/&amp;/g, '&');
  let shared = null;   // {k, st, note} of a plan opened from a link

  // ---------- encode / decode ----------
  function b64url(text){
    const bytes = new TextEncoder().encode(text);
    let s = ''; bytes.forEach(b => { s += String.fromCharCode(b); });
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function unb64url(code){
    const bin = atob(code.replace(/-/g, '+').replace(/_/g, '/'));
    return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
  }
  function encode(k, st, note){
    const def = H[k].defaults, d = {};
    Object.keys(def).forEach(key => { if(JSON.stringify(st[key]) !== JSON.stringify(def[key])) d[key] = st[key]; });
    const o = {h:k, s:d};
    if(note) o.n = note.slice(0, 200);
    return b64url(JSON.stringify(o));
  }
  // Only values the board itself could produce are accepted (a link is outside input).
  function sanitize(k, s){
    const def = H[k].defaults, st = JSON.parse(JSON.stringify(def));
    Object.keys(def).forEach(key => {
      if(!(key in s)) return;
      const a = def[key], b = s[key];
      if(Array.isArray(a) ? Array.isArray(b) && b.every(x => typeof x === typeof (a[0] ?? x)) : typeof b === typeof a) st[key] = b;
    });
    // Check every choice against the board's own options (built from the valid
    // defaults first, since some heists look values up while building them).
    const check = (groups, strict) => groups.forEach(g => {
      if(g.type === 'chips' && !g.options.some(o => o.v === st[g.key] && !(strict && o.dis))) st[g.key] = def[g.key];
      if(g.type === 'multi') st[g.key] = (st[g.key] || []).filter(v => g.options.some(o => o.v === v));
      if(g.type === 'range') st[g.key] = Math.min(g.max, Math.max(g.min, Number(st[g.key]) || g.min));
      if(g.type === 'bags') st.bags = Array.from({length:4}, (_, i) => g.src[st.bags[i]] !== undefined ? st.bags[i] : def.bags[i]);
    });
    check(H[k].groups(JSON.parse(JSON.stringify(def))), false);
    H[k].fix(st);
    check(H[k].groups(st), true);
    H[k].fix(st);
    const cutsOk = Array.isArray(st.cuts) && st.cuts.length === st.players && st.cuts.every(c => Number.isInteger(c) && c >= 15) && sum(st.cuts) === 100;
    if(!cutsOk) st.cuts = evenCuts(st.players);
    return st;
  }
  function decode(code){
    const o = JSON.parse(unb64url(code));
    if(!o || !H[o.h] || typeof o.s !== 'object') throw new Error('bad plan');
    return {k:o.h, st:sanitize(o.h, o.s), note:typeof o.n === 'string' ? o.n.slice(0, 200) : ''};
  }
  const linkFor = (k, st, note) => location.origin + location.pathname + '#plan=' + encode(k, st, note);

  // ---------- what the plan says ----------
  function rows(k, st){
    const out = [];
    let stage = '';
    H[k].groups(st).forEach(g => {
      if(g.stage) stage = g.stage;
      if(g.key.startsWith('_')) return;
      let v = '';
      if(g.type === 'chips'){ const o = g.options.find(x => x.v === st[g.key]); if(o) v = o.l + (gl(o.l) ? ' – ' + gl(o.l) : ''); }
      else if(g.type === 'multi') v = g.options.filter(o => (st[g.key] || []).includes(o.v)).map(o => o.l).join(', ') || t('opt.none');
      else if(g.type === 'bags') v = st.bags.slice(0, st.players).map((b, i) => `P${i + 1}: ${t(g.lk + b)}`).join(' • ');
      else if(g.type === 'range') v = rv(g, st[g.key]);
      out.push({stage, label:g.label, value:plain(v)});
    });
    return out;
  }
  function payouts(k, st){
    const r = H[k].calc(st), pool = Math.max(0, r.gross - sum(r.deducts, d => d.v)), bonus = sum(r.bonus, b => b.v), fee = sum(r.hostFees, f => f.v);
    const list = [];
    for(let i = 0; i < st.players; i++){
      const who = 'P' + (i + 1) + (i === 0 ? ' ' + t('who.host') : '');
      if(r.split === 'host') list.push({who, net:i === 0 ? fmt(pool + bonus - fee) : '≈ $100k–200k'});
      else list.push({who, net:fmt(pool * st.cuts[i] / 100 + bonus - (i === 0 ? fee : 0)) + ` (${st.cuts[i]}%)`});
    }
    return {gross:fmt(r.gross), list};
  }
  const subline = (k, st) => `${H[k].short} • ${players(st.players)} • ${({easy:'Easy', normal:'Normal', hard:'Hard'})[st.diff]}`;

  function cardHTML(k, st, note){
    const p = payouts(k, st);
    let last = '';
    return `<div class="plan-card" style="--h:${H[k].accent}"><div class="plan-head"><b>${esc(H[k].name)}</b><span>${esc(subline(k, st))}</span></div>` +
      (note ? `<p class="plan-note">💬 ${esc(note)}</p>` : '') +
      `<dl class="plan-rows">${rows(k, st).map(r => { const s = r.stage !== last ? `<dt class="plan-stage">${esc(r.stage)}</dt>` : ''; last = r.stage;
        return s + `<div><dt>${esc(r.label)}</dt><dd>${esc(r.value)}</dd></div>`; }).join('')}</dl>` +
      `<div class="plan-pay"><b>💰 ${esc(t('share.payout'))}</b> <span class="muted">${esc(t('sum.gross'))}: ${esc(p.gross)}</span>` +
      `<ul>${p.list.map(x => `<li><span>${esc(x.who)}</span><b>${esc(x.net)}</b></li>`).join('')}</ul></div></div>`;
  }

  // ---------- image ----------
  function wrap(ctx, text, maxW){
    const lines = []; let line = '';
    // Thai/CJK have no spaces: break per character when a word is too long.
    for(const ch of Array.from(text)){
      const test = line + ch;
      if(ctx.measureText(test).width > maxW && line){
        const sp = line.lastIndexOf(' ');
        if(sp > 0 && ch !== ' '){ lines.push(line.slice(0, sp)); line = line.slice(sp + 1) + ch; }
        else { lines.push(line); line = ch === ' ' ? '' : ch; }
      } else line = test;
    }
    if(line) lines.push(line);
    return lines;
  }
  function draw(k, st, note){
    const W = 1080, P = 56, font = '"Noto Sans Thai", "Leelawadee UI", system-ui, -apple-system, "Segoe UI", sans-serif';
    const c = document.createElement('canvas'), ctx = c.getContext('2d');
    const accent = H[k].accent, rs = rows(k, st), pay = payouts(k, st);
    // Lay out first (to know the height), then paint.
    const ops = []; let y = 0;
    const text = (s, x, size, weight, color, maxW) => {
      ctx.font = `${weight} ${size}px ${font}`;
      const lines = wrap(ctx, s, maxW), y0 = y + size;
      lines.forEach((ln, i) => ops.push(() => { ctx.font = `${weight} ${size}px ${font}`; ctx.fillStyle = color; ctx.fillText(ln, x, y0 + i * size * 1.3); }));
      return lines.length * size * 1.3;
    };
    y = 150;                                   // header band
    if(note){ y += 16; y += text('💬 ' + note, P, 30, 500, '#ffffff', W - 2 * P) + 16; }
    let last = '';
    rs.forEach(r => {
      if(r.stage !== last){ y += 22; y += text(r.stage.toUpperCase(), P, 22, 700, accent, W - 2 * P) + 4; last = r.stage; }
      const h1 = text(r.label, P, 24, 400, '#9aa1ad', 360);
      const h2 = text(r.value, P + 380, 26, 600, '#e8eaed', W - 2 * P - 380);
      y += Math.max(h1, h2) + 8;
    });
    y += 30; const payTop = y; y += 20;
    y += text('💰 ' + t('share.payout') + '   ' + t('sum.gross') + ': ' + pay.gross, P + 24, 28, 700, '#ffffff', W - 2 * P - 48) + 10;
    pay.list.forEach(x => {
      text(x.who, P + 24, 28, 500, '#e8eaed', 300);
      ctx.font = `700 32px ${font}`; const w = ctx.measureText(x.net).width, yy = y + 32;
      ops.push(() => { ctx.font = `700 32px ${font}`; ctx.fillStyle = '#3dd68c'; ctx.fillText(x.net, W - P - 24 - w, yy); });
      y += 46;
    });
    const payH = y - payTop + 14; y += 40;
    const footY = y; y += 70;
    c.width = W; c.height = Math.ceil(y);
    ctx.fillStyle = '#111318'; ctx.fillRect(0, 0, W, c.height);
    ctx.fillStyle = accent; ctx.fillRect(0, 0, W, 130);
    ctx.fillStyle = '#ffffff'; ctx.font = `italic 900 48px ${font}`; ctx.fillText(H[k].name, P, 70);
    ctx.font = `500 26px ${font}`; ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillText(subline(k, st), P, 110);
    ctx.fillStyle = '#181b21'; ctx.strokeStyle = '#2c313b'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(P, payTop, W - 2 * P, payH, 16) : ctx.rect(P, payTop, W - 2 * P, payH); ctx.fill(); ctx.stroke();
    ops.forEach(f => f());
    ctx.fillStyle = '#9aa1ad'; ctx.font = `400 22px ${font}`;
    ctx.fillText(t('share.made') + ' · bombxdev.github.io/gta-online/heist', P, footY + 30);
    return c;
  }

  // ---------- share dialog ----------
  const modal = document.createElement('div');
  modal.className = 'share-modal'; modal.hidden = true;
  modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true');
  document.body.appendChild(modal);
  let imgBlob = null;
  function close(){ modal.hidden = true; }
  modal.addEventListener('click', e => { if(e.target === modal) close(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && !modal.hidden) close(); });

  function toast(msg){
    let el = document.getElementById('toast');
    if(!el){ el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg; el.hidden = false;
    clearTimeout(toast.timer); toast.timer = setTimeout(() => { el.hidden = true; }, 3500);
  }
  function refreshImage(){
    const note = modal.querySelector('#shareNote').value.trim();
    const c = draw(cur, S[cur], note);
    const img = modal.querySelector('#shareImg');
    c.toBlob(b => { imgBlob = b; img.src = URL.createObjectURL(b); }, 'image/png');
  }
  function open(){
    const canShareFiles = !!(navigator.canShare && navigator.share && navigator.canShare({files:[new File([''], 'x.png', {type:'image/png'})]}));
    modal.innerHTML = `<div class="share-box"><div class="share-top"><h2>📤 ${esc(t('share.title'))}</h2><button type="button" class="icon-btn" data-x aria-label="${esc(t('share.close'))}">✕</button></div>
      <p class="hint">${esc(t('share.hint'))}</p>
      <label class="share-note"><span>${esc(t('share.note'))}</span><input id="shareNote" maxlength="200" placeholder="${esc(t('share.notePh'))}"></label>
      <div class="share-btns"><button type="button" class="chip primary" data-copy>${esc(t('share.copy'))}</button>
        <button type="button" class="chip" data-save>${esc(t('share.save'))}</button>
        ${canShareFiles ? `<button type="button" class="chip" data-send>${esc(t('share.send'))}</button>` : ''}</div>
      <img id="shareImg" class="share-img" alt="${esc(t('share.planTitle'))}"></div>`;
    modal.hidden = false;
    refreshImage();
    let timer;
    modal.querySelector('#shareNote').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(refreshImage, 300); });
    modal.querySelector('[data-x]').addEventListener('click', close);
    const link = () => linkFor(cur, S[cur], modal.querySelector('#shareNote').value.trim());
    modal.querySelector('[data-copy]').addEventListener('click', () => {
      const url = link();
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast(t('share.copied')))
        .catch(() => { window.prompt(t('share.copy'), url); });
    });
    modal.querySelector('[data-save]').addEventListener('click', () => {
      if(!imgBlob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(imgBlob); a.download = 'heist-plan-' + cur + '.png';
      document.body.appendChild(a); a.click(); a.remove();
    });
    const send = modal.querySelector('[data-send]');
    if(send) send.addEventListener('click', () => {
      if(!imgBlob) return;
      navigator.share({files:[new File([imgBlob], 'heist-plan-' + cur + '.png', {type:'image/png'})], title:H[cur].name, text:link()}).catch(() => {});
    });
  }

  // ---------- a plan opened from a link ----------
  function renderShared(){
    const box = document.getElementById('sharedPlan');
    if(!shared){ box.hidden = true; box.innerHTML = ''; return; }
    box.hidden = false;
    box.innerHTML = `<div class="shared-top"><b>${esc(t('share.from'))}</b><button type="button" class="icon-btn" data-dismiss aria-label="${esc(t('share.dismiss'))}">✕</button></div>` +
      cardHTML(shared.k, shared.st, shared.note) +
      `<button type="button" class="btn" data-use>${esc(t('share.use'))}</button>`;
    box.querySelector('[data-dismiss]').addEventListener('click', () => { shared = null; renderShared(); });
    box.querySelector('[data-use]').addEventListener('click', () => {
      const changed = JSON.stringify(S[shared.k]) !== JSON.stringify(shared.st);
      if(changed && !window.confirm(t('share.useConfirm', {heist:H[shared.k].short}))) return;
      S[shared.k] = shared.st; const k = shared.k; shared = null;
      renderShared(); setHeist(k); toast(t('share.loaded'));
    });
  }
  function fromHash(){
    const m = /^#plan=([A-Za-z0-9_-]+)$/.exec(location.hash);
    if(!m) return false;
    try{ shared = decode(m[1]); }
    catch(e){ shared = null; toast(t('share.bad')); return false; }
    if(view !== 'heist' || cur !== shared.k) setHeist(shared.k);
    else history.replaceState(null, '', '#' + shared.k);
    renderShared();
    document.getElementById('page').scrollTo({top:0});
    return true;
  }
  window.addEventListener('hashchange', fromHash);

  // Called by heist.js once the language is loaded.
  function init(){
    document.getElementById('shareBtn').addEventListener('click', open);
    fromHash();
  }
  return {init, renderShared, encode, decode, draw};
})();
