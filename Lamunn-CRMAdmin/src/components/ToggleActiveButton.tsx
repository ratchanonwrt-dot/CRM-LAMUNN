"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ToggleActiveButton({
  endpoint,
  isActive,
  confirmPinToDeactivate,
}: {
  endpoint: string;
  isActive: boolean;
  // When set, turning this OFF (not on) prompts for this exact PIN first — a
  // speed bump against misclicks on things wired to automation (e.g. an
  // auto-granted coupon), not a real access-control boundary.
  confirmPinToDeactivate?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (isActive && confirmPinToDeactivate) {
      const entered = window.prompt("กรอกรหัส 6 หลักเพื่อยืนยันการปิดใช้งาน");
      if (entered === null) return;
      if (entered !== confirmPinToDeactivate) {
        window.alert("รหัสไม่ถูกต้อง ยกเลิกการปิดใช้งาน");
        return;
      }
    }
    setLoading(true);
    await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={
        isActive
          ? "rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700"
          : "rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500"
      }
    >
      {isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
    </button>
  );
}
