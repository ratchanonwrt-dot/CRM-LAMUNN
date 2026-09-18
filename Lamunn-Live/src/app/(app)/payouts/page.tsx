import { requirePageRole } from "@/lib/requirePageRole";
import { EDITOR_ROLES } from "@/lib/requireStaff";
import { computeDailyPayouts, parseIsoDate } from "@/lib/payouts";
import { addDays, isoDate, todayTH } from "@/lib/schedule";
import PayoutManager from "@/components/PayoutManager";

export const dynamic = "force-dynamic";

export default async function PayoutsPage({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  const me = await requirePageRole();
  const today = todayTH();
  const from = parseIsoDate(searchParams.from) ?? addDays(today, -13);
  const to = parseIsoDate(searchParams.to) ?? today;
  const rows = await computeDailyPayouts(from, to);

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-semibold tracking-tight text-ink">ทำจ่ายรายวัน</h1>
      <p className="mb-5 max-w-3xl text-sm text-muted">
        ยอดจ่ายต่อคนต่อวัน คิดจากกะที่กรอกยอดแล้ว (สูตรเดียวกับหน้าค่าคอมมิชชั่น รวมยอดที่แอดมินกำหนดเอง) — กด <b>อนุมัติ</b> แล้วรายการจะไปโผล่ที่เว็บ Finance
        ให้บัญชีทำจ่าย บัญชีเห็นเฉพาะรายการที่อนุมัติแล้วเท่านั้น ถ้าแก้ยอดหลังอนุมัติ ระบบจะเตือนให้อนุมัติใหม่
      </p>
      <PayoutManager rows={rows} from={isoDate(from)} to={isoDate(to)} canEdit={EDITOR_ROLES.includes(me.role)} />
    </div>
  );
}
