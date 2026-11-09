/* GTA Online FAQ. Which questions exist, their topic, confidence and sources live in
   data/faq.json; every sentence shown to the reader lives in i18n/<code>.json
   (keys i.<id>.q / .insight / .explain / .rec), so data and wording stay separate.
   Cards whose id starts with "r" summarise the r/gtaonline FAQ thread (keys i.<id>.q / .a / .note);
   their "ref" is the GTAFAQ-xxx id of the research handoff they came from. */
'use strict';
const $ = id => document.getElementById(id);
const t = (k, v) => I18N.t(k, v);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const LANG_KEY = 'gtaomap.lang';   // shared with the map and the heist planner (JSON string)
const CONF = ['verified', 'consensus', 'thread', 'reply', 'opinion', 'unconfirmed'];

let DATA = null, cat = 'all', query = '';

function reviewedDate(){
  try{ return new Date(DATA.reviewed + 'T00:00:00').toLocaleDateString(I18N.code, {year:'numeric', month:'long', day:'numeric'}); }
  catch(e){ return DATA.reviewed; }
}
const badge = c => `<span class="badge ${c}" title="${esc(t('f.conf'))}">${esc(t('f.conf.' + c))}</span>`;

function itemHTML(it, open){
  const k = 'i.' + it.id + '.';
  return `<details class="qa" id="q-${it.id}"${open ? ' open' : ''}>
    <summary><span>${esc(t(k + 'q'))}</span>${badge(it.conf)}</summary>
    <div class="body">
      ${it.ref ? `<h3>${esc(t('f.answer'))}</h3><p>${esc(t(k + 'a'))}</p>` +
        (it.note ? `<p class="note">⚠️ <b>${esc(t('f.note'))}:</b> ${esc(t(k + 'note'))}</p>` : '') :
      `<h3>${esc(t('f.insight'))}</h3><p>${esc(t(k + 'insight'))}</p>
      <h3>${esc(t('f.explain'))}</h3><p>${esc(t(k + 'explain'))}</p>
      <h3>${esc(t('f.rec'))}</h3><p class="rec">${esc(t(k + 'rec'))}</p>`}
      ${it.link ? `<p><a href="${esc(it.link[0])}">${esc(t(it.link[1]))}</a></p>` : ''}
      ${it.related ? `<p class="related">${esc(t('f.related'))}: ${it.related.map(r =>
        `<a href="#q-${r}" data-goto="${r}">${esc(t('i.' + r + '.q'))}</a>`).join(' • ')}</p>` : ''}
      <div class="meta">
        <span>${esc(t('f.conf'))}: ${badge(it.conf)}</span>
        ${it.vol ? `<span class="vol">⏳ ${esc(t('f.vol.' + it.vol))}</span>` : ''}
        <span>${esc(t('f.reviewed', {date:reviewedDate()}))}</span>
        <div class="srcs">${esc(t('f.sources'))}:<ul>${it.sources.map(([name, url]) =>
          `<li><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(name)} ↗</a></li>`).join('')}</ul></div>
      </div>
    </div></details>`;
}

const matches = it => {
  if(cat !== 'all' && it.cat !== cat) return false;
  if(!query) return true;
  const k = 'i.' + it.id + '.';
  return (it.ref ? ['q', 'a', 'note'] : ['q', 'insight', 'explain', 'rec']).some(p => t(k + p).toLowerCase().includes(query));
};

function renderList(){
  const shown = DATA.items.filter(matches), single = shown.length === 1 || !!query;
  const html = DATA.cats.map(c => {
    const list = shown.filter(it => it.cat === c);
    return list.length ? `<h2 class="faq-cat" id="cat-${c}">${esc(t('f.cat.' + c))}</h2>` + list.map(it => itemHTML(it, single)).join('') : '';
  }).join('');
  $('list').innerHTML = html || `<p class="empty">${esc(t('f.empty'))}</p>`;
}

