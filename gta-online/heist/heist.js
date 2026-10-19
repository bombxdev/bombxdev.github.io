'use strict';
/* ---------- helpers ---------- */
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
function posterCayo(){ const u = ++UID; return `<svg viewBox="0 0 300 420" preserveAspectRatio="xMidYMid slice" role="img" aria-label="โปสเตอร์ Cayo Perico: เกาะยามพระอาทิตย์ตก เรือดำน้ำลอยลำ">
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
return `<svg viewBox="0 0 300 420" preserveAspectRatio="xMidYMid slice" role="img" aria-label="โปสเตอร์ Diamond Casino: เพชรเม็ดใหญ่เรืองแสงเหนือเมืองยามค่ำ">
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

function posterKortz(){ const u = ++UID; return `<svg viewBox="0 0 300 420" preserveAspectRatio="xMidYMid slice" role="img" aria-label="โปสเตอร์ Kortz Center: กรอบภาพทองที่ว่างเปล่ามีแสงเลเซอร์ตัดผ่าน">
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

function posterDoom(){ const u = ++UID; return `<svg viewBox="0 0 300 420" preserveAspectRatio="xMidYMid slice" role="img" aria-label="โปสเตอร์ Doomsday: ดาวเทียมยิงลำแสงลงยอดเขา">
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
return `<svg viewBox="0 0 300 420" preserveAspectRatio="xMidYMid slice" role="img" aria-label="โปสเตอร์ Original Heists: ธนาคารเสาโรมันกับธนบัตรที่ปลิวว่อน">
<defs><linearGradient id="b${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0A2417"/><stop offset=".55" stop-color="#1D5F3C"/><stop offset="1" stop-color="#8EC67B"/></linearGradient>${fx(u)}</defs>
<rect width="300" height="420" fill="url(#b${u})"/>
${bills}
<g fill="#0A1F14" stroke="#E8C66A" stroke-width="1.2"><polygon points="66,150 150,110 234,150"/><rect x="62" y="150" width="176" height="12"/>
${[0,1,2,3,4,5].map(k => `<rect x="${78 + k * 26}" y="164" width="12" height="64"/>`).join('')}
<rect x="56" y="228" width="188" height="10"/><rect x="48" y="238" width="204" height="8"/></g>
<rect y="246" width="300" height="174" fill="#06150D"/>
${ttl('PACIFIC STANDARD','THE ORIGINAL HEISTS',296,'#D9F2C5',274)}${finish(u)}</svg>`; }

/* ---------- data ---------- */
const CAYO_PRIM = {
  tequila:{l:'Sinsimito Tequila', v:400000, boost:1.2},
  ruby:{l:'Ruby Necklace', v:560000, boost:1.1},
  bonds:{l:'Bearer Bonds', v:616000, boost:1.05},
  pink:{l:'Pink Diamond', v:910000, boost:1},
  panther:{l:'Panther Statue', v:1900000, boost:1, ev:true},
  madrazo:{l:'Madrazo Files', v:1100000, boost:1, first:true}
};
const CAYO_BAG = {
  gold:{l:'ทองคำ', v:446625}, coke:{l:'โคเคน', v:360450}, weed:{l:'กัญชา + เงินสดเติม', v:311850},
  art:{l:'ภาพวาด', v:303750}, cash:{l:'เงินสด', v:291600}, none:{l:'ไม่เก็บของรอง', v:0}
};
const CAYO_VEH = {
  kosatka:{l:'Kosatka', d:'เรือดำน้ำ • ลงได้ทุกจุด', e:['airstrip','halo','westbeach','maindock','northdock','ndrop','sdrop','drain']},
  alkonost:{l:'Alkonost', d:'บินสูงแล้วกระโดด HALO', e:['halo']},
  velum:{l:'Velum', d:'เครื่องบินเล็กลงลานบิน', e:['airstrip']},
  annihilator:{l:'Stealth Annihilator', d:'ฮ.ล่องหน หย่อนลงจุดดรอป', e:['ndrop','sdrop']},
  patrol:{l:'Patrol Boat', d:'เรือติดอาวุธ เทียบท่าหลัก', e:['maindock']},
  longfin:{l:'Longfin', d:'เรือเร็ว ขึ้นฝั่งที่ท่าเรือ', e:['maindock','northdock']}
};
const CAYO_ENTRY = {airstrip:'Airstrip', halo:'HALO Jump', westbeach:'West Beach', maindock:'Main Dock', northdock:'North Dock', ndrop:'North Drop Zone', sdrop:'South Drop Zone', drain:'Drainage Tunnel'};
const CAYO_COMP = {drain:'Drainage Tunnel', main:'Main Gate', nwall:'North Wall', ngate:'North Gate', swall:'South Wall', sgate:'South Gate'};

const CASINO_T = {cash:{l:'Cash', th:'เงินสด', v:1480500}, art:{l:'Artwork', th:'งานศิลปะ', v:1645000}, gold:{l:'Gold', th:'ทองคำ', v:1809500}, diamonds:{l:'Diamonds', th:'เพชร • อีเวนต์', v:2303000}};
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
const KORTZ_BAG = {
  top2:{l:'ภาพชั้นดี 2 ภาพ', v:307500}, vault4:{l:'ภาพเล็กห้องนิรภัย ~4 ชิ้น', v:325000},
  top1:{l:'ภาพชั้นดี 1 ภาพ (ครึ่งใบ)', v:153750}, none:{l:'ไม่เก็บของรอง', v:0}
};
const DOOM = {a1:{l:'Act I: The Data Breaches', s:65000, n:877500, h:1096875}, a2:{l:'Act II: The Bogdan Problem', s:95000, n:1282500, h:1603125}, a3:{l:'Act III: The Doomsday Scenario', s:120000, n:1620000, h:2025000}};
const OG = {
  fleeca:{l:'The Fleeca Job', s:11500, p:2, e:100625, n:201250, h:251563, elite:50000, ec:['จบในไม่เกิน 5:20','รถเสียหายไม่ถึง 6%','ไม่มีใครตาย']},
  prison:{l:'The Prison Break', s:25000, p:4, e:350000, n:700000, h:875000, elite:100000, ec:['Rashkovsky เสียหายไม่เกิน 1%','พาออกมาได้ใน 4:40','ไม่มีใครตาย']},
  humane:{l:'The Humane Labs Raid', s:25000, p:4, e:472500, n:945000, h:1181250, elite:100000, ec:['จบในไม่เกิน 11:00','รถเสียหายไม่ถึง 2%','ไม่มีใครตาย']},
  seriesa:{l:'Series A Funding', s:25000, p:4, e:353500, n:707000, h:883750, elite:100000, ec:['จบในไม่เกิน 6:30','ฆ่าศัตรู 75 คน','ไม่มีใครตาย']},
  pacific:{l:'The Pacific Standard Job', s:25000, p:4, e:750000, n:1500000, h:1875000, elite:100000, ec:['จบในไม่เกิน 10:15','ไม่ให้ NOOSE ถูกเรียก','ไม่มีใครตาย']}
};

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
const OG_PLACE = {fleeca:'ธนาคาร Fleeca (Great Ocean Hwy)', prison:'เรือนจำ Bolingbroke', humane:'Humane Labs', pacific:'ธนาคาร Pacific Standard'};
const mapHref = hash => MAP + encodeURIComponent(hash).replace(/%2C/g, ',').replace(/%40/g, '@');

const yesno = (yl, nl) => [{v:'yes', l:yl}, {v:'no', l:nl}];
const nOpts = (a, b) => Array.from({length:b - a + 1}, (_, i) => ({v:a + i, l:(a + i) + ' คน'}));

/* ---------- heists ---------- */
const H = {
kortz:{
  short:'Kortz Center', isNew:true, where:() => ({hash:PLACES.kortz, l:'Kortz Center (Pacific Bluffs)'}), accent:'#B07D22', poster:posterKortz,
  name:'The Kortz Center Heist',
  tag:'ปล้นพิพิธภัณฑ์ศิลปะบนเนินเขา Pacific Bluffs ตอนกลางคืน ลงไปห้องนิรภัยชั้นใต้ดิน สลับภาพจริงด้วยภาพปลอมจาก Art Studio ในคฤหาสน์ แล้วขนงานศิลปะไปส่ง Alec ที่ Cypress Flats',
  facts:[['ผู้เล่น','1–4 คน'],['ต้องมี','Mansion + Art Studio'],['ค่าเริ่ม','รอบแรกฟรี • รีเพลย์ $100,000'],['ภาพแรกของสัปดาห์','×4'],['Elite','$50k / $100k (Hard)']],
  defaults:{players:1, diff:'normal', painting:'mio', first:'yes', run:'replay', entry:'loading', getaway:'manchez', preps:['guard'], bags:['top2','top2','top2','top2'], request:'yes', elite:'no', cuts:[100]},
  fix(){},
  groups(st){
    const hard = st.diff === 'hard', f = st.first === 'yes';
    return [
      {stage:'ทีมและเงื่อนไข', key:'players', label:'จำนวนผู้เล่น', type:'chips', num:true, options:nOpts(1,4)},
      {key:'diff', label:'ระดับความยาก', type:'chips', options:[{v:'normal', l:'Normal'}, {v:'hard', l:'Hard', d:'หลัก +10% • รีเพลย์เท่านั้น'}]},
      {key:'first', label:'ขายภาพหลักชิ้นแรกของสัปดาห์', hint:'ภาพแรกที่ขายหลังรีเซ็ตวันพฤหัสได้ 4 เท่า รอบต่อไปตลาดศิลปะอิ่มตัว', type:'chips', options:yesno('ใช่ (×4)', 'ไม่ใช่')},
      {key:'run', label:'รอบนี้คือ', type:'chips', options:[{v:'story', l:'ครั้งแรกสุด', d:'ไม่เสียค่าเริ่ม'}, {v:'replay', l:'รีเพลย์', d:'จ่าย $100,000'}]},
      {stage:'เป้าหมาย', key:'painting', label:'ภาพหลักในห้องนิรภัย', hint:'ภาพหลักหมุนเวียนทุกสัปดาห์ ราคาแสดงตามความยากและเงื่อนไขที่เลือก', type:'chips', wide:true,
        options:Object.entries(KORTZ_P).map(([v, o]) => ({v, l:o.l, d:(o.est ? '≈ ' : '') + fmt(o.v * (hard ? 1.1 : 1) * (f ? 4 : 1)) + (o.story ? ' • ครั้งแรกสุด' : '')}))},
      {key:'bags', label:'กระเป๋าของรอง (คนละ 1 ใบ)', hint:'ภาพในแกลเลอรีกินที่ราวครึ่งใบ • มูลค่าเป็นค่าประมาณ', type:'bags', wide:true, src:KORTZ_BAG},
      {key:'request', label:'Buyer’s Request (ของ 3 ชิ้นที่ผู้ซื้อขอ)', type:'chips', options:yesno('เก็บครบ +$50k', 'ไม่ครบ')},
      {stage:'แทรกซึม', key:'entry', label:'ทางเข้า', type:'chips', options:[
        {v:'staff', l:'Staff Entrance', d:'คีย์การ์ดโคลน • ช้าแต่ชัวร์'}, {v:'loading', l:'Loading Bay', d:'ปลอมเป็น Alpha Mail • เร็วสุด'},
        {v:'sewer', l:'Sewer', d:'ชุด Hazmat • กุญแจท่อสุ่ม'}, {v:'skylight', l:'Skylight', d:'โรยตัวจากหลังคา • สายสเตลท์'}]},
      {key:'preps', label:'Prep เสริม', hint:'เลือกได้หลายอย่าง', type:'multi', options:[
        {v:'guard', l:'Guard Routes', d:'เห็นยามบนแผนที่'}, {v:'emp', l:'EMP Charges', d:'ดับไฟ + บันไดลัด'},
        {v:'glass', l:'Glass Cutter', d:'เปิดตู้กระจกเสริม'}, {v:'drills', l:'Power Drills', d:'เปิดล็อกบ็อกซ์'}, {v:'keypad', l:'Vault Keypad', d:'ห้องซ้อม $450k'}]},
      {stage:'หลบหนี', key:'getaway', label:'พาหนะหลบหนี', type:'chips', options:[
        {v:'manchez', l:'Manchez', d:'มอเตอร์ไซค์ หลังอาคาร'}, {v:'annihilator', l:'Annihilator Stealth', d:'ฮ. บนหลังคา'},
        {v:'caracara', l:'Armored Caracara', d:'กระบะหุ้มเกราะ ลานจอด'}, {v:'none', l:'ไม่ใช้', d:'ออกถนนแล้วหารถเอง'}]},
      {stage:'โบนัส', key:'elite', label:'Elite Challenge', hint:'ต่ำกว่า 17:00 • ความแม่น >90% • ของเสียหายน้อย • Buyer’s Request ครบ', type:'chips', options:yesno('ทำได้', 'ไม่ทำ')}
    ];
  },
  calc(st){
    const p = KORTZ_P[st.painting], hard = st.diff === 'hard', f = st.first === 'yes';
    const prim = p.v * (hard ? 1.1 : 1) * (f ? 4 : 1);
    const lines = [{l:'ภาพหลัก: ' + p.l + (f ? ' (×4)' : ''), v:prim}];
    for(let i = 0; i < st.players; i++){ const b = KORTZ_BAG[st.bags[i]]; if(b.v) lines.push({l:`กระเป๋า P${i + 1}: ${b.l} ≈`, v:b.v}); }
    if(st.request === 'yes') lines.push({l:'Buyer’s Request', v:50000});
    return {lines, gross:sum(lines, x => x.v), deducts:[], hostFees:st.run === 'replay' ? [{l:'ค่าเริ่มรีเพลย์', v:100000}] : [],
      bonus:st.elite === 'yes' ? [{l:'Elite', v:hard ? 100000 : 50000}] : [], split:'host',
      note:'Kortz ไม่มีการตั้งเปอร์เซ็นต์ – โฮสต์เก็บยอดทั้งหมด ลูกทีมได้ค่าจ้างคงที่จากเกมราว $100k–200k ต่อคน (รายงานจากผู้เล่น) จึงควรผลัดกันเป็นโฮสต์'};
  },
  tips(st){
    const t = [], n = st.players;
    if(st.first === 'yes') t.push('ภาพหลักชิ้นแรกที่ขายหลังรีเซ็ตวันพฤหัสคือก้อนใหญ่สุดของ heist นี้ ทำรอบแรกให้คลีน อย่าเสี่ยงพังเพื่อเก็บของรองเพิ่ม');
    else t.push('ขายภาพที่สองของสัปดาห์จะเหลือราว 1/4 ของรอบแรก ถ้าใช้สิทธิ์ไปแล้ว หมุนไปทำ heist อื่นที่ยังได้โบนัสรายสัปดาห์จะคุ้มกว่า');
    if(st.entry === 'loading') t.push('Loading Bay คือทางฟาร์ม ขับรถ Alpha Mail เข้าไปเริ่มติดห้องเซิร์ฟเวอร์เลย ไม่ต้องเดินลงหลายชั้น');
    if(st.entry === 'sewer') t.push('สาย Sewer ต้องหากุญแจท่อใหม่ทุกรอบ (สุ่ม 5 จุดรอบนอก) – เดินหานาน ๆ กลางแจ้งเสี่ยงยามเห็นก่อนเข้าตึก');
    if(st.entry === 'skylight') t.push('Skylight เหมาะกับคนล่า Elite แบบสเตลท์ล้วน แว่น Night Vision ช่วยมาก แต่ต้องไล่ลงจากชั้นบนสุด');
    if(st.entry === 'staff') t.push('Staff Entrance เหมาะรอบแรกไว้จำแผนผังตึก รอบต่อไปเปลี่ยนเป็น Loading Bay จะเร็วขึ้นเยอะ');
    if(st.getaway === 'annihilator') t.push('ระวัง! มีรายงานบั๊กนักบิน NPC พา Annihilator ตกตอนรับตัว – ใช้ Manchez/Caracara หรือออกถนนหารถเองปลอดภัยกว่า');
    if(n === 1) t.push('เล่นเดี่ยวเข้าห้อง Exhibit Level 2 ไม่ได้ (ต้อง 2 คน) ถ้า Buyer’s Request อยู่ในห้องนั้น Elite รอบนี้หมดสิทธิ์ ดูตอน Scope ก่อน');
    if(!st.preps.includes('guard')) t.push('ทำ Guard Routes ไว้ จะเห็นยามบนมินิแมพ เส้นทางลาดตระเวนตายตัวทุกรอบ จำครั้งเดียวใช้ได้ตลอด');
    if(st.diff === 'hard') t.push('Hard เปิดได้เฉพาะรีเพลย์ (จ่าย $100k ภายในราว 15 นาทีหลัง Raf โทร) ได้หลักเพิ่มแค่ ~10% ตัวจริงคือ Elite $100k');
    t.push('พยานที่ยังมีชีวิตและฟุตเทจกล้องทำให้ของราคาตก – ลบฟุตเทจที่คอมหน้าห้องนิรภัยก่อนออกทุกครั้ง และเผื่อเวลาในห้องนิรภัยอย่างน้อย 10 วินาที');
    return t.slice(0, 5);
  },
  pro(st){ const st2 = {entry:'loading', getaway:'manchez', preps:['guard','emp'], request:'yes', elite:'yes', first:'yes', bags:Array(4).fill('top2')};
    return {patch:st2, msg:'จัดให้แล้ว: Loading Bay ปลอมเป็นพนักงานส่งของ, Guard Routes + EMP, หนีด้วย Manchez, เก็บภาพชั้นดีเต็มกระเป๋า, ทำ Buyer’s Request ให้ครบ และรันให้ตรงรอบแรกของสัปดาห์'}; }
},

cayo:{
  short:'Cayo Perico', where:() => ({hash:PLACES.cayo, l:'คฤหาสน์ El Rubio'}), accent:'#D9622B', poster:posterCayo,
  name:'The Cayo Perico Heist',
  tag:'แทรกซึมเกาะส่วนตัวของ El Rubio ด้วยเรือดำน้ำ Kosatka ขโมยของในห้องนิรภัยคฤหาสน์ กวาดของรองรอบเกาะ แล้วหนีออกทะเล – heist ที่เล่นคนเดียวได้ตั้งแต่ต้นจนจบ',
  facts:[['ผู้เล่น','1–4 คน'],['ต้องมี','Kosatka'],['ค่าเซ็ตอัป','$100,000'],['หักจากยอด','Fencing 10% + Pavel 2%'],['คูลดาวน์','144 นาที (เดี่ยว) / 48 นาที (ทีม)'],['Elite','$50k / $100k (Hard)']],
  defaults:{players:1, diff:'normal', primary:'pink', approach:'stealth', vehicle:'kosatka', entry:'drain', compound:'drain', escape:'kosatka', loadout:'conspirator', time:'night', bags:['coke','coke','coke','coke'], safe:50000, elite:'no', cuts:[100]},
  fix(st){
    const e = CAYO_VEH[st.vehicle].e; if(!e.includes(st.entry)) st.entry = e[0];
    if(st.entry === 'drain') st.compound = 'drain'; else if(st.compound === 'drain') st.compound = 'main';
    if(st.players === 1 && st.bags[0] === 'gold') st.bags[0] = 'coke';
  },
  groups(st){
    const hard = st.diff === 'hard', ents = CAYO_VEH[st.vehicle].e;
    return [
      {stage:'ทีมและความยาก', key:'players', label:'จำนวนผู้เล่น', type:'chips', num:true, options:nOpts(1,4)},
      {key:'diff', label:'ระดับความยาก', type:'chips', options:[{v:'normal', l:'Normal'}, {v:'hard', l:'Hard', d:'หลัก +10% • Elite $100k'}]},
      {stage:'เป้าหมาย', key:'primary', label:'เป้าหมายหลักในห้องนิรภัย El Rubio', hint:'สุ่มจากการ Scope – รอบแรกของสัปดาห์มีโอกาสได้ของดีกว่า', type:'chips', wide:true,
        options:Object.entries(CAYO_PRIM).map(([v, o]) => ({v, l:o.l, d:fmt(o.v * (hard && !o.first ? 1.1 : 1)) + (o.ev ? ' • อีเวนต์' : '') + (o.first ? ' • ครั้งแรกสุด' : '')}))},
      {key:'bags', label:'กระเป๋าของรอง (คนละ 1 ใบ)', hint:'มูลค่าเฉลี่ยต่อกระเป๋าเต็ม ชนิดของรองสุ่มทุกรอบ', type:'bags', wide:true, src:CAYO_BAG, goldNeeds2:true},
      {key:'safe', label:'ตู้เซฟห้อง El Rubio’s Office', hint:'สุ่ม $18k–$99k ไม่กินที่ในกระเป๋า', type:'range', min:18000, max:99000, step:1000},
      {stage:'แทรกซึม', key:'approach', label:'รูปแบบการปล้น', type:'chips', options:[{v:'stealth', l:'Stealth', d:'ลอบเงียบ'}, {v:'aggressive', l:'Aggressive', d:'บุกเปิดหน้า'}]},
      {key:'time', label:'เวลาเริ่ม', type:'chips', options:[{v:'night', l:'กลางคืน', d:'ยามเห็นไม่ไกล'}, {v:'day', l:'กลางวัน', d:'มองชัดทั้งสองฝ่าย'}]},
      {key:'vehicle', label:'พาหนะแทรกซึม', type:'chips', wide:true, options:Object.entries(CAYO_VEH).map(([v, o]) => ({v, l:o.l, d:o.d}))},
      {key:'entry', label:'จุดขึ้นเกาะ', hint:'จุดที่ใช้ได้ขึ้นกับพาหนะ', map:CAYO_MAP.entry, type:'chips', options:Object.entries(CAYO_ENTRY).map(([v, l]) => ({v, l, dis:!ents.includes(v)}))},
      {key:'compound', label:'ทางเข้าคฤหาสน์', map:CAYO_MAP.compound, type:'chips', options:Object.entries(CAYO_COMP).map(([v, l]) => ({v, l, dis:(st.entry === 'drain') !== (v === 'drain')}))},
      {key:'loadout', label:'ชุดอาวุธ', type:'chips', wide:true, options:[
        {v:'aggressor', l:'Aggressor', d:'ลูกซอง'}, {v:'conspirator', l:'Conspirator', d:'ไรเฟิลเก็บเสียง'}, {v:'crackshot', l:'Crack Shot', d:'สไนเปอร์'},
        {v:'saboteur', l:'Saboteur', d:'SMG เก็บเสียง'}, {v:'marksman', l:'Marksman', d:'ไรเฟิลจู่โจม'}]},
      {stage:'หลบหนี', key:'escape', label:'จุดหลบหนี', map:CAYO_MAP.escape, type:'chips', options:[
        {v:'kosatka', l:'Kosatka', d:'ว่ายออกทะเลกลับเรือดำน้ำ'}, {v:'airstrip', l:'Airstrip', d:'ขโมยเครื่องบิน'},
        {v:'maindock', l:'Main Dock', d:'เรือที่ท่าหลัก'}, {v:'northdock', l:'North Dock', d:'เรือที่ท่าเหนือ'}]},
      {stage:'โบนัส', key:'elite', label:'Elite Challenge', hint:'จบใน 15 นาที • กระเป๋าเต็มทุกคน • แฮกไม่พลาด', type:'chips', options:yesno('ทำได้', 'ไม่ทำ')}
    ];
  },
  calc(st){
    const p = CAYO_PRIM[st.primary], hard = st.diff === 'hard';
    const prim = p.v * (hard && !p.first ? 1.1 : 1);
    const lines = [{l:'เป้าหมายหลัก: ' + p.l + (hard && !p.first ? ' (Hard)' : ''), v:prim}];
    for(let i = 0; i < st.players; i++){ const b = CAYO_BAG[st.bags[i]]; if(b.v) lines.push({l:`กระเป๋า P${i + 1}: ${b.l}` + (p.boost > 1 ? ` (+${Math.round((p.boost - 1) * 100)}%)` : ''), v:b.v * p.boost}); }
    lines.push({l:'ตู้เซฟ El Rubio', v:st.safe});
    const gross = sum(lines, x => x.v);
    const deducts = p.first ? [] : [{l:'ค่าฟอกของ Madrazo', pct:10, v:gross * .10}, {l:'ส่วนแบ่ง Pavel', pct:2, v:gross * .02}];
    return {lines, gross, deducts, hostFees:[{l:'ค่าเซ็ตอัป', v:100000}], bonus:st.elite === 'yes' ? [{l:'Elite', v:hard ? 100000 : 50000}] : [], split:'cuts',
      note:p.first ? 'รอบแรกสุด (Madrazo Files) ยังไม่ถูกหัก Fencing และ Pavel' : 'ขั้นต่ำส่วนแบ่งคนละ 15% • โฮสต์เป็นคนจ่ายค่าเซ็ตอัป'};
  },
  tips(st){
    const t = [], n = st.players, p = st.primary;
    if(p === 'madrazo') t.push('รอบแรกสุดได้ Madrazo Files ตายตัว และยังไม่โดนหัก 12% – โกยของรองให้เต็มกระเป๋าเลย');
    if(p === 'tequila') t.push('ได้ Tequila ไม่ต้องเซ็ง ของรองรอบนี้ได้บูสต์ +20% ไปกวาดโคเคนให้เต็มกระเป๋า เงินจะกลับมาเยอะ');
    if(p === 'panther') t.push('Panther Statue มาเฉพาะช่วงอีเวนต์ เห็นเมื่อไหร่รีบจ่ายค่าเซ็ตอัปให้ทันเปิด Hard');
    if(n === 1) t.push('เล่นเดี่ยวเอาทองในคฤหาสน์ไม่ได้ (ต้องรูดคีย์การ์ด 2 คนพร้อมกัน) – โคเคนคือของรองที่คุ้มสุดสำหรับคนเดียว');
    else if(st.bags.slice(0, n).some(b => b !== 'gold')) t.push(`มากัน ${n} คน ทองคุ้มสุด (~$446k ต่อกระเป๋า) แต่ทองบนเกาะมีจำกัด ถ้าไม่พอค่อยเติมโคเคน`);
    if(st.entry === 'drain') t.push('สูตรคลาสสิก: Kosatka → ว่ายเข้าท่อระบายน้ำ ตัดลูกกรงแล้วโผล่ในคฤหาสน์ ไม่ต้องปะทะใคร');
    else t.push('ถ้ายังไม่คล่อง ลอง Kosatka + Drainage Tunnel ดู เป็นเส้นทางที่เงียบและเร็วสุดสำหรับสายลอบ');
    if(st.escape === 'airstrip') t.push('หนีทางลานบินต้องผ่านยามเยอะ โดนเห็นทีเดียววุ่นทั้งเกาะ – ว่ายออกทะเลกลับ Kosatka ง่ายกว่า');
    if(st.time === 'day') t.push('กลางวันยามมองเห็นไกลกว่า มือใหม่เลือกกลางคืนไว้ก่อน');
    if(st.approach === 'stealth' && (st.loadout === 'aggressor' || st.loadout === 'crackshot' || st.loadout === 'marksman')) t.push('สายลอบควรใช้ปืนเก็บเสียง: Conspirator หรือ Saboteur ยิงแล้วยามข้าง ๆ ไม่แตกตื่น');
    if(st.approach === 'aggressive') t.push('Aggressive ใช้ได้ แต่เสียเวลายิงจน Elite 15 นาทีหลุดง่าย ส่วนเงินไม่ได้เพิ่มเลย');
    t.push(st.diff === 'hard' ? 'Hard ต้องจ่ายค่าเซ็ตอัปภายใน 48 นาทีหลัง Pavel โทรมาตอนคูลดาวน์หมด – พลาดแล้วจะกลายเป็น Normal' : 'อยากได้ Hard ให้จ่ายค่าเซ็ตอัปภายใน 48 นาทีหลังคูลดาวน์หมด หลักเพิ่ม 10% และ Elite เป็น $100k');
    t.push('ทำ Cayo รอบเดียวหลังรีเซ็ตวันพฤหัส การ Scope รอบต่อ ๆ ไปในสัปดาห์เดียวกันส่วนใหญ่จะได้ Tequila');
    return t.slice(0, 5);
  },
  pro(st){ const gold = st.players > 1;
    return {patch:{approach:'stealth', vehicle:'kosatka', entry:'drain', compound:'drain', escape:'kosatka', loadout:'conspirator', time:'night', diff:'hard', elite:'yes', bags:Array(4).fill(gold ? 'gold' : 'coke')},
      msg:`จัดให้แล้ว: Kosatka → Drainage Tunnel กลางคืน, Conspirator เก็บเสียง, ว่ายกลับเรือดำน้ำ, เปิด Hard + Elite และให้ทุกคนเก็บ${gold ? 'ทอง' : 'โคเคน'}เต็มกระเป๋า อย่าลืมแวะตู้เซฟห้อง El Rubio`}; }
},

casino:{
  short:'Diamond Casino', where:() => ({hash:PLACES.casino, l:'Diamond Casino & Resort'}), accent:'#8A55D6', poster:posterCasino,
  name:'The Diamond Casino Heist',
  tag:'งานใหญ่ของ Lester: เจาะห้องนิรภัยใต้ Diamond Casino & Resort เลือกได้ทั้งลอบเงียบ ปลอมตัว หรือบุกยิง จ้างลูกทีม NPC เป็นมือปืน คนขับ และแฮกเกอร์',
  facts:[['ผู้เล่น','2–4 คน'],['ต้องมี','Arcade + เป็น CEO/VIP/MC'],['ค่าเซ็ตอัป','$25,000'],['ส่วนแบ่ง Lester','5%'],['รันแรกของสัปดาห์','≈ ×1.86'],['Elite','$50k / $100k (Hard)']],
  defaults:{players:2, diff:'normal', target:'gold', approach:'bigcon', disguise:'gruppe6', entry:'main', exit:'staff', exitd:'none', gunman:'karl', driver:'karim', hacker:'christian', buyer:'high', first:'yes', elite:'no', hits:0, cuts:[50,50]},
  fix(st){ const ok = CASINO_BY[st.approach]; if(!ok.includes(st.entry)) st.entry = ok[0]; },
  groups(st){
    const hard = st.diff === 'hard', f = st.first === 'yes', ok = CASINO_BY[st.approach];
    const g = [
      {stage:'ทีมและความยาก', key:'players', label:'จำนวนผู้เล่น', hint:'ประตูห้องนิรภัยต้องใช้ 2 คน', type:'chips', num:true, options:nOpts(2,4)},
      {key:'diff', label:'ระดับความยาก', type:'chips', options:[{v:'normal', l:'Normal'}, {v:'hard', l:'Hard', d:'+10%'}]},
      {key:'first', label:'Finale แรกของโฮสต์ในสัปดาห์', hint:'ตัวคูณมาจากการทดสอบของชุมชน Rockstar ไม่ได้ประกาศ', type:'chips', options:yesno('ใช่ (≈ ×1.86)', 'ไม่ใช่')},
      {stage:'เป้าหมายและแนวทาง', key:'target', label:'ของในห้องนิรภัย', type:'chips', wide:true,
        options:Object.entries(CASINO_T).map(([v, o]) => ({v, l:o.l, d:(f ? '≈ ' : '') + fmt(o.v * (hard ? 1.1 : 1) * (f ? 1.86 : 1)) + ' • ' + o.th}))},
      {key:'approach', label:'แนวทาง (Approach)', type:'chips', wide:true, options:[
        {v:'ss', l:'Silent & Sneaky', d:'ลอบเงียบ ห้ามโดนเห็น'}, {v:'bigcon', l:'The Big Con', d:'ปลอมตัวเดินเข้าประตู'}, {v:'aggr', l:'Aggressive', d:'บุกยิงเปิดทาง'}]},
      {stage:'ลูกทีม NPC', key:'hacker', label:'แฮกเกอร์', hint:'กำหนดเวลาที่อยู่ในห้องนิรภัยได้ (ถ้าไม่โดนจับได้)', type:'chips', wide:true, options:HCK.map(([v, l, c, tm]) => ({v, l, d:`${c}% • ${tm}`}))},
      {key:'gunman', label:'มือปืน', type:'chips', options:GUN.map(([v, l, c]) => ({v, l, d:c + '%'}))},
      {key:'driver', label:'คนขับ', type:'chips', options:DRV.map(([v, l, c]) => ({v, l, d:c + '%'}))},
      {stage:'แทรกซึม', key:'entry', label:'ทางเข้า', hint:'ต้องปลดล็อกจากการ Scope ก่อน', type:'chips', options:Object.entries(CASINO_ENTRY).map(([v, l]) => ({v, l, dis:!ok.includes(v)}))}
    ];
    if(st.approach === 'bigcon') g.push({key:'disguise', label:'ชุดปลอมตัวตอนเข้า', type:'chips', options:[
      {v:'gruppe6', l:'Gruppe Sechs', d:'ยามขนเงิน'}, {v:'bugstars', l:'Bugstars', d:'กำจัดแมลง'}, {v:'maint', l:'Maintenance', d:'ช่างซ่อม'}, {v:'celeb', l:'Yung Ancestor', d:'คนดัง'}]});
    g.push(
      {stage:'หลบหนี', key:'exit', label:'ทางออก', type:'chips', options:Object.entries(CASINO_ENTRY).map(([v, l]) => ({v, l}))},
      {key:'exitd', label:'ชุดปลอมตัวตอนออก', type:'chips', options:[{v:'none', l:'ไม่ใช้'}, {v:'fire', l:'Firefighter'}, {v:'noose', l:'NOOSE'}, {v:'roller', l:'High Roller'}]},
      {key:'buyer', label:'ผู้ซื้อ (จุดส่งของ)', type:'chips', options:[{v:'low', l:'Low Level', d:'ไกลสุด'}, {v:'mid', l:'Mid Level', d:'กลาง ๆ'}, {v:'high', l:'High Level', d:'ใกล้สุด'}]},
      {key:'hits', label:'กระสุนที่โดนตอนแบกของ', hint:'โดนยิงขณะแบกของ เงินในกระเป๋าหายราว $2,000 ต่อนัด', type:'range', min:0, max:80, step:1, unit:'นัด'},
      {stage:'โบนัส', key:'elite', label:'Elite Challenge', hint:st.approach === 'aggr' ? 'ต่ำกว่า 15:00 • ไม่มีใครตาย • เฮดช็อต 80 ครั้ง' : 'ต่ำกว่า 15:00 • ไม่มีใครตาย • ไม่โดนจับได้' + (st.approach === 'ss' ? ' • แฮกไม่พลาด' : ''), type:'chips', options:yesno('ทำได้', 'ไม่ทำ')}
    );
    return g;
  },
  calc(st){
    const T = CASINO_T[st.target], hard = st.diff === 'hard', f = st.first === 'yes';
    const v = T.v * (hard ? 1.1 : 1) * (f ? 1.86 : 1);
    const gm = GUN.find(x => x[0] === st.gunman), dr = DRV.find(x => x[0] === st.driver), hk = HCK.find(x => x[0] === st.hacker);
    const deducts = [{l:'Lester', pct:5, v:v * .05}, {l:'มือปืน ' + gm[1], pct:gm[2], v:v * gm[2] / 100}, {l:'คนขับ ' + dr[1], pct:dr[2], v:v * dr[2] / 100}, {l:'แฮกเกอร์ ' + hk[1], pct:hk[2], v:v * hk[2] / 100}];
    if(st.hits > 0) deducts.push({l:`โดนยิง ${st.hits} นัด ≈`, v:st.hits * 2000});
    return {lines:[{l:`ห้องนิรภัย: ${T.l}` + (f ? ' (รันแรก ≈)' : ''), v}], gross:v, deducts, hostFees:[{l:'ค่าเซ็ตอัปให้ Lester', v:25000}],
      bonus:st.elite === 'yes' ? [{l:'Elite', v:hard ? 100000 : 50000}] : [], split:'cuts', note:'ขั้นต่ำส่วนแบ่งคนละ 15% • ยอดนี้สมมุติว่าเก็บของได้เต็ม ถ้าเวลาในห้องนิรภัยไม่พอ ยอดจริงจะต่ำกว่า'};
  },
  tips(st){
    const t = [], gm = GUN.find(x => x[0] === st.gunman), dr = DRV.find(x => x[0] === st.driver);
    if(st.first === 'no') t.push('รันแรกของสัปดาห์ (หลังรีเซ็ตพฤหัส) จ่ายราว 1.86 เท่า มากกว่าการประหยัดค่าลูกทีมทุกอย่างรวมกัน – นัดทีมให้ตรงวัน');
    if(st.hacker === 'rickie') t.push('Rickie ถูกสุดก็จริง แต่เวลาในห้องนิรภัยสั้นสุด เก็บของไม่ทันเงินหายมากกว่าค่าจ้างที่ประหยัดได้');
    if(st.hacker === 'yohan') t.push('Yohan 5% ได้ 2:52 แต่ Christian Feltz 7% ได้ 3:00 และไม่ต้องมี Nightclub – Feltz คุ้มกว่า');
    if(gm[2] + dr[2] > 10) { const save = (gm[2] + dr[2] - 10); t.push(`มือปืนกับคนขับแทบไม่มีผลต่อเงิน ใช้ Karl + Karim (5% + 5%) จะเพิ่มกองกลางอีก ${save}%`); }
    if(st.approach === 'ss') t.push('Silent & Sneaky ห้ามโดนเห็นเด็ดขาด ถ้าโดนจับได้ระหว่างทาง เวลาในห้องนิรภัยจะหายไปราวหนึ่งนาที');
    if(st.approach === 'bigcon') t.push('Big Con สมดุลสุดทั้งความเร็วและความปลอดภัย ชุด Gruppe Sechs เป็นตัวเลือกยอดนิยมของสายฟาร์ม');
    if(st.approach === 'aggr') t.push('Aggressive เซ็ตอัปไวสุด แต่ทุกนัดที่โดนตอนแบกของคือเงินที่หาย และ Elite ต้องเฮดช็อต 80 ครั้ง');
    if(st.target === 'diamonds') t.push('เพชรมีเฉพาะสัปดาห์อีเวนต์ Scope เจอเมื่อไหร่ห้ามพลาด – รวมกับรันแรกของสัปดาห์คือเพดานสูงสุดของ heist นี้');
    if(st.players === 2 && st.target === 'gold') t.push('ทองกับ 2 คน: ทองหนักเก็บช้า เลือกแฮกเกอร์เวลานาน (Paige/Avi) ถึงจะขนได้เกือบครบ');
    if(st.buyer === 'low') t.push('ผู้ซื้อ Low Level อยู่ไกลสุด ขับหนีตำรวจนานขึ้น ถ้าเลือกได้เอา High Level');
    return t.slice(0, 5);
  },
  pro(st){ return {patch:{approach:'bigcon', disguise:'gruppe6', entry:'main', exit:'staff', gunman:'karl', driver:'karim', hacker:'paige', buyer:'high', first:'yes', elite:'yes', hits:0},
    msg:'จัดให้แล้ว: Big Con ชุด Gruppe Sechs เข้าประตูหน้า, Karl + Karim ตัวถูก, Paige Harris เวลา 3:25, ผู้ซื้อ High Level และรันตรงรอบแรกของสัปดาห์ (ถ้ามี Avi ใช้ Avi ได้เลย)'}; }
},

doom:{
  short:'Doomsday', where:() => null, nowhere:'จุดเริ่มคือ Facility ของคุณเอง และ Finale แต่ละองก์ไม่มีจุดตายตัว', accent:'#C9431F', poster:posterDoom,
  name:'The Doomsday Heist',
  tag:'มหากาพย์ 3 องก์จาก Facility ใต้ดิน ไล่ล่าข้อมูล บุกเรือดำน้ำของ Bogdan และปิดฉากด้วยการหยุด AI ที่จะยิงขีปนาวุธถล่มเมือง',
  facts:[['ผู้เล่น','2–4 คน'],['ต้องมี','Facility'],['ค่าเซ็ตอัป','$65k / $95k / $120k'],['รันแรกของสัปดาห์','≈ ×1.22'],['Elite','$50,000']],
  defaults:{players:4, diff:'normal', act:'a3', first:'yes', elite:'no', cuts:[25,25,25,25]},
  fix(){},
  groups(st){
    const ec = {a1:['จบในไม่เกิน 15:00','รถเสียหายไม่ถึง 10%','ไม่มีใครตาย'], a2:['จบในไม่เกิน 15:00','รถเสียหายไม่ถึง 5%','ไม่มีใครตาย'], a3:['จบในไม่เกิน 30:00','เฮดช็อต 150 ครั้ง','ไม่มีใครตาย']}[st.act];
    const f = st.first === 'yes';
    return [
      {stage:'เลือกองก์', key:'act', label:'Finale', type:'chips', wide:true, options:Object.entries(DOOM).map(([v, o]) => ({v, l:o.l, d:(f ? '≈ ' : '') + fmt((st.diff === 'hard' ? o.h : o.n) * (f ? 1.222 : 1))}))},
      {stage:'ทีมและเงื่อนไข', key:'players', label:'จำนวนผู้เล่น', type:'chips', num:true, options:nOpts(2,4)},
      {key:'diff', label:'ระดับความยาก', type:'chips', options:[{v:'normal', l:'Normal'}, {v:'hard', l:'Hard', d:'+25%'}]},
      {key:'first', label:'Finale แรกของโฮสต์ในสัปดาห์', type:'chips', options:yesno('ใช่ (≈ ×1.22)', 'ไม่ใช่')},
      {stage:'โบนัส', key:'elite', label:'Elite Challenge', type:'chips', options:yesno('ทำได้', 'ไม่ทำ')},
      {key:'_ec', label:'เงื่อนไข Elite ขององก์นี้', type:'info', items:ec}
    ];
  },
  calc(st){
    const a = DOOM[st.act], f = st.first === 'yes', v = (st.diff === 'hard' ? a.h : a.n) * (f ? 1.222 : 1);
    return {lines:[{l:a.l + (f ? ' (รันแรก ≈)' : ''), v}], gross:v, deducts:[], hostFees:[{l:'ค่าเซ็ตอัป', v:a.s}],
      bonus:st.elite === 'yes' ? [{l:'Elite', v:50000}] : [], split:'cuts', note:'ขั้นต่ำส่วนแบ่งคนละ 15% • โฮสต์จ่ายค่าเซ็ตอัป'};
  },
  tips(st){
    const t = [];
    if(st.act === 'a3') t.push('Act III ยาวสุด (Finale 45–60 นาที) แต่จ่ายสูงสุดในสาม องก์ Elite ต้องเฮดช็อต 150 ครั้ง ทีมต้องมีมือปืนแม่น');
    if(st.act === 'a2') t.push('Act II Elite ต้องจบใน 15 นาทีและรถเสียหายไม่ถึง 5% – ให้คนขับมือดีสุดของทีมจับพวงมาลัย');
    if(st.act === 'a1') t.push('Act I สั้นและง่ายสุด เหมาะใช้อุ่นเครื่องทีมใหม่ก่อนไปองก์ใหญ่');
    t.push(st.first === 'yes' ? 'โบนัสรันแรกผูกกับโฮสต์ – ถ้าเพื่อนในทีมยังไม่ได้ทำสัปดาห์นี้ ผลัดกันเป็นโฮสต์จะได้โบนัสหลายรอบ' : 'ถ้าโฮสต์ยังไม่ได้เล่นองก์นี้สัปดาห์นี้ จะได้ราว 1.22 เท่า ให้คนที่ยังไม่ได้ทำเป็นโฮสต์');
    t.push(st.diff === 'hard' ? 'Hard ได้เพิ่ม 25% จาก Normal ศัตรูแน่นขึ้น เตรียมเกราะให้เต็ม' : 'ทีมที่เล่นคล่องแล้วเปิด Hard ได้เพิ่ม 25% ทันที');
    t.push('Setup mission ของ Doomsday ได้รับการปรับเงินขึ้นในอัปเดต 1.73 ทำเองทุกขั้นไม่เสียเปล่า');
    return t.slice(0, 5);
  },
  pro(){ return {patch:{diff:'hard', first:'yes', elite:'yes', act:'a3'}, msg:'จัดให้แล้ว: Act III บน Hard รันแรกของสัปดาห์ – ก้อนใหญ่สุดของ Doomsday ทีมต้องพร้อมเล่นยาวราวหนึ่งชั่วโมง'}; }
},

og:{
  short:'Original Heists', where:st => PLACES[st.heist] ? {hash:PLACES[st.heist], l:OG_PLACE[st.heist]} : null, nowhere:'Series A Funding ไม่มีจุดเป้าหมายเดียว (หลายฉากทั่วเมือง)', accent:'#2E8B57', poster:posterOG,
  name:'The Original Heists',
  tag:'heist ชุดแรกของ GTA Online จาก High-end Apartment ไล่ตั้งแต่ปล้นธนาคาร Fleeca จนถึงงานใหญ่ Pacific Standard ต้องใช้ทีมครบตามบทบาท',
  facts:[['ผู้เล่น','4 คน (Fleeca 2 คน)'],['ต้องมี','High-end Apartment'],['ความยาก','Easy / Normal / Hard'],['รันแรกของสัปดาห์','×1.5'],['Elite','$100k (Fleeca $50k)']],
  defaults:{heist:'pacific', players:4, diff:'normal', first:'yes', elite:'no', cuts:[25,25,25,25]},
  fix(st){ const p = OG[st.heist].p; if(st.players !== p){ st.players = p; st.cuts = evenCuts(p); } },
  groups(st){
    const f = st.first === 'yes', key = {easy:'e', normal:'n', hard:'h'}[st.diff];
    return [
      {stage:'เลือก heist', key:'heist', label:'Finale', type:'chips', wide:true, options:Object.entries(OG).map(([v, o]) => ({v, l:o.l, d:fmt(o[key] * (f ? 1.5 : 1)) + ` • ${o.p} คน`}))},
      {stage:'ความยากและเงื่อนไข', key:'diff', label:'ระดับความยาก', type:'chips', options:[{v:'easy', l:'Easy', d:'ครึ่งของ Normal'}, {v:'normal', l:'Normal'}, {v:'hard', l:'Hard', d:'+25%'}]},
      {key:'first', label:'Finale แรกของโฮสต์ในสัปดาห์', type:'chips', options:yesno('ใช่ (×1.5)', 'ไม่ใช่')},
      {stage:'โบนัส', key:'elite', label:'Elite Challenge', type:'chips', options:yesno('ทำได้', 'ไม่ทำ')},
      {key:'_ec', label:'เงื่อนไข Elite', type:'info', items:OG[st.heist].ec}
    ];
  },
  calc(st){
    const o = OG[st.heist], f = st.first === 'yes', v = o[{easy:'e', normal:'n', hard:'h'}[st.diff]] * (f ? 1.5 : 1);
    return {lines:[{l:o.l + (f ? ' (รันแรก ×1.5)' : ''), v}], gross:v, deducts:[], hostFees:[{l:'ค่าเซ็ตอัป', v:o.s}],
      bonus:st.elite === 'yes' ? [{l:'Elite', v:o.elite}] : [], split:'cuts', note:'ขั้นต่ำส่วนแบ่งคนละ 15% • โฮสต์จ่ายค่าเซ็ตอัป'};
  },
  tips(st){
    const t = [];
    if(st.heist === 'pacific') t.push('Pacific Standard Elite: จบใน 10:15 และห้ามให้ NOOSE ถูกเรียก – คนแฮกต้องไม่พลาด ทีมขี่มอเตอร์ไซค์หนีต้องไม่หลง');
    if(st.heist === 'fleeca') t.push('Fleeca ใช้แค่ 2 คน จบไว เป็น heist ที่ดีสุดสำหรับมือใหม่ฝึกงานทีม');
    if(st.heist === 'prison') t.push('Prison Break Elite: Rashkovsky ต้องเสียหายไม่เกิน 1% คนคุ้มกันต้องขับนิ่งมาก');
    if(st.heist === 'humane') t.push('Humane Labs Elite: รถเสียหายไม่ถึง 2% – คนขับ Insurgent ต้องระวังทุกโค้ง');
    if(st.heist === 'seriesa') t.push('Series A Elite ต้องฆ่า 75 คน ให้ทุกคนช่วยกันยิง อย่าปล่อยภาระไว้ที่คนเดียว');
    t.push(st.first === 'yes' ? 'โบนัส ×1.5 นับจากโฮสต์ ผลัดกันเป็นโฮสต์ heist เดียวกันได้หลายรอบในสัปดาห์' : 'ถ้าโฮสต์ยังไม่ได้ทำ Finale นี้สัปดาห์นี้ จะได้เพิ่ม 50% ทันที');
    if(st.diff !== 'hard') t.push('ทีมขาประจำเปิด Hard ได้เพิ่ม 25% จาก Normal ส่วน Easy ได้แค่ครึ่งเดียว');
    t.push('โฮสต์จ่ายค่าเซ็ตอัปและทำ Setup เยอะสุด ธรรมเนียมทั่วไปคือโฮสต์รับส่วนแบ่งมากกว่าเล็กน้อย');
    return t.slice(0, 5);
  },
  pro(){ return {patch:{heist:'pacific', diff:'hard', first:'yes', elite:'yes'}, msg:'จัดให้แล้ว: Pacific Standard บน Hard รันแรกของสัปดาห์ – งานที่จ่ายสูงสุดของชุด Original'}; }
}
};
const ORDER = ['kortz','cayo','casino','doom','og'];

/* ---------- state ---------- */
const STORE_KEY = 'gtaoheist.board';
let cur = 'cayo', S = {}, coachMsg = '';
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
  const item = k => `<button type="button" data-h="${k}" aria-current="${k === cur}" style="--h:${H[k].accent}"><div class="thumb">${H[k].poster()}</div><span class="nm">${H[k].short}${H[k].isNew ? '<span class="new">ใหม่ 2026</span>' : ''}</span></button>`;
  $('rail').innerHTML = ORDER.map(item).join('');
  $('tabs').innerHTML = ORDER.map(k => `<button type="button" data-h="${k}" aria-current="${k === cur}" style="--h:${H[k].accent}">${H[k].short}</button>`).join('');
}
function whereHTML(){
  const h = H[cur], w = h.where(S[cur]);
  return w ? `<a class="maplink big" href="${mapHref(w.hash)}">📍 ดู ${w.l} บนแผนที่</a>` : `<p class="nowhere">📍 ${h.nowhere}</p>`;
}
function renderHero(anim){
  const h = H[cur];
  $('hero').innerHTML = `<div class="poster${anim ? ' in' : ''}">${h.poster()}</div>
  <div class="brief"><h1>${h.name}</h1><p class="tag">${h.tag}</p>
  <dl class="facts">${h.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl><div id="where">${whereHTML()}</div></div>`;
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
    b = '<div class="bags">' + Array.from({length:st.players}, (_, i) => `<label class="bagrow"><b>P${i + 1}${i === 0 ? ' โฮสต์' : ''}</b><select data-bag="${i}">` +
      Object.entries(g.src).map(([v, o]) => `<option value="${v}"${st.bags[i] === v ? ' selected' : ''}${g.goldNeeds2 && v === 'gold' && st.players < 2 ? ' disabled' : ''}>${o.l}${o.v ? ' • ≈ ' + fmt(o.v) : ''}${g.goldNeeds2 && v === 'gold' && st.players < 2 ? ' (ต้อง 2 คน)' : ''}</option>`).join('') + '</select></label>').join('') + '</div>';
  } else if(g.type === 'info'){
    b = '<ul class="info">' + g.items.map(x => `<li>${x}</li>`).join('') + '</ul>';
  }
  const ml = g.map && g.map[st[g.key]] ? ` <a class="maplink" href="${mapHref(g.map[st[g.key]])}" title="ดูจุดที่เลือกบนแผนที่">📍 แผนที่</a>` : '';
  return `<section class="grp${g.wide ? ' wide' : ''}"><h3>${g.label}${ml}</h3>${g.hint ? `<p class="hint">${g.hint}</p>` : ''}${b}</section>`;
}
const rv = (g, v) => g.unit ? `${v} ${g.unit}` : fmt(v);

