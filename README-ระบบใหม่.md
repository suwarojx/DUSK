# คู่มือติดตั้งระบบ Login และ แชทบอท AI — DUSK Roleplay

เว็บของนายตอนนี้เป็น Static Website (HTML/CSS) ล้วนๆ ยังไม่มี server ของตัวเอง
ผมเลยเลือกวิธีที่ **ไม่ต้องมี hosting/server เอง ก็ใช้งานได้จริง**:

- **ระบบ Login** → ใช้ **Firebase Authentication** (ฟรี)
- **แชทบอท AI** → หน้าเว็บเรียก **Cloudflare Worker** (ฟรี) ซึ่งเป็นตัวกลางไปเรียก Claude API อีกที
  (ต้องมีตัวกลางแบบนี้ เพราะถ้าเอา API Key ไปใส่ใน JS หน้าเว็บตรงๆ คนอื่นจะขโมย Key ไปใช้ได้ทันที)

ไฟล์ที่เพิ่มเข้ามาใหม่:
```
my website/
├── login.html              ← หน้าเข้าสู่ระบบ/สมัครสมาชิก
├── chat.html                ← หน้าแชทบอทเต็มจอ (แบบเดียวกับคุยกับ Claude)
├── css/auth.css             ← สไตล์หน้า login และปุ่มบน navbar
├── css/chat-page.css        ← สไตล์หน้าแชทเต็มจอ
├── js/firebase-config.js    ← ใส่ค่า Firebase ของนายตรงนี้ (ใส่ไว้ให้แล้ว)
├── js/auth.js                ← ระบบ login/register/logout
├── js/chat-page.js           ← ตรรกะของหน้าแชทเต็มจอ
└── worker/chat-worker.js     ← โค้ด deploy ขึ้น Cloudflare Worker
```
ไฟล์ index.html, about.html, team.html, login.html ถูกแก้ให้มีเมนู "แชทบอท" บน navbar ไปหน้า chat.html แล้ว

⚠️ **สำคัญมาก:** ห้ามเปิดไฟล์ html ตรงๆแบบดับเบิลคลิก (จะขึ้น URL แบบ `file:///...`) เพราะ Firebase จะไม่ทำงานเด็ดขาด ต้องเปิดผ่าน server เท่านั้น (เช่น VS Code extension "Live Server" กด "Open with Live Server" แล้ว URL ต้องขึ้นเป็น `http://127.0.0.1:...`) หรืออัปโหลดขึ้น hosting จริงแล้วเปิดผ่านโดเมนนั้น

---

## ส่วนที่ 1: ตั้งค่าระบบ Login (Firebase)

1. ไปที่ https://console.firebase.google.com/ แล้วสร้างโปรเจกต์ใหม่ (กด "Add project" ฟรี ไม่ต้องผูกบัตร)
2. ในโปรเจกต์ ไปที่ **Build > Authentication > Get started** แล้วเปิดใช้งานวิธี **Email/Password**
3. ไปที่ **Build > Firestore Database > Create database** เลือกโหมด "Start in test mode" ไปก่อน (ปรับ rule เข้มขึ้นทีหลังได้)
4. ไปที่ ⚙️ **Project settings > General** เลื่อนลงมาที่ "Your apps" กดไอคอน `</>` เพื่อสร้าง Web App
5. ระบบจะให้โค้ด `firebaseConfig = {...}` มา → คัดลอกค่าไปแปะแทนในไฟล์ `js/firebase-config.js`
6. เปิดเว็บผ่าน `login.html` ทดสอบสมัครสมาชิก/ล็อกอินได้เลย ปุ่ม "เข้าสู่ระบบ / ออกจากระบบ" บน navbar จะเปลี่ยนอัตโนมัติตามสถานะ

> หมายเหตุ: ต้องเปิดเว็บผ่าน server จริง (เช่น อัปโหลดขึ้น hosting, หรือใช้ VS Code extension "Live Server") Firebase จะไม่ทำงานถ้าเปิดไฟล์ html ตรงๆแบบ `file://`

---

## ส่วนที่ 2: ตั้งค่าแชทบอท AI (Cloudflare Worker + Gemini API)

