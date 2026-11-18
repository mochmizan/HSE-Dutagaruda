/**
 * Pemetaan API P3K → grid tahunan UI (21 item × 12 bulan).
 * Mendukung multi-kotak per lokasi (Lantai 2 Tipe A, Lantai 3 Tipe B, Tipe C).
 */

import * as k from '@/services/api/klien';
import { periodeBaris } from '@/services/api/queries';
import { matchP3kCatalogItem, STANDARD_P3K_ITEMS } from '@/lib/p3kItems';
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
        const matched =
          matchP3kCatalogItem(it.itemName) ??
          STANDARD_P3K_ITEMS.find((s) => s.name === it.itemName);
        if (!matched) continue;
        items[matched.id] = {
          actual: it.status === 'DIBAWAH_STANDAR' ? 0 : it.actualQty,
          expired: it.status === 'KADALUARSA',
        };
      }
      grid[bulan] = {
        items,
        tanggal: insp.inspectionDate ?? insp.createdAt.slice(0, 10),
        paraf: insp.paraf ?? 'Takamay Jason Hermantika Irsyad',
      };
    }
    hasil[box.id] = grid;
  }
  return hasil;
}
