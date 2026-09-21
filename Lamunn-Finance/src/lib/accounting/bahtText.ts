/** แปลงจำนวนเงินเป็นตัวอักษรภาษาไทย เช่น 10652.73 -> "หนึ่งหมื่นหกร้อยห้าสิบสองบาทเจ็ดสิบสามสตางค์"
 *
 * เอกสารทางบัญชี/ภาษีของไทยต้องมีบรรทัด "จำนวนเงินเป็นตัวอักษร" กำกับเสมอ
 * กติกาที่ต้องระวังและมักทำผิดกัน:
 *   - หลักสิบที่เป็น 1 อ่านว่า "สิบ" ไม่ใช่ "หนึ่งสิบ"
 *   - หลักหน่วยที่เป็น 1 และมีหลักสิบอยู่ด้วย อ่านว่า "เอ็ด" เช่น 21 = ยี่สิบเอ็ด
 *   - หลักสิบที่เป็น 2 อ่านว่า "ยี่สิบ"
 *   - จำนวนเกินล้าน วนซ้ำเป็นชุดละ 6 หลัก เช่น 1,000,000 = หนึ่งล้าน
 *   - ไม่มีสตางค์ ลงท้ายด้วย "บาทถ้วน"
 */

const DIGITS = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
const PLACES = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"];

/** อ่านจำนวนเต็มไม่เกิน 6 หลัก (ใช้เป็นบล็อกย่อยของหลักล้าน) */
function readGroup(n: number): string {
  let out = "";
  const s = String(n);
  const len = s.length;

  for (let i = 0; i < len; i++) {
    const digit = Number(s[i]);
    const place = len - i - 1;
    if (digit === 0) continue;

    if (place === 0 && digit === 1 && len > 1) out += "เอ็ด";
    else if (place === 1 && digit === 1) out += "สิบ";
    else if (place === 1 && digit === 2) out += "ยี่สิบ";
    else out += DIGITS[digit] + PLACES[place];
  }
  return out;
}

/** อ่านจำนวนเต็มทุกขนาด — ตัดเป็นชุดละ 6 หลักแล้วต่อด้วย "ล้าน" */
function readInteger(n: number): string {
  if (n === 0) return "ศูนย์";
  const groups: number[] = [];
  let rest = n;
  while (rest > 0) {
    groups.unshift(rest % 1_000_000);
    rest = Math.floor(rest / 1_000_000);
  }
  return groups
    .map((g, i) => {
      if (g === 0) return i === groups.length - 1 ? "" : "";
      const text = readGroup(g);
      const millions = groups.length - i - 1;
      return text + "ล้าน".repeat(millions);
    })
    .join("");
}

/** รับจำนวนเงินเป็น "สตางค์" (จำนวนเต็ม) แบบเดียวกับที่ระบบบัญชีใช้ทั้งระบบ */
export function bahtTextFromSatang(satang: number): string {
  const negative = satang < 0;
  const abs = Math.abs(Math.round(satang));
  const baht = Math.floor(abs / 100);
  const coins = abs % 100;

  let out: string;
  if (baht === 0 && coins === 0) out = "ศูนย์บาทถ้วน";
  else if (coins === 0) out = `${readInteger(baht)}บาทถ้วน`;
  else if (baht === 0) out = `${readGroup(coins)}สตางค์`;
  else out = `${readInteger(baht)}บาท${readGroup(coins)}สตางค์`;

  return negative ? `ลบ${out}` : out;
}

/** รับจำนวนเงินเป็นบาท (ทศนิยม) — สะดวกเวลาเรียกจากที่ที่ไม่ได้ใช้หน่วยสตางค์ */
export function bahtText(amount: number): string {
  return bahtTextFromSatang(Math.round(amount * 100));
}
