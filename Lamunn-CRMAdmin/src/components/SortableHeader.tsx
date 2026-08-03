import Link from "next/link";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

export default function SortableHeader({
  field,
  label,
  currentSort,
  currentDir,
}: {
  field: string;
  label: string;
  currentSort: string;
  currentDir: "asc" | "desc";
}) {
  const active = currentSort === field;
  const nextDir = active && currentDir === "desc" ? "asc" : "desc";
  const Icon = active ? (currentDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <th className="px-4 py-2">
      <Link
        href={`?sort=${field}&dir=${nextDir}`}
        className={`flex items-center gap-1 hover:text-gray-700 ${active ? "font-semibold text-gray-700" : ""}`}
      >
        {label}
        <Icon size={12} />
      </Link>
    </th>
  );
}