const SEG = ['#B83227','#D9763A','#C9A227','#8C6D5A','#7E57C2','#5C6BC0'];
function renderSummary(){
  const h = H[cur], st = S[cur], r = h.calc(st);
  const ded = sum(r.deducts, d => d.v), pool = Math.max(0, r.gross - ded);
  $('rcsub').textContent = `${h.short} • ${st.players} คน • ${({easy:'Easy', normal:'Normal', hard:'Hard'})[st.diff]}`;
  let html = '<div class="rc-lines">' + r.lines.map(x => row(x.l, fmt(x.v))).join('') + '</div>';
  html += row('มูลค่ารวมที่ปล้นได้', fmt(r.gross), 'tot');
  r.deducts.forEach(d => html += row(d.l + (d.pct != null ? `<span class="pct">${d.pct}%</span>` : ''), '−' + fmt(d.v), 'neg'));
  html += row(r.split === 'host' ? 'เข้ากระเป๋าโฮสต์' : 'กองกลางแบ่งให้ผู้เล่น', fmt(pool), 'pool');
  // bar
  const segs = [], leg = [];
  r.deducts.forEach((d, i) => { segs.push([d.v, SEG[i % SEG.length]]); leg.push([d.l.replace(' ≈', ''), SEG[i % SEG.length]]); });
  if(r.split === 'host'){ segs.push([pool, 'var(--money)']); leg.push(['โฮสต์', 'var(--money)']); }
  else st.cuts.forEach((c, i) => { const col = `color-mix(in srgb, var(--money) ${100 - i * 18}%, var(--surface))`; segs.push([pool * c / 100, col]); leg.push([`P${i + 1}`, col]); });
  html += '<div class="sbar" role="img" aria-label="สัดส่วนเงินที่ไปถึงแต่ละฝ่าย">' + segs.map(([v, c]) => `<i style="width:${(v / r.gross * 100).toFixed(2)}%;background:${c}"></i>`).join('') + '</div>';
  html += '<div class="legend">' + leg.map(([l, c]) => `<span><i style="background:${c}"></i>${l}</span>`).join('') + '</div>';
  $('summary').innerHTML = html;
  return {r, pool};
}
const row = (l, v, c = '') => `<div class="row ${c}"><span>${l}</span><span class="v">${v}</span></div>`;

