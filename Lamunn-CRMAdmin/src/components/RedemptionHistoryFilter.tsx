"use client";

export default function RedemptionHistoryFilter({
  rewardNames,
  current,
}: {
  rewardNames: string[];
  current?: string;
}) {
  return (
    <form method="GET" className="flex items-center gap-2">
      <select
        name="rewardName"
        defaultValue={current ?? ""}
        onChange={(e) => e.currentTarget.form?.submit()}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="">ทั้งหมด</option>
        {rewardNames.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </form>
  );
}
