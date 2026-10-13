/**
 * Pemetaan API P3K → grid tahunan UI (21 item × 12 bulan).
 * Satu kotak per lokasi; inspeksi bulan muncul bila sudah dibuat di API.
 */

import * as k from '@/services/api/klien';
import { periodeBaris } from '@/services/api/queries';
import { STANDARD_P3K_ITEMS } from '@/lib/p3kItems';
import type { P3kYearGrid, P3kMonthData } from './types';

/** Grid tahunan per kotak P3K (kunci id kotak). */
export function petakanGridP3k(
  kotak: k.ApiP3kBox[],
  inspeksi: k.ApiInspeksiP3k[],
  tahun: string,
): Record<string, P3kYearGrid> {
  const hasil: Record<string, P3kYearGrid> = {};
  for (const box of kotak) {
    const grid: P3kYearGrid = {};
    for (const insp of inspeksi) {
      if (insp.boxId !== box.id) continue;
      if (periodeBaris(insp.period) !== `${tahun}-12` && insp.period.slice(0, 4) !== tahun) continue;
      const bulan = periodeBaris(insp.period).slice(5, 7);
      const items: P3kMonthData['items'] = {};
      for (const it of insp.items ?? []) {
        const idx = STANDARD_P3K_ITEMS.findIndex((s) => s.name === it.itemName);
        if (idx < 0) continue;
        items[STANDARD_P3K_ITEMS[idx].id] = {
          actual: it.actualQty,
          expired: it.status === 'KADALUARSA',
        };
      }
      grid[bulan] = {
        items,
        tanggal: insp.inspectionDate ?? insp.createdAt.slice(0, 10),
        paraf: insp.paraf ?? '',
      };
    }
    hasil[box.id] = grid;
  }
  return hasil;
}
