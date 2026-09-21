# Lamunn Tax Invoice

เว็บกรอกขอใบกำกับภาษี — ลูกค้าสแกน QR จากใบเสร็จ POS, กรอกที่อยู่, ระบบออกใบกำกับภาษีผ่าน
Flow Account และส่งอีเมลอัตโนมัติ

โปรเจกต์นี้แยกอิสระจาก `Lamunn-CRM` / `Lamunn-CRMAdmin` — มี DB, dependencies, และ deploy
ของตัวเอง ไม่ได้อยู่ใน npm workspaces เดิม

## Flow

1. ลูกค้าสแกน QR บนใบเสร็จ → เปิด `/r?b=<branchCode>&r=<receiptNo>&a=<amount>&t=<timestamp>&s=<signature>`
   (สเปกเดียวกับ QR สะสมแต้มใน Lamunn-CRM ดู `src/lib/qr.ts`)
2. ระบบตรวจลายเซ็น HMAC ของ QR ฝั่งเซิร์ฟเวอร์ (cross-check กับยอด/เลขที่ใบเสร็จจริงจาก POS)
3. ลูกค้ากรอกชื่อ/เลขผู้เสียภาษี/ที่อยู่/อีเมล
4. `POST /api/requests` → บันทึกคำขอ → เรียก Flow Account ออกใบกำกับภาษี → ส่งอีเมลผ่าน Resend
5. `/status/[id]` แสดงสถานะให้ลูกค้า, `/admin` (Basic Auth) ให้พนักงานดู/ลองใหม่คำขอที่ค้าง

## สิ่งที่ต้องเติมทีหลัง

- **POS_QR_SECRET**: ต้องตรงกับ secret ที่ระบบ POS (กำลังพัฒนา) ใช้เซ็น QR — จนกว่าจะเชื่อมเสร็จ
  QR ที่ไม่มีลายเซ็นก็ยังใช้งานได้ (ทำเครื่องหมาย `signed: false` ไว้ให้ตรวจสอบภายหลัง)
- **FLOWACCOUNT_API_KEY / FLOWACCOUNT_ACCOUNT_ID**: ดู `src/lib/flowaccount.ts` — endpoint และ
  รูปแบบ payload เป็นการเดาอย่างดีที่สุดจากรูปแบบ Open API ทั่วไปของ Flow Account
  **ต้องตรวจสอบกับเอกสารจริงของ Flow Account ก่อนใช้งานจริง** ก่อนเชื่อม ระบบจะบันทึกคำขอไว้
  ที่สถานะ `AWAITING_FLOWACCOUNT_SETUP` และส่งอีเมลรับทราบคำขอแทน
- **RESEND_API_KEY / RESEND_FROM_EMAIL**: สมัคร Resend และ verify โดเมนที่จะใช้ส่ง

## Setup

```bash
cd Lamunn-TaxInvoice
npm install
cp .env.example .env   # แล้วกรอกค่าที่มี
npm run db:migrate -- --name init
npm run dev             # http://localhost:3002
```

## ทดสอบ QR โดยไม่ต้องรอ POS

ใช้ `buildSignedQrContent` ใน `src/lib/qr.ts` (หรือ endpoint ทดสอบที่สร้างเพิ่มได้) เพื่อสร้างลิงก์
QR ทดสอบที่มีลายเซ็นถูกต้อง แล้วเปิดลิงก์นั้นแทนการสแกนจริง
