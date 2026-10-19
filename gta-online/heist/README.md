# GTA Online Heist Planner

หน้าวางแผน Heist ใช้งานที่ `https://bombxdev.github.io/gta-online/heist/` (ลิงก์ตรงไปแต่ละ heist: `#kortz`, `#cayo`, `#casino`, `#doom`, `#og`)

- 5 heist: Kortz Center, Cayo Perico, Diamond Casino, Doomsday, Original Heists พร้อมโปสเตอร์ SVG ที่วาดใหม่
- บอร์ดเลือก setup แบบในเกม คำนวณเงินตามความยาก/จำนวนผู้เล่น/ของที่ปล้น แจกแจง % ที่ถูกหัก ตั้ง cut และโค้ช "พี่บอส"
- ตัวเลขอิง Title Update 1.73 (ก.ค. 2026) — ข้อมูลทั้งหมดอยู่ใน `heist.js` (`CAYO_PRIM`, `CASINO_T`, `KORTZ_P`, `DOOM`, `OG` ฯลฯ)
- การตั้งค่าเก็บใน localStorage (`gtaoheist.board`)

## ภาษา

รองรับ 16 ภาษาเหมือนหน้าแผนที่ ใช้ `../map/i18n.js` ตัวเดียวกัน ไฟล์ข้อความอยู่ใน `i18n/` (`index.json` = รายชื่อภาษา, `<code>.json` = `{"ui": {...}}`)
ค่าภาษาที่เลือกใช้ร่วมกับหน้าแผนที่ (`gtaomap.lang` ใน localStorage) เปลี่ยนที่หน้าไหนอีกหน้าก็เปลี่ยนตาม
ชื่อเฉพาะในเกม (ชื่อ heist, ภาพวาด, ลูกทีม, ทางเข้า, พาหนะ) ไม่แปล ตั้งใจให้ตรงกับที่เห็นในเกม
`*.ec.*` (เงื่อนไข Elite) คั่นแต่ละข้อด้วย ` | `
เพิ่มข้อความใหม่: ใส่คีย์ใน `en.json` (ภาษาอื่นที่ยังไม่มีคีย์จะใช้ภาษาอังกฤษแทน) แล้วแปลลงไฟล์อื่น

## คู่มือมือใหม่

- ปุ่ม "📘 มือใหม่ เริ่มที่นี่" (`#guide`): ขั้นตอนของทุก heist, เคล็ดลับ และศัพท์ในเกม (`#guide:scope` เปิดไปที่คำนั้น)
- ด้านบนของแต่ละ heist มีกล่อง "ทำ heist นี้ทีละขั้น" (`GUIDE` ใน `heist.js`, ข้อความ `g.<heist>.sN`) พร้อมรูปประกอบ
- ชื่อเฉพาะภาษาอังกฤษในเกม (ทางเข้า พาหนะ ภาพวาด ฯลฯ) แสดงความหมายเป็นภาษาที่เลือกไว้ใต้ชื่อ: `"names"` ใน `i18n/<code>.json`
  (ไม่มีในภาษาอังกฤษ) ไม่แสดงถ้าคำอธิบายของตัวเลือกขึ้นต้นด้วยความหมายเดียวกันอยู่แล้ว

## รูปภาพ (`img/`)

ใช้เฉพาะแหล่งเดียวกับหน้าแผนที่ซึ่งมีเครดิตอยู่แล้วใน `../map/credits.html`:

- `img/veh/` รูปรถจาก [FiveM docs](https://docs.fivem.net/docs/game-references/vehicle-references/) (`static/vehicles/<model>.webp`) ครอปขอบใสแล้วย่อกว้าง 480px
- `img/blip/` ไอคอนเรดาร์จาก FiveM docs (`static/blips/`)
- `img/place/` ภาพมุมสูง 360×220 ครอปจากภาพแผนที่ของเว็บเอง (`../map/tiles/satellite/7` สำหรับ Los Santos,
  `../map/tiles-cayo/satellite.webp` สำหรับ Cayo Perico) วงแดงที่พิกัดจุดนั้น ชื่อไฟล์ Cayo ตรงกับ id จุดบนแผนที่ (`cayo_infiltration-7` ฯลฯ)

## หน้าตาและเมนู

ใช้ `../map/style.css` ร่วมกับหน้าแผนที่ (สี, sidebar, แถบ แผนที่ / วางแผนปล้น, เมนูมือถือ) แล้วเพิ่มเฉพาะของหน้านี้ใน `heist.css`
Content-Security-Policy เหมือนหน้าแผนที่ จึงไม่มี inline script และไม่โหลดฟอนต์จากเว็บอื่น

## ลิงก์ไปแผนที่

- Cayo Perico: จุดขึ้นเกาะ / ทางเข้าคฤหาสน์ / จุดหนี ลิงก์ไปจุดจริงบนแผนที่ (`#cayo_infiltration-n`, `#cayo_entrances-n`, `#cayo_escape-n`)
  ซึ่งดึงจากกระดานวางแผนในเกม (ดู `../map/tools/extract_cayo_heist.py`) — HALO Jump ไม่มีจุดตายตัวจึงไม่มีลิงก์
- สถานที่อื่น (Kortz Center, Diamond Casino, ธนาคาร Fleeca/Pacific Standard, เรือนจำ, Humane Labs) ใช้ `#@x,y,ชื่อ`
  พิกัดเกมตรวจกับภาพดาวเทียมของแผนที่แล้ว ลิงก์ไปที่ตัวอาคาร (ทางเข้าย่อยของ Kortz/Casino ยังไม่มีพิกัด)
- Doomsday เริ่มที่ Facility ของผู้เล่นเอง และ Series A ไม่มีจุดเดียว จึงไม่มีลิงก์

## ก่อน deploy ทุกครั้ง

เปลี่ยน `data-app-version` และ `?v=` ใน `index.html` (รวมลิงก์ไป `../map/style.css` และ `../map/i18n.js`) — ไฟล์ภาษาโหลดด้วยเลขนี้
