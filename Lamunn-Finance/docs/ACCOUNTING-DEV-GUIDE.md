# คู่มือพัฒนาระบบบัญชีด้วย Codex (สำหรับทีมบัญชี)

คุณพัฒนา "ระบบบัญชี" ในแอป Lamunn-Finance ผ่าน Codex บนเครื่องของคุณเอง แล้วส่งงานเป็น Pull Request
ระบบจะตรวจอัตโนมัติว่าแตะเฉพาะส่วนบัญชีและโค้ดคอมไพล์ผ่าน — ผ่านแล้วกด merge เอง เว็บจริงอัปเดตเองภายในไม่กี่นาที

## A. ติดตั้งครั้งแรก (ทำครั้งเดียว)

1. ติดตั้ง **Git** (git-scm.com), **Node.js 20 LTS** (nodejs.org), **VS Code** (code.visualstudio.com)
2. ล็อกอิน GitHub ด้วยบัญชีของคุณ (เจ้าของระบบต้องเชิญคุณเข้า repo ก่อน) แล้วใน Terminal:
   ```bash
   git clone https://github.com/ratchanonwrt-dot/CRM-LAMUNN.git
   cd CRM-LAMUNN
   npm install
   ```
3. สร้างไฟล์ `Lamunn-Finance/.env` โดยคัดลอกจาก `Lamunn-Finance/.env.example` แล้วเติมค่าที่เจ้าของระบบส่งให้
   (**เป็นฐานข้อมูล dev เท่านั้น — ไม่ใช่ข้อมูลจริง**)
4. ติดตั้ง Codex: ใน VS Code → Extensions → ค้น "Codex" (OpenAI) → Install → Sign in ด้วยบัญชี ChatGPT
   (หรือแบบ CLI: `npm install -g @openai/codex` แล้ว `codex login`)
5. เปิดโฟลเดอร์ `CRM-LAMUNN` ใน VS Code — Codex จะอ่านกติกาจาก `AGENTS.md` ที่ root ของ repo เอง
6. ทดสอบว่ารันได้:
   ```bash
   cd Lamunn-Finance
   npm run dev
   ```
   เปิด http://localhost:3003 ล็อกอิน แล้วเห็นเมนู "บัญชี" = พร้อมใช้งาน

## B. เริ่มงานใหม่ทุกครั้ง

```bash
git checkout master
git pull
git checkout -b acc/ชื่องาน-สั้นๆ
```
ตัวอย่างชื่อ branch: `acc/wht-report-export`, `acc/fix-ledger-opening-balance`

## C. สั่งงาน Codex

พิมพ์ภาษาไทยธรรมดาในช่องแชทของ Codex ได้เลย ตัวอย่าง:

- **เพิ่มฟังก์ชัน** — "เพิ่มปุ่ม Export Excel ในหน้ารายงานภาษีขาย ใช้รูปแบบเดียวกับของรายงานภาษีซื้อ
  (ดู `src/lib/accounting/inputVatExcel.ts`) เสร็จแล้วรัน tsc และเขียนสคริปต์ verify ให้ด้วย"
- **แก้วิธีทำงาน** — "ตอนคีย์ใบสำคัญ ถ้าเลือกซัพพลายเออร์ที่บรรทัดแรกแล้ว ให้บรรทัดถัดไปเติมซัพพลายเออร์เดิม
  ให้อัตโนมัติ แต่ยังแก้ได้"
- **แก้บั๊ก** — "หน้าบัญชีแยกประเภท เดือนที่ไม่มีรายการ ยอดยกมาแสดง 0 ทั้งที่ควรเป็นยอดสะสมจากเดือนก่อน
  หาสาเหตุใน `src/lib/accounting/reports.ts` แล้วแก้ พร้อมเทสพิสูจน์"
