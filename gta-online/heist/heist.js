'use strict';
/* ---------- helpers ---------- */
const t = (k, v) => I18N.t(k, v);
const fmt = n => 'GTA$' + Math.round(n).toLocaleString('en-US');
const sum = (a, f = x => x) => a.reduce((s, x) => s + f(x), 0);
function evenCuts(n){ if(n <= 1) return [100]; const o = Math.floor(100 / n / 5) * 5; const a = Array(n).fill(o); a[0] = 100 - o * (n - 1); return a; }
let UID = 0;

/* ---------- posters (original illustrations) ---------- */
function fx(u){
  return `<filter id="n${u}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .08 0"/></filter>
  <radialGradient id="v${u}" cx=".5" cy=".46" r=".78"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></radialGradient>`;
}
const finish = u => `<rect width="300" height="420" fill="url(#v${u})"/><rect width="300" height="420" filter="url(#n${u})"/>`;
function ttl(t, sub, y, subc, len = 268){
  return `<text x="150" y="${y - 30}" text-anchor="middle" font-family="Chakra Petch, sans-serif" font-weight="700" font-size="11" letter-spacing="5" fill="${subc}">${sub}</text>
  <text x="150" y="${y}" text-anchor="middle" font-family="Kanit, sans-serif" font-style="italic" font-weight="900" font-size="48" textLength="${len}" lengthAdjust="spacingAndGlyphs" fill="#fff" stroke="#000" stroke-opacity=".55" stroke-width="3" paint-order="stroke">${t}</text>`;
}
function palm(x, y, h, l, c){
  const tx = x + l, ty = y - h;
  let s = `<path d="M${x} ${y} Q${x + l * .15} ${y - h * .6} ${tx} ${ty}" stroke="${c}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`;
  [[24,-4],[-24,-4],[16,-14],[-16,-14],[26,8],[-24,9]].forEach(([dx, dy]) => {
    s += `<path d="M${tx} ${ty} q${dx / 2} ${dy - 9} ${dx} ${dy + 5}" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  });
  return s;
}
function posterCayo(){ const u = ++UID; return `<svg viewBox="0 0 300 420" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${t('poster.cayo')}">
<defs><linearGradient id="s${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26123F"/><stop offset=".36" stop-color="#B93A3A"/><stop offset=".52" stop-color="#FF8A3D"/><stop offset=".6" stop-color="#FFC567"/></linearGradient>
<linearGradient id="w${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E5A73"/><stop offset="1" stop-color="#071827"/></linearGradient>${fx(u)}</defs>
<rect width="300" height="254" fill="url(#s${u})"/>
<circle cx="150" cy="198" r="66" fill="#FFE08A"/>
<g fill="#FF9545"><rect x="70" y="210" width="160" height="3"/><rect x="70" y="221" width="160" height="5"/><rect x="70" y="234" width="160" height="7"/></g>
<rect y="250" width="300" height="170" fill="url(#w${u})"/>
<g fill="#FFD27A" opacity=".55"><rect x="104" y="258" width="92" height="2"/><rect x="120" y="266" width="60" height="2"/><rect x="134" y="274" width="32" height="2"/></g>
<path d="M0 252 L0 236 C30 232 55 220 92 222 C120 224 140 214 176 216 C214 218 248 228 300 230 L300 252Z" fill="#1A0D22"/>
<g fill="#1A0D22"><rect x="218" y="168" width="5" height="52"/><rect x="208" y="161" width="25" height="8"/></g>
<path d="M211 222 L220 178 L229 222" stroke="#1A0D22" stroke-width="2" fill="none"/>
${palm(36,238,64,-8,'#1A0D22')}${palm(62,232,46,10,'#1A0D22')}${palm(262,232,58,6,'#1A0D22')}${palm(284,233,40,-6,'#1A0D22')}
<g fill="#040C15"><ellipse cx="150" cy="356" rx="132" ry="12"/><rect x="126" y="330" width="44" height="24" rx="6"/><rect x="146" y="310" width="3" height="22"/><rect x="146" y="310" width="13" height="3"/></g>
${ttl('CAYO PERICO','THE HEIST',292,'#FFE7B0')}${finish(u)}</svg>`; }

function posterCasino(){ const u = ++UID; const sky = [[0,302,34,118],[30,318,28,102],[56,290,30,130],[84,326,26,94],[108,306,38,114],[144,330,22,90],[164,296,30,124],[192,316,36,104],[226,300,26,120],[250,322,30,98],[278,308,22,112]];
return `<svg viewBox="0 0 300 420" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${t('poster.casino')}">
<defs><linearGradient id="b${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#110426"/><stop offset=".5" stop-color="#3A0E5E"/><stop offset="1" stop-color="#A3245E"/></linearGradient>
<linearGradient id="d${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F1FEFF"/><stop offset=".5" stop-color="#86DBFF"/><stop offset="1" stop-color="#5A4FFF"/></linearGradient>
<radialGradient id="g${u}"><stop offset="0" stop-color="#9AE7FF" stop-opacity=".65"/><stop offset="1" stop-color="#9AE7FF" stop-opacity="0"/></radialGradient>${fx(u)}</defs>
<rect width="300" height="420" fill="url(#b${u})"/>
<g fill="#fff" opacity=".07"><polygon points="30,420 66,420 168,0 146,0"/><polygon points="236,420 270,420 158,0 140,0"/></g>
<circle cx="150" cy="166" r="104" fill="url(#g${u})"/>
<polygon points="90,148 120,110 180,110 210,148 150,226" fill="url(#d${u})"/>
<g stroke="#fff" stroke-opacity=".75" stroke-width="1.2" fill="none" stroke-linejoin="round"><polyline points="90,148 210,148"/><polyline points="120,110 135,148 150,110 165,148 180,110"/><polyline points="135,148 150,226 165,148"/><polyline points="105,148 150,226 195,148"/></g>
<g fill="#fff"><path d="M222 104 l3 9 9 3 -9 3 -3 9 -3 -9 -9 -3 9 -3z"/><path d="M78 196 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z"/></g>
<g fill="#0A0315">${sky.map(([x,y,w,h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`).join('')}</g>
<g fill="#FFC75A" opacity=".75">${sky.flatMap(([x,y,w],i) => [0,1,2].map(k => `<rect x="${x + 5 + (k % 2) * (w / 2 - 2)}" y="${y + 10 + k * 16 + (i % 3) * 4}" width="4" height="5"/>`)).join('')}</g>
${ttl('DIAMOND CASINO','THE HEIST',282,'#E7D2FF',274)}${finish(u)}</svg>`; }

function posterKortz(){ const u = ++UID; return `<svg viewBox="0 0 300 420" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${t('poster.kortz')}">
<defs><linearGradient id="b${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1A0A12"/><stop offset=".55" stop-color="#4B1426"/><stop offset="1" stop-color="#86303B"/></linearGradient>
<filter id="gl${u}"><feGaussianBlur stdDeviation="2.4"/></filter>${fx(u)}</defs>
<rect width="300" height="420" fill="url(#b${u})"/>
<circle cx="150" cy="160" r="38" fill="#F2E4C4"/><circle cx="138" cy="150" r="7" fill="#E1CFA6"/><circle cx="160" cy="172" r="5" fill="#E1CFA6"/>
<rect x="90" y="104" width="120" height="114" fill="none" stroke="#D7A746" stroke-width="11"/>
<rect x="101" y="115" width="98" height="92" fill="none" stroke="#6E4A14" stroke-width="2"/>
<g fill="#F1CC74"><circle cx="90" cy="104" r="6"/><circle cx="210" cy="104" r="6"/><circle cx="90" cy="218" r="6"/><circle cx="210" cy="218" r="6"/></g>
<g stroke="#FF3346" stroke-width="4" opacity=".55" filter="url(#gl${u})"><line x1="0" y1="186" x2="300" y2="128"/><line x1="0" y1="132" x2="300" y2="212"/></g>
<g stroke="#FF6C78" stroke-width="1.3"><line x1="0" y1="186" x2="300" y2="128"/><line x1="0" y1="132" x2="300" y2="212"/></g>
<path d="M0 266 C60 246 120 240 172 244 C222 248 262 256 300 252 L300 420 L0 420Z" fill="#13060B"/>
<g fill="#13060B"><rect x="70" y="228" width="58" height="22"/><rect x="128" y="218" width="48" height="30"/><rect x="176" y="230" width="44" height="18" rx="9"/></g>
<g fill="#F3C978" opacity=".8"><rect x="76" y="236" width="46" height="2"/><rect x="134" y="226" width="36" height="2"/><rect x="134" y="234" width="36" height="2"/><rect x="182" y="237" width="32" height="2"/></g>
${ttl('KORTZ CENTER','THE HEIST',296,'#F3D99A')}${finish(u)}</svg>`; }

function posterDoom(){ const u = ++UID; return `<svg viewBox="0 0 300 420" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${t('poster.doom')}">
<defs><linearGradient id="b${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#12030A"/><stop offset=".45" stop-color="#5C0E12"/><stop offset=".72" stop-color="#E5552A"/><stop offset="1" stop-color="#FFB45E"/></linearGradient>
<radialGradient id="i${u}"><stop offset="0" stop-color="#FFF4CF"/><stop offset=".4" stop-color="#FFD58A" stop-opacity=".8"/><stop offset="1" stop-color="#FF8A3D" stop-opacity="0"/></radialGradient>${fx(u)}</defs>
<rect width="300" height="420" fill="url(#b${u})"/>
<g fill="#FFE7D0" opacity=".7"><circle cx="220" cy="40" r="1.2"/><circle cx="250" cy="76" r="1"/><circle cx="180" cy="22" r="1"/><circle cx="34" cy="128" r="1"/><circle cx="268" cy="132" r="1.2"/></g>
<polygon points="70,92 90,92 196,238 140,238" fill="#FFCF8A" opacity=".22"/>
<polygon points="78,92 82,92 172,238 160,238" fill="#FFF3CC" opacity=".95"/>
<g fill="#1C0608"><rect x="66" y="64" width="28" height="18" rx="2"/><rect x="26" y="68" width="38" height="9"/><rect x="96" y="68" width="38" height="9"/><path d="M74 82 L86 82 L80 94Z"/></g>
<g stroke="#5B1B1B" stroke-width="1"><line x1="36" y1="68" x2="36" y2="77"/><line x1="46" y1="68" x2="46" y2="77"/><line x1="56" y1="68" x2="56" y2="77"/><line x1="106" y1="68" x2="106" y2="77"/><line x1="116" y1="68" x2="116" y2="77"/><line x1="126" y1="68" x2="126" y2="77"/></g>
<circle cx="166" cy="236" r="58" fill="url(#i${u})"/>
<path d="M0 262 L46 216 L84 246 L130 202 L166 238 L206 194 L252 238 L300 212 L300 420 L0 420Z" fill="#150406"/>
${ttl('DOOMSDAY','THE HEIST',300,'#FFD9B8',250)}${finish(u)}</svg>`; }

function posterOG(){ const u = ++UID; let bills = '';
for(let i = 0; i < 26; i++){ const x = (i * 53 + 11) % 290, y = (i * 97 + 17) % 228 + 6, r = (i * 37) % 80 - 40;
  bills += `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-12" y="-6" width="24" height="12" rx="1" fill="#D6F3C6" opacity=".8"/><circle r="3" fill="#7DBA74" opacity=".8"/></g>`; }
return `<svg viewBox="0 0 300 420" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${t('poster.og')}">
<defs><linearGradient id="b${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0A2417"/><stop offset=".55" stop-color="#1D5F3C"/><stop offset="1" stop-color="#8EC67B"/></linearGradient>${fx(u)}</defs>
<rect width="300" height="420" fill="url(#b${u})"/>
${bills}
<g fill="#0A1F14" stroke="#E8C66A" stroke-width="1.2"><polygon points="66,150 150,110 234,150"/><rect x="62" y="150" width="176" height="12"/>
${[0,1,2,3,4,5].map(k => `<rect x="${78 + k * 26}" y="164" width="12" height="64"/>`).join('')}
<rect x="56" y="228" width="188" height="10"/><rect x="48" y="238" width="204" height="8"/></g>
<rect y="246" width="300" height="174" fill="#06150D"/>
${ttl('PACIFIC STANDARD','THE ORIGINAL HEISTS',296,'#D9F2C5',274)}${finish(u)}</svg>`; }

/* ---------- data ----------
   Proper names (targets, crew, entry points) stay as in the game; every other
   text is a key in i18n/<lang>.json (read through t()). */
const CAYO_PRIM = {
  tequila:{l:'Sinsimito Tequila', v:400000, boost:1.2},
  ruby:{l:'Ruby Necklace', v:560000, boost:1.1},
  bonds:{l:'Bearer Bonds', v:616000, boost:1.05},
  pink:{l:'Pink Diamond', v:910000, boost:1},
  panther:{l:'Panther Statue', v:1900000, boost:1, ev:true},
  madrazo:{l:'Madrazo Files', v:1100000, boost:1, first:true}
};
const CAYO_BAG = {gold:446625, coke:360450, weed:311850, art:303750, cash:291600, none:0};
const CAYO_VEH = {
  kosatka:{l:'Kosatka', e:['airstrip','halo','westbeach','maindock','northdock','ndrop','sdrop','drain']},
  alkonost:{l:'Alkonost', e:['halo']},
  velum:{l:'Velum', e:['airstrip']},
  annihilator:{l:'Stealth Annihilator', e:['ndrop','sdrop']},
  patrol:{l:'Patrol Boat', e:['maindock']},
  longfin:{l:'Longfin', e:['maindock','northdock']}
};
const CAYO_ENTRY = {airstrip:'Airstrip', halo:'HALO Jump', westbeach:'West Beach', maindock:'Main Dock', northdock:'North Dock', ndrop:'North Drop Zone', sdrop:'South Drop Zone', drain:'Drainage Tunnel'};
const CAYO_COMP = {drain:'Drainage Tunnel', main:'Main Gate', nwall:'North Wall', ngate:'North Gate', swall:'South Wall', sgate:'South Gate'};

const CASINO_T = {cash:{l:'Cash', v:1480500}, art:{l:'Artwork', v:1645000}, gold:{l:'Gold', v:1809500}, diamonds:{l:'Diamonds', v:2303000, ev:true}};
const GUN = [['karl','Karl Abolaji',5],['charlie','Charlie Reed',7],['patrick','Patrick McReary',8],['gustavo','Gustavo Mota',9],['chester','Chester McCoy',10]];
const DRV = [['karim','Karim Denz',5],['zach','Zach Nelson',6],['taliana','Taliana Martinez',7],['eddie','Eddie Toh',9],['chesterd','Chester McCoy',10]];
const HCK = [['rickie','Rickie Lukens',3,'≈2:26'],['yohan','Yohan Blair',5,'2:52'],['christian','Christian Feltz',7,'3:00'],['paige','Paige Harris',9,'3:25'],['avi','Avi Schwartzman',10,'3:30']];
const CASINO_ENTRY = {main:'Main Door', staff:'Staff Lobby', waste:'Waste Disposal', sewer:'Sewer', tunnel:'Security Tunnel', roof:'Roof Terrace'};
const CASINO_BY = {ss:['main','staff','waste','sewer','roof'], bigcon:['main','staff','tunnel','roof'], aggr:['main','staff','waste','sewer','tunnel','roof']};

const KORTZ_P = {
  mio:{l:'Mi O Melee', v:317000}, cons:{l:'Consumato', v:308000}, ihv:{l:'I Hear Voices', v:308500},
  dor:{l:'The Downfall of Rome', v:305000, est:true}, fruit:{l:'I, Fruit', v:312000, est:true},
  pearl:{l:'The Girl with the Pearl Necklace', v:309500, est:true}, ldd:{l:'La Dernière Débauche', v:481250, story:true}
};
const KORTZ_BAG = {top2:307500, vault4:325000, top1:153750, none:0};
const DOOM = {a1:{l:'Act I: The Data Breaches', s:65000, n:877500, h:1096875}, a2:{l:'Act II: The Bogdan Problem', s:95000, n:1282500, h:1603125}, a3:{l:'Act III: The Doomsday Scenario', s:120000, n:1620000, h:2025000}};
const OG = {
  fleeca:{l:'The Fleeca Job', s:11500, p:2, e:100625, n:201250, h:251563, elite:50000},
  prison:{l:'The Prison Break', s:25000, p:4, e:350000, n:700000, h:875000, elite:100000},
  humane:{l:'The Humane Labs Raid', s:25000, p:4, e:472500, n:945000, h:1181250, elite:100000},
  seriesa:{l:'Series A Funding', s:25000, p:4, e:353500, n:707000, h:883750, elite:100000},
  pacific:{l:'The Pacific Standard Job', s:25000, p:4, e:750000, n:1500000, h:1875000, elite:100000}
};
const ecList = key => t(key).split(' | ');

/* ---------- links to the map page (../map/) ----------
   Cayo points are the map's own planning-board points (#<category>-<n>);
   other places use #@x,y,label (game coordinates, checked on the satellite tiles). */
const MAP = '../map/#';
const at = (x, y, label) => '@' + x + ',' + y + ',' + label;
const CAYO_MAP = {
  entry:{airstrip:'cayo_infiltration-1', westbeach:'cayo_infiltration-2', maindock:'cayo_infiltration-3', northdock:'cayo_infiltration-4', ndrop:'cayo_infiltration-5', sdrop:'cayo_infiltration-6', drain:'cayo_infiltration-7'},
  compound:{main:'cayo_entrances-1', nwall:'cayo_entrances-2', ngate:'cayo_entrances-3', swall:'cayo_entrances-4', sgate:'cayo_entrances-5', drain:'cayo_entrances-6'},
  escape:{airstrip:'cayo_escape-1', maindock:'cayo_escape-2', northdock:'cayo_escape-3', kosatka:'cayo_escape-4'}
};
const PLACES = {
  kortz:at(-2243.8, 264.5, 'Kortz Center'),
  casino:at(924, 46, 'The Diamond Casino & Resort'),
  cayo:'cayo_key_places-3',
  fleeca:at(-2962.6, 482.6, 'Fleeca (Great Ocean Hwy)'),
  prison:at(1845, 2585, 'Bolingbroke Penitentiary'),
  humane:at(3619, 3730, 'Humane Labs and Research'),
  pacific:at(235, 216, 'Pacific Standard Bank')
};
const mapHref = hash => MAP + encodeURIComponent(hash).replace(/%2C/g, ',').replace(/%40/g, '@');

const yesno = (yk, nk) => [{v:'yes', l:t(yk)}, {v:'no', l:t(nk)}];
const nOpts = (a, b) => Array.from({length:b - a + 1}, (_, i) => ({v:a + i, l:players(a + i)}));
const players = n => t(n === 1 ? 'players.one' : 'players.n', {n});
const eliteGroup = (hint) => ({stage:t('stage.bonus'), key:'elite', label:t('grp.elite'), hint, type:'chips', options:yesno('elite.yes', 'elite.no')});
const diffGroup = (hardKey) => ({key:'diff', label:t('grp.diff'), type:'chips', options:[{v:'normal', l:'Normal'}, {v:'hard', l:'Hard', d:t(hardKey)}]});
const firstFinale = (yesKey) => ({key:'first', label:t('grp.firstFinale'), type:'chips', options:yesno(yesKey, 'opt.no')});

/* ---------- heists ---------- */
const H = {
kortz:{
  short:'Kortz Center', isNew:true, where:() => ({hash:PLACES.kortz, l:t('place.kortz')}),
  accent:'#B07D22', poster:posterKortz,
  name:'The Kortz Center Heist',
  tag:() => t('kortz.tag'),
  facts:() => [[t('fact.players'), t('players.range', {a:1, b:4})], [t('fact.needs'), 'Mansion + Art Studio'], [t('fact.start'), t('kortz.factStart')], [t('fact.firstPainting'), '×4'], [t('fact.elite'), '$50k / $100k (Hard)']],
  defaults:{players:1, diff:'normal', painting:'mio', first:'yes', run:'replay', entry:'loading', getaway:'manchez', preps:['guard'], bags:['top2','top2','top2','top2'], request:'yes', elite:'no', cuts:[100]},
  fix(){},
  groups(st){
    const hard = st.diff === 'hard', f = st.first === 'yes';
    return [
      {stage:t('stage.teamCond'), key:'players', label:t('grp.players'), type:'chips', num:true, options:nOpts(1,4)},
      diffGroup('kortz.hard'),
      {key:'first', label:t('kortz.first'), hint:t('kortz.firstHint'), type:'chips', options:yesno('kortz.firstYes', 'opt.no')},
      {key:'run', label:t('kortz.run'), type:'chips', options:[{v:'story', l:t('kortz.runStory'), d:t('kortz.runStoryD')}, {v:'replay', l:t('kortz.runReplay'), d:t('kortz.runReplayD')}]},
      {stage:t('stage.target'), key:'painting', label:t('kortz.painting'), hint:t('kortz.paintingHint'), type:'chips', wide:true,
        options:Object.entries(KORTZ_P).map(([v, o]) => ({v, l:o.l, d:(o.est ? '≈ ' : '') + fmt(o.v * (hard ? 1.1 : 1) * (f ? 4 : 1)) + (o.story ? ' • ' + t('tag.storyOnly') : '')}))},
      {key:'bags', label:t('grp.bags'), hint:t('kortz.bagsHint'), type:'bags', wide:true, src:KORTZ_BAG, lk:'kortz.bag.'},
      {key:'request', label:t('kortz.request'), type:'chips', options:yesno('kortz.requestYes', 'kortz.requestNo')},
      {stage:t('stage.infil'), key:'entry', label:t('grp.entrance'), type:'chips', options:[
        {v:'staff', l:'Staff Entrance', d:t('kortz.entry.staff')}, {v:'loading', l:'Loading Bay', d:t('kortz.entry.loading')},
        {v:'sewer', l:'Sewer', d:t('kortz.entry.sewer')}, {v:'skylight', l:'Skylight', d:t('kortz.entry.skylight')}]},
      {key:'preps', label:t('kortz.preps'), hint:t('hint.multi'), type:'multi', options:[
        {v:'guard', l:'Guard Routes', d:t('kortz.prep.guard')}, {v:'emp', l:'EMP Charges', d:t('kortz.prep.emp')},
        {v:'glass', l:'Glass Cutter', d:t('kortz.prep.glass')}, {v:'drills', l:'Power Drills', d:t('kortz.prep.drills')}, {v:'keypad', l:'Vault Keypad', d:t('kortz.prep.keypad')}]},
      {stage:t('stage.escape'), key:'getaway', label:t('kortz.getaway'), type:'chips', options:[
        {v:'manchez', l:'Manchez', d:t('kortz.get.manchez')}, {v:'annihilator', l:'Annihilator Stealth', d:t('kortz.get.annihilator')},
        {v:'caracara', l:'Armored Caracara', d:t('kortz.get.caracara')}, {v:'none', l:t('kortz.get.none'), d:t('kortz.get.noneD')}]},
      eliteGroup(t('kortz.eliteHint'))
    ];
  },
  calc(st){
    const p = KORTZ_P[st.painting], hard = st.diff === 'hard', f = st.first === 'yes';
    const prim = p.v * (hard ? 1.1 : 1) * (f ? 4 : 1);
    const lines = [{l:t('line.painting', {name:p.l}) + (f ? ' (×4)' : ''), v:prim}];
    for(let i = 0; i < st.players; i++){ const v = KORTZ_BAG[st.bags[i]]; if(v) lines.push({l:t('line.bag', {n:i + 1, loot:t('kortz.bag.' + st.bags[i])}) + ' ≈', v}); }
    if(st.request === 'yes') lines.push({l:'Buyer’s Request', v:50000});
    return {lines, gross:sum(lines, x => x.v), deducts:[], hostFees:st.run === 'replay' ? [{l:t('fee.replay'), v:100000}] : [],
      bonus:st.elite === 'yes' ? [{l:'Elite', v:hard ? 100000 : 50000}] : [], split:'host', note:t('kortz.note')};
  },
  tips(st){
    const T = [], n = st.players;
    T.push(t(st.first === 'yes' ? 'kortz.tip.first' : 'kortz.tip.notFirst'));
    if(st.entry === 'loading') T.push(t('kortz.tip.loading'));
    if(st.entry === 'sewer') T.push(t('kortz.tip.sewer'));
    if(st.entry === 'skylight') T.push(t('kortz.tip.skylight'));
    if(st.entry === 'staff') T.push(t('kortz.tip.staff'));
    if(st.getaway === 'annihilator') T.push(t('kortz.tip.annihilator'));
    if(n === 1) T.push(t('kortz.tip.solo'));
    if(!st.preps.includes('guard')) T.push(t('kortz.tip.guard'));
    if(st.diff === 'hard') T.push(t('kortz.tip.hard'));
    T.push(t('kortz.tip.witness'));
    return T.slice(0, 5);
  },
  pro(){ return {patch:{entry:'loading', getaway:'manchez', preps:['guard','emp'], request:'yes', elite:'yes', first:'yes', bags:Array(4).fill('top2')}, msg:t('kortz.pro')}; }
},

cayo:{
  short:'Cayo Perico', where:() => ({hash:PLACES.cayo, l:t('place.cayo')}), accent:'#D9622B', poster:posterCayo,
  name:'The Cayo Perico Heist',
  tag:() => t('cayo.tag'),
  facts:() => [[t('fact.players'), t('players.range', {a:1, b:4})], [t('fact.needs'), 'Kosatka'], [t('fact.setup'), '$100,000'], [t('fact.deduct'), 'Fencing 10% + Pavel 2%'], [t('fact.cooldown'), t('cayo.factCooldown')], [t('fact.elite'), '$50k / $100k (Hard)']],
  defaults:{players:1, diff:'normal', primary:'pink', approach:'stealth', vehicle:'kosatka', entry:'drain', compound:'drain', escape:'kosatka', loadout:'conspirator', time:'night', bags:['coke','coke','coke','coke'], safe:50000, elite:'no', cuts:[100]},
  fix(st){
    const e = CAYO_VEH[st.vehicle].e; if(!e.includes(st.entry)) st.entry = e[0];
    if(st.entry === 'drain') st.compound = 'drain'; else if(st.compound === 'drain') st.compound = 'main';
    if(st.players === 1 && st.bags[0] === 'gold') st.bags[0] = 'coke';
  },
  groups(st){
    const hard = st.diff === 'hard', ents = CAYO_VEH[st.vehicle].e;
    return [
      {stage:t('stage.teamDiff'), key:'players', label:t('grp.players'), type:'chips', num:true, options:nOpts(1,4)},
      diffGroup('cayo.hard'),
      {stage:t('stage.target'), key:'primary', label:t('cayo.primary'), hint:t('cayo.primaryHint'), type:'chips', wide:true,
        options:Object.entries(CAYO_PRIM).map(([v, o]) => ({v, l:o.l, d:fmt(o.v * (hard && !o.first ? 1.1 : 1)) + (o.ev ? ' • ' + t('tag.event') : '') + (o.first ? ' • ' + t('tag.storyOnly') : '')}))},
      {key:'bags', label:t('grp.bags'), hint:t('cayo.bagsHint'), type:'bags', wide:true, src:CAYO_BAG, lk:'loot.', goldNeeds2:true},
      {key:'safe', label:t('cayo.safe'), hint:t('cayo.safeHint'), type:'range', min:18000, max:99000, step:1000},
      {stage:t('stage.infil'), key:'approach', label:t('cayo.approach'), type:'chips', options:[{v:'stealth', l:'Stealth', d:t('cayo.app.stealth')}, {v:'aggressive', l:'Aggressive', d:t('cayo.app.aggressive')}]},
      {key:'time', label:t('cayo.time'), type:'chips', options:[{v:'night', l:t('cayo.night'), d:t('cayo.nightD')}, {v:'day', l:t('cayo.day'), d:t('cayo.dayD')}]},
      {key:'vehicle', label:t('cayo.vehicle'), type:'chips', wide:true, options:Object.entries(CAYO_VEH).map(([v, o]) => ({v, l:o.l, d:t('cayo.veh.' + v)}))},
      {key:'entry', label:t('cayo.entry'), hint:t('cayo.entryHint'), map:CAYO_MAP.entry, type:'chips', options:Object.entries(CAYO_ENTRY).map(([v, l]) => ({v, l, dis:!ents.includes(v)}))},
      {key:'compound', label:t('cayo.compound'), map:CAYO_MAP.compound, type:'chips', options:Object.entries(CAYO_COMP).map(([v, l]) => ({v, l, dis:(st.entry === 'drain') !== (v === 'drain')}))},
      {key:'loadout', label:t('cayo.loadout'), type:'chips', wide:true, options:[
        {v:'aggressor', l:'Aggressor', d:t('weapon.shotgun')}, {v:'conspirator', l:'Conspirator', d:t('weapon.silencedRifle')}, {v:'crackshot', l:'Crack Shot', d:t('weapon.sniper')},
        {v:'saboteur', l:'Saboteur', d:t('weapon.silencedSmg')}, {v:'marksman', l:'Marksman', d:t('weapon.assault')}]},
      {stage:t('stage.escape'), key:'escape', label:t('cayo.escape'), map:CAYO_MAP.escape, type:'chips', options:[
        {v:'kosatka', l:'Kosatka', d:t('cayo.esc.kosatka')}, {v:'airstrip', l:'Airstrip', d:t('cayo.esc.airstrip')},
        {v:'maindock', l:'Main Dock', d:t('cayo.esc.maindock')}, {v:'northdock', l:'North Dock', d:t('cayo.esc.northdock')}]},
      eliteGroup(t('cayo.eliteHint'))
    ];
  },
  calc(st){
    const p = CAYO_PRIM[st.primary], hard = st.diff === 'hard';
    const prim = p.v * (hard && !p.first ? 1.1 : 1);
    const lines = [{l:t('line.primary', {name:p.l}) + (hard && !p.first ? ' (Hard)' : ''), v:prim}];
    for(let i = 0; i < st.players; i++){ const v = CAYO_BAG[st.bags[i]]; if(v) lines.push({l:t('line.bag', {n:i + 1, loot:t('loot.' + st.bags[i])}) + (p.boost > 1 ? ` (+${Math.round((p.boost - 1) * 100)}%)` : ''), v:v * p.boost}); }
    lines.push({l:t('line.safe'), v:st.safe});
    const gross = sum(lines, x => x.v);
    const deducts = p.first ? [] : [{l:t('ded.fence'), pct:10, v:gross * .10}, {l:t('ded.pavel'), pct:2, v:gross * .02}];
    return {lines, gross, deducts, hostFees:[{l:t('fee.setup'), v:100000}], bonus:st.elite === 'yes' ? [{l:'Elite', v:hard ? 100000 : 50000}] : [], split:'cuts',
      note:t(p.first ? 'cayo.noteFirst' : 'note.min15')};
  },
  tips(st){
    const T = [], n = st.players, p = st.primary;
    if(p === 'madrazo') T.push(t('cayo.tip.madrazo'));
    if(p === 'tequila') T.push(t('cayo.tip.tequila'));
    if(p === 'panther') T.push(t('cayo.tip.panther'));
    if(n === 1) T.push(t('cayo.tip.solo'));
    else if(st.bags.slice(0, n).some(b => b !== 'gold')) T.push(t('cayo.tip.gold', {n}));
    T.push(t(st.entry === 'drain' ? 'cayo.tip.drain' : 'cayo.tip.tryDrain'));
    if(st.escape === 'airstrip') T.push(t('cayo.tip.airstrip'));
    if(st.time === 'day') T.push(t('cayo.tip.day'));
    if(st.approach === 'stealth' && (st.loadout === 'aggressor' || st.loadout === 'crackshot' || st.loadout === 'marksman')) T.push(t('cayo.tip.silenced'));
    if(st.approach === 'aggressive') T.push(t('cayo.tip.aggressive'));
    T.push(t(st.diff === 'hard' ? 'cayo.tip.hard' : 'cayo.tip.wantHard'));
    T.push(t('cayo.tip.weekly'));
    return T.slice(0, 5);
  },
  pro(st){ const gold = st.players > 1;
    return {patch:{approach:'stealth', vehicle:'kosatka', entry:'drain', compound:'drain', escape:'kosatka', loadout:'conspirator', time:'night', diff:'hard', elite:'yes', bags:Array(4).fill(gold ? 'gold' : 'coke')},
      msg:t('cayo.pro', {loot:t(gold ? 'loot.gold' : 'loot.coke')})}; }
},

casino:{
  short:'Diamond Casino', where:() => ({hash:PLACES.casino, l:t('place.casino')}), accent:'#8A55D6', poster:posterCasino,
  name:'The Diamond Casino Heist',
  tag:() => t('casino.tag'),
  facts:() => [[t('fact.players'), t('players.range', {a:2, b:4})], [t('fact.needs'), t('casino.factNeeds')], [t('fact.setup'), '$25,000'], [t('fact.lester'), '5%'], [t('fact.firstRun'), '≈ ×1.86'], [t('fact.elite'), '$50k / $100k (Hard)']],
  defaults:{players:2, diff:'normal', target:'gold', approach:'bigcon', disguise:'gruppe6', entry:'main', exit:'staff', exitd:'none', gunman:'karl', driver:'karim', hacker:'christian', buyer:'high', first:'yes', elite:'no', hits:0, cuts:[50,50]},
  fix(st){ const ok = CASINO_BY[st.approach]; if(!ok.includes(st.entry)) st.entry = ok[0]; },
  groups(st){
    const hard = st.diff === 'hard', f = st.first === 'yes', ok = CASINO_BY[st.approach];
    const g = [
      {stage:t('stage.teamDiff'), key:'players', label:t('grp.players'), hint:t('casino.playersHint'), type:'chips', num:true, options:nOpts(2,4)},
      diffGroup('casino.hard'),
      Object.assign(firstFinale('casino.firstYes'), {hint:t('casino.firstHint')}),
      {stage:t('stage.targetApproach'), key:'target', label:t('casino.target'), type:'chips', wide:true,
        options:Object.entries(CASINO_T).map(([v, o]) => { const ln = t('loot.' + (v === 'art' ? 'artwork' : v));
          return {v, l:o.l, d:(f ? '≈ ' : '') + fmt(o.v * (hard ? 1.1 : 1) * (f ? 1.86 : 1)) + (ln !== o.l ? ' • ' + ln : '') + (o.ev ? ' • ' + t('tag.event') : '')}; })},
      {key:'approach', label:t('casino.approach'), type:'chips', wide:true, options:[
        {v:'ss', l:'Silent & Sneaky', d:t('casino.app.ss')}, {v:'bigcon', l:'The Big Con', d:t('casino.app.bigcon')}, {v:'aggr', l:'Aggressive', d:t('casino.app.aggr')}]},
      {stage:t('stage.crew'), key:'hacker', label:t('casino.hacker'), hint:t('casino.hackerHint'), type:'chips', wide:true, options:HCK.map(([v, l, c, tm]) => ({v, l, d:`${c}% • ${tm}`}))},
      {key:'gunman', label:t('casino.gunman'), hint:t('casino.gunmanHint'), type:'chips', options:GUN.map(([v, l, c]) => ({v, l, d:c + '%'}))},
      {key:'driver', label:t('casino.driver'), hint:t('casino.driverHint'), type:'chips', options:DRV.map(([v, l, c]) => ({v, l, d:c + '%'}))},
      {stage:t('stage.infil'), key:'entry', label:t('grp.entrance'), hint:t('casino.entryHint'), type:'chips', options:Object.entries(CASINO_ENTRY).map(([v, l]) => ({v, l, dis:!ok.includes(v)}))}
    ];
    if(st.approach === 'bigcon') g.push({key:'disguise', label:t('casino.disguise'), type:'chips', options:[
      {v:'gruppe6', l:'Gruppe Sechs', d:t('casino.dis.gruppe6')}, {v:'bugstars', l:'Bugstars', d:t('casino.dis.bugstars')}, {v:'maint', l:'Maintenance', d:t('casino.dis.maint')}, {v:'celeb', l:'Yung Ancestor', d:t('casino.dis.celeb')}]});
    g.push(
      {stage:t('stage.escape'), key:'exit', label:t('casino.exit'), type:'chips', options:Object.entries(CASINO_ENTRY).map(([v, l]) => ({v, l}))},
      {key:'exitd', label:t('casino.exitDisguise'), type:'chips', options:[{v:'none', l:t('opt.none')}, {v:'fire', l:'Firefighter'}, {v:'noose', l:'NOOSE'}, {v:'roller', l:'High Roller'}]},
      {key:'buyer', label:t('casino.buyer'), type:'chips', options:[{v:'low', l:'Low Level', d:t('casino.buyer.low')}, {v:'mid', l:'Mid Level', d:t('casino.buyer.mid')}, {v:'high', l:'High Level', d:t('casino.buyer.high')}]},
      {key:'hits', label:t('casino.hits'), hint:t('casino.hitsHint'), type:'range', min:0, max:80, step:1, unit:'unit.hits'},
      eliteGroup(t(st.approach === 'aggr' ? 'casino.eliteAggr' : st.approach === 'ss' ? 'casino.eliteSs' : 'casino.eliteBigcon'))
    );
    return g;
  },
  calc(st){
    const T = CASINO_T[st.target], hard = st.diff === 'hard', f = st.first === 'yes';
    const v = T.v * (hard ? 1.1 : 1) * (f ? 1.86 : 1);
    const gm = GUN.find(x => x[0] === st.gunman), dr = DRV.find(x => x[0] === st.driver), hk = HCK.find(x => x[0] === st.hacker);
    const deducts = [{l:'Lester', pct:5, v:v * .05}, {l:t('ded.gunman', {name:gm[1]}), pct:gm[2], v:v * gm[2] / 100}, {l:t('ded.driver', {name:dr[1]}), pct:dr[2], v:v * dr[2] / 100}, {l:t('ded.hacker', {name:hk[1]}), pct:hk[2], v:v * hk[2] / 100}];
    if(st.hits > 0) deducts.push({l:t('ded.hits', {n:st.hits}) + ' ≈', v:st.hits * 2000});
    return {lines:[{l:t('line.vault', {name:T.l}) + (f ? ' ' + t('line.firstApprox') : ''), v}], gross:v, deducts, hostFees:[{l:t('fee.lester'), v:25000}],
      bonus:st.elite === 'yes' ? [{l:'Elite', v:hard ? 100000 : 50000}] : [], split:'cuts', note:t('casino.note')};
  },
  tips(st){
    const T = [], gm = GUN.find(x => x[0] === st.gunman), dr = DRV.find(x => x[0] === st.driver);
    if(st.first === 'no') T.push(t('casino.tip.first'));
    if(st.hacker === 'rickie') T.push(t('casino.tip.rickie'));
    if(st.hacker === 'yohan') T.push(t('casino.tip.yohan'));
    if(gm[2] + dr[2] > 10) T.push(t('casino.tip.cheapCrew', {n:gm[2] + dr[2] - 10}));
    if(st.approach === 'ss') T.push(t('casino.tip.ss'));
    if(st.approach === 'bigcon') T.push(t('casino.tip.bigcon'));
    if(st.approach === 'aggr') T.push(t('casino.tip.aggr'));
    if(st.target === 'diamonds') T.push(t('casino.tip.diamonds'));
    if(st.players === 2 && st.target === 'gold') T.push(t('casino.tip.gold2'));
    if(st.buyer === 'low') T.push(t('casino.tip.buyerLow'));
    return T.slice(0, 5);
  },
  pro(){ return {patch:{approach:'bigcon', disguise:'gruppe6', entry:'main', exit:'staff', gunman:'karl', driver:'karim', hacker:'paige', buyer:'high', first:'yes', elite:'yes', hits:0}, msg:t('casino.pro')}; }
},

doom:{
  short:'Doomsday', where:() => null, nowhere:() => t('doom.nowhere'), accent:'#C9431F', poster:posterDoom,
  name:'The Doomsday Heist',
  tag:() => t('doom.tag'),
  facts:() => [[t('fact.players'), t('players.range', {a:2, b:4})], [t('fact.needs'), 'Facility'], [t('fact.setup'), '$65k / $95k / $120k'], [t('fact.firstRun'), '≈ ×1.22'], [t('fact.elite'), '$50,000']],
  defaults:{players:4, diff:'normal', act:'a3', first:'yes', elite:'no', cuts:[25,25,25,25]},
  fix(){},
  groups(st){
    const f = st.first === 'yes';
    return [
      {stage:t('stage.act'), key:'act', label:'Finale', type:'chips', wide:true, options:Object.entries(DOOM).map(([v, o]) => ({v, l:o.l, d:(f ? '≈ ' : '') + fmt((st.diff === 'hard' ? o.h : o.n) * (f ? 1.222 : 1))}))},
      {stage:t('stage.teamCond'), key:'players', label:t('grp.players'), type:'chips', num:true, options:nOpts(2,4)},
      diffGroup('hard.plus25'),
      firstFinale('doom.firstYes'),
      eliteGroup(),
      {key:'_ec', label:t('doom.ecLabel'), type:'info', items:ecList('doom.ec.' + st.act)}
    ];
  },
  calc(st){
    const a = DOOM[st.act], f = st.first === 'yes', v = (st.diff === 'hard' ? a.h : a.n) * (f ? 1.222 : 1);
    return {lines:[{l:a.l + (f ? ' ' + t('line.firstApprox') : ''), v}], gross:v, deducts:[], hostFees:[{l:t('fee.setup'), v:a.s}],
      bonus:st.elite === 'yes' ? [{l:'Elite', v:50000}] : [], split:'cuts', note:t('note.min15')};
  },
  tips(st){
    const T = [t('doom.tip.' + st.act)];
    T.push(t(st.first === 'yes' ? 'doom.tip.firstHost' : 'doom.tip.notFirst'));
    T.push(t(st.diff === 'hard' ? 'doom.tip.hard' : 'doom.tip.wantHard'));
    T.push(t('doom.tip.setups'));
    return T.slice(0, 5);
  },
  pro(){ return {patch:{diff:'hard', first:'yes', elite:'yes', act:'a3'}, msg:t('doom.pro')}; }
},

og:{
  short:'Original Heists', accent:'#2E8B57', poster:posterOG,
  where:st => PLACES[st.heist] ? {hash:PLACES[st.heist], l:t('place.' + st.heist)} : null, nowhere:() => t('og.nowhere'),
  name:'The Original Heists',
  tag:() => t('og.tag'),
  facts:() => [[t('fact.players'), t('og.factPlayers')], [t('fact.needs'), 'High-end Apartment'], [t('fact.diff'), 'Easy / Normal / Hard'], [t('fact.firstRun'), '×1.5'], [t('fact.elite'), t('og.factElite')]],
  defaults:{heist:'pacific', players:4, diff:'normal', first:'yes', elite:'no', cuts:[25,25,25,25]},
  fix(st){ const p = OG[st.heist].p; if(st.players !== p){ st.players = p; st.cuts = evenCuts(p); } },
  groups(st){
    const f = st.first === 'yes', key = {easy:'e', normal:'n', hard:'h'}[st.diff];
    return [
      {stage:t('stage.heist'), key:'heist', label:'Finale', type:'chips', wide:true, options:Object.entries(OG).map(([v, o]) => ({v, l:o.l, d:fmt(o[key] * (f ? 1.5 : 1)) + ' • ' + players(o.p)}))},
      {stage:t('stage.diffCond'), key:'diff', label:t('grp.diff'), type:'chips', options:[{v:'easy', l:'Easy', d:t('og.easy')}, {v:'normal', l:'Normal'}, {v:'hard', l:'Hard', d:t('hard.plus25')}]},
      firstFinale('og.firstYes'),
      eliteGroup(),
      {key:'_ec', label:t('og.ecLabel'), type:'info', items:ecList('og.ec.' + st.heist)}
    ];
  },
  calc(st){
    const o = OG[st.heist], f = st.first === 'yes', v = o[{easy:'e', normal:'n', hard:'h'}[st.diff]] * (f ? 1.5 : 1);
    return {lines:[{l:o.l + (f ? ' ' + t('line.first15') : ''), v}], gross:v, deducts:[], hostFees:[{l:t('fee.setup'), v:o.s}],
      bonus:st.elite === 'yes' ? [{l:'Elite', v:o.elite}] : [], split:'cuts', note:t('note.min15')};
  },
  tips(st){
    const T = [t('og.tip.' + st.heist)];
    T.push(t(st.first === 'yes' ? 'og.tip.firstHost' : 'og.tip.notFirst'));
    if(st.diff !== 'hard') T.push(t('og.tip.wantHard'));
    T.push(t('og.tip.hostCut'));
    return T.slice(0, 5);
  },
  pro(){ return {patch:{heist:'pacific', diff:'hard', first:'yes', elite:'yes'}, msg:t('og.pro')}; }
}
};
const ORDER = ['kortz','cayo','casino','doom','og'];

/* ---------- state ---------- */
const STORE_KEY = 'gtaoheist.board';
const LANG_KEY = 'gtaomap.lang';   // shared with the map page (JSON string)
let cur = 'cayo', S = {}, coachMsg = null;
ORDER.forEach(k => S[k] = JSON.parse(JSON.stringify(H[k].defaults)));
try{
  const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
  if(saved && saved.S){ ORDER.forEach(k => { if(saved.S[k]) S[k] = Object.assign(S[k], saved.S[k]); }); if(H[saved.cur]) cur = saved.cur; }
}catch(e){}
const fromHash = () => { const k = decodeURIComponent(location.hash.slice(1)); return H[k] ? k : null; };
if(fromHash()) cur = fromHash();
ORDER.forEach(k => { const st = S[k]; if(!Array.isArray(st.cuts) || st.cuts.length !== st.players) st.cuts = evenCuts(st.players); H[k].fix(st); });
function save(){ try{ localStorage.setItem(STORE_KEY, JSON.stringify({cur, S})); }catch(e){} }

/* ---------- render ---------- */
const $ = id => document.getElementById(id);
function renderRail(){
  const item = k => `<button type="button" data-h="${k}" aria-current="${k === cur}" style="--h:${H[k].accent}"><div class="thumb">${H[k].poster()}</div><span class="nm">${H[k].short}${H[k].isNew ? `<span class="new">${t('rail.new')}</span>` : ''}</span></button>`;
  $('rail').innerHTML = ORDER.map(item).join('');
  $('tabs').innerHTML = ORDER.map(k => `<button type="button" data-h="${k}" aria-current="${k === cur}" style="--h:${H[k].accent}">${H[k].short}</button>`).join('');
}
function whereHTML(){
  const h = H[cur], w = h.where(S[cur]);
  return w ? `<a class="maplink big" href="${mapHref(w.hash)}">📍 ${t('where.view', {place:w.l})}</a>` : `<p class="nowhere">📍 ${h.nowhere()}</p>`;
}
function renderHero(anim){
  const h = H[cur];
  $('hero').innerHTML = `<div class="poster${anim ? ' in' : ''}">${h.poster()}</div>
  <div class="brief"><h1>${h.name}</h1><p class="tag">${h.tag()}</p>
  <dl class="facts">${h.facts().map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl><div id="where">${whereHTML()}</div></div>`;
}
function renderBoard(){
  const h = H[cur], st = S[cur], gs = h.groups(st);
  let html = '', open = false, n = 0;
  gs.forEach(g => {
    if(g.stage){ if(open) html += '</div>'; n++; html += `<div class="stage"><span class="n">${n}</span>${g.stage}</div><div class="sbody">`; open = true; }
    html += groupHTML(g, st);
  });
  if(open) html += '</div>';
  $('board').innerHTML = html;
  if($('where')) $('where').innerHTML = whereHTML();
}
function groupHTML(g, st){
  let b = '';
  if(g.type === 'chips' || g.type === 'multi'){
    b = `<div class="opts" role="group" aria-label="${g.label}">` + g.options.map(o => {
      const on = g.type === 'multi' ? (st[g.key] || []).includes(o.v) : st[g.key] === o.v;
      return `<button type="button" class="opt${on ? ' on' : ''}" data-k="${g.key}" data-v="${o.v}" data-t="${g.type}"${g.num ? ' data-num="1"' : ''} aria-pressed="${on}"${o.dis ? ' disabled' : ''}><span>${o.l}</span>${o.d ? `<span class="cd">${o.d}</span>` : ''}</button>`;
    }).join('') + '</div>';
  } else if(g.type === 'range'){
    b = `<div class="rng"><input type="range" min="${g.min}" max="${g.max}" step="${g.step}" value="${st[g.key]}" data-r="${g.key}" aria-label="${g.label}"><output id="o-${g.key}">${rv(g, st[g.key])}</output></div>`;
  } else if(g.type === 'bags'){
    b = '<div class="bags">' + Array.from({length:st.players}, (_, i) => `<label class="bagrow"><b>P${i + 1}${i === 0 ? ' ' + t('who.host') : ''}</b><select data-bag="${i}">` +
      Object.entries(g.src).map(([v, val]) => { const no2 = g.goldNeeds2 && v === 'gold' && st.players < 2;
        return `<option value="${v}"${st.bags[i] === v ? ' selected' : ''}${no2 ? ' disabled' : ''}>${t(g.lk + v)}${val ? ' • ≈ ' + fmt(val) : ''}${no2 ? ' ' + t('bag.needs2') : ''}</option>`; }).join('') + '</select></label>').join('') + '</div>';
  } else if(g.type === 'info'){
    b = '<ul class="info">' + g.items.map(x => `<li>${x}</li>`).join('') + '</ul>';
  }
  const ml = g.map && g.map[st[g.key]] ? ` <a class="maplink" href="${mapHref(g.map[st[g.key]])}" title="${t('where.mapTitle')}">📍 ${t('where.map')}</a>` : '';
  return `<section class="grp${g.wide ? ' wide' : ''}"><h3>${g.label}${ml}</h3>${g.hint ? `<p class="hint">${g.hint}</p>` : ''}${b}</section>`;
}
const rv = (g, v) => g.unit ? t(g.unit, {n:v}) : fmt(v);

const SEG = ['#B83227','#D9763A','#C9A227','#8C6D5A','#7E57C2','#5C6BC0'];
function renderSummary(){
  const h = H[cur], st = S[cur], r = h.calc(st);
  const ded = sum(r.deducts, d => d.v), pool = Math.max(0, r.gross - ded);
  $('rcsub').textContent = `${h.short} • ${players(st.players)} • ${({easy:'Easy', normal:'Normal', hard:'Hard'})[st.diff]}`;
  let html = '<div class="rc-lines">' + r.lines.map(x => row(x.l, fmt(x.v))).join('') + '</div>';
  html += row(t('sum.gross'), fmt(r.gross), 'tot');
  r.deducts.forEach(d => html += row(d.l + (d.pct != null ? `<span class="pct">${d.pct}%</span>` : ''), '−' + fmt(d.v), 'neg'));
  html += row(t(r.split === 'host' ? 'sum.hostPool' : 'sum.pool'), fmt(pool), 'pool');
  const segs = [], leg = [];
  r.deducts.forEach((d, i) => { segs.push([d.v, SEG[i % SEG.length]]); leg.push([d.l.replace(' ≈', ''), SEG[i % SEG.length]]); });
  if(r.split === 'host'){ segs.push([pool, 'var(--money)']); leg.push([t('who.hostCap'), 'var(--money)']); }
  else st.cuts.forEach((c, i) => { const col = `color-mix(in srgb, var(--money) ${100 - i * 18}%, var(--surface))`; segs.push([pool * c / 100, col]); leg.push([`P${i + 1}`, col]); });
  html += `<div class="sbar" role="img" aria-label="${t('sum.barAria')}">` + segs.map(([v, c]) => `<i style="width:${(v / r.gross * 100).toFixed(2)}%;background:${c}"></i>`).join('') + '</div>';
  html += '<div class="legend">' + leg.map(([l, c]) => `<span><i style="background:${c}"></i>${l}</span>`).join('') + '</div>';
  $('summary').innerHTML = html;
  return {r, pool};
}
const row = (l, v, c = '') => `<div class="row ${c}"><span>${l}</span><span class="v">${v}</span></div>`;

function renderCuts(){
  const st = S[cur], r = H[cur].calc(st);
  if(r.split !== 'cuts' || st.players < 2){ $('cuts').innerHTML = ''; return; }
  const max = 100 - 15 * (st.players - 1);
  let html = `<div class="cuts"><h3>${t('cuts.title')}</h3>`;
  html += `<div class="cutrow"><span>P1 ${t('who.host')}</span><span class="hint" style="margin:0">${t('cuts.rest')}</span><output data-cl="0">${st.cuts[0]}%</output></div>`;
  for(let i = 1; i < st.players; i++) html += `<div class="cutrow"><label for="c${i}">P${i + 1}</label><input id="c${i}" type="range" min="15" max="${max}" step="5" value="${st.cuts[i]}" data-cut="${i}"><output data-cl="${i}">${st.cuts[i]}%</output></div>`;
  html += `<button type="button" class="mini" id="even">${t('cuts.even')}</button></div>`;
  $('cuts').innerHTML = html;
}
function renderSplit(res){
  const st = S[cur], {r, pool} = res, bonus = sum(r.bonus, b => b.v), fee = sum(r.hostFees, f => f.v);
  let html = `<div class="split"><h3>${t('split.title')}</h3><div class="pls">`;
  for(let i = 0; i < st.players; i++){
    let net, det = [];
    if(r.split === 'host'){
      if(i === 0){ net = pool + bonus - fee; det.push(t('split.all', {amt:fmt(pool)})); }
      else { html += `<div class="pc"><div class="pc-top"><b>P${i + 1}</b><span class="net">≈ $100k–200k</span></div><div class="det">${t('split.crew', {bonus:bonus ? ' + Elite ' + fmt(bonus) : ''})}</div></div>`; continue; }
    } else {
      const share = pool * st.cuts[i] / 100; net = share + bonus - (i === 0 ? fee : 0);
      det.push(t('split.share', {pct:st.cuts[i], amt:fmt(share)}));
    }
    r.bonus.forEach(b => det.push(`+ ${b.l} ${fmt(b.v)}`));
    if(i === 0) r.hostFees.forEach(f => det.push(`− ${f.l} ${fmt(f.v)}`));
    html += `<div class="pc"><div class="pc-top"><b>P${i + 1}${i === 0 ? ' ' + t('who.host') : ''}</b><span class="net">${fmt(net)}</span></div><div class="det">${det.join('<br>')}</div></div>`;
  }
  html += `</div><p class="rc-note">${r.note}</p></div>`;
  $('split').innerHTML = html;
}
function renderCoach(){
  const h = H[cur], st = S[cur];
  const face = `<svg viewBox="0 0 26 26" aria-hidden="true"><circle cx="13" cy="10" r="6" fill="#fff"/><rect x="6.5" y="8" width="13" height="3.4" rx="1.6" fill="#18212D"/><path d="M3 25c1-6 5.5-8.5 10-8.5S22 19 23 25z" fill="#fff"/></svg>`;
  // coachMsg is kept as a function so it follows a language switch
  $('coach').innerHTML = `<div class="who"><div class="av">${face}</div><div><b>${t('coach.name')}</b><small>${t('coach.sub', {heist:h.short})}</small></div></div>
  ${coachMsg ? `<p class="said">${coachMsg()}</p>` : ''}
  <ul>${h.tips(st).map(x => `<li>${x}</li>`).join('')}</ul>
  <button type="button" class="btn" id="pro">${t('coach.btn')}</button>`;
}
function renderAside(keepCuts){
  const res = renderSummary();
  if(!keepCuts) renderCuts();
  renderSplit(res);
  renderCoach();
}
function setHeist(k, anim = true){
  if(k !== cur) coachMsg = null;
  cur = k;
  document.documentElement.style.setProperty('--heist', H[k].accent);
  renderRail(); renderHero(anim); renderBoard(); renderAside(); save();
  if(location.hash.slice(1) !== k) history.replaceState(null, '', '#' + k);
  document.title = H[k].short + ' – ' + t('page.title');
}

/* ---------- events ---------- */
function pick(e){
  const b = e.target.closest('button[data-h]'); if(!b) return;
  if(b.dataset.h !== cur){ setHeist(b.dataset.h); $('page').scrollTo({top:0}); }
  if(isMobile()) setSidebar(false);
}
$('rail').addEventListener('click', pick);
$('tabs').addEventListener('click', pick);
window.addEventListener('hashchange', () => { const k = fromHash(); if(k && k !== cur) setHeist(k); });
$('board').addEventListener('click', e => {
  const c = e.target.closest('.opt'); if(!c || c.disabled) return;
  const st = S[cur], k = c.dataset.k; let v = c.dataset.v; if(c.dataset.num) v = Number(v);
  if(c.dataset.t === 'multi'){ const a = st[k] || []; st[k] = a.includes(v) ? a.filter(x => x !== v) : a.concat(v); }
  else { st[k] = v; if(k === 'players') st.cuts = evenCuts(v); }
  coachMsg = null; H[cur].fix(st); renderBoard(); renderAside(); save();
});
$('board').addEventListener('change', e => {
  const s = e.target.closest('select[data-bag]'); if(!s) return;
  S[cur].bags[+s.dataset.bag] = s.value; H[cur].fix(S[cur]); renderAside(true); save();
});
$('board').addEventListener('input', e => {
  const r = e.target.closest('input[data-r]'); if(!r) return;
  const st = S[cur], k = r.dataset.r; st[k] = Number(r.value);
  const g = H[cur].groups(st).find(x => x.key === k); $('o-' + k).textContent = rv(g, st[k]);
  renderAside(true); save();
});
$('ticket').addEventListener('input', e => {
  const el = e.target.closest('input[data-cut]'); if(!el) return;
  const st = S[cur], i = +el.dataset.cut;
  const others = st.cuts.reduce((a, c, j) => (j === 0 || j === i) ? a : a + c, 0);
  let v = Math.max(15, Math.min(+el.value, 100 - 15 - others)); el.value = v;
  st.cuts[i] = v; st.cuts[0] = 100 - others - v;
  document.querySelectorAll('[data-cl]').forEach(o => o.textContent = st.cuts[+o.dataset.cl] + '%');
  renderSplit(renderSummary()); save();
});
$('ticket').addEventListener('click', e => {
  if(e.target.closest('#even')){ const st = S[cur]; st.cuts = evenCuts(st.players); renderAside(); save(); }
  if(e.target.closest('#pro')){
    const h = H[cur], st = S[cur], p = h.pro(st); Object.assign(st, JSON.parse(JSON.stringify(p.patch)));
    h.fix(st); coachMsg = () => h.pro(st).msg; renderBoard(); renderAside(); save();
    $('coach').scrollIntoView({behavior:'smooth', block:'nearest'});
  }
});

/* ---------- sidebar (same behaviour as the map page) ---------- */
const mobileQuery = window.matchMedia('(max-width: 760px)');
const isMobile = () => mobileQuery.matches;
const sidebarOpen = () => isMobile() ? $('sidebar').classList.contains('open') : !$('app').classList.contains('sidebar-collapsed');
function setSidebar(open){
  if(isMobile()) $('sidebar').classList.toggle('open', open);
  else { $('app').classList.toggle('sidebar-collapsed', !open); try{ localStorage.setItem('gtaoheist.sidebarCollapsed', open ? '0' : '1'); }catch(e){} }
  $('openSidebar').hidden = !isMobile() && sidebarOpen();
}
$('openSidebar').addEventListener('click', () => setSidebar(true));
$('closeSidebar').addEventListener('click', () => setSidebar(false));
$('backdrop').addEventListener('click', () => setSidebar(false));
document.addEventListener('keydown', e => { if(e.key === 'Escape' && isMobile() && sidebarOpen()) setSidebar(false); });
mobileQuery.addEventListener('change', () => { $('sidebar').classList.remove('open'); setSidebar(isMobile() ? false : !$('app').classList.contains('sidebar-collapsed')); });
try{ if(localStorage.getItem('gtaoheist.sidebarCollapsed') === '1' && !isMobile()) $('app').classList.add('sidebar-collapsed'); }catch(e){}
setSidebar(isMobile() ? false : sidebarOpen());

/* ---------- language (same files layout and setting as the map) ---------- */
function savedLang(){ try{ return JSON.parse(localStorage.getItem(LANG_KEY)); }catch(e){ return null; } }
function applyLanguage(anim){
  I18N.apply(document);
  $('lang').value = I18N.code;
  setHeist(cur, anim);
}
I18N.init().then(() => {
  const sel = $('lang');
  I18N.languages.forEach(l => { const o = document.createElement('option'); o.value = l.code; o.textContent = l.label; sel.appendChild(o); });
  sel.addEventListener('change', () => {
    try{ localStorage.setItem(LANG_KEY, JSON.stringify(sel.value)); }catch(e){}
    I18N.use(sel.value).then(() => applyLanguage(false));
  });
  return I18N.use(I18N.detect(savedLang()));
}).then(() => applyLanguage(true)).catch(err => { console.error(err); });
