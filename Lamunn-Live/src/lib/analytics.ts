import { slotHours, timeToMinutes } from "@/lib/format";

/** แถวข้อมูล 1 ช่วงเวลา (flatten จาก LiveSlot + LiveSession + Streamer + Channel) */
export interface SlotRow {
  id: string;
  date: Date;
  dow: number; // 0=อาทิตย์
  hour: number; // ชั่วโมงกึ่งกลางของช่วง (0-23) ใช้จัดกลุ่ม "ช่วงเวลา"
  hours: number; // ระยะเวลาของช่วง (ชั่วโมง) — ใช้เป็นน้ำหนักถ่วง
  startTime: string;
  endTime: string;
  streamerId: string;
  streamerName: string;
  channelId: string | null;
  channelName: string;
  viewers: number | null; // ไม่บังคับกรอก — ช่วงที่ไม่มีตัวเลขจะไม่ถูกนับในค่าเฉลี่ยคนดู แต่ยังนับชั่วโมง/ยอดขาย
  peakViewers: number | null;
  sales: number;
  orders: number | null;
}

interface SlotInput {
  id: string;
  startTime: string;
  endTime: string;
  viewers: number | null;
  peakViewers: number | null;
  sales: number;
  orders: number | null;
  streamer: { id: string; name: string };
  session: { date: Date; channelId: string | null; channel: { name: string } | null };
}

export function toRows(slots: SlotInput[]): SlotRow[] {
  return slots.map((s) => {
    const h = slotHours(s.startTime, s.endTime);
    const startMin = timeToMinutes(s.startTime) ?? 0;
    const mid = (startMin + (h * 60) / 2) % (24 * 60);
    return {
      id: s.id,
      date: s.session.date,
      dow: s.session.date.getUTCDay(),
      hour: Math.floor(mid / 60),
      hours: h > 0 ? h : 0.25, // ช่วงที่ start=end ให้น้ำหนักน้อย ๆ แทนที่จะเป็นศูนย์
      startTime: s.startTime,
      endTime: s.endTime,
      streamerId: s.streamer.id,
      streamerName: s.streamer.name,
      channelId: s.session.channelId,
      channelName: s.session.channel?.name ?? "ไม่ระบุช่องทาง",
      viewers: s.viewers,
      peakViewers: s.peakViewers,
      sales: s.sales,
      orders: s.orders,
    };
  });
}

export interface GroupStat {
  key: string;
  label: string;
  slots: number;
  hours: number;
  avgViewers: number; // ถ่วงน้ำหนักด้วยชั่วโมง (เฉพาะช่วงที่มีตัวเลขคนดู)
  viewerHours: number; // ชั่วโมงที่มีตัวเลขคนดู
  peakViewers: number | null;
  totalSales: number;
  salesPerHour: number;
  orders: number;
}

function emptyStat(key: string, label: string): GroupStat {
  return { key, label, slots: 0, hours: 0, avgViewers: 0, viewerHours: 0, peakViewers: null, totalSales: 0, salesPerHour: 0, orders: 0 };
}

function peakOf(r: SlotRow): number | null {
  return r.peakViewers ?? r.viewers;
}

function groupBy(rows: SlotRow[], keyOf: (r: SlotRow) => string, labelOf: (r: SlotRow) => string): GroupStat[] {
  const acc = new Map<string, GroupStat & { _vw: number }>();
  for (const r of rows) {
    const k = keyOf(r);
    let g = acc.get(k);
    if (!g) {
      g = { ...emptyStat(k, labelOf(r)), _vw: 0 };
      acc.set(k, g);
    }
    g.slots += 1;
    g.hours += r.hours;
    if (r.viewers !== null) {
      g.viewerHours += r.hours;
      g._vw += r.viewers * r.hours;
    }
    g.totalSales += r.sales;
    g.orders += r.orders ?? 0;
    const pk = peakOf(r);
    if (pk !== null) g.peakViewers = g.peakViewers === null ? pk : Math.max(g.peakViewers, pk);
  }
  return Array.from(acc.values()).map(({ _vw, ...g }) => ({
    ...g,
    avgViewers: g.viewerHours > 0 ? _vw / g.viewerHours : 0,
    salesPerHour: g.hours > 0 ? g.totalSales / g.hours : 0,
  }));
}

export interface StreamerStat extends GroupStat {
  expectedViewers: number; // คนดูที่ "ควรจะได้" ตามช่วงเวลาที่คนนี้ไลฟ์ (baseline จากคนอื่นในช่วงเดียวกัน)
  index: number | null; // avgViewers / expectedViewers — >1 = ดึงคนดูได้ดีกว่าค่าเฉลี่ยของช่วงเวลานั้น
  comparable: boolean; // มีข้อมูลคนอื่นในช่วงเวลาเดียวกันให้เทียบหรือไม่
  days: number; // จำนวนวันที่ไลฟ์
}

