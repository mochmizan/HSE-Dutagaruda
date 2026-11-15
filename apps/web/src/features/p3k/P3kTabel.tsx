import React from 'react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { StandardP3kItemDefinition } from '../../lib/p3kItems';
import { KeteranganTeks } from '@/features/pageChrome';
import {
  MONTH_KEYS,
  MONTH_NAMES,
  MONTH_SHORT,
  isMonthFilled,
  markFor,
  type P3kYearGrid,
} from './types';

function fmtTanggal(iso: string): string {
  if (!iso) return '–';
  try {
    return format(parseISO(iso), 'dd-MMM-yy', { locale: idLocale });
  } catch {
    return iso;
  }
}

interface P3kTabelProps {
  grid: P3kYearGrid;
  year: string;
  /** Butir tampil (sudah disaring laman bila saring aktif). */
  items: StandardP3kItemDefinition[];
  onPilihBulan: (bulan: string) => void;
}

/** Grid tahunan 21 butir × 12 bulan, plus baris tanggal inspeksi & paraf.
 *
 * Disiplin tabel Hydrant: sel tengah (`text-center align-middle`), kolom
 * rincian (`ITEM`) rata kiri, kolom `No.` angka posisi gaya NoUrut
 * (mono + tabular, tanpa panah — urutan katalog tetap), sel bulan terisi
 * bertinta seperti baris selesai Hydrant, klik header bulan membuka form
 * (sama seperti klik baris membuka modal di Hydrant).
 */
