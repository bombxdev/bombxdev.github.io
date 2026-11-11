// Link-preview images for the share pages (ai/share/*.html), 1200x630.
//
//   NODE_PATH=<dir with playwright> node ai/tools/render_og.cjs <out dir>
//
// Serves the checked-out site locally, opens the chart for each preset with
// the stars.json just written to <out dir> (instead of the published copy)
// and screenshots it to <out dir>/og/<preset>[-en].png.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const OUT = process.argv[2];
if (!OUT) { console.error('usage: render_og.cjs <out dir>'); process.exit(2); }
const ROOT = path.resolve(__dirname, '..', '..');
const DATA = fs.readFileSync(path.join(OUT, 'stars.json'));
const PRESETS = [['today', 'mode=date'], ['month', 'mode=month'], ['year', 'mode=year']];
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };

const server = http.createServer((req, res) => {
  const p = path.normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
  const file = path.join(ROOT, p.endsWith('/') || !p ? p + 'index.html' : p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  fs.mkdirSync(path.join(OUT, 'og'), { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const lang of ['th', 'en']) {
      const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, timezoneId: 'Asia/Bangkok', locale: lang === 'en' ? 'en-GB' : 'th-TH' });
      await ctx.route(/raw\.githubusercontent\.com\/.*\/stars-data\/stars\.json/, (r) => r.fulfill({ body: DATA, contentType: 'application/json' }));
      await ctx.route(/api\.github\.com/, (r) => r.abort());   // hourly data only, no live top-up
      const page = await ctx.newPage();
      for (const [name, q] of PRESETS) {
        await page.goto(`http://127.0.0.1:${port}/ai/trends.html?${q}&lang=${lang}`);
        await page.waitForSelector('.tr-svg', { timeout: 20000 });
        await page.waitForLoadState('networkidle').catch(() => {});   // avatars
        await page.waitForTimeout(500);
        const file = path.join(OUT, 'og', name + (lang === 'en' ? '-en' : '') + '.png');
        await page.screenshot({ path: file });
        console.log('og:', path.basename(file));
      }
      await ctx.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
