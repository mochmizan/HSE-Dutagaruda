import React from 'react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { P3kBoxType, StandardP3kItemDefinition } from '../../lib/p3kItems';
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
  boxType?: P3kBoxType;
  /** Butir tampil (sudah disesuaikan standardQty sesuai Tipe A/B/C). */
  items: StandardP3kItemDefinition[];
  onPilihBulan: (bulan: string) => void;
}

/**
 * Grid tahunan 21 butir × 12 bulan sesuai tabel standar Kotak A / B / C.
 */
export const P3kTabel: React.FC<P3kTabelProps> = ({
  grid,
  year,
  boxType = 'A',
  items,
  onPilihBulan,
}) => {
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
            <th className="py-2.5 px-3 print:py-0.5 print:px-1 w-14 text-center align-middle">No.</th>
            <th className="py-2.5 px-3 print:py-0.5 print:px-1 min-w-[230px] text-center align-middle">
              Isi Kotak P3K
            </th>
            <th className="py-2.5 px-3 print:py-0.5 print:px-1 text-center align-middle">
              Standar Kotak {boxType}
            </th>
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
            <th className="py-2.5 px-3 print:py-0.5 print:px-1 min-w-[180px] text-center align-middle">
              Keterangan
            </th>
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
              <td className="py-2.5 px-3 print:py-[1px] print:px-1.5 text-left align-middle font-semibold text-[var(--primary)] print:text-black">
                {item.displayName || item.name}
              </td>
              <td className="py-2.5 px-3 print:py-[1px] print:px-1 text-center align-middle font-mono font-semibold text-[var(--primary)] print:text-black tabular-nums">
                {item.standardQty}
              </td>
              {MONTH_KEYS.map((m, i) => {
                const mark = markFor(item.id, item.standardQty, grid[m]);
                return (
                  <td
                    key={m}
                    onClick={() => onPilihBulan(m)}
                    title={`${item.displayName || item.name} — ${MONTH_NAMES[i]} ${year}`}
                    className={`py-2.5 px-1 print:py-[1px] text-center align-middle font-mono font-bold tabular-nums cursor-pointer ${
                      mark === 'kd'
                        ? 'bg-[#eb5757]/[0.14] dark:bg-[#eb5757]/[0.2] print:bg-white text-red-600 dark:text-red-400 print:text-red-600'
                        : mark === 'kurang'
                        ? 'bg-amber-500/[0.12] dark:bg-amber-500/[0.18] print:bg-white text-amber-600 dark:text-amber-400 print:text-black'
                        : mark === 'standar'
                        ? 'bg-emerald-500/[0.08] dark:bg-emerald-500/[0.14] print:bg-white text-emerald-600 dark:text-emerald-400 print:text-black'
                        : 'text-[var(--muted)] print:text-black'
                    }`}
                  >
                    {mark === 'standar' ? '√' : mark === 'kurang' ? '×' : mark === 'kd' ? 'KD' : ''}
                  </td>
                );
              })}
              <td className="py-2.5 px-3 print:py-[1px] print:px-1.5 align-middle text-[11px] print:text-[6.5px] text-[var(--secondary)] print:text-black">
                <KeteranganTeks teks={keteranganFor(item.id, item.standardQty)} />
              </td>
            </tr>
          ))}

          {/* Baris Tanggal Inspeksi */}
          <tr className="bg-[var(--bg-sidebar)]/60 print:bg-white font-semibold">
            <td
              colSpan={3}
              className="py-2 px-3 print:py-0.5 print:px-1.5 text-center align-middle uppercase tracking-wider text-[10px] print:text-[6.5px] text-[var(--primary)] print:text-black"
            >
              Tanggal Inspeksi
            </td>
            {MONTH_KEYS.map((m) => (
              <td
                key={m}
                onClick={() => onPilihBulan(m)}
                className="py-2 px-1 print:py-0.5 text-center align-middle font-mono text-[10px] print:text-[6px] text-[var(--secondary)] print:text-black tabular-nums cursor-pointer"
              >
                {fmtTanggal(grid[m]?.tanggal ?? '')}
              </td>
            ))}
            <td className="py-2 px-3 print:py-0.5 text-center align-middle text-[var(--muted)] print:text-black">
              –
            </td>
          </tr>

          {/* Baris Petugas Pemeriksa & Paraf */}
          <tr className="bg-[var(--bg-sidebar)]/60 print:bg-white font-semibold">
            <td
              colSpan={3}
              className="py-2 px-3 print:py-0.5 print:px-1.5 text-center align-middle uppercase tracking-wider text-[10px] print:text-[6.5px] text-[var(--primary)] print:text-black"
            >
              Petugas Pemeriksa / Paraf
            </td>
            {MONTH_KEYS.map((m) => (
              <td
                key={m}
                onClick={() => onPilihBulan(m)}
                className="py-2 px-1 print:py-0.5 text-center align-middle text-[10px] print:text-[6px] text-[var(--primary)] print:text-black truncate max-w-[64px] cursor-pointer"
              >
                {grid[m]?.paraf || '–'}
              </td>
            ))}
            <td className="py-2 px-3 print:py-0.5 text-center align-middle text-[var(--muted)] print:text-black">
              –
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