export interface HeatCell {
  avgViewers: number;
  slots: number;
  hours: number;
  totalSales: number;
}

export interface Analysis {
  totals: {
    slots: number;
    sessions: number;
    days: number;
    hours: number;
    avgViewers: number;
    peakViewers: number | null;
    totalSales: number;
    salesPerHour: number;
    orders: number;
  };
  byHour: GroupStat[]; // ครบ 24 ชั่วโมง (ที่ไม่มีข้อมูล slots=0)
  byDow: GroupStat[]; // 7 วัน
  byStreamer: StreamerStat[]; // เรียงตาม index มาก -> น้อย
  byChannel: GroupStat[];
  streamerHour: Map<string, HeatCell>; // key `${streamerId}|${hour}`
  dowHour: Map<string, HeatCell>; // key `${dow}|${hour}`
  decomposition: { hour: number; streamer: number; dow: number; n: number }; // สัดส่วนความแปรปรวนของยอดคนดูที่อธิบายได้ (eta squared, 0-1)
}

const HOUR_LABEL = (h: number) => `${String(h).padStart(2, "0")}:00`;
export const DOW_LABEL = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์", "เสาร์"];

function fillSeries(stats: GroupStat[], keys: string[], labelOf: (k: string) => string): GroupStat[] {
  const map = new Map(stats.map((s) => [s.key, s]));
  return keys.map((k) => map.get(k) ?? emptyStat(k, labelOf(k)));
}

/** heatmap นับเฉพาะช่วงที่มีตัวเลขคนดู */
function heat(rows: SlotRow[], keyOf: (r: SlotRow) => string): Map<string, HeatCell> {
  const acc = new Map<string, HeatCell & { _vw: number }>();
  for (const r of rows) {
    if (r.viewers === null) continue;
    const k = keyOf(r);
    let c = acc.get(k);
    if (!c) {
      c = { avgViewers: 0, slots: 0, hours: 0, totalSales: 0, _vw: 0 };
      acc.set(k, c);
    }
    c.slots += 1;
    c.hours += r.hours;
    c._vw += r.viewers * r.hours;
    c.totalSales += r.sales;
  }
  const out = new Map<string, HeatCell>();
  acc.forEach(({ _vw, ...c }, k) => out.set(k, { ...c, avgViewers: c.hours > 0 ? _vw / c.hours : 0 }));
  return out;
}

type ViewerRow = SlotRow & { viewers: number };

/** สัดส่วนความแปรปรวน (ถ่วงน้ำหนักชั่วโมง) ของยอดคนดูที่ปัจจัยหนึ่งอธิบายได้ — eta squared */
function etaSquared(rows: ViewerRow[], keyOf: (r: SlotRow) => string): number {
  const W = rows.reduce((a, r) => a + r.hours, 0);
  if (W === 0) return 0;
  const mean = rows.reduce((a, r) => a + r.viewers * r.hours, 0) / W;
  const ssTotal = rows.reduce((a, r) => a + r.hours * (r.viewers - mean) ** 2, 0);
  if (ssTotal === 0) return 0;
  const groups = new Map<string, { w: number; vw: number }>();
  for (const r of rows) {
    const g = groups.get(keyOf(r)) ?? { w: 0, vw: 0 };
    g.w += r.hours;
    g.vw += r.viewers * r.hours;
    groups.set(keyOf(r), g);
  }
  let ssBetween = 0;
  groups.forEach((g) => {
    const gm = g.vw / g.w;
    ssBetween += g.w * (gm - mean) ** 2;
  });
  return Math.min(1, ssBetween / ssTotal);
}

