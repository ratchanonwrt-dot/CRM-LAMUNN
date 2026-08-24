"use client";

interface BranchOption {
  id: string;
  name: string;
}

export default function RedemptionHistoryFilter({
  rewardNames,
  branches,
  currentReward,
  currentBranchId,
  currentFrom,
  currentTo,
}: {
  rewardNames: string[];
  branches: BranchOption[];
  currentReward?: string;
  currentBranchId?: string;
  currentFrom?: string;
  currentTo?: string;
}) {
  return (
    <form method="GET" className="flex flex-wrap items-end gap-2">
      <div>
        <label className="mb-1 block text-xs text-gray-500">โปร/คูปอง</label>
        <select
          name="rewardName"
          defaultValue={currentReward ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">ทั้งหมด</option>
          {rewardNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-gray-500">สาขา</label>
        <select
          name="branchId"
          defaultValue={currentBranchId ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">ทุกสาขา</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-gray-500">ตั้งแต่วันที่</label>
        <input type="date" name="from" defaultValue={currentFrom ?? ""} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-gray-500">ถึงวันที่</label>
        <input type="date" name="to" defaultValue={currentTo ?? ""} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      </div>
      <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">
        กรอง
      </button>
      {(currentReward || currentBranchId || currentFrom || currentTo) && (
        <a href="/admin/redemptions/history" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600">
          ล้างตัวกรอง
        </a>
      )}
    </form>
  );
}
