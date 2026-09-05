// Shared helpers for the analytics engine and AI layer.

export const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

export const toPct = (v: number): string => `${Math.round(v * 100)}%`;

export const round1 = (v: number): number => Math.round(v * 10) / 10;
export const round0 = (v: number): number => Math.round(v);

export function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

export function keyBy<K extends string, V>(
  items: K[],
  valueOf: (k: K) => V
): Record<string, V> {
  const out: Record<string, V> = {};
  for (const k of items) out[k] = valueOf(k);
  return out;
}

/** Safe integer formatting with commas. */
export const fmtInt = (n: number): string =>
  Math.round(n).toLocaleString('en-US');

/** "YYYY-MM-DD" -> "Jan 2024" style month label. */
export function monthLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function yearMonth(ts: number): string {
  const d = new Date(ts);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function daysBetween(a: string | number, b: string | number): number {
  const t1 = typeof a === 'number' ? a : new Date(a).getTime();
  const t2 = typeof b === 'number' ? b : new Date(b).getTime();
  return Math.max(0, Math.floor((t2 - t1) / 86_400_000));
}

/** Human readable "Xy Xm" span. */
export function fmtAge(days: number): string {
  if (days < 30) return `${Math.max(1, days)}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  const y = Math.floor(days / 365);
  const m = Math.floor((days % 365) / 30);
  return m > 0 ? `${y}y ${m}mo` : `${y}y`;
}

export function toKey(dateStr: string | number): string {
  const ts = typeof dateStr === 'number' ? dateStr : new Date(dateStr).getTime();
  return new Date(ts).toISOString().slice(0, 10);
}

export const DAY = 86_400_000;