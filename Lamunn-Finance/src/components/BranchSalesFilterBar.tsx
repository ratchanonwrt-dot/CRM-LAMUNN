"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toDateInputValue } from "@/lib/format";

interface BranchOption {
  id: string;
  name: string;
}

/** ตัวกรองหน้ารายงานยอดขายรายสาขา — เลือกสาขา + ช่วงวันที่ (มีปุ่มลัดเดือนนี้/เดือนก่อน) แล้วกดใช้ตัวกรอง
 * เปลี่ยน URL query (branchId/from/to) เพื่อให้หน้า server component ดึงข้อมูลใหม่ตามนั้น */
export default function BranchSalesFilterBar({
  branches,
  branchId,
  from,
  to,
}: {
  branches: BranchOption[];
  branchId: string;
  from: string;
  to: string;
}) {
  const router = useRouter();
  const [selBranch, setSelBranch] = useState(branchId);
  const [selFrom, setSelFrom] = useState(from);
  const [selTo, setSelTo] = useState(to);

  function go(nextBranch: string, nextFrom: string, nextTo: string) {
    const params = new URLSearchParams();
    if (nextBranch) params.set("branchId", nextBranch);
    params.set("from", nextFrom);
    params.set("to", nextTo);
    router.push(`/reports/branch-sales?${params.toString()}`);
  }

  function thisMonth() {
    const now = new Date();
    const start = toDateInputValue(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)));
    const end = toDateInputValue(now);
    setSelFrom(start);
    setSelTo(end);
    go(selBranch, start, end);
  }

  function lastMonth() {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
    const startStr = toDateInputValue(start);
    const endStr = toDateInputValue(end);
    setSelFrom(startStr);
    setSelTo(endStr);
    go(selBranch, startStr, endStr);
  }

  return (
    <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <label className="text-xs text-gray-500">
        สาขา
        <select
          value={selBranch}
          onChange={(e) => setSelBranch(e.target.value)}
          className="mt-1 block w-48 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
        >
          <option value="">ทุกสาขา</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-gray-500">
        ตั้งแต่วันที่
        <input
          type="date"
          value={selFrom}
          onChange={(e) => setSelFrom(e.target.value)}
          className="mt-1 block rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
        />
      </label>
      <label className="text-xs text-gray-500">
        ถึงวันที่
        <input
          type="date"
          value={selTo}
          onChange={(e) => setSelTo(e.target.value)}
          className="mt-1 block rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
        />
      </label>
      <button
        type="button"
        onClick={() => go(selBranch, selFrom, selTo)}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        ใช้ตัวกรอง
      </button>
      <button type="button" onClick={thisMonth} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
        เดือนนี้
      </button>
      <button type="button" onClick={lastMonth} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
        เดือนก่อน
      </button>
    </div>
  );
}
