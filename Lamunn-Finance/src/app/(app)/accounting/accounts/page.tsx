import { prisma } from "@lamunn/db-finance";
import { requireSectionPage } from "@/lib/permissions";
import SeedChartButton from "@/components/accounting/SeedChartButton";
import AddAccountForm from "@/components/accounting/AddAccountForm";
import ImportChartButton from "@/components/accounting/ImportChartButton";
import AccountList from "@/components/accounting/AccountList";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const { permissions } = await requireSectionPage("ACCOUNTING");
  const canEdit = permissions.ACCOUNTING.canEdit;

  const [accounts, usage] = await Promise.all([
    prisma.accAccount.findMany({ orderBy: { code: "asc" } }),
    prisma.accJournalLine.groupBy({ by: ["accountId"], _count: { _all: true } }),
  ]);
  const groups = accounts.filter((a) => !a.isPostable).map((a) => ({ code: a.code, nameTh: a.nameTh }));
  const usedCount = new Map(usage.map((u) => [u.accountId, u._count._all]));

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-gray-900">ผังบัญชี</h1>
      <p className="mb-4 text-sm text-gray-500">
        รายการบัญชีทั้งหมดที่ใช้ลงรายการและออกงบ — ทีมบัญชีแก้ชื่อ เพิ่มบัญชีย่อย หรือย้ายกลุ่มได้เอง
        บัญชีที่ถูกใช้ในสมุดรายวันแล้วจะลบไม่ได้ ป้องกันงบย้อนหลังเพี้ยน
      </p>

      {canEdit && (
        <div className="mb-5">
          <div className="flex flex-wrap items-start gap-3">
            <SeedChartButton hasAccounts={accounts.length > 0} />
            <ImportChartButton />
            <AddAccountForm groups={groups} />
          </div>
          <p className="mt-2 text-xs text-gray-400">
            ไฟล์นำเข้า: .xlsx หรือ .csv มีคอลัมน์ รหัสบัญชี กับ ชื่อบัญชี (มีหัวตารางหรือไม่ก็ได้) — รหัสเดิมจะอัพเดตชื่อ รหัสใหม่จะสร้างเพิ่ม
            หมวดเดาจากเลขตัวแรกของรหัส (1 สินทรัพย์ 2 หนี้สิน 3 ทุน 4 รายได้ 5 ค่าใช้จ่าย)
          </p>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
          <p className="text-sm font-medium text-gray-700">ยังไม่มีผังบัญชี</p>
          <p className="mt-1 text-sm text-gray-500">กด &ldquo;ติดตั้งผังบัญชีเริ่มต้น&rdquo; ด้านบนเพื่อเริ่มต้นด้วยผังมาตรฐานสำหรับร้านอาหาร/เบเกอรี่</p>
        </div>
      ) : (
        <AccountList
          canEdit={canEdit}
          groups={groups}
          accounts={accounts.map((a) => ({
            id: a.id,
            code: a.code,
            nameTh: a.nameTh,
            type: a.type,
            parentCode: a.parentCode,
            isPostable: a.isPostable,
            isActive: a.isActive,
            vatRole: a.vatRole,
            usedCount: usedCount.get(a.id) ?? 0,
          }))}
        />
      )}
    </div>
  );
}
