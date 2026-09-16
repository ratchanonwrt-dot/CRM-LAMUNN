"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Radio, ArrowRight } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("live-credentials", { email, password, redirect: false, callbackUrl });
    setLoading(false);
    if (res?.error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }
    window.location.href = callbackUrl;
  }

  const inputCls = "w-full rounded-xl border border-line bg-white px-4 py-3 text-ink outline-none transition placeholder:text-stone-400 focus:border-ink focus:ring-2 focus:ring-ink/10";

  return (
    <main className="grid min-h-screen bg-paper lg:grid-cols-[1.1fr_1fr]">
      {/* ฝั่งซ้าย: แผงเข้ม บอกตัวตนระบบ */}
      <section className="relative hidden overflow-hidden bg-ink px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500">
            <Radio size={20} strokeWidth={2.4} />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">Lamunn Live</span>
        </div>
        <div>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-300">หลังบ้านทีมไลฟ์</p>
          <h1 className="font-display text-5xl font-semibold leading-[1.1] tracking-tight">
            รู้ว่าช่วงไหนคนดูเยอะ
            <br />
            และใครไลฟ์แล้วขายได้
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-stone-400">
            ตารางกะ ยอดคนดูรายชั่วโมง ยอดขาย และค่าคอมมิชชั่นของทีมไลฟ์ อยู่ที่เดียวกัน
          </p>
        </div>
        <div className="flex gap-8 text-[12px] text-stone-500">
          <span>ตารางไลฟ์</span>
          <span>คำขอจอง</span>
          <span>วิเคราะห์</span>
          <span>ค่าคอม</span>
        </div>
        {/* ลวดลายวงกลมจาง ๆ */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full border border-white/5" />
        <div className="pointer-events-none absolute -bottom-40 -right-10 h-[420px] w-[420px] rounded-full border border-white/5" />
        <div className="pointer-events-none absolute -bottom-52 right-16 h-[420px] w-[420px] rounded-full bg-brand-500/10 blur-3xl" />
      </section>

      {/* ฝั่งขวา: ฟอร์ม */}
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-white">
              <Radio size={16} strokeWidth={2.4} />
            </div>
            <span className="font-display text-base font-semibold">Lamunn Live</span>
          </div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">เข้าสู่ระบบ</h2>
          <p className="mt-1.5 text-sm text-muted">สำหรับทีมงาน Lamunn เท่านั้น</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">อีเมล</label>
              <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@lamunn.co.th" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">รหัสผ่าน</label>
              <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              {!loading && <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />}
            </button>
          </form>
          <p className="mt-8 text-[11px] text-stone-400">ลืมรหัสผ่าน ให้ผู้ดูแลระบบตั้งรหัสใหม่ให้ที่เมนู &quot;ผู้ใช้งาน&quot;</p>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
