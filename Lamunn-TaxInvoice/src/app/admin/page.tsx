import { prisma } from "@/lib/db";
import { retryRequest } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "กำลังดำเนินการ",
  AWAITING_FLOWACCOUNT_SETUP: "รอเชื่อม Flow Account",
  ISSUED: "ออกใบกำกับภาษีแล้ว",
  EMAIL_SENT: "ส่งอีเมลแล้ว",
  FAILED: "ล้มเหลว",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const requests = await prisma.taxInvoiceRequest.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <main className="max-w-none space-y-4">
      <h1 className="text-lg font-semibold">คำขอใบกำกับภาษี</h1>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-3 py-2">วันที่</th>
              <th className="px-3 py-2">สาขา</th>
              <th className="px-3 py-2">เลขที่ใบเสร็จ</th>
              <th className="px-3 py-2">ยอดเงิน</th>
              <th className="px-3 py-2">ลูกค้า</th>
              <th className="px-3 py-2">อีเมล</th>
              <th className="px-3 py-2">QR ลงชื่อ</th>
              <th className="px-3 py-2">สถานะ</th>
              <th className="px-3 py-2">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-t border-gray-100">
                <td className="px-3 py-2 whitespace-nowrap">{r.createdAt.toLocaleString("th-TH")}</td>
                <td className="px-3 py-2">{r.branchCode}</td>
                <td className="px-3 py-2">{r.receiptNo}</td>
                <td className="px-3 py-2">{Number(r.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                <td className="px-3 py-2">{r.fullName}</td>
                <td className="px-3 py-2">{r.email}</td>
                <td className="px-3 py-2">{r.signed ? "✓" : "—"}</td>
                <td className="px-3 py-2">
                  <span
                    className={
                      r.status === "EMAIL_SENT"
                        ? "text-brand-700"
                        : r.status === "FAILED"
                        ? "text-red-700"
                        : "text-amber-700"
                    }
                  >
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                  {r.errorMessage && <div className="text-xs text-red-500">{r.errorMessage}</div>}
                </td>
                <td className="px-3 py-2">
                  {r.status !== "EMAIL_SENT" && (
                    <form action={retryRequest.bind(null, r.id)}>
                      <button type="submit" className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50">
                        ลองใหม่
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
