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

## ไฟล์

`index.html`, `ai.js`, `ai.css`, `stats.js`, `data/resources.json` (`{updated, root:{id,name,folders:[…],links:[{id,url,title,remark,image,added}]}}`)
