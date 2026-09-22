"use client";

import { useState } from "react";
import { Building2, CheckCircle2, FileSpreadsheet, UploadCloud } from "lucide-react";

type UploadKind = "bank" | "ledger";

type SelectedFiles = Record<UploadKind, File | null>;

const UPLOADS = [
  {
    kind: "bank" as const,
    title: "ไฟล์รายการเดินบัญชีธนาคาร",
    hint: "Statement ที่ดาวน์โหลดจากธนาคาร",
    icon: Building2,
    tone: "border-blue-200 bg-blue-50/60 text-blue-700 hover:border-blue-400",
  },
  {
    kind: "ledger" as const,
    title: "ไฟล์บัญชี",
    hint: "รายการบัญชีเงินฝากจากโปรแกรมบัญชี",
    icon: FileSpreadsheet,
    tone: "border-emerald-200 bg-emerald-50/60 text-emerald-700 hover:border-emerald-400",
  },
];

const PREVIEW_ROWS = [
  { date: "01/09/2569", detail: "รับโอนยอดขายสาขาอารีย์", bank: "25,400.00", ledger: "25,400.00", matched: true },
  { date: "02/09/2569", detail: "ค่าธรรมเนียมธนาคาร", bank: "350.00", ledger: "—", matched: false },
  { date: "03/09/2569", detail: "รับโอนยอดขายสาขาสีลม", bank: "18,950.00", ledger: "19,850.00", matched: false },
];

function fileSizeLabel(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function BankReconciliationUpload() {
  const [files, setFiles] = useState<SelectedFiles>({ bank: null, ledger: null });
  const ready = Boolean(files.bank && files.ledger);

  const selectFile = (kind: UploadKind, file: File | null) => {
    setFiles((current) => ({ ...current, [kind]: file }));
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        {UPLOADS.map(({ kind, title, hint, icon: Icon, tone }) => {
          const file = files[kind];
          return (
            <section key={kind} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start gap-3">
                <span className="rounded-lg bg-gray-100 p-2 text-gray-600">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-semibold text-gray-900">{title}</h2>
                  <p className="mt-0.5 text-sm text-gray-500">{hint}</p>
                </div>
              </div>

              <label className={`flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-7 text-center transition-colors ${tone}`}>
                {file ? <CheckCircle2 size={32} aria-hidden="true" /> : <UploadCloud size={32} aria-hidden="true" />}
                <span className="mt-3 text-sm font-semibold">{file ? "เลือกไฟล์แล้ว" : "คลิกเพื่อเลือกไฟล์"}</span>
                <span className="mt-1 text-xs opacity-75">รองรับ Excel และ CSV</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="sr-only"
                  onChange={(event) => selectFile(kind, event.target.files?.[0] ?? null)}
                />
              </label>

              <div className="mt-3 min-h-11 rounded-lg bg-gray-50 px-3 py-2 text-sm">
                {file ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate font-medium text-gray-700">{file.name}</span>
                    <span className="shrink-0 text-xs text-gray-400">{fileSizeLabel(file.size)}</span>
                  </div>
                ) : (
                  <span className="text-gray-400">ยังไม่ได้เลือกไฟล์</span>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-gray-900">พร้อมตรวจสอบและจับคู่รายการ</h2>
            <p className="mt-1 text-sm text-gray-500">
              {ready ? "เลือกไฟล์ครบทั้ง 2 ฝั่งแล้ว" : "เลือกไฟล์ธนาคารและไฟล์บัญชีให้ครบก่อนเริ่มกระทบยอด"}
            </p>
          </div>
          <button
            type="button"
            disabled
            className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-500"
            title="ตัวอย่างหน้าจอ — ยังไม่ประมวลผลไฟล์"
          >
            ตรวจสอบและจับคู่
          </button>
        </div>
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          ตัวอย่างหน้าจอ: ไฟล์ยังไม่ถูกอัปโหลดหรือบันทึกเข้าสู่ระบบ และผลตรวจจะไม่ถูกนำไปลงบัญชี
        </p>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-900">ตัวอย่างผลการกระทบยอด</h2>
            <p className="mt-0.5 text-sm text-gray-500">รายการที่ข้อมูลไม่ตรงกันจะแสดงเป็นสีแดงทั้งแถว</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> ตรงกัน
            </span>
            <span className="flex items-center gap-1.5 text-rose-700">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> ไม่ตรงกัน
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">วันที่</th>
                <th className="px-4 py-3 text-left font-medium">รายละเอียด</th>
                <th className="px-4 py-3 text-right font-medium">ยอดธนาคาร</th>
                <th className="px-4 py-3 text-right font-medium">ยอดบัญชี</th>
                <th className="px-4 py-3 text-center font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {PREVIEW_ROWS.map((row) => (
                <tr
                  key={`${row.date}-${row.detail}`}
                  className={row.matched ? "border-t border-gray-100 text-gray-700" : "border-t border-rose-200 bg-rose-50 text-rose-800"}
                >
                  <td className="whitespace-nowrap px-4 py-3">{row.date}</td>
                  <td className="px-4 py-3 font-medium">{row.detail}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{row.bank}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{row.ledger}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${row.matched ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                      {row.matched ? "ตรงกัน" : "ไม่ตรงกัน"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
