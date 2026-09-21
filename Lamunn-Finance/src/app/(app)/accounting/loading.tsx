/** Skeleton เฉพาะหมวดบัญชี — มีแยกจาก (app)/loading.tsx เพื่อให้แถบแท็บด้านบน (AccountingTabs)
 * ยังอยู่ตอนสลับหน้าในหมวดนี้ ไม่กะพริบหายไปทั้งแถบ */
export default function AccountingLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-2 h-6 w-56 rounded bg-gray-200" />
      <div className="mb-5 h-4 w-96 max-w-full rounded bg-gray-100" />
      <div className="mb-5 h-14 rounded-xl border border-gray-200 bg-white" />
      <div className="h-96 rounded-xl border border-gray-200 bg-white" />
    </div>
  );
}
