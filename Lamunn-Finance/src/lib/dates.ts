/** Parses a "yyyy-mm-dd" string into a UTC-midnight Date (matches Postgres @db.Date columns). */
export function parseDateOnly(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function monthRange(year: number, monthIndex0: number): { start: Date; end: Date } {
  const start = new Date(Date.UTC(year, monthIndex0, 1));
  const end = new Date(Date.UTC(year, monthIndex0 + 1, 0));
  return { start, end };
}
