// Star history collector for the "GitHub Star Trends" chart (ai/trends.js).
//
//   node ai/tools/fetch_stars.mjs <stars.json>
//
// Every run (hourly, .github/workflows/star-trends.yml):
//   1. picks the repos to track: the most-starred repos with the GitHub topic
//      "ai" (the list on https://github.com/topics/ai), plus every repo tracked
//      before that still carries the topic (so history keeps growing); repos
//      that lost the topic are dropped;
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

const [, , OUT] = process.argv;
if (!OUT) { console.error('usage: fetch_stars.mjs <stars.json>'); process.exit(2); }

const API = process.env.GITHUB_API_URL || 'https://api.github.com';
const TOKEN = process.env.GITHUB_TOKEN || '';
// Listing stargazers needs a user token: the Actions GITHUB_TOKEN gets 403
// ("Resource not accessible by integration") and anonymous calls get 401.
// STARS_TOKEN (optional secret: fine-grained token, public repos read-only)
// enables the back-fill; without it only the daily snapshots are recorded and
// the page draws a dashed estimate from the repo's creation date.
const STARS_TOKEN = process.env.STARS_TOKEN || '';
const BUDGET = +(process.env.STAR_BUDGET || 700);   // max API calls per run (GITHUB_TOKEN: 1000/h)
const CAP = 40000;                                    // stargazers GitHub will list
const SAMPLES = 24;                                   // stargazer pages sampled per repo
const TOPIC = 'ai';                                   // https://github.com/topics/ai
const TOPIC_TOP = 50;                                 // most-starred repos taken from the topic

const BASE = { 'User-Agent': 'star-trends-collector', 'X-GitHub-Api-Version': '2022-11-28' };
let calls = 0;
let starLeft = Infinity;                                // rate limit left for stargazer requests
async function gh(path, accept, token = TOKEN) {
  calls++;
  const headers = { ...BASE, Accept: accept || 'application/vnd.github+json' };
  if (token) headers.Authorization = 'Bearer ' + token;
  const r = await fetch(API + path, { headers });
  if (accept) starLeft = +(r.headers.get('x-ratelimit-remaining') ?? starLeft);
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

const found = await gh(`/search/repositories?q=${encodeURIComponent('topic:' + TOPIC)}&sort=stars&order=desc&per_page=${TOPIC_TOP}`);
if (!found) throw new Error('topic search failed');
found.items.forEach((i) => add(i.full_name));

// ---- 2. today's snapshot ---------------------------------------------------
let snapped = 0;
for (const name of wanted.values()) {
  let info;
  try { info = await gh(`/repos/${name}`); } catch (e) { console.warn(name, e.message); continue; }
  const key = info && info.full_name;                    // follows renames / transfers
  if (!info || info.private || !(info.topics || []).includes(TOPIC)) {   // gone, or no longer in the topic
    if (info !== undefined) { delete data.repos[name]; if (key) delete data.repos[key]; }
    continue;
  }
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
if (!STARS_TOKEN) console.log('no STARS_TOKEN secret: history back-fill skipped');
for (const [key, r] of Object.entries(STARS_TOKEN ? data.repos : {})) {
  if (r.bf) continue;
  const lastPage = Math.max(1, Math.ceil(Math.min(r.stars || 0, CAP) / 100));
  const n = Math.min(SAMPLES, lastPage);
  const pages = [...new Set(Array.from({ length: n }, (_, i) => 1 + Math.round(i * (lastPage - 1) / Math.max(1, n - 1))))];
  if (calls + pages.length > BUDGET || starLeft < pages.length + 2) { console.log('rate budget reached, the rest next run'); break; }
  const hist = new Map();
  const put = (d, v) => hist.set(d, Math.max(hist.get(d) || 0, v));
  try {
    for (const p of pages) {
      const items = await gh(`/repos/${key}/stargazers?per_page=100&page=${p}`, 'application/vnd.github.star+json', STARS_TOKEN);
      if (!items || !items.length) break;
      put(day(items[0].starred_at), (p - 1) * 100 + 1);
      put(day(items[items.length - 1].starred_at), (p - 1) * 100 + items.length);
    }
  } catch (e) {
    console.warn(key, 'backfill:', e.message);
    if (/ 40[13] | 429 /.test(e.message)) break;          // rate limited / not allowed: try again next run
    continue;
  }

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

data.topic = TOPIC;
data.updated = new Date().toISOString();
fs.writeFileSync(OUT, JSON.stringify(data) + '\n');
const pending = Object.values(data.repos).filter((r) => !r.bf).length;
console.log(`tracked ${Object.keys(data.repos).length} repos · snapshot ${snapped} · back-filled ${filled} (${pending} waiting) · ${calls} API calls · back-fill: ${STARS_TOKEN ? 'on' : 'off (no STARS_TOKEN)'}`);
