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

## ไฟล์

`index.html`, `ai.js`, `ai.css`, `data/resources.json` (`{updated, root:{id,name,folders:[…],links:[{id,url,title,remark,image,added}]}}`)
