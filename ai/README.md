# AI Notes (`/ai/`)

สมุดลิงก์ศึกษา AI ที่ `https://bombxdev.github.io/ai/` — จัดเป็นโฟลเดอร์ (ซ้อนกันได้) แต่ละลิงก์มี remark และ thumbnail

- **ทุกคน**: ดู / เปิดลิงก์ / ค้นหา (ชื่อ, remark, URL) / ลิงก์ตรงไปโฟลเดอร์ `#<id>`
- **เจ้าของเท่านั้น**: เพิ่ม/แก้/ลบ/ย้าย/จัดลำดับโฟลเดอร์และลิงก์

## วิธีแก้ไข (admin)

1. สร้าง fine-grained token: <https://github.com/settings/personal-access-tokens/new>
   เลือกเฉพาะ repo `bombxdev/bombxdev.github.io`, สิทธิ์ **Contents: Read and write**
2. เปิด `https://bombxdev.github.io/ai/?admin` วาง token แล้วเข้าสู่ระบบ (ใช้ token เดียวกับหน้า GTA map ได้)
3. จะมีแถบปุ่ม `+ โฟลเดอร์` / `+ ลิงก์` และปุ่มแก้/ลบ/ลำดับบนแต่ละรายการ

กดบันทึกแล้วจะ commit `ai/data/resources.json` เข้า `master` ผ่าน GitHub API (Pages อัปเดตใน ~1 นาที
ระหว่างนั้นหน้านี้อ่านจาก `raw.githubusercontent.com` ด้วยเพื่อให้เห็นของใหม่เร็วขึ้น)

## ความปลอดภัย

- สิทธิ์เขียนถูกตรวจโดย GitHub (token) ไม่ใช่โค้ดในหน้าเว็บ — คนอื่นอ่านโค้ดได้ แต่เขียนข้อมูลไม่ได้
- หน้าเว็บยืนยันว่า token เป็นของ `bombxdev` ก่อนแสดงปุ่มแก้ไข; token เก็บใน sessionStorage (หรือ localStorage ถ้าติ๊ก "จำไว้")
- CSP จำกัดให้รันได้เฉพาะสคริปต์ของเว็บนี้ (ไม่มี inline/สคริปต์ภายนอก) ลดความเสี่ยง XSS ขโมย token
- ข้อความทุกช่องถูก escape, ลิงก์รับเฉพาะ `http(s)://`, เปิดแท็บใหม่แบบ `noopener noreferrer`
- ควรเปิด branch protection / 2FA บัญชี GitHub และตั้งวันหมดอายุ token

## Thumbnail

คำนวณในเบราว์เซอร์ ไม่ต้องเก็บไฟล์รูป: GitHub repo → `opengraph.githubassets.com`, YouTube → ภาพปกวิดีโอ,
เว็บอื่น → og:image ที่ดึงตอนเพิ่ม (ปุ่ม ⚡ ดึงข้อมูล ผ่าน microlink.io) หรือภาพหน้าเว็บ (`s.wordpress.com/mshots`)
ใส่ URL รูปเองได้ในช่อง "รูป thumbnail"

## GitHub Star Trends (กราฟด้านบน)

กราฟ repo ที่ได้ดาวมากที่สุด — ค่าเริ่มต้นคือ "วันนี้" (ดาวทั้งหมด) เลือกดูเป็น เดือน / ปี / ช่วงวันที่ ได้
(ดาวที่เพิ่มขึ้นในช่วง หรือดาวทั้งหมด), เลือก Top 10/20/30, ชี้เมาส์ดูค่าแต่ละวัน, ชี้ชื่อเพื่อไฮไลต์เส้น

