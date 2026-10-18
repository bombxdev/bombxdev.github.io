# GTA Online Map

แผนที่ GTA Online แบบค้นหาได้ ไม่มีโฆษณา ใช้งานที่ `https://bombxdev.github.io/gta-online/map/`

## ฟีเจอร์

- ตำแหน่ง collectibles 20 หมวด (~1,000 จุด) เช่น Action Figures, Playing Cards, Signal Jammers,
  Peyote, Movie Props, Media Sticks, Hidden Caches, Shipwrecks, LD Organics, Skydives, LS Tags
  และอีเวนต์ตามเทศกาล (ฟักทองฮาโลวีน, ตุ๊กตาหิมะ, Yuanbao, St. Patrick's charms ฯลฯ)
- ค้นหาด้วยชื่อไทย/อังกฤษ + หมายเลข (`ฟิกเกอร์ 12`, `card 5`) หรือพิกัดเกม (`-75, -818`)
- แผนที่ 3 แบบ: Atlas / Road / Satellite (โฮสต์ tiles เองทั้งหมด ไม่พึ่งเว็บอื่น)
- ติ๊ก "เก็บแล้ว" แล้วนับความคืบหน้าต่อหมวด (บันทึกใน localStorage ของเบราว์เซอร์)
- ลิงก์ตรงไปยังแต่ละจุด เช่น `#action_figures-12`
- คลิกขวา/กดค้างบนแผนที่เพื่อดูพิกัดในเกม
- ปุ่ม ⓘ ข้างแต่ละหมวด: ทำไปเพื่ออะไร ได้เงิน/RP เท่าไหร่ (ค่าเริ่มต้นจาก tunables ของเกม `data/info.json`) และจัดกลุ่มเมนูตาม "ประเภท" หรือ "เป้าหมาย"
- Ghosts Exposed: ตำแหน่ง + ชั่วโมงที่ผีแต่ละตัวโผล่ (เวลาในเกม) แปลงเป็นเวลาจริงของเครื่องผู้ใช้ และนาฬิกาเวลาในเกม (1 นาทีในเกม = 2 วินาทีจริง)
- รายวันเพิ่ม: Street Dealers (3 จุด/วัน), Junk Energy Bike Time Trial, RC Bandito Time Trial
- แผนที่เกาะ Cayo Perico (ภาพดาวเทียม) วางตามพิกัดเกม
- 🚗 Exotic Exports (`exports.js`): รถ 10 คันที่ต้องหาในวันนั้น (เรียงตามลำดับในเกม) ค้นหารถด้วยชื่อรุ่น/ยี่ห้อ (หลายภาษา)
  แสดงจุดจอดที่เป็นไปได้ทั้ง 50 จุดของรถคันนั้นบนแผนที่ ค่าความแรงรถสต็อก (ความเร็วสูงสุด/อัตราเร่ง/เบรก/การยึดเกาะ)
  และวันที่รถคันนั้นจะกลับมาอยู่ในรายการ
- popup แต่ละจุดบอก "แถว <ชื่อย่าน>" + ความสูงจากระดับน้ำทะเล / ความลึกใต้น้ำ + ภาพดาวเทียมซูมใกล้พร้อมวงแดง
  และช่อง "โน้ตของฉัน" ไว้จดคำบอกทางเอง (เก็บในเบราว์เซอร์ ค้นหาได้ และรวมในไฟล์สำรอง)
  ชื่อย่าน (`data/zones.json`) ค้นจากกล่องโซนจริงของเกม
- 🗺 ไฮไลท์โซนเมือง: ระบายสีโซน/ย่านทั้งแผนที่แบบโปร่งใส (ปรับความทึบได้) โซนติดกันสีไม่ซ้ำ ชื่อโซนแสดงตามระดับซูม
  และไอคอนอยู่ด้านบนเสมอ ข้อมูลจาก [DurtyFree/gta-v-data-dumps](https://github.com/DurtyFree/gta-v-data-dumps) `zones.json`
  (ขอบเขต popzone ของเกม) แปลงด้วย `tools/build_zone_shapes.py` → `data/zone_shapes.json` + `data/zones.json`
- 🧮 วางแผน (`planner.js`): ใส่เป้าหมายเป็นเงิน / RP / Rank (Rank ปัจจุบัน → Rank เป้าหมาย ใช้ตาราง RP จริงของเกม `data/ranks.json`)
  แล้วแนะนำว่าควรเก็บหมวดไหนกี่ชิ้น เรียงจากคุ้มที่สุดต่อนาที ปรับเวลาต่อชิ้น เปิด/ปิดหมวด ตัวคูณอีเวนต์ ฯลฯ ได้ และกดแสดงบนแผนที่ได้
- รองรับ 16 ภาษา (เลือกอัตโนมัติตามเบราว์เซอร์ เปลี่ยนได้ที่ 🌐) ค้นหาด้วยชื่อหมวดภาษาไหนก็ได้
- ไม่ต้องสมัครสมาชิก: ความคืบหน้า/การตั้งค่าเก็บใน localStorage และ **ส่งออก/นำเข้าไฟล์สำรอง (.json)** ได้

## ภาษา

ไฟล์ภาษาอยู่ใน `i18n/` (`index.json` = รายชื่อภาษา, `<code>.json` = ข้อความ UI + ชื่อ/คำอธิบายหมวด)
เพิ่มภาษาใหม่: คัดลอก `en.json` เป็น `<code>.json` แปลค่า (คง `{placeholder}` ไว้) แล้วเพิ่มลงใน `index.json`
คีย์ที่ไม่มีจะใช้ภาษาอังกฤษแทนอัตโนมัติ

## ไฟล์สำรอง

ปุ่ม "ส่งออกไฟล์สำรอง" ดาวน์โหลดทุกค่าที่ขึ้นต้นด้วย `gtaomap.` ใน localStorage
(เช่น `collected`, `visible`, `lang`, `style`) เป็นไฟล์ `{"app":"bombxdev-gta-online-map","version":1,"data":{...}}`
"นำเข้าไฟล์สำรอง" จะถามยืนยันแล้วแทนที่ค่าทั้งหมดในเบราว์เซอร์นั้น

## ตำแหน่งประจำวัน (Gun Van, Shipwreck, Hidden Caches ฯลฯ)

คำนวณในเบราว์เซอร์เองทั้งหมด ไม่ต้องอัปเดตมือ ด้วยตรรกะเดียวกับในเกม (`freemode.c`):

- **ของรายวัน** (Hidden Caches, Shipwreck, Treasure Chests, Buried Stashes, Skydives, LS Tags, Weed Packages):
  เกมใช้ตารางตายตัววนรอบ 84 วัน `day = (เวลา UTC - 1555999200) / 86400`, ใช้แถวที่ `day % 84`
  → `data/daily.json` (ดึงด้วย `tools/extract_daily.py`)
- **Gun Van**: ตัวสุ่มของเกม (`NETWORK_SEED_RANDOM_NUMBER_GENERATOR`) seed = `(เวลา UTC - 6 ชม.) / 86400`
  สุ่มใหม่ถ้าจุดนั้นถูกปิด (`XM22_GUN_VAN_LOCATION_ENABLED_n`) → `daily.js`
- ทุกอย่างรีเซ็ต 06:00 UTC (13:00 เวลาไทย)
- Rockstar override ได้ผ่าน tunables → GitHub Action `.github/workflows/gtao-tunables.yml`
  ดึงจาก [api.rdo.gg](https://tunables.rdo.gg) ทุกวันหลังรีเซ็ต เก็บไว้ที่ `data/tunables.json`
  หน้าเว็บจะนำ override มาใช้และแจ้งเตือนถ้ามี

- **Exotic Exports**: รถ 100 รุ่น (ตัดรุ่นที่ถูก blacklist ผ่าน tunables) สับด้วยตัวสุ่มเดียวกัน seed เดียวกับ Gun Van
  10 คันแรกคือรถของวันนั้น (tunables แทนบางช่องได้) ลำดับที่ขอสับอีกรอบด้วย `seed % (i + 1)`
  เวลาขอรถแต่ละคัน เกมสุ่มจุดจอด 1 ใน 50 จุด (มี 2 ชุด: รถหรู 60 รุ่น / รถทั่วไป 40 รุ่น) จึงบอกได้แค่ 50 จุดที่เป็นไปได้
  → `data/exotic_exports.json` (ดึงด้วย `tools/extract_exotic_exports.py`, ค่าความแรงจาก DurtyFree `vehicles.json`)

ตรวจสอบแล้ว: ตาราง 84 วันที่ดึงเองตรงกับของ [GTAO-Bot](https://github.com/ShinyWasabi/GTAO-Bot) ครบ 504/504 รายการ
และ Gun Van ที่คำนวณได้ตรงกับที่เว็บอื่นรายงาน (17 ต.ค. 2026 = #7 Paleto Forest)
รายการ Exotic Exports ตรงกับ GTAO-Bot ครบ 400/400 วันที่ทดสอบ

## เครดิต

เครดิตทั้งหมดอยู่ในหน้า `credits.html` (ลิงก์ "เครดิตและแหล่งข้อมูล" ท้ายเมนู และมุมขวาล่างของแผนที่)
แรงบันดาลใจ: [GTALens](https://gtalens.com/map) และ [GTAweb.eu](https://gtaweb.eu/gtao-map) — ไม่ได้คัดลอกข้อมูลหรือรูปภาพจากทั้งสองเว็บ

## ที่มาของข้อมูล

| ส่วน | แหล่งที่มา |
| --- | --- |
| พิกัด collectibles | `freemode.c` จาก [Sainan/GTA-V-Decompiled-Scripts](https://github.com/Sainan/GTA-V-Decompiled-Scripts) (สคริปต์เกมที่ decompile แล้ว) |
| ภาพแผนที่ | [CreepPork/GTAV-Maps](https://github.com/CreepPork/GTAV-Maps) (MIT) แปลงเป็น WebP |
| ไอคอนบนแผนที่ | ภาพ radar blip จริงของเกม จาก [FiveM docs](https://docs.fivem.net/docs/game-references/blips/) (`citizenfx/fivem-docs`, `static/blips/`) — `blipSource: "game"` = blip ที่สคริปต์เกมใช้กับหมวดนั้นจริง (`SET_BLIP_SPRITE`), `"closest"` = เกมไม่มี blip เฉพาะ เลือก blip ทางการที่ใกล้เคียงที่สุด |
| แผนที่ Cayo Perico | [fivenet-app/livemap-tiles](https://github.com/fivenet-app/livemap-tiles) (Apache-2.0) ภาพโดย jonstyle83 — ดู `tiles-cayo/README.md` |
| Ghosts Exposed / Street Dealers / Time Trials | `fm_content_ghosthunt.c` และ `freemode.c`; ตาราง/ลำดับสุ่มตรวจเทียบกับ GTAO-Bot (Street Dealers ใช้ตรรกะเกมล่าสุดที่เว้นระยะ 1 กม.) |
| ไลบรารีแผนที่ | [Leaflet 1.9.4](https://leafletjs.com) (BSD-2-Clause) |

ภาพแผนที่ไม่มีเกาะ Cayo Perico — หมุดของหมวดที่อยู่บนเกาะ (Treasure Chests, Buried Stashes)
จะแสดงในกรอบเส้นประบนพื้นทะเลตามพิกัดจริง

## การแปลงพิกัด

พิกัดเกม (x, y) → พิกเซลที่ zoom 0:

```
px = 0.0069329164 * x + 39.385831
py = -0.0069134440 * y + 57.919678
```

ค่านี้ fit จากตำแหน่ง Shipwrecks 30 จุด (อยู่ที่ระดับน้ำทะเลพอดี) ให้ตรงกับแนวชายฝั่งบนภาพ
ความคลาดเคลื่อนเฉลี่ยประมาณ 5 เมตร

## ก่อน deploy ทุกครั้ง

เปลี่ยนเลข `APP_VERSION` และ `?v=` ใน `index.html` (ค่าเดียวกันทุกจุด) ไม่งั้นเบราว์เซอร์อาจใช้
ไฟล์ CSS/JS/ข้อมูลเก่าจากแคช (GitHub Pages แคช 10 นาที) ปนกับไฟล์ใหม่

## อัปเดตข้อมูลเมื่อเกมอัปเดต

```sh
curl -LO https://raw.githubusercontent.com/Sainan/GTA-V-Decompiled-Scripts/master/decompiled_scripts/freemode.c
curl -LO https://raw.githubusercontent.com/Sainan/GTA-V-Decompiled-Scripts/master/decompiled_scripts/tuneables_processing.c
python3 tools/extract_collectibles.py freemode.c data/points.json
python3 tools/extract_daily.py freemode.c tuneables_processing.c data/daily.json
curl -LO https://raw.githubusercontent.com/DurtyFree/gta-v-data-dumps/master/vehicles.json
python3 tools/extract_exotic_exports.py freemode.c tuneables_processing.c vehicles.json data/exotic_exports.json data/points.json
```

ชื่อฟังก์ชัน (`func_NNNN`) อาจเปลี่ยนเมื่อเกมอัปเดต ดูคำอธิบายใน `tools/extract_collectibles.py`
ชื่อ/สี/ไอคอนของแต่ละหมวดอยู่ใน `data/categories.json`

GTA V / GTA Online © Rockstar Games — เว็บแฟนเมด ไม่เกี่ยวข้องกับ Rockstar
