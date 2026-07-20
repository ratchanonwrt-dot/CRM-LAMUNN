import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-2xl font-bold text-brand-700">Lamunn CRM — หลังบ้าน</h1>
      <p className="text-gray-600">ระบบจัดการสาขา พนักงาน กติกาสะสมแต้ม รางวัล และรายงาน</p>
      <Link
        href="/admin/login"
        className="w-full rounded-lg bg-brand-600 px-6 py-3 font-medium text-white hover:bg-brand-700"
      >
        เข้าสู่ระบบพนักงาน / หลังบ้าน
      </Link>
    </main>
  );
}