ใช้ **Gemini API ของ Google** เพราะมี **free tier จริง ไม่ต้องผูกบัตรเครดิต** (ใช้ได้กับโมเดล Gemini Flash / Flash-Lite จำกัดจำนวนครั้งต่อวัน แต่พอสำหรับบอทตอบคำถามลูกโรลของเซิร์ฟเวอร์ทั่วไป)

### 2.1 ขอ API Key จาก Google AI Studio (ฟรี ไม่ต้องผูกบัตร)
1. ไปที่ https://aistudio.google.com/apikey (ล็อกอินด้วย Gmail)
2. กด **"Create API Key"** เลือกโปรเจกต์ (หรือสร้างใหม่)
3. คัดลอก Key ที่ได้เก็บไว้ (จะใช้ในขั้นตอนถัดไป — **ห้ามเผยแพร่ Key นี้ที่ไหนทั้งสิ้น**)

> หมายเหตุ: free tier จำกัดจำนวนคำขอต่อนาที/ต่อวัน ถ้าลูกโรลถามพร้อมกันเยอะมากอาจเจอ error ชั่วคราว ลองใหม่อีกครั้งได้ ถ้าจะใช้งานหนักจริงจังค่อยพิจารณาผูกบัตรเปิด billing ทีหลัง

### 2.2 Deploy ตัวกลาง (Cloudflare Worker)
1. ไปที่ https://dash.cloudflare.com สมัครฟรี
2. เมนู **Workers & Pages > Create > Create Worker** ตั้งชื่อ เช่น `dusk-chatbot`
3. เปิดไฟล์ `worker/chat-worker.js` ในโปรเจกต์นี้ คัดลอกโค้ดทั้งหมด ไปวางแทนโค้ดเริ่มต้นใน Cloudflare แล้วกด **Deploy**
4. ไปที่ **Settings > Variables and Secrets** ของ Worker → เพิ่ม Secret ชื่อ `GEMINI_API_KEY` ใส่ค่า API Key จากขั้นตอน 2.1
5. คัดลอก URL ของ Worker (รูปแบบ `https://dusk-chatbot.xxxx.workers.dev`)

### 2.3 เชื่อมหน้าเว็บเข้ากับ Worker
1. เปิดไฟล์ `js/chat-page.js`
2. แก้บรรทัด
   ```js
   const CHAT_API_URL = "https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev";
   ```
   ใส่ URL จริงจากขั้นตอน 2.2
3. (แนะนำ) แก้ข้อมูลใน `SERVER_CONTEXT` ในไฟล์เดียวกัน ให้ตรงกับกฎ/ข้อมูลเซิร์ฟเวอร์จริงของนาย เพื่อให้บอทตอบได้แม่นขึ้น
4. เปิดเว็บ กดเมนู "แชทบอท" บน navbar จะพาไปหน้าคุยกับบอทเต็มจอ

### 2.4 (แนะนำ) ล็อกความปลอดภัย
ในไฟล์ `worker/chat-worker.js` มีบรรทัด
```js
const CORS_ALLOW_ORIGIN = "*";
```
พอเว็บนายมีโดเมนจริงแล้ว (เช่น `https://dusk-mc.com`) ให้เปลี่ยนเป็นโดเมนนั้น แล้ว deploy worker ใหม่ จะช่วยกันไม่ให้เว็บอื่นแอบเรียกใช้ Worker/API Key ของนาย

---

## สรุป checklist
- [ ] สร้าง Firebase Project + เปิด Email/Password Auth + Firestore
- [ ] ใส่ค่าใน `js/firebase-config.js`
- [ ] ขอ Gemini API Key จาก https://aistudio.google.com/apikey (ฟรี ไม่ต้องผูกบัตร)
- [ ] Deploy `worker/chat-worker.js` ขึ้น Cloudflare Worker + ใส่ Secret `GEMINI_API_KEY`
- [ ] ใส่ URL Worker ใน `js/chat-page.js` (CHAT_API_URL)
- [ ] แก้ `SERVER_CONTEXT` ให้ตรงกับเซิร์ฟเวอร์จริง
- [ ] อัปโหลดทั้งโฟลเดอร์ `my website/` ขึ้น hosting จริง (เช่น GitHub Pages, Netlify, Vercel — ฟรีทั้งหมด) แล้วทดสอบผ่านโดเมนจริง
