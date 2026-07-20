"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import clsx from "clsx";

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: "ผู้ดูแลระบบ (ทุกสาขา)",
  BRANCH_MANAGER: "ผู้จัดการสาขา",
  STAFF: "พนักงาน",
};

const allLinks = [
  { href: "/admin", label: "ภาพรวม", roles: ["SUPER_ADMIN", "BRANCH_MANAGER", "STAFF"] },
  { href: "/admin/branches", label: "สาขา", roles: ["SUPER_ADMIN"] },
  { href: "/admin/staff", label: "พนักงาน", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
  { href: "/admin/customers", label: "ลูกค้า", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
  { href: "/admin/point-rules", label: "กติกาสะสมแต้ม", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
  { href: "/admin/rewards", label: "รางวัล", roles: ["SUPER_ADMIN"] },
  { href: "/admin/redemptions", label: "ยืนยันแลกรางวัล", roles: ["SUPER_ADMIN", "BRANCH_MANAGER", "STAFF"] },
  { href: "/admin/reports", label: "รายงาน", roles: ["SUPER_ADMIN", "BRANCH_MANAGER", "STAFF"] },
  { href: "/admin/qr-simulator", label: "จำลอง QR (ทดสอบ)", roles: ["SUPER_ADMIN"] },
];

export default function AdminNav({ role, name }: { role: string; name: string }) {
  const pathname = usePathname();
  const links = allLinks.filter((l) => l.roles.includes(role));

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white px-4 py-6">
      <div className="mb-6">
        <p className="font-semibold text-gray-800">{name}</p>
        <p className="text-xs text-gray-400">{roleLabel[role] ?? role}</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "rounded-lg px-3 py-2 text-sm font-medium",
              pathname === link.href ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-100"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <button
        onClick={() => signOut({ callbackUrl: "/admin/login" })}
        className="rounded-lg px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-100"
      >
        ออกจากระบบ
      </button>
    </aside>
  );
}
