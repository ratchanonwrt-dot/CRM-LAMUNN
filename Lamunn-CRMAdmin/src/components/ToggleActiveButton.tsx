"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ToggleActiveButton({
  endpoint,
  isActive,
}: {
  endpoint: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
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