- **ถามก่อนแก้** (แนะนำสำหรับงานใหญ่) — "อธิบายว่าระบบลงบัญชียอดขายรายวันทำงานยังไง และถ้าจะเพิ่ม
  การลง GP ห้างอัตโนมัติต้องแตะไฟล์ไหนบ้าง ยังไม่ต้องแก้"
- **ปิดท้ายทุกงาน** — "รัน `npx tsc --noEmit` และสคริปต์ verify ที่เกี่ยวข้องใน `scripts/` ให้ผ่านทั้งหมด
  แล้วสรุปว่าแก้ไฟล์อะไรบ้าง"

## D. ส่งงาน

```bash
git add -A
git commit -m "สรุปสั้นๆ ว่าทำอะไร"
git push -u origin HEAD
```
เปิดลิงก์ที่ git แสดง → **Create pull request** → รอเครื่องหมายถูกสีเขียว (ตรวจขอบเขตไฟล์ + tsc)
→ กด **Merge** → ระบบ deploy ขึ้นเว็บจริงให้เอง (ดูสถานะที่แท็บ Actions)

## กติกา 3 ข้อ

1. **ห้ามทำงานบน `master` ตรงๆ** — สร้าง branch `acc/...` ใหม่ทุกงาน
2. **ถ้าเครื่องหมายแดง** บอกว่าแตะไฟล์นอกโฟลเดอร์บัญชี → ไม่ต้องพยายามแก้ให้ผ่าน ส่งลิงก์ PR ให้เจ้าของระบบดู
3. **ข้อมูลทดสอบใช้วันที่ปี ค.ศ. 2090 ขึ้นไป** และสคริปต์ต้องลบเฉพาะที่ตัวเองสร้าง — ห้ามลบด้วยเงื่อนไขกว้างๆ

## ฐานข้อมูล dev (สำหรับเจ้าของระบบ)

ฐานข้อมูล dev คือ Supabase project `lamunn-finance-dev` (องค์กร "Lamunn Dev") — ข้อมูลเริ่มต้นถูกใส่ด้วย
`packages/db-finance/prisma/seed.ts` (สาขา + ผู้ใช้ admin) และ `Lamunn-Finance/scripts/seed-dev-accounting.ts`
(ผังบัญชีมาตรฐาน + ชื่อบริษัทสมมติ) ถ้าต้องสร้างฐานข้อมูล dev ใหม่:

```bash
cd packages/db-finance && npx prisma migrate deploy
```
> หมายเหตุ: บน DB ว่างเปล่า migration `20260827160000_accounting_tax_documents` จะล้มเพราะอ้างตาราง `acc_partners`
> ที่ถูกสร้างใน migration หลังจากนั้น (ลำดับใน production ไม่เป็นปัญหาเพราะตารางมีอยู่ก่อนแล้ว) — แก้โดย
> `npx prisma migrate resolve --rolled-back 20260827160000_accounting_tax_documents` → `npx prisma db push --skip-generate`
> → `npx prisma migrate resolve --applied <ชื่อ migration>` สำหรับตัวนั้นและทุกตัวที่เหลือ แล้วค่อยรัน seed สองตัวข้างบน

## ถ้าเจอปัญหา

| อาการ | ทำอย่างไร |
|---|---|
| `npm run dev` ขึ้น error เรื่อง Prisma client | รัน `npx prisma generate --schema ../packages/db-finance/prisma/schema.prisma` จากโฟลเดอร์ Lamunn-Finance |
| ล็อกอินไม่ได้ | ขอ user/password ของฐานข้อมูล dev จากเจ้าของระบบ (คนละชุดกับเว็บจริง) |
| PR ตกที่ขั้น tsc | ให้ Codex รัน `npx tsc --noEmit` แล้วแก้ตาม error |
| PR ตกที่ขั้น accounting-scope | มีไฟล์นอกโฟลเดอร์บัญชีถูกแก้ — ให้ Codex `git checkout master -- <ไฟล์นั้น>` เพื่อคืนค่า หรือส่งให้เจ้าของระบบดู |