export const P3kTabel: React.FC<P3kTabelProps> = ({ grid, year, items, onPilihBulan }) => {
  const keteranganFor = (id: number, std: number): string => {
    const kurangMonths: string[] = [];
    const kdMonths: string[] = [];
    MONTH_KEYS.forEach((m, i) => {
      const mark = markFor(id, std, grid[m]);
      if (mark === 'kurang') kurangMonths.push(MONTH_SHORT[i]);
      else if (mark === 'kd') kdMonths.push(MONTH_SHORT[i]);
    });
    const parts: string[] = [];
    if (kdMonths.length) parts.push(`KD: ${kdMonths.join(', ')}`);
    if (kurangMonths.length) parts.push(`Kurang: ${kurangMonths.join(', ')}`);
    return parts.length ? parts.join(' · ') : '–';
  };

  return (
    <div className="overflow-x-auto rounded-[6px] border border-[var(--border)] print:border-black bg-[var(--bg-main)] dark:bg-[var(--bg-main)] print:bg-white shadow-2xs print:shadow-none">
      <table className="w-full border-collapse text-xs print:text-[7px] min-w-[1024px] print:min-w-0 text-center [&_th]:border [&_th]:border-[var(--border)] [&_td]:border [&_td]:border-[var(--border)] print:[&_th]:border-black print:[&_td]:border-black">
        <thead>
          <tr className="border-b border-[var(--border)] print:border-black bg-[var(--bg-sidebar)]/80 print:bg-white text-[10px] print:text-[7px] font-semibold text-[var(--muted)] print:text-black uppercase tracking-wider">
            <th className="py-2.5 px-3 print:py-0.5 print:px-1 w-16 text-center align-middle">No.</th>
            <th className="py-2.5 px-3 print:py-0.5 print:px-1 min-w-[224px] text-center align-middle">Item</th>
            <th className="py-2.5 px-3 print:py-0.5 print:px-1 text-center align-middle">Jumlah Standar</th>
            {MONTH_KEYS.map((m, i) => (
              <th key={m} className="py-1 px-1 text-center align-middle print:py-0.5">
                <button
                  type="button"
                  onClick={() => onPilihBulan(m)}
                  title={`Isi ${MONTH_NAMES[i]} ${year}`}
                  className="no-print inline-flex items-center gap-1 font-bold hover:text-[#27ae60] pressable cursor-pointer tabular-nums"
                >
                  {MONTH_SHORT[i]}
                  {isMonthFilled(grid[m]) && (
                    <span className="text-[8px] text-[#27ae60] font-bold">●</span>
                  )}
                </button>
                <span className="hidden print:inline tabular-nums">{MONTH_SHORT[i]}</span>
              </th>
            ))}
            <th className="py-2.5 px-3 print:py-0.5 print:px-1 min-w-[184px] text-center align-middle">Keterangan</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)] text-xs">
          {items.map((item, idx) => (
            <tr
              key={item.id}
              className="transition-colors hover:bg-[var(--bg-hover)]/60 print:hover:bg-white"
            >
              <td className="py-2.5 px-3 print:py-[1px] print:px-1 text-center align-middle font-mono text-[var(--muted)] tabular-nums">
                <span className="font-mono tabular-nums w-4 text-right inline-block">{idx + 1}</span>
              </td>
              <td className="py-2.5 px-3 print:py-[1px] print:px-1 text-left align-middle text-[var(--primary)] print:whitespace-nowrap">
                {item.name}
                <span className="block text-[10px] print:text-[6px] text-[var(--muted)] tabular-nums">
                  Standar: {item.standardQty} {item.unit}
                </span>
              </td>
              <td className="py-2.5 px-3 print:py-[1px] print:px-1 text-center align-middle tabular-nums text-[var(--secondary)]">
                {item.standardQty}
              </td>
              {MONTH_KEYS.map((m) => {
                const mark = markFor(item.id, item.standardQty, grid[m]);
                return (
                  <td
                    key={m}
                    className={`py-2.5 px-1 print:py-[1px] text-center align-middle tabular-nums font-semibold ${
                      mark === 'standar'
                        ? 'bg-emerald-500/[0.10] dark:bg-emerald-500/[0.16]'
                        : mark === 'kurang' || mark === 'kd'
                          ? 'bg-red-500/[0.07]'
                          : ''
                    }`}
                  >
                    {mark === 'standar' ? (
                      <span className="text-emerald-600 dark:text-emerald-400">√</span>
                    ) : mark === 'kurang' ? (
                      <span className="text-red-600 dark:text-red-400">×</span>
                    ) : mark === 'kd' ? (
                      <span className="text-red-600 dark:text-red-400 font-bold">KD</span>
                    ) : (
                      <span className="font-normal text-[var(--muted)]">–</span>
                    )}
                  </td>
                );
              })}
              <td className="py-2.5 px-3 print:py-[1px] print:px-1 align-middle text-[11px] print:text-[6px] text-[var(--secondary)] print:leading-tight">
                <KeteranganTeks teks={keteranganFor(item.id, item.standardQty)} />
              </td>
            </tr>
          ))}
          <tr className="border-t border-[var(--border)] print:border-black bg-[var(--bg-sidebar)]/50 print:bg-white">
            <td colSpan={3} className="py-2.5 px-3 text-center align-middle text-[10px] print:text-[7px] font-bold text-[var(--primary)] print:text-black print:py-0.5 print:px-1 uppercase tracking-wider">
              Tanggal Inspeksi
            </td>
            {MONTH_KEYS.map((m) => (
              <td
                key={m}
                className="py-2.5 px-1 text-center align-middle text-[10px] print:text-[7px] tabular-nums text-[var(--secondary)] print:py-0.5 print:whitespace-nowrap"
              >
                {fmtTanggal(grid[m]?.tanggal ?? '')}
              </td>
            ))}
            <td className="py-2.5 px-3 text-center align-middle text-[var(--muted)] print:py-0.5">–</td>
          </tr>
          <tr className="border-t border-[var(--border)] print:border-black bg-[var(--bg-sidebar)]/50 print:bg-white">
            <td colSpan={3} className="py-2.5 px-3 text-center align-middle text-[10px] print:text-[7px] font-bold text-[var(--primary)] print:text-black print:py-0.5 print:px-1 uppercase tracking-wider">
              Paraf &amp; Inisial
            </td>
            {MONTH_KEYS.map((m) => (
              <td
                key={m}
                className="py-2.5 px-1 text-center align-middle text-[10px] print:text-[7px] text-[var(--secondary)] print:py-0.5"
              >
                {grid[m]?.paraf?.trim() ? grid[m]?.paraf : '–'}
              </td>
            ))}
            <td className="py-2.5 px-3 text-center align-middle text-[var(--muted)] print:py-0.5">–</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
