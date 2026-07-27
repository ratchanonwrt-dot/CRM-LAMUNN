"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteEventButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("ลบ Event นี้?")) return;
    setLoading(true);
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="text-xs text-red-500 hover:underline disabled:opacity-50">
      ลบ
    </button>
  );
}
