# Lamunn Line Translate Bot

บอท LINE ที่แปลข้อความในกลุ่มอัตโนมัติระหว่าง **ไทย / พม่า / อังกฤษ** ใช้ Claude (Anthropic) เป็นเอนจิ้นแปล

พนักงานพิมพ์คุยในกลุ่มตามปกติ (ภาษาไหนก็ได้ใน 3 ภาษานี้) บอทจะตอบกลับด้วยคำแปลอีก 2 ภาษาที่เหลือใต้ข้อความนั้นทันที

## วิธีตั้งค่า

### 1. สร้าง LINE Messaging API channel

1. เข้า [LINE Developers Console](https://developers.line.biz/console/) แล้ว login ด้วยบัญชี LINE ของคุณ
2. สร้าง Provider ใหม่ (ถ้ายังไม่มี) แล้วสร้าง **Channel** ชนิด **Messaging API**
3. ตั้งชื่อบอท เช่น "Lamunn แปลภาษา"
4. ไปที่แท็บ **Basic settings** → copy ค่า **Channel secret**
5. ไปที่แท็บ **Messaging API** → กด **Issue** ที่ **Channel access token (long-lived)** → copy token

### 2. ตั้งค่าให้บอทเข้ากลุ่มได้ และปิดโหมดตอบอัตโนมัติของ LINE เอง

ในแท็บ **Messaging API** ของ channel:

- **Allow bot to join group chats** → เปิด (Enabled)
- **Auto-reply messages** → ปิด (Disabled) — ไม่งั้น LINE จะตอบข้อความทักทายเองแทนบอทเรา
- **Greeting messages** → ปิด (Disabled) ตามชอบ
- **Use webhook** → เปิด (Enabled)

(ปุ่มพวกนี้บางอันต้องตั้งผ่าน [LINE Official Account Manager](https://manager.line.biz/) ของบัญชีเดียวกัน ถ้าไม่เห็นในหน้า Developers Console)

### 3. Deploy โปรเจกต์นี้ขึ้น Vercel

จาก root ของ monorepo:

```bash
vercel --scope lamunncrm
```

ครั้งแรกให้เลือกสร้างโปรเจกต์ใหม่ ตั้ง Root Directory เป็น `Lamunn-LineTranslate`

ตั้งค่า Environment Variables ใน Vercel project settings:

| ตัวแปร | ค่า |
|---|---|
| `LINE_CHANNEL_SECRET` | จากขั้นตอนที่ 1 |
| `LINE_CHANNEL_ACCESS_TOKEN` | จากขั้นตอนที่ 1 |
| `ANTHROPIC_API_KEY` | Anthropic API key ของบริษัท |

แล้ว deploy จริงอีกครั้ง (`vercel --prod --scope lamunncrm`) หลังตั้งค่า env ครบ

### 4. ผูก Webhook URL

กลับไปที่แท็บ **Messaging API** ของ channel → ช่อง **Webhook URL** ใส่:

```
https://<โดเมนที่ deploy ได้>/api/webhook
```

กด **Verify** เพื่อเช็คว่าเชื่อมสำเร็จ (ควรขึ้น Success)

### 5. เพิ่มบอทเข้ากลุ่ม

สแกน QR code ของบอท (อยู่ในแท็บ Messaging API) เพื่อเป็นเพื่อนก่อน แล้วเชิญบอทเข้ากลุ่มที่คุยกับลูกน้อง — เสร็จแล้วพิมพ์คุยได้เลย บอทจะแปลให้อัตโนมัติทุกข้อความ

## หมายเหตุ

- บอทตอบผ่าน LINE **Reply API** (ฟรี ไม่จำกัดจำนวนต่อเดือน) ไม่ใช้ Push API ที่มีโควตา
- ข้อความที่ไม่มีอะไรให้แปล (อีโมจิล้วน, สติกเกอร์, ตัวเลขเปล่าๆ) บอทจะไม่ตอบ
- เปลี่ยนโมเดลได้ด้วย env `CLAUDE_MODEL` (ค่า default คือ `claude-haiku-4-5-20251001` ซึ่งเร็วและถูก เหมาะกับงานแปลสั้นๆ ถี่ๆ)
- รัน dev ในเครื่อง: `npm run dev:line` จาก root (พอร์ต 3005) — ทดสอบ webhook จริงต้องมี public URL เช่น ngrok เพราะ LINE ต้อง POST เข้ามาจากอินเทอร์เน็ต
