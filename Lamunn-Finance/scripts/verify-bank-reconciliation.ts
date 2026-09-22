/** พิสูจน์การอ่านและจับคู่รายการกระทบยอดโดยไม่แตะฐานข้อมูลหรือสร้างใบสำคัญ
 * รัน: npx tsx scripts/verify-bank-reconciliation.ts
 */
import { parseReconciliationTable, reconcileBankRows } from "../src/lib/accounting/bankReconciliation";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`  ${ok ? "ผ่าน  " : "ไม่ผ่าน ❌"}  ${label}${ok ? "" : ` (ได้ ${JSON.stringify(actual)} ควรเป็น ${JSON.stringify(expected)})`}`);
  if (!ok) failures++;
}

function main() {
  const sparseHeader: unknown[] = [];
  sparseHeader[1] = "วันที่";
  sparseHeader[3] = "รายละเอียด";
  sparseHeader[5] = "จำนวนเงิน";
  // ใช้ปีอนาคตและชื่อ [test] เพื่อแยกข้อมูลพิสูจน์ออกจากข้อมูลใช้งาน แม้ชุดนี้จะอยู่ในหน่วยความจำเท่านั้น
  const bank = parseReconciliationTable([
    ["วันที่", "รายละเอียด", "เงินเข้า", "เงินออก"],
    ["01/01/2637", "[test] รับโอน", "1,250.50", 0],
    ["02/01/2637", "[test] ค่าธรรมเนียม", 0, "15.00"],
    ["03/01/2637", "[test] รายการค้าง", "300.00", ""],
  ], "bank");
  const ledger = parseReconciliationTable([
    ["Date", "Description", "Debit", "Credit"],
    ["2094-01-01", "[test] รับโอนเข้าบัญชี", 1250.5, 0],
    ["2094-01-02", "[test] ค่าธรรมเนียมธนาคาร", 0, 15],
    ["2094-01-04", "[test] รายการเฉพาะบัญชี", 99, ""],
  ], "ledger");
  const result = reconcileBankRows(bank, ledger);
  const sparse = parseReconciliationTable([
    sparseHeader,
    [null, "05/01/2094", null, "[test] เว้นคอลัมน์", null, "500.00"],
  ], "bank");

  console.log("\n=== อ่านไฟล์เป็นสตางค์ ===");
  check("เงินเข้าธนาคารเป็นบวก", bank[0].amount, 125_050);
  check("เงินออกธนาคารเป็นลบ", bank[1].amount, -1_500);
  check("เครดิตบัญชีเงินฝากเป็นลบ", ledger[1].amount, -1_500);
  check("อ่านหัวตารางที่มีคอลัมน์ว่างคั่นได้", sparse[0].amount, 50_000);

  console.log("\n=== จับคู่ด้วยวันที่และจำนวนเงิน ===");
  check("จับคู่ได้ 2 รายการ", result.filter((row) => row.matched).length, 2);
  check("รายการไม่ตรงกันเป็น 2 รายการ", result.filter((row) => !row.matched).length, 2);
  check("เก็บรายการค้างจากทั้งสองฝั่ง", result.filter((row) => !row.matched).map((row) => [row.bank?.detail ?? null, row.ledger?.detail ?? null]), [
    ["[test] รายการค้าง", null],
    [null, "[test] รายการเฉพาะบัญชี"],
  ]);

  console.log("\n=== ล้างข้อมูลทดสอบ ===");
  bank.length = 0;
  ledger.length = 0;
  result.length = 0;
  sparse.length = 0;
  check("ข้อมูลในหน่วยความจำถูกล้าง", [bank.length, ledger.length, result.length, sparse.length], [0, 0, 0, 0]);

  console.log(failures === 0 ? "\n✅ ผ่านทั้งหมด\n" : `\n❌ ไม่ผ่าน ${failures} ข้อ\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
