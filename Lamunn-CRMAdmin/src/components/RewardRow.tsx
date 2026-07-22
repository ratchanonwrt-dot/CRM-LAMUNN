"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Pencil } from "lucide-react";
import ToggleActiveButton from "@/components/ToggleActiveButton";
import DeleteButton from "@/components/DeleteButton";
import ImageUploadField from "@/components/ImageUploadField";

interface Reward {
  id: string;
  name: string;
  description: string | null;
  pointsCost: number;
  stock: number | null;
  imageUrl: string | null;
  isActive: boolean;
}

const PLACEHOLDER_COLORS = [
  "bg-emerald-50 text-emerald-400",
  "bg-pink-50 text-pink-400",
  "bg-amber-50 text-amber-400",
  "bg-sky-50 text-sky-400",
  "bg-violet-50 text-violet-400",
];

function placeholderColor(id: string) {
  const sum = id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return PLACEHOLDER_COLORS[sum % PLACEHOLDER_COLORS.length];
}

export default function RewardRow({ reward }: { reward: Reward }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(reward.name);
  const [description, setDescription] = useState(reward.description ?? "");
  const [pointsCost, setPointsCost] = useState(String(reward.pointsCost));
  const [stock, setStock] = useState(reward.stock === null ? "" : String(reward.stock));
  const [imageUrl, setImageUrl] = useState<string | null>(reward.imageUrl);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/admin/rewards/${reward.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description: description || null,
        pointsCost,
        stock: stock === "" ? null : stock,
        imageUrl,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  return (
    <>
      <tr className="border-t border-gray-100">
        <td className="px-4 py-2">
          {reward.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={reward.imageUrl} alt={reward.name} className="h-10 w-10 rounded-xl object-cover" />
          ) : (
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${placeholderColor(reward.id)}`}>
              <Gift size={18} strokeWidth={2.2} />
            </div>
          )}
        </td>
        <td className="px-4 py-2">{reward.name}</td>
        <td className="px-4 py-2">{reward.pointsCost}</td>
        <td className="px-4 py-2 text-gray-500">{reward.stock === null ? "ไม่จำกัด" : reward.stock}</td>
        <td className="px-4 py-2">
          <ToggleActiveButton endpoint={`/api/admin/rewards/${reward.id}`} isActive={reward.isActive} />
        </td>
        <td className="px-4 py-2">
          <button onClick={() => setEditing((v) => !v)} className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            <Pencil size={12} />
            {editing ? "ยกเลิก" : "แก้ไข"}
          </button>
        </td>
        <td className="px-4 py-2">
          <DeleteButton endpoint={`/api/admin/rewards/${reward.id}`} confirmMessage={`ลบรางวัล "${reward.name}" ใช่ไหม?`} />
        </td>
      </tr>
      {editing && (
        <tr className="border-t border-gray-100 bg-gray-50">
          <td colSpan={7} className="px-4 py-3">
            <form onSubmit={handleSave} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <input required placeholder="ชื่อรางวัล" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <input placeholder="รายละเอียด" value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <input required type="number" min="1" placeholder="แต้มที่ใช้แลก" value={pointsCost} onChange={(e) => setPointsCost(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <input type="number" min="0" placeholder="จำนวนคงเหลือ (ว่าง = ไม่จำกัด)" value={stock} onChange={(e) => setStock(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <ImageUploadField value={imageUrl} onChange={setImageUrl} />
              <div>
                <button type="submit" disabled={loading} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                  {loading ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
            </form>
          </td>
        </tr>
      )}
    </>
  );
}