function renderCuts(){
  const st = S[cur], r = H[cur].calc(st);
  if(r.split !== 'cuts' || st.players < 2){ $('cuts').innerHTML = ''; return; }
  const max = 100 - 15 * (st.players - 1);
  let html = '<div class="cuts"><h3>ตั้งส่วนแบ่ง (Cut)</h3>';
  html += `<div class="cutrow"><span>P1 โฮสต์</span><span class="hint" style="margin:0">ได้ส่วนที่เหลือ</span><output data-cl="0">${st.cuts[0]}%</output></div>`;
  for(let i = 1; i < st.players; i++) html += `<div class="cutrow"><label for="c${i}">P${i + 1}</label><input id="c${i}" type="range" min="15" max="${max}" step="5" value="${st.cuts[i]}" data-cut="${i}"><output data-cl="${i}">${st.cuts[i]}%</output></div>`;
  html += '<button type="button" class="mini" id="even">หารเท่ากัน</button></div>';
  $('cuts').innerHTML = html;
}
function renderSplit(res){
  const st = S[cur], {r, pool} = res, bonus = sum(r.bonus, b => b.v), fee = sum(r.hostFees, f => f.v);
  let html = '<div class="split"><h3>เงินเข้ากระเป๋าแต่ละคน</h3><div class="pls">';
  for(let i = 0; i < st.players; i++){
    let net, det = [];
    if(r.split === 'host'){
      if(i === 0){ net = pool + bonus - fee; det.push('ได้ยอดทั้งหมด ' + fmt(pool)); }
      else { html += `<div class="pc"><div class="pc-top"><b>P${i + 1}</b><span class="net">≈ $100k–200k</span></div><div class="det">ค่าจ้างคงที่จากเกม${bonus ? ' + Elite ' + fmt(bonus) : ''} (ค่าที่รายงานโดยผู้เล่น)</div></div>`; continue; }
    } else {
      const share = pool * st.cuts[i] / 100; net = share + bonus - (i === 0 ? fee : 0);
      det.push(`ส่วนแบ่ง ${st.cuts[i]}% = ${fmt(share)}`);
    }
    r.bonus.forEach(b => det.push(`+ ${b.l} ${fmt(b.v)}`));
    if(i === 0) r.hostFees.forEach(f => det.push(`− ${f.l} ${fmt(f.v)}`));
    html += `<div class="pc"><div class="pc-top"><b>P${i + 1}${i === 0 ? ' โฮสต์' : ''}</b><span class="net">${fmt(net)}</span></div><div class="det">${det.join('<br>')}</div></div>`;
  }
  html += `</div><p class="rc-note">${r.note}</p></div>`;
  $('split').innerHTML = html;
}
function renderCoach(){
  const h = H[cur], st = S[cur];
  const face = `<svg viewBox="0 0 26 26" aria-hidden="true"><circle cx="13" cy="10" r="6" fill="#fff"/><rect x="6.5" y="8" width="13" height="3.4" rx="1.6" fill="#18212D"/><path d="M3 25c1-6 5.5-8.5 10-8.5S22 19 23 25z" fill="#fff"/></svg>`;
  $('coach').innerHTML = `<div class="who"><div class="av">${face}</div><div><b>พี่บอส มือโปรประจำแก๊ง</b><small>ปล้น ${h.short} มาเป็นร้อยรอบ</small></div></div>
  ${coachMsg ? `<p class="said">${coachMsg}</p>` : ''}
  <ul>${h.tips(st).map(t => `<li>${t}</li>`).join('')}</ul>
  <button type="button" class="btn" id="pro">ให้พี่บอสจัดเซ็ตอัปให้</button>`;
}
function renderAside(keepCuts){
  const res = renderSummary();
  if(!keepCuts) renderCuts();
  renderSplit(res);
  renderCoach();
}
function setHeist(k){
  cur = k; coachMsg = '';
  document.documentElement.style.setProperty('--heist', H[k].accent);
  renderRail(); renderHero(true); renderBoard(); renderAside(); save();
  if(location.hash.slice(1) !== k) history.replaceState(null, '', '#' + k);
  document.title = H[k].short + ' – GTA Online Heist Planner';
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
$('board').addEventListener('click', e => {
  const c = e.target.closest('.opt'); if(!c || c.disabled) return;
  const st = S[cur], k = c.dataset.k; let v = c.dataset.v; if(c.dataset.num) v = Number(v);
  if(c.dataset.t === 'multi'){ const a = st[k] || []; st[k] = a.includes(v) ? a.filter(x => x !== v) : a.concat(v); }
  else { st[k] = v; if(k === 'players') st.cuts = evenCuts(v); }
  coachMsg = ''; H[cur].fix(st); renderBoard(); renderAside(); save();
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
    const st = S[cur], p = H[cur].pro(st); Object.assign(st, JSON.parse(JSON.stringify(p.patch)));
    H[cur].fix(st); coachMsg = p.msg; renderBoard(); renderAside(); save();
    document.getElementById('coach').scrollIntoView({behavior:'smooth', block:'nearest'});
  }
});

setHeist(cur);
