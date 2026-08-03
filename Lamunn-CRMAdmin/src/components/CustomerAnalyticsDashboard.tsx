"use client";

type Point = { label: string; value: number };

// Validated categorical palette (see dataviz skill) — fixed hue order, never cycled.
const CATEGORICAL = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];
const SEQUENTIAL_BLUE = "#2a78d6";

function DonutChart({ title, data }: { title: string; data: Point[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = 70;
  const stroke = 28;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">{title}</h3>
      {total === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">ยังไม่มีข้อมูล</p>
      ) : (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <svg viewBox="0 0 180 180" className="h-40 w-40 shrink-0 -rotate-90">
            {data.map((d, i) => {
              if (d.value === 0) return null;
              const fraction = d.value / total;
              const dash = fraction * circumference;
              const el = (
                <circle
                  key={d.label}
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  stroke={CATEGORICAL[i % CATEGORICAL.length]}
                  strokeWidth={stroke}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                >
                  <title>{`${d.label}: ${d.value.toLocaleString("th-TH")} (${(fraction * 100).toFixed(1)}%)`}</title>
                </circle>
              );
              offset += dash;
              return el;
            })}
            <circle cx="90" cy="90" r={radius - stroke / 2 - 2} fill="white" />
          </svg>
          <div className="flex flex-1 flex-col gap-1.5">
            {data.map((d, i) => (
              <div key={d.label} className="flex items-center justify-between gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CATEGORICAL[i % CATEGORICAL.length] }} />
                  {d.label}
                </span>
                <span className="font-medium text-gray-800">
                  {d.value.toLocaleString("th-TH")} {total > 0 && <span className="text-gray-400">({((d.value / total) * 100).toFixed(0)}%)</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LineChart({ title, data }: { title: string; data: Point[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 600;
  const h = 180;
  const padL = 30;
  const padB = 24;
  const plotW = w - padL - 10;
  const plotH = h - padB - 10;
  const stepX = data.length > 1 ? plotW / (data.length - 1) : 0;
  const points = data.map((d, i) => ({
    x: padL + i * stepX,
    y: 10 + plotH - (d.value / max) * plotH,
    ...d,
  }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${10 + plotH} L ${points[0].x} ${10 + plotH} Z`;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">{title}</h3>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        {[0, 0.5, 1].map((t) => (
          <line key={t} x1={padL} x2={w - 10} y1={10 + plotH * t} y2={10 + plotH * t} stroke="#e1e0d9" strokeWidth={1} />
        ))}
        <path d={areaPath} fill={SEQUENTIAL_BLUE} opacity={0.12} />
        <path d={linePath} fill="none" stroke={SEQUENTIAL_BLUE} strokeWidth={2} />
        {points.map((p) => (
          <circle key={p.label} cx={p.x} cy={p.y} r={4} fill={SEQUENTIAL_BLUE}>
            <title>{`${p.label}: ${p.value.toLocaleString("th-TH")}`}</title>
          </circle>
        ))}
        <text x={padL} y={h - 6} fontSize="9" fill="#898781">
          {data[0]?.label}
        </text>
        <text x={w - 10} y={h - 6} fontSize="9" fill="#898781" textAnchor="end">
          {data[data.length - 1]?.label}
        </text>
      </svg>
    </div>
  );
}

function OrderedBarChart({ title, data }: { title: string; data: Point[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">{title}</h3>
      <div className="flex h-40 items-end gap-1.5">
        {data.map((d) => (
          <div key={d.label} className="group relative flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t"
              style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 2 : 0, backgroundColor: SEQUENTIAL_BLUE }}
              title={`${d.label}: ${d.value.toLocaleString("th-TH")}`}
            />
            <span className="text-[10px] text-gray-400">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankedList({ title, data }: { title: string; data: Point[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">{title}</h3>
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">ยังไม่มีข้อมูล</p>
      ) : (
        <div className="flex flex-col gap-2">
          {data.map((d, i) => (
            <div key={`${d.label}-${i}`} className="flex items-center gap-2 text-xs">
              <span className="w-5 shrink-0 text-gray-400">{i + 1}</span>
              <span className="w-28 shrink-0 truncate text-gray-700">{d.label}</span>
              <div className="h-4 flex-1 overflow-hidden rounded bg-gray-100">
                <div className="h-full rounded" style={{ width: `${(d.value / max) * 100}%`, backgroundColor: SEQUENTIAL_BLUE }} />
              </div>
              <span className="w-14 shrink-0 text-right font-medium text-gray-800">{d.value.toLocaleString("th-TH")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CustomerAnalyticsDashboard({
  totalCustomers,
  signupTrend,
  activityRecency,
  genderStats,
  ageStats,
  birthMonthStats,
  topCustomers,
  topRewards,
}: {
  totalCustomers: number;
  signupTrend: Point[];
  activityRecency: Point[];
  genderStats: Point[];
  ageStats: Point[];
  birthMonthStats: Point[];
  topCustomers: Point[];
  topRewards: Point[];
}) {
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-800">Dashboard ข้อมูลลูกค้า</h1>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-500">ยอดสมาชิกทั้งหมด</p>
        <p className="text-3xl font-bold text-brand-700">{totalCustomers.toLocaleString("th-TH")} คน</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LineChart title="สมาชิกใหม่รายเดือน (12 เดือนล่าสุด)" data={signupTrend} />
        <DonutChart title="ความถี่ในการใช้งาน (ซื้อล่าสุด)" data={activityRecency} />
        <DonutChart title="สถิติเพศ" data={genderStats} />
        <DonutChart title="ช่วงอายุ" data={ageStats} />
        <OrderedBarChart title="สถิติเดือนเกิด" data={birthMonthStats} />
        <div />
        <RankedList title="สมาชิกที่มีแต้มสะสมสูงสุด" data={topCustomers} />
        <RankedList title="รางวัลที่แลกมากที่สุด" data={topRewards} />
      </div>
    </div>
  );
}