export function analyze(rows: SlotRow[]): Analysis {
  const viewerRows = rows.filter((r): r is ViewerRow => r.viewers !== null);
  const hours = rows.reduce((a, r) => a + r.hours, 0);
  const viewerHours = viewerRows.reduce((a, r) => a + r.hours, 0);
  const vw = viewerRows.reduce((a, r) => a + r.viewers * r.hours, 0);
  const totalSales = rows.reduce((a, r) => a + r.sales, 0);
  const peak = rows.reduce<number | null>((a, r) => {
    const pk = peakOf(r);
    if (pk === null) return a;
    return a === null ? pk : Math.max(a, pk);
  }, null);
  const dayKeys = new Set(rows.map((r) => r.date.toISOString().slice(0, 10)));
  const sessionKeys = new Set(rows.map((r) => `${r.date.toISOString().slice(0, 10)}|${r.channelId ?? ""}`));

  const byHourRaw = groupBy(rows, (r) => String(r.hour), (r) => HOUR_LABEL(r.hour));
  const byHour = fillSeries(byHourRaw, Array.from({ length: 24 }, (_, i) => String(i)), (k) => HOUR_LABEL(Number(k)));
  const byDow = fillSeries(
    groupBy(rows, (r) => String(r.dow), (r) => DOW_LABEL[r.dow]),
    ["0", "1", "2", "3", "4", "5", "6"],
    (k) => DOW_LABEL[Number(k)]
  );
  const byChannel = groupBy(rows, (r) => r.channelId ?? "none", (r) => r.channelName).sort((a, b) => b.hours - a.hours);

  // baseline ต่อชั่วโมง "ไม่รวมคนไลฟ์คนนั้น" — ตอบคำถามว่าคนดูมาเพราะเวลา หรือเพราะคนไลฟ์ (ใช้เฉพาะช่วงที่มีตัวเลขคนดู)
  const hourTotals = new Map<string, { w: number; vw: number }>();
  const hourByStreamer = new Map<string, { w: number; vw: number }>();
  for (const r of viewerRows) {
    const h = String(r.hour);
    const t = hourTotals.get(h) ?? { w: 0, vw: 0 };
    t.w += r.hours;
    t.vw += r.viewers * r.hours;
    hourTotals.set(h, t);
    const sk = `${r.streamerId}|${h}`;
    const s = hourByStreamer.get(sk) ?? { w: 0, vw: 0 };
    s.w += r.hours;
    s.vw += r.viewers * r.hours;
    hourByStreamer.set(sk, s);
  }
  /** คนดูเฉลี่ยของ "คนอื่น" ในชั่วโมง h (null ถ้าไม่มีใครไลฟ์ชั่วโมงนั้นนอกจากคนนี้) */
  const othersAtHour = (streamerId: string, h: number): number | null => {
    if (h < 0 || h > 23) return null;
    const t = hourTotals.get(String(h));
    if (!t) return null;
    const s = hourByStreamer.get(`${streamerId}|${h}`) ?? { w: 0, vw: 0 };
    const othersW = t.w - s.w;
    return othersW > 0 ? (t.vw - s.vw) / othersW : null;
  };

  const streamerBase = groupBy(rows, (r) => r.streamerId, (r) => r.streamerName);
  const byStreamer: StreamerStat[] = streamerBase.map((g) => {
    const own = rows.filter((r) => r.streamerId === g.key);
    // เทียบเฉพาะช่วงที่มี "คนอื่น" ไลฟ์ในชั่วโมงเดียวกัน (หรือชั่วโมงติดกัน) — ช่วงที่ไม่มีใครให้เทียบจะไม่ถูกนับ
    let ownW = 0;
    let ownV = 0;
    let expV = 0;
    for (const r of own) {
      if (r.viewers === null) continue;
      let baseline = othersAtHour(g.key, r.hour);
      if (baseline === null) {
        const prev = othersAtHour(g.key, r.hour - 1);
        const next = othersAtHour(g.key, r.hour + 1);
        if (prev !== null && next !== null) baseline = (prev + next) / 2;
        else baseline = prev ?? next;
      }
      if (baseline === null) continue;
      ownW += r.hours;
      ownV += r.viewers * r.hours;
      expV += baseline * r.hours;
    }
    const comparable = ownW > 0;
    const expectedViewers = comparable ? expV / ownW : 0;
    const index = comparable && expectedViewers > 0 ? ownV / ownW / expectedViewers : null;
    const days = new Set(own.map((r) => r.date.toISOString().slice(0, 10))).size;
    return { ...g, expectedViewers, index, comparable, days };
  });
  byStreamer.sort((a, b) => {
    if (a.index !== null && b.index !== null) return b.index - a.index;
    if (a.index !== null) return -1;
    if (b.index !== null) return 1;
    return b.avgViewers - a.avgViewers;
  });

  return {
    totals: {
      slots: rows.length,
      sessions: sessionKeys.size,
      days: dayKeys.size,
      hours,
      avgViewers: viewerHours > 0 ? vw / viewerHours : 0,
      peakViewers: peak,
      totalSales,
      salesPerHour: hours > 0 ? totalSales / hours : 0,
      orders: rows.reduce((a, r) => a + (r.orders ?? 0), 0),
    },
    byHour,
    byDow,
    byStreamer,
    byChannel,
    streamerHour: heat(rows, (r) => `${r.streamerId}|${r.hour}`),
    dowHour: heat(rows, (r) => `${r.dow}|${r.hour}`),
    decomposition: {
      hour: etaSquared(viewerRows, (r) => String(r.hour)),
      streamer: etaSquared(viewerRows, (r) => r.streamerId),
      dow: etaSquared(viewerRows, (r) => String(r.dow)),
      n: viewerRows.length,
    },
  };
}
