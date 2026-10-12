/** P3K yearly grid types. One grid per box per year. */

export const MONTH_KEYS = [
  '01', '02', '03', '04', '05', '06',
  '07', '08', '09', '10', '11', '12',
];

export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export const MONTH_SHORT = [
  'JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN',
  'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES',
];

export interface P3kMonthItemData {
  /** Actual counted quantity. '' means not yet inspected. */
  actual: number | '';
  expired: boolean;
}

export interface P3kMonthData {
  items: Record<number, P3kMonthItemData>;
  /** ISO date (yyyy-mm-dd) from the modal date input. */
  tanggal: string;
  paraf: string;
}

export type P3kYearGrid = Partial<Record<string, P3kMonthData>>;

export function emptyMonth(): P3kMonthData {
  return { items: {}, tanggal: '', paraf: '' };
}

/** Cell mark: √ in Standar col, √ in Di-Bawah col, KD if expired, empty if not inspected. */
export type P3kMark = 'standar' | 'kurang' | 'kd' | 'empty';

export function markFor(
  itemId: number,
  standardQty: number,
  month: P3kMonthData | undefined
): P3kMark {
  const it = month?.items[itemId];
  if (!it || it.actual === '') return 'empty';
  if (it.expired) return 'kd';
  return it.actual >= standardQty ? 'standar' : 'kurang';
}

export function isMonthFilled(month: P3kMonthData | undefined): boolean {
  if (!month) return false;
  if (month.tanggal || month.paraf.trim()) return true;
  return Object.values(month.items).some((it) => it.actual !== '' || it.expired);
}
