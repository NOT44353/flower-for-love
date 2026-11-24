# 🌹 Flower For Love — 3D ASCII Rose Bouquet & Portrait Gift

โปรเจค **3D ASCII Art ธีมส่งช่อดอกไม้ให้แฟนใต้แสงโคมแดง** (ได้แรงบันดาลใจจากชุดฮั่นฝูสีแดง ปิ่นทอง โคมแดง และบรรยากาศริมทะเลสาบในรูปแฟน)  
ใช้งานได้ทั้ง **หน้าเว็บโต้ตอบ 60 FPS** (ดับเบิลคลิกเปิดได้ทันที) และ **Python รันใน Terminal** แบบ 24-bit ANSI True Color

---

## 📁 โครงสร้างโปรเจค

```text
flower-for-love/
├── index.html              # เปิดดูบนเบราว์เซอร์ได้ทันที (รองรับเปิดตรงผ่าน file://)
├── config.js               # แก้ชื่อแฟน / ข้อความบอกรัก / โหมดเริ่มต้น
├── flower_ascii.py         # เวอร์ชัน Python รันสดๆ ใน Terminal (ไม่จำเป็นต้องลง numpy)
├── assets/
│   └── girlfriend.jpg      # รูปแฟนต้นฉบับ
├── css/
│   └── style.css           # ธีมสีแดง-ทองฮั่นฝู
├── js/
│   ├── portrait-data.js    # ข้อมูลรูปภาพสำหรับโหมดออฟไลน์
│   ├── flower-3d.js        # เอนจิน 3D Z-Buffer ช่อกุหลาบ & โบตั๋นผลิบาน 3 มิติ
│   ├── portrait-ascii.js   # เอนจินแปลงรูปแฟนเป็น True-Color ASCII Art พร้อมปรับ Blend
│   ├── code-panel.js       # โหมดคลิป 9:16 พร้อมโค้ดเลื่อนอัตโนมัติ (แบบ TikTok/Reels)
│   └── app.js              # ตัวควบคุมโหมด การปรับแต่ง และอัดคลิป .webm
└── scripts/
    └── update_photo.py     # สคริปต์สร้าง portrait-data.js ใหม่เมื่อเปลี่ยนรูป
```

---

## 🚀 วิธีใช้งาน

### 1. แบบหน้าเว็บ (แนะนำ — ลื่น 60 FPS ส่งให้แฟนเปิดดูหรืออัดคลิปได้)
- **ดับเบิลคลิกไฟล์ `index.html`** เปิดด้วย Chrome / Edge ได้เลยทันที (ไม่ต้องรันเซิร์ฟเวอร์)
- เลือกสลับได้ 3 โหมด:
  - **💝 คู่ช่อดอกไม้ + รูปเธอ**: ด้านซ้ายเป็นช่อกุหลาบ 3D ASCII ที่ลากเมาส์หมุนได้ ด้านขวาเป็นรูปแฟนในสไตล์ True-Color ASCII (เลื่อนสไลเดอร์ปรับระดับ `ASCII ↔ รูปจริง` ได้)
  - **🌹 ช่อดอกไม้ 3D เต็มจอ**: ช่อกุหลาบแดง-โบตั๋นสีงาช้างกำลังผลิบานเหนือทะเลสาบและโคมแดง
  - **🎬 โหมดคลิป Reels**: เลย์เอาต์แนวตั้ง 9:16 ด้านบนเป็น 3D ASCII + รูปแฟน ด้านล่างเป็นโค้ดเลื่อนอัตโนมัติ พร้อมปุ่ม **อัดคลิป `.webm`** ในคลิกเดียว

### 2. แบบ Python รันใน Terminal (24-bit True Color)
เปิด Windows Terminal หรือ VS Code Terminal ในโฟลเดอร์นี้แล้วรัน:

```powershell
# โหมดคู่กัน (ช่อดอกไม้ 3D ด้านซ้าย + รูปแฟน ASCII ด้านขวา)
python flower_ascii.py

# โหมดช่อดอกไม้ 3D เต็มจอ
python flower_ascii.py --mode bouquet

# โหมดรูปแฟน ASCII เต็มจอ
python flower_ascii.py --mode portrait --name "ดอกไม้ช่อนี้ให้เธอคนเดียวนะ ♥"
```

---

## ✏️ วิธีเปลี่ยนข้อความและเปลี่ยนรูป

- **แก้ข้อความแบบถาวร** (สำหรับส่งโฟลเดอร์ให้แฟน): แก้ในไฟล์ `config.js`
- **แก้ข้อความแบบเร็วบนหน้าเว็บ**: กดปุ่ม **"ปรับแต่งข้อความ / รูป"** ที่มุมขวาบน
- **เปลี่ยนรูปภาพแบบถาวร**: นำรูปใหม่ไปวางทับ `assets/girlfriend.jpg` แล้วรัน:
  ```powershell
  python scripts/update_photo.py
  ```

---

## 👨‍💻 Created By

**Thanapat Pisavong (ธนภัทร พิศวงศ์ · น๊อต / NOT44353)**  
*Full Stack Developer & Cloud Systems Engineer*

- 🌐 Portfolio: https://not44353.vercel.app/
- 🐙 GitHub: https://github.com/NOT44353
- 💼 LinkedIn: https://www.linkedin.com/in/thanapat-pisavong-0a8a80367
- 👤 Facebook: https://www.facebook.com/thanaput.pisawong
