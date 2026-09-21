/** รวม router.refresh() ที่ยิงติดๆ กันให้เหลือครั้งเดียวหลังผู้ใช้ "หยุดกรอก"
 *
 * ตารางกรอกยอดขายบันทึกทุกครั้งที่ออกจากช่อง (blur) — ตอนกด Tab ไล่กรอกทีละช่องเร็วๆ แต่ละช่องจะสั่ง
 * refresh ทั้งหน้า (เซิร์ฟเวอร์ query ใหม่ทั้งเดือน + ส่ง RSC ~130KB + React reconcile ตารางที่มี input
 * หลายร้อยช่อง) ถ้าปล่อยให้ยิงทุกช่องจะกลายเป็น render ซ้ำ 5-10 รอบต่อเนื่องกันแย่งเวลากับการพิมพ์
 *
 * ประวัติ: เวอร์ชันแรกเป็น debounce ล้วน → ผู้ใช้รู้สึกว่ายอดรวมขยับช้า จึงเปลี่ยนเป็น leading+trailing
 * (ยิงทันทีครั้งแรก) ตอนนี้ตารางคำนวณยอดรวมฝั่ง client ทันทีที่ออกจากช่องแล้ว (optimistic — ดู
 * BranchDailyMatrix / EditableMonthlyChannelTable) การ refresh จึงเหลือหน้าที่แค่ "ปรับการ์ดสรุป/กราฟ
 * ด้านบนให้ตรงกับเซิร์ฟเวอร์" ซึ่งรอได้ → กลับมาเป็น trailing อย่างเดียว: ยิงครั้งเดียวหลังหยุดกรอก IDLE_MS
 * ระหว่างที่กำลังกรอกรัวๆ จะไม่มี render ใหญ่คั่นเลย */
const IDLE_MS = 800;

let timer: ReturnType<typeof setTimeout> | null = null;
let latest: (() => void) | null = null;

export function scheduleRefresh(refresh: () => void) {
  latest = refresh;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    const fn = latest;
    latest = null;
    fn?.();
  }, IDLE_MS);
}
