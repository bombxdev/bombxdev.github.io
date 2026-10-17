# GTA Online Map

แผนที่ GTA Online แบบค้นหาได้ ไม่มีโฆษณา ใช้งานที่ `https://bombxdev.github.io/gta-online-map/`

## ฟีเจอร์

- ตำแหน่ง collectibles 20 หมวด (~1,000 จุด) เช่น Action Figures, Playing Cards, Signal Jammers,
  Peyote, Movie Props, Media Sticks, Hidden Caches, Shipwrecks, LD Organics, Skydives, LS Tags
  และอีเวนต์ตามเทศกาล (ฟักทองฮาโลวีน, ตุ๊กตาหิมะ, Yuanbao, St. Patrick's charms ฯลฯ)
- ค้นหาด้วยชื่อไทย/อังกฤษ + หมายเลข (`ฟิกเกอร์ 12`, `card 5`) หรือพิกัดเกม (`-75, -818`)
- แผนที่ 3 แบบ: Atlas / Road / Satellite (โฮสต์ tiles เองทั้งหมด ไม่พึ่งเว็บอื่น)
- ติ๊ก "เก็บแล้ว" แล้วนับความคืบหน้าต่อหมวด (บันทึกใน localStorage ของเบราว์เซอร์)
- ลิงก์ตรงไปยังแต่ละจุด เช่น `#action_figures-12`
- คลิกขวา/กดค้างบนแผนที่เพื่อดูพิกัดในเกม

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

ตรวจสอบแล้ว: ตาราง 84 วันที่ดึงเองตรงกับของ [GTAO-Bot](https://github.com/ShinyWasabi/GTAO-Bot) ครบ 504/504 รายการ
และ Gun Van ที่คำนวณได้ตรงกับที่เว็บอื่นรายงาน (17 ต.ค. 2026 = #7 Paleto Forest)

## ที่มาของข้อมูล

| ส่วน | แหล่งที่มา |
| --- | --- |
| พิกัด collectibles | `freemode.c` จาก [Sainan/GTA-V-Decompiled-Scripts](https://github.com/Sainan/GTA-V-Decompiled-Scripts) (สคริปต์เกมที่ decompile แล้ว) |
| ภาพแผนที่ | [CreepPork/GTAV-Maps](https://github.com/CreepPork/GTAV-Maps) (MIT) แปลงเป็น WebP |
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

## อัปเดตข้อมูลเมื่อเกมอัปเดต

```sh
curl -LO https://raw.githubusercontent.com/Sainan/GTA-V-Decompiled-Scripts/master/decompiled_scripts/freemode.c
curl -LO https://raw.githubusercontent.com/Sainan/GTA-V-Decompiled-Scripts/master/decompiled_scripts/tuneables_processing.c
python3 tools/extract_collectibles.py freemode.c data/points.json
python3 tools/extract_daily.py freemode.c tuneables_processing.c data/daily.json
```

ชื่อฟังก์ชัน (`func_NNNN`) อาจเปลี่ยนเมื่อเกมอัปเดต ดูคำอธิบายใน `tools/extract_collectibles.py`
ชื่อ/สี/ไอคอนของแต่ละหมวดอยู่ใน `data/categories.json`

GTA V / GTA Online © Rockstar Games — เว็บแฟนเมด ไม่เกี่ยวข้องกับ Rockstar