- **ข้อมูล**: `.github/workflows/star-trends.yml` รันทุกชั่วโมง (`ai/tools/fetch_stars.mjs`) เก็บดาวของ
  repo ที่มี GitHub topic **`ai`** (https://github.com/topics/ai) ที่ดาวมากที่สุด 50 อันดับ — repo ที่เคยติดอันดับจะเก็บต่อ
  ตราบที่ยังมี topic `ai` อยู่
  แล้ว force-push ไฟล์เดียว `stars.json` ไปที่ branch **`stars-data`** (ไม่รก history ของ master)
- **เรียลไทม์**: หน้าเว็บดึงจำนวนดาวล่าสุดของวันนี้เพิ่มจาก GitHub search API อีกที (cache 10 นาที)
- **ประวัติย้อนหลัง**: ตอนเจอ repo ครั้งแรกจะสุ่มอ่านรายชื่อ stargazers (มีวันที่กดดาว) แต่ GitHub ให้ดู
  ได้แค่ 40,000 ดาวแรก repo ที่ใหญ่กว่านั้นช่วงระหว่างดาวที่ 40,000 จนถึงวันเริ่มเก็บจะเป็น**เส้นประ (ประมาณการ)**
  — หลังจากนั้นเป็นข้อมูลจริงรายวัน
- **บันทึกรูป / แชร์**: `💾 บันทึกรูป` ได้ PNG (2x) มีหัวเรื่อง, เวลาอัปเดต และ credit `Bomb x AI` สีเทาจาง
  `📤 แชร์` = แชร์รูปผ่านแอปในเครื่อง (มือถือที่รองรับ Web Share) หรือแชร์ลิงก์ไป X / Facebook / LINE / LinkedIn /
  Telegram / Reddit / คัดลอกลิงก์ (โซเชียลส่วนใหญ่รับแค่ลิงก์ ถ้าอยากโพสต์เป็นรูปให้บันทึกรูปแล้วแนบเอง)
- **ภาพพรีวิวตอนแชร์ลิงก์**: workflow ถ่าย screenshot กราฟทุกชั่วโมง (`ai/tools/render_og.cjs`, 1200×630)
  สำหรับ วันนี้ / เดือนนี้ / ปีนี้ × TH/EN ไว้ที่ `stars-data/og/*.png` และหน้า `ai/share/<preset>[-en].html`
  ใส่ og:image ชี้ไปที่ภาพนั้น — ปุ่มแชร์ใช้หน้าเหล่านี้อัตโนมัติเมื่อตัวกรองตรงกัน (Top 20, ค่าเริ่มต้น)
  ตัวกรองอื่นแชร์เป็นลิงก์ `trends.html?…` ได้ แต่ภาพพรีวิวจะเป็นของ "วันนี้"; ถ้าอยากได้ภาพตรงตัวกรองใช้ 📱 / 💾
  (โซเชียลแต่ละเจ้าจะ cache ภาพพรีวิวไว้เองระยะหนึ่ง)
- **เวลาอัปเดต** แสดงตามเขตเวลาของเครื่องที่เปิดดู พร้อมชื่อเขต เช่น `GMT+7` (ชี้เมาส์เพื่อดูชื่อ timezone)
- **แปะเว็บอื่น**: ปุ่ม `📋 Copy iframe` ได้โค้ด `<iframe src="https://bombxdev.github.io/ai/trends.html?…">`
  ตามตัวกรองที่เลือกอยู่ (โหมด "วันที่" ที่ไม่ได้เลือกวันจะแสดงวันปัจจุบันเสมอ)
  กราฟใน iframe ปรับความสูงให้พอดีกรอบ (ไม่มี scrollbar) และมี credit `Bomb x AI` จางๆ มุมขวาล่าง
- รันเองทันที: Actions → *Star trends data* → Run workflow
- **ประวัติย้อนหลัง (ต้องตั้ง secret)**: การอ่านรายชื่อ stargazers ต้องใช้ token ของผู้ใช้
  (`GITHUB_TOKEN` ของ Actions และการเรียกแบบไม่ล็อกอินถูกปฏิเสธ) — สร้าง fine-grained token
  (Repository access: *Public repositories (read-only)*, ไม่ต้องติ๊กสิทธิ์อะไร) แล้วใส่เป็น secret ชื่อ
  **`STARS_TOKEN`** ที่ Settings → Secrets and variables → Actions จากนั้น Run workflow หนึ่งครั้ง
  ถ้าไม่ตั้ง: เก็บแค่ข้อมูลจริงรายวันตั้งแต่วันนี้ ส่วนก่อนหน้าวาดเป็นเส้นประจากวันสร้าง repo (0 ดาว)

## สถิติการใช้งาน (GoatCounter — ฟรี)

`stats.js` ส่งสถิติแบบไม่ระบุตัวตนไปที่ [GoatCounter](https://www.goatcounter.com) (ฟรีสำหรับเว็บส่วนตัว, ไม่ใช้ cookie)
ส่งเป็น "pixel" (`<img>`) เท่านั้น ไม่โหลดสคริปต์ภายนอก CSP จึงยังเข้มเหมือนเดิม (token admin ปลอดภัย)

**ตั้งค่าครั้งเดียว**

1. สมัครที่ <https://www.goatcounter.com/signup> ใช้ code **`bombxdev`** (ถ้าโดนใช้ไปแล้ว เปลี่ยน `GC_CODE` ใน `stats.js`
   และโดเมนใน CSP `connect-src` ของ `index.html` ให้ตรง)
2. Settings → ติ๊ก **Allow adding visitor counts on your website** (เพื่อให้ตัวนับท้ายหน้าแสดง "👀 ผู้เข้าชม N คน")
3. ถ้าอยากให้คนอื่นดู dashboard ได้: Settings → Public → ตั้งเป็น public
4. ดูสถิติที่ `https://bombxdev.goatcounter.com`

**อ่านสถิติยังไง**

| ใน dashboard | ความหมาย |
|---|---|
| `/ai/` (visitors / pageviews) | คนเข้าหน้านี้กี่คน กี่ครั้ง ต่อวัน/สัปดาห์ + referrer, ประเทศ, เบราว์เซอร์, จอ |
| `/ai/#<folder>` | โฟลเดอร์ไหนถูกเปิดบ่อย |
| `visit/new` vs `visit/back-1d`, `back-1-7d`, `back-7-30d`, `back-30d+` | คนใหม่ vs คนกลับมา และกลับมาถี่แค่ไหน (นับครั้งละ 1 ต่อ session) |
| `visit/n-1`, `n-2-4`, `n-5-9`, `n-10-24`, `n-25+` | คนนี้เข้ามาเป็นครั้งที่เท่าไร (ขาประจำ vs ขาจร) |
| `out/<url>` | ลิงก์ไหนถูกกดเปิด → ลิงก์ไหน "มีประโยชน์" จริง |
| `search/<คำ>` / `search-miss/<คำ>` | คนค้นอะไร / ค้นแล้วไม่เจออะไร (ไอเดียลิงก์ที่ควรเพิ่ม) |

ตัวนับใน browser (`visit/*`) เก็บใน localStorage ของคนนั้นเอง ส่งไปแค่ชื่อกลุ่ม ไม่มีข้อมูลส่วนตัว

**ไม่นับ**: ตอนล็อกอิน admin (มี token ในเครื่อง), localhost, headless browser และเบราว์เซอร์ที่เปิด `?nostat` ครั้งหนึ่ง
(เปิด `?stat` เพื่อกลับมานับ) — ตัวเลขท้ายหน้า GoatCounter cache ไว้สูงสุด ~4 ชม.

## ภาษา TH / EN และ Taskbar

แถบ taskbar แบบ Windows 95 ด้านล่าง: ปุ่ม **Start** (เมนูไปที่หน้าต่าง + เลือกภาษา), ปุ่มหน้าต่างแต่ละอัน
(คลิกเพื่อเลื่อนไปหา อันที่อยู่บนจอจะเป็นปุ่มกดค้าง) และ tray มีตัวบอกภาษา **TH/EN** (คลิกเพื่อสลับ) กับนาฬิกา
กดปุ่ม <kbd>`</kbd> (grave) เพื่อสลับภาษาได้ด้วย (ยกเว้นตอนพิมพ์ในช่องกรอก) — ภาษาที่เลือกจำไว้ในเบราว์เซอร์ (localStorage) iframe ใช้ `&lang=en` (ปุ่ม Copy iframe ใส่ให้เองตอนอยู่โหมด EN)
ข้อความแปลอยู่ใน `i18n.js` (ใช้ข้อความไทยเป็นคีย์)

## ไฟล์

`index.html`, `ai.js`, `ai.css`, `stats.js`, `i18n.js`, `taskbar.js`, `trends.js` + `trends.css` + `trends.html` (iframe), `tools/fetch_stars.mjs`, `tools/render_og.cjs`, `share/*.html`, `data/resources.json` (`{updated, root:{id,name,folders:[…],links:[{id,url,title,remark,image,added}]}}`)
