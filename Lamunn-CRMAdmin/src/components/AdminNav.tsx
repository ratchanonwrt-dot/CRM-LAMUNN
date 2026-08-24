"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import clsx from "clsx";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserRound,
  Award,
  Percent,
  Gift,
  QrCode,
  Camera,
  Coins,
  BarChart3,
  PieChart,
  Palette,
  History,
  ShieldCheck,
  Ticket,
  Briefcase,
  Layers,
  LogOut,
  Menu,
  X,
  ClipboardList,
} from "lucide-react";
import type { FeatureKey } from "@lamunn/db";

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: "ผู้จัดการ (Manager)",
  SUPERVISOR: "ผู้ดูแลสาขา (Supervisor)",
  STAFF: "พนักงาน (Staff)",
  MARKETING: "การตลาด (Marketing)",
};

// Section headers give a clear visual split so the nav never reads as one long
// undifferentiated list — retail's old single 13-item bucket got split into 4
// focused groups (overview/reports, day-to-day ops, loyalty-program setup,
// master data), on top of the pre-existing retail vs B2B/Catering vs system split.
const SECTIONS = [
  { key: "overview", label: "ภาพรวม & รายงาน" },
  { key: "operations", label: "ดำเนินการหน้าร้าน" },
  { key: "loyalty", label: "ตั้งค่าระบบสมาชิก" },
  { key: "masterdata", label: "ข้อมูลหลัก" },
  { key: "b2b", label: "B2B / Catering" },
  { key: "system", label: "ระบบ" },
] as const;
type SectionKey = (typeof SECTIONS)[number]["key"];

// Order here is the exact left-nav order requested. `feature` is null for links
// gated outside the dynamic permission system (role-permissions itself is
// SUPER_ADMIN-only and hardcoded, so a role can never edit its own access away).
const allLinks: { href: string; label: string; icon: typeof LayoutDashboard; color: string; feature: FeatureKey | null; section: SectionKey; superAdminOnly?: boolean }[] = [
  { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard, color: "bg-sky-100 text-sky-400", feature: "overview", section: "overview" },
  { href: "/admin/reports", label: "รายงาน", icon: BarChart3, color: "bg-cyan-100 text-cyan-400", feature: "reports", section: "overview" },
  { href: "/admin/customer-analytics", label: "Dashboard ลูกค้า", icon: PieChart, color: "bg-lime-100 text-lime-500", feature: "customerAnalytics", section: "overview" },

  { href: "/admin/enter-points", label: "กรอกคะแนน", icon: Coins, color: "bg-yellow-100 text-yellow-500", feature: "enterPoints", section: "operations" },
  { href: "/admin/scan-redemption", label: "สแกน QR ยืนยันแลกรางวัล", icon: Camera, color: "bg-lime-100 text-lime-500", feature: "scanRedemption", section: "operations" },
  { href: "/admin/redemptions", label: "ยืนยันแลกรางวัล", icon: QrCode, color: "bg-teal-100 text-teal-400", feature: "redemptions", section: "operations" },
  { href: "/admin/redemptions/history", label: "ประวัติการแลกรางวัล", icon: ClipboardList, color: "bg-teal-100 text-teal-400", feature: "redemptions", section: "operations" },

  { href: "/admin/tiers", label: "ระดับสมาชิก", icon: Award, color: "bg-fuchsia-100 text-fuchsia-400", feature: "tiers", section: "loyalty" },
  { href: "/admin/point-rules", label: "กติกาสะสมแต้ม", icon: Percent, color: "bg-orange-100 text-orange-400", feature: "pointRules", section: "loyalty" },
  { href: "/admin/rewards", label: "รางวัล", icon: Gift, color: "bg-emerald-100 text-emerald-400", feature: "rewards", section: "loyalty" },
  { href: "/admin/vouchers", label: "Voucher", icon: Ticket, color: "bg-amber-100 text-amber-500", feature: "vouchers", section: "loyalty" },

  { href: "/admin/branches", label: "สาขา", icon: Building2, color: "bg-violet-100 text-violet-400", feature: "branches", section: "masterdata" },
  { href: "/admin/customers", label: "ลูกค้า", icon: UserRound, color: "bg-pink-100 text-pink-400", feature: "customers", section: "masterdata" },

  { href: "/admin/b2b", label: "ลูกค้า B2B/Catering", icon: Briefcase, color: "bg-stone-100 text-stone-500", feature: "b2bCustomers", section: "b2b" },
  { href: "/admin/b2b/tiers", label: "ระดับ B2B/Catering", icon: Layers, color: "bg-stone-100 text-stone-500", feature: "b2bTiers", section: "b2b" },

  { href: "/admin/settings", label: "ตั้งค่าหน้าตาแอป", icon: Palette, color: "bg-rose-100 text-rose-400", feature: "settings", section: "system" },
  { href: "/admin/audit-log", label: "ประวัติการแก้ไข", icon: History, color: "bg-slate-100 text-slate-400", feature: "auditLog", section: "system" },
  { href: "/admin/staff", label: "พนักงาน", icon: Users, color: "bg-indigo-100 text-indigo-400", feature: "staff", section: "system" },
  { href: "/admin/role-permissions", label: "ตั้งค่าสิทธิ", icon: ShieldCheck, color: "bg-red-100 text-red-500", feature: null, section: "system", superAdminOnly: true },
];

function NavLinks({ links, pathname, onNavigate }: { links: typeof allLinks; pathname: string; onNavigate?: () => void }) {
  const visibleSections = SECTIONS.filter((s) => links.some((l) => l.section === s.key));
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {visibleSections.map((sectionDef, i) => {
        const sectionLinks = links.filter((l) => l.section === sectionDef.key);
        return (
          <div key={sectionDef.key} className={clsx("mb-2", i > 0 && "border-t border-gray-100 pt-2")}>
            <p className="mb-1 mt-3 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 first:mt-0">{sectionDef.label}</p>
            {sectionLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onNavigate}
                  className={clsx(
                    "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors",
                    active ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <span className={clsx("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", link.color)}>
                    <Icon size={15} strokeWidth={2.4} />
                  </span>
                  {link.label}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

export default function AdminNav({ role, name, allowedFeatures }: { role: string; name: string; allowedFeatures: FeatureKey[] }) {
  const pathname = usePathname();
  const links = allLinks.filter((l) => (l.superAdminOnly ? role === "SUPER_ADMIN" : l.feature && allowedFeatures.includes(l.feature)));
  const [open, setOpen] = useState(false);

  const profileBlock = (
    <div className="mb-6 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 shadow-inner">
        {name.slice(0, 1) || "?"}
      </div>
      <div>
        <p className="font-semibold text-gray-800">{name}</p>
        <p className="text-xs text-gray-400">{roleLabel[role] ?? role}</p>
      </div>
    </div>
  );

  const signOutButton = (
    <button
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm text-gray-400 hover:bg-gray-50"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <LogOut size={15} strokeWidth={2.4} />
      </span>
      ออกจากระบบ
    </button>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="เปิดเมนู"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
        >
          <Menu size={22} />
        </button>
        <p className="font-semibold text-gray-800">{name}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
          {name.slice(0, 1) || "?"}
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col overflow-y-auto bg-white px-4 py-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              {profileBlock}
              <button onClick={() => setOpen(false)} aria-label="ปิดเมนู" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <NavLinks links={links} pathname={pathname} onNavigate={() => setOpen(false)} />
            {signOutButton}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-gray-200 bg-white px-4 py-6 md:flex">
        {profileBlock}
        <NavLinks links={links} pathname={pathname} />
        {signOutButton}
      </aside>
    </>
  );
}