function render(){
  $('faq').innerHTML = `<h1>❓ ${esc(t('f.title'))}</h1><p class="tag">${esc(t('f.intro'))}</p>
    <section class="src-box"><h2>📚 ${esc(t('f.srcTitle'))}</h2>
      <p>${esc(t('f.srcThread'))} <a href="${esc(DATA.thread)}" target="_blank" rel="noopener noreferrer">Simple and Frequently Asked Question Thread – r/gtaonline ↗</a></p>
      <p class="muted">${esc(t('f.srcNote'))}</p>
      ${DATA.handoff ? `<p class="muted">${esc(t('f.archived', {n:DATA.handoff.archived.length}))}</p>` : ''}
      <p class="muted">${esc(t('f.reviewed', {date:reviewedDate()}))}</p></section>
    <div class="faq-tools"><input type="search" id="q" autocomplete="off" placeholder="${esc(t('f.search'))}" aria-label="${esc(t('f.search'))}" value="${esc(query)}"></div>
    <div class="chips" id="chips">${['all'].concat(DATA.cats).map(c =>
      `<button type="button" data-cat="${c}" aria-pressed="${c === cat}">${esc(c === 'all' ? t('f.all') : t('f.cat.' + c))}</button>`).join('')}</div>
    <p class="conf-help">${CONF.map(badge).join(' ')}<br>${esc(t('f.confHelp'))}</p>
    <div id="list"></div>`;
  $('toc').innerHTML = DATA.cats.map(c =>
    `<a href="#cat-${c}" data-cat="${c}">${esc(t('f.cat.' + c))}<small>${DATA.items.filter(it => it.cat === c).length}</small></a>`).join('');
  renderList();
  openFromHash();
}

function openFromHash(){
  const m = /^#q-([a-z0-9]+)$/.exec(location.hash), el = m && $('q-' + m[1]);
  if(el){ el.open = true; el.scrollIntoView({block:'start'}); }
}

/* ---------- events ---------- */
$('faq').addEventListener('click', e => {
  const b = e.target.closest('#chips button'); if(!b) return;
  cat = b.dataset.cat;
  document.querySelectorAll('#chips button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  renderList();
});
$('faq').addEventListener('input', e => {
  if(e.target.id !== 'q') return;
  query = e.target.value.trim().toLowerCase(); renderList();
});
$('toc').addEventListener('click', e => {
  const a = e.target.closest('a[data-cat]'); if(!a) return;
  if(cat !== 'all' && cat !== a.dataset.cat){ cat = 'all'; render(); }
  if(isMobile()) setSidebar(false);
});
$('faq').addEventListener('click', e => {
  const g = e.target.closest('a[data-goto]'); if(!g) return;
  e.preventDefault();
  if(cat !== 'all' || query){ cat = 'all'; query = ''; render(); }
  history.replaceState(null, '', '#q-' + g.dataset.goto); openFromHash();
});
window.addEventListener('hashchange', openFromHash);

const mobileQuery = window.matchMedia('(max-width: 760px)');
const isMobile = () => mobileQuery.matches;
function setSidebar(open){ $('sidebar').classList.toggle('open', open); }
$('openSidebar').addEventListener('click', () => setSidebar(true));
$('closeSidebar').addEventListener('click', () => setSidebar(false));
$('backdrop').addEventListener('click', () => setSidebar(false));
document.addEventListener('keydown', e => { if(e.key === 'Escape') setSidebar(false); });

/* ---------- start ---------- */
function savedLang(){ try{ return JSON.parse(localStorage.getItem(LANG_KEY)); }catch(e){ return null; } }
function applyLanguage(){
  I18N.apply(document);
  $('lang').value = I18N.code;
  document.documentElement.lang = I18N.code;
  document.title = t('page.title');
  render();
}
Promise.all([
  fetch('data/faq.json?v=' + window.APP_VERSION).then(r => r.json()),
  I18N.init()
]).then(([data]) => {
  DATA = data;
  const sel = $('lang');
  I18N.languages.forEach(l => { const o = document.createElement('option'); o.value = l.code; o.textContent = l.label; sel.appendChild(o); });
  sel.addEventListener('change', () => {
    try{ localStorage.setItem(LANG_KEY, JSON.stringify(sel.value)); }catch(e){}
    I18N.use(sel.value).then(applyLanguage);
  });
  return I18N.use(I18N.detect(savedLang()));
}).then(applyLanguage).catch(err => { console.error(err); });
