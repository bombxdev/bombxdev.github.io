// TH / EN for the /ai/ pages. Thai is the source text: T('ข้อความ {n}', { n: 3 })
// returns it as is in Thai, or the English entry below. Static markup uses
// data-i18n (text), data-i18n-ph (placeholder), data-i18n-title, data-i18n-aria.
// Language: ?lang=th|en (iframe) > saved choice > Thai.
(function () {
  'use strict';

  var KEY = 'ai.lang';
  var EN = {
    // page
    'ค้นหา:': 'Search:',
    'ลิงก์ / remark…': 'links / remarks…',
    'ตำแหน่งโฟลเดอร์': 'Folder path',
    'พร้อม': 'Ready',
    'สมุดลิงก์ศึกษา AI: repo และบทความน่าสนใจ แยกหมวดเป็นโฟลเดอร์': 'AI study notes: interesting repos and articles, sorted into folders',
    '👀 ผู้เข้าชม {n} คน': '👀 {n} visitors',
    // folders & links
    'เลื่อนขึ้น': 'Move up',
    'เลื่อนลง': 'Move down',
    'แก้ไข': 'Edit',
    'ย้าย': 'Move',
    'ลบ': 'Delete',
    'ย้ายไปโฟลเดอร์อื่น (หรือลากไปวางบนโฟลเดอร์)': 'Move to another folder (or drag it onto a folder)',
    '{n} ลิงก์': '{n} links',
    '1 ลิงก์': '1 link',
    '1 โฟลเดอร์ย่อย': '1 subfolder',
    '{n} โฟลเดอร์ย่อย': '{n} subfolders',
    'ยังไม่มีอะไรในโฟลเดอร์นี้': 'This folder is empty',
    ' — กดปุ่มด้านบนเพื่อเพิ่ม': ' — use the buttons above to add something',
    'พบ {n} รายการ': '{n} found',
    'ไม่พบ “{q}”': 'Nothing found for “{q}”',
    // admin
    '✏️ กลับโหมดแก้ไข': '✏️ Back to editing',
    '👁 มุมมองผู้เข้าชม': '👁 Visitor view',
    'แสดงปุ่มแก้ไขอีกครั้ง': 'Show the edit buttons again',
    'ดูหน้านี้แบบที่คนทั่วไปเห็น': 'See this page the way visitors do',
    'มุมมองผู้เข้าชม — กดปุ่มเดิมเพื่อกลับไปแก้ไข': 'Visitor view — press the same button to edit again',
    'กลับโหมดแก้ไขแล้ว': 'Back in edit mode',
    '📁 + โฟลเดอร์': '📁 + Folder',
    '🔗 + ลิงก์': '🔗 + Link',
    '✏️ แก้โฟลเดอร์นี้': '✏️ Edit this folder',
    'บัญชีนี้ไม่ใช่เจ้าของเว็บ': 'This account is not the site owner',
    'กำลังบันทึก…': 'Saving…',
    'บันทึกแล้ว ✓ (เว็บอัปเดตให้คนอื่นใน ~1 นาที)': 'Saved ✓ (others will see it in ~1 minute)',
    'บันทึกไม่สำเร็จ: {e}': 'Save failed: {e}',
    'ไม่พบโฟลเดอร์ (ถูกลบไปแล้ว?)': 'Folder not found (deleted?)',
    'ไม่พบลิงก์ (ถูกลบไปแล้ว?)': 'Link not found (deleted?)',
    'ปิด': 'Close',
    'ยกเลิก': 'Cancel',
    'บันทึก': 'Save',
    'แก้ไขโฟลเดอร์': 'Edit folder',
    'เพิ่มโฟลเดอร์': 'New folder',
    'ชื่อโฟลเดอร์': 'Folder name',
    'ย้ายไปอยู่ใน': 'Move into',
    'สร้างใน': 'Create in',
    'ย้ายโฟลเดอร์เข้าไปในตัวเองไม่ได้': 'A folder cannot be moved into itself',
    'แก้ไขลิงก์': 'Edit link',
    'เพิ่มลิงก์': 'New link',
    '⚡ ดึงข้อมูล': '⚡ Fetch info',
    'ชื่อ': 'Title',
    '(เว้นว่าง = ดึงอัตโนมัติ/ใช้โดเมน)': '(blank = automatic / domain name)',
    'จดว่าทำไมน่าสนใจ ใช้ทำอะไร': 'Why it is interesting, what it is for',
    'โฟลเดอร์': 'Folder',
    'รูป thumbnail (เว้นว่าง = อัตโนมัติ)': 'Thumbnail image (blank = automatic)',
    '📸 ภาพหน้าเว็บ': '📸 Page screenshot',
    'GitHub / YouTube ได้ thumbnail อัตโนมัติ เว็บอื่นใช้ og:image หรือภาพหน้าเว็บ': 'GitHub / YouTube get a thumbnail automatically; other sites use og:image or a page screenshot',
    'URL ต้องขึ้นต้นด้วย http:// หรือ https://': 'The URL must start with http:// or https://',
    'URL รูปไม่ถูกต้อง': 'Invalid image URL',
    'ใส่ URL ก่อน': 'Enter a URL first',
    'กำลังดึงข้อมูล…': 'Fetching…',
    'ไม่พบข้อมูล': 'Nothing found',
    'ดึงข้อมูลแล้ว ✓ ตรวจ/แก้ได้ก่อนบันทึก': 'Fetched ✓ check or edit before saving',
    'ดึงไม่ได้ ({e}) — กรอกเองได้ หรือปล่อยให้ใช้ thumbnail อัตโนมัติ': 'Could not fetch ({e}) — fill it in yourself or keep the automatic thumbnail',
    'ย้าย “{name}”': 'Move “{name}”',
    'ย้ายไปไว้ในโฟลเดอร์': 'Move to folder',
    'ทิป: ลากการ์ดไปวางบนไอคอนโฟลเดอร์ หรือบนชื่อในแถบ Address ก็ย้ายได้': 'Tip: you can also drag a card onto a folder icon or onto a name in the Address bar',
    'ลบโฟลเดอร์ “{name}” และทุกอย่างข้างใน ({n} ลิงก์)?': 'Delete the folder “{name}” and everything in it ({n} links)?',
    'ลบลิงก์ “{name}”?': 'Delete the link “{name}”?',
    '🔐 ล็อกอินเป็น {login} — แก้ไขได้': '🔐 Signed in as {login} — editing enabled',
    'ออกจากระบบ': 'Sign out',
    'ออกจากระบบแล้ว': 'Signed out',
    '🔐 โหมดเจ้าของ': '🔐 Owner mode',
    'สร้าง fine-grained token ที่ {link} เลือกเฉพาะ repo {repo} สิทธิ์ Contents: Read and write แล้ววางด้านล่าง (token ไม่ถูกส่งไปที่ไหนนอกจาก api.github.com)':
      'Create a fine-grained token at {link}, limited to the repo {repo} with Contents: Read and write, and paste it below (the token is only ever sent to api.github.com)',
    'จำไว้ในเครื่องนี้': 'Remember on this device',
    'เข้าสู่ระบบ': 'Sign in',
    'ล็อกอินเป็น {login}': 'Signed in as {login}',
    'ล็อกอินไม่สำเร็จ: {e}': 'Sign-in failed: {e}',
    // star trends
    'ดู': 'View',
    'วันที่': 'Date',
    'เดือน': 'Month',
    'ปี': 'Year',
    'ช่วงวันที่': 'Date range',
    'ตั้งแต่': 'From',
    'ถึง': 'To',
    'ค่าที่แสดง': 'Value shown',
    'ดาวที่เพิ่มขึ้น': 'Stars gained',
    'ดาวทั้งหมด': 'Total stars',
    'เปิดเต็ม ↗': 'Open full ↗',
    'จำนวนดาวทั้งหมด ณ วันนี้': 'Total stars on this day',
    'ปี {y}': '{y}',
    'ดาวที่เพิ่มขึ้นในเดือนนี้': 'Stars gained this month',
    'ดาวที่เพิ่มขึ้นในปีนี้': 'Stars gained this year',
    'ดาวที่เพิ่มขึ้นในช่วงนี้': 'Stars gained in this period',
    'จำนวนดาวทั้งหมด ณ วันสุดท้ายของเดือนนี้': 'Total stars at the end of the month',
    'จำนวนดาวทั้งหมด ณ วันสุดท้ายของปีนี้': 'Total stars at the end of the year',
    'จำนวนดาวทั้งหมด ณ วันสุดท้ายของช่วงนี้': 'Total stars at the end of the period',
    'กราฟดาว GitHub: {t}': 'GitHub stars chart: {t}',
    'ไม่มีข้อมูลในช่วงนี้': 'No data for this period',
    '* ประมาณการ': '* estimated',
    'กำลังโหลด…': 'Loading…',
    'กำลังโหลดข้อมูล…': 'Loading data…',
    'ยังไม่มีข้อมูล — รอ GitHub Actions เก็บข้อมูลรอบแรก (ทุกชั่วโมง)': 'No data yet — waiting for the first GitHub Actions run (hourly)',
    'โหลดข้อมูลไม่สำเร็จ ลองรีเฟรชอีกครั้ง': 'Could not load the data, try refreshing',
    'ไม่มีข้อมูล': 'No data',
    ' · เส้นประ = ประมาณการ': ' · dashed = estimated',
    'อัปเดต {t}': 'Updated {t}',
    'แปะโค้ดนี้ในเว็บอื่นเพื่อแสดงกราฟนี้ (ใช้ตัวกรองที่เลือกอยู่ตอนนี้{note})': 'Paste this code into another website to show this chart (with the current filters{note})',
    ' — แสดงวันปัจจุบันเสมอ': ' — always shows the current day',
    '📋 คัดลอก': '📋 Copy',
    '✓ คัดลอกแล้ว': '✓ Copied',
    // taskbar
    'ภาษา': 'Language',
    'ภาษา: ไทย (คลิกเพื่อเปลี่ยน)': 'Language: English (click to change)',
    'เริ่ม': 'Start'
  };

  function pick() {
    var q = /[?&]lang=(th|en)\b/.exec(location.search);
    if (q) return q[1];
    try { var s = localStorage.getItem(KEY); if (s === 'th' || s === 'en') return s; } catch (e) { /* storage unavailable */ }
    return 'th';
  }
  var lang = pick();
  var missing = {};
  var subs = [];

  function T(s, vars) {
    var out = s;
    if (lang === 'en') {
      if (Object.prototype.hasOwnProperty.call(EN, s)) out = EN[s];
      else missing[s] = 1;
    }
    if (vars) out = out.replace(/\{(\w+)\}/g, function (m, k) { return k in vars ? vars[k] : m; });
    return out;
  }
  function apply(root) {
    root = root || document;
    document.documentElement.lang = lang;
    var each = function (attr, fn) {
      Array.prototype.forEach.call(root.querySelectorAll('[' + attr + ']'), function (el) { fn(el, T(el.getAttribute(attr))); });
    };
    each('data-i18n', function (el, v) { el.textContent = v; });
    each('data-i18n-ph', function (el, v) { el.placeholder = v; });
    each('data-i18n-title', function (el, v) { el.title = v; });
    each('data-i18n-aria', function (el, v) { el.setAttribute('aria-label', v); });
  }
  function set(l) {
    if ((l !== 'th' && l !== 'en') || l === lang) return;
    lang = l;
    try { localStorage.setItem(KEY, l); } catch (e) { /* storage unavailable */ }
    apply();
    subs.forEach(function (fn) { try { fn(lang); } catch (e) { if (window.console) console.error(e); } });
  }

  window.T = T;
  window.I18N = {
    T: T,
    get lang() { return lang; },
    set: set,
    on: function (fn) { subs.push(fn); },
    apply: apply,
    missing: missing
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { apply(); });
  else apply();
})();
