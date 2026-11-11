// Star history collector for the "GitHub Star Trends" chart (ai/trends.js).
//
//   node ai/tools/fetch_stars.mjs <stars.json> [resources.json]
//
// Every run (hourly, .github/workflows/star-trends.yml):
//   1. picks the repos to track: the most-starred repos created in the last
//      ~18 months (GitHub search), every GitHub link in the AI Notes page, and
//      everything tracked before (never dropped, so history keeps growing);
//   2. stores today's star count for each one (one point per day, overwritten
//      until the day ends);
//   3. back-fills older history for repos seen for the first time, by sampling
//      pages of the stargazers list (each entry carries starred_at). GitHub only
//      lists the first 40,000 stargazers, so for bigger repos the part between
//      star 40,000 and the first daily snapshot is a straight-line estimate;
//      that segment is flagged (third array item = 1) and drawn dashed.
//
// File format: { updated, repos: { "owner/name": { avatar, desc, created, stars,
//   bf: <history back-filled>, pts: [["YYYY-MM-DD", stars, estimated?], ...] } } }
import fs from 'node:fs';

const [, , OUT, RESOURCES] = process.argv;
if (!OUT) { console.error('usage: fetch_stars.mjs <stars.json> [resources.json]'); process.exit(2); }

const API = process.env.GITHUB_API_URL || 'https://api.github.com';
const TOKEN = process.env.GITHUB_TOKEN || '';
const BUDGET = +(process.env.STAR_BUDGET || 700);   // max API calls per run (GITHUB_TOKEN: 1000/h)
const CAP = 40000;                                    // stargazers GitHub will list
const SAMPLES = 24;                                   // stargazer pages sampled per repo
const SEARCH_DAYS = 540;
const SEARCH_MIN_STARS = 10000;
const SEARCH_TOP = 40;

const HEADERS = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'star-trends-collector',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(TOKEN ? { Authorization: 'Bearer ' + TOKEN } : {})
};
let calls = 0;
async function gh(path, accept) {
  calls++;
  const r = await fetch(API + path, { headers: accept ? { ...HEADERS, Accept: accept } : HEADERS });
  if (r.status === 404 || r.status === 422 || r.status === 451) return null;   // gone / past the stargazer cap
  if (!r.ok) throw new Error(`${path} → ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json();
}
const day = (s) => String(s).slice(0, 10);
const today = new Date().toISOString().slice(0, 10);

let data = { updated: '', repos: {} };
try { data = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch { /* first run */ }
data.repos = data.repos || {};

// ---- 1. which repos -------------------------------------------------------
const wanted = new Map();                               // lower-case name -> name
const add = (n) => { if (n && !wanted.has(n.toLowerCase())) wanted.set(n.toLowerCase(), n); };
Object.keys(data.repos).forEach(add);

const since = new Date(Date.now() - SEARCH_DAYS * 864e5).toISOString().slice(0, 10);
const found = await gh(`/search/repositories?q=${encodeURIComponent(`created:>${since} stars:>${SEARCH_MIN_STARS}`)}&sort=stars&order=desc&per_page=${SEARCH_TOP}`);
(found ? found.items : []).forEach((i) => add(i.full_name));

if (RESOURCES) {
  try {
    const res = JSON.parse(fs.readFileSync(RESOURCES, 'utf8'));
    (function walk(node) {
      (node.links || []).forEach((l) => {
        const m = /^https?:\/\/(?:www\.)?github\.com\/([\w.-]+\/[\w.-]+?)(?:\.git)?(?:[/?#]|$)/i.exec(l.url || '');
        if (m) add(m[1]);
      });
      (node.folders || []).forEach(walk);
    })(res.root || {});
  } catch (e) { console.warn('resources:', e.message); }
}

// ---- 2. today's snapshot ---------------------------------------------------
let snapped = 0;
for (const name of wanted.values()) {
  let info;
  try { info = await gh(`/repos/${name}`); } catch (e) { console.warn(name, e.message); continue; }
  if (!info || info.private) continue;
  const key = info.full_name;                            // follows renames / transfers
  const r = data.repos[key] || data.repos[name] || { bf: false, pts: [] };
  if (key !== name && data.repos[name]) delete data.repos[name];
  r.avatar = info.owner && info.owner.avatar_url || '';
  r.desc = (info.description || '').slice(0, 160);
  r.created = day(info.created_at);
  r.stars = info.stargazers_count;
  const last = r.pts[r.pts.length - 1];
  if (last && last[0] === today) last[1] = r.stars;
  else r.pts.push([today, r.stars]);
  data.repos[key] = r;
  snapped++;
}

// ---- 3. back-fill history (oldest repos first, within the call budget) ---------
let filled = 0;
for (const [key, r] of Object.entries(data.repos)) {
  if (r.bf) continue;
  const lastPage = Math.max(1, Math.ceil(Math.min(r.stars || 0, CAP) / 100));
  const n = Math.min(SAMPLES, lastPage);
  const pages = [...new Set(Array.from({ length: n }, (_, i) => 1 + Math.round(i * (lastPage - 1) / Math.max(1, n - 1))))];
  if (calls + pages.length > BUDGET) { console.log('budget reached, rest next run'); break; }
  const hist = new Map();
  const put = (d, v) => hist.set(d, Math.max(hist.get(d) || 0, v));
  try {
    for (const p of pages) {
      const items = await gh(`/repos/${key}/stargazers?per_page=100&page=${p}`, 'application/vnd.github.star+json');
      if (!items || !items.length) break;
      put(day(items[0].starred_at), (p - 1) * 100 + 1);
      put(day(items[items.length - 1].starred_at), (p - 1) * 100 + items.length);
    }
  } catch (e) { console.warn(key, 'backfill:', e.message); continue; }

  const snaps = r.pts;
  const first = snaps.length ? snaps[0][0] : today;
  const old = [...hist.entries()].filter(([d]) => d < first).sort((a, b) => a[0] < b[0] ? -1 : 1);
  if (old.length && r.created && r.created < old[0][0]) old.unshift([r.created, 0]);
  // monotone (unstars can make samples dip a little)
  for (let i = 1; i < old.length; i++) old[i][1] = Math.max(old[i][1], old[i - 1][1]);
  if (old.length && snaps.length && (r.stars > CAP || snaps[0][1] - old[old.length - 1][1] > 1000)) snaps[0][2] = 1;
  r.pts = old.concat(snaps);
  r.bf = true;
  filled++;
}

data.updated = new Date().toISOString();
fs.writeFileSync(OUT, JSON.stringify(data) + '\n');
console.log(`tracked ${Object.keys(data.repos).length} repos · snapshot ${snapped} · back-filled ${filled} · ${calls} API calls`);
