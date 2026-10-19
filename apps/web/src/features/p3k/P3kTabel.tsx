import React from 'react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { STANDARD_P3K_ITEMS } from '../../lib/p3kItems';
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
  onPilihBulan: (bulan: string) => void;
}

/** Grid tahunan 21 butir × 12 bulan, plus baris tanggal inspeksi & paraf. */
export const P3kTabel: React.FC<P3kTabelProps> = ({ grid, year, onPilihBulan }) => {
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
    <div className="overflow-x-auto border border-[var(--border)] print:border-black bg-[var(--bg-main)] dark:bg-[var(--bg-main)] print:bg-white shadow-2xs print:shadow-none rounded-[6px] print:rounded-none">
      <table className="w-full border-collapse text-xs print:text-[7px] min-w-[1024px] print:min-w-0">
        <thead>
          <tr className="border-b border-[var(--border)] print:border-black bg-[var(--bg-sidebar)]/80 print:bg-white text-[10px] print:text-[7px] font-bold text-[var(--primary)] print:text-black">
            <th className="py-1.5 px-2 text-center align-middle print:py-0.5 print:px-1">NO.</th>
            <th className="py-1.5 px-2 text-center align-middle print:py-0.5 print:px-1">ITEM</th>
            <th className="py-1.5 px-2 text-center align-middle print:py-0.5 print:px-1">JUMLAH STANDAR</th>
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
            <th className="py-1.5 px-2 text-center align-middle print:py-0.5 print:px-1">KETERANGAN</th>
          </tr>
        </thead>
        <tbody>
          {STANDARD_P3K_ITEMS.map((item) => (
            <tr
              key={item.id}
              className="border-b border-[var(--border)]/60 print:border-black last:border-none"
            >
              <td className="py-1 px-2 text-center align-middle tabular-nums text-[var(--secondary)] print:py-[1px] print:px-1">
                {item.id}
              </td>
              <td className="py-1 px-2 text-left align-middle text-[var(--primary)] print:py-[1px] print:px-1 print:whitespace-nowrap">
                {item.name}
              </td>
              <td className="py-1 px-2 text-center align-middle tabular-nums text-[var(--secondary)] print:py-[1px] print:px-1">
                {item.standardQty}
              </td>
              {MONTH_KEYS.map((m) => {
                const mark = markFor(item.id, item.standardQty, grid[m]);
                return (
                  <td
                    key={m}
                    className={`py-1 px-1 text-center align-middle tabular-nums font-semibold print:py-[1px] ${
                      mark === 'kurang' || mark === 'kd' ? 'bg-red-500/[0.07]' : ''
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
              <td className="py-1 px-2 text-left align-middle text-[10px] print:text-[6px] text-[var(--secondary)] print:py-[1px] print:px-1 print:leading-tight">
                {keteranganFor(item.id, item.standardQty)}
              </td>
            </tr>
          ))}
          <tr className="border-t border-[var(--border)] print:border-black bg-[var(--bg-sidebar)]/50 print:bg-white">
            <td colSpan={3} className="py-1.5 px-2 text-center align-middle text-[10px] print:text-[7px] font-bold text-[var(--primary)] print:text-black print:py-0.5 print:px-1">
              TANGGAL INSPEKSI
            </td>
            {MONTH_KEYS.map((m) => (
              <td
                key={m}
                className="py-1.5 px-1 text-center align-middle text-[10px] print:text-[7px] tabular-nums text-[var(--secondary)] print:py-0.5 print:whitespace-nowrap"
              >
                {fmtTanggal(grid[m]?.tanggal ?? '')}
              </td>
            ))}
            <td className="py-1.5 px-2 text-center align-middle text-[var(--muted)] print:py-0.5">–</td>
          </tr>
          <tr className="border-t border-[var(--border)] print:border-black bg-[var(--bg-sidebar)]/50 print:bg-white">
            <td colSpan={3} className="py-1.5 px-2 text-center align-middle text-[10px] print:text-[7px] font-bold text-[var(--primary)] print:text-black print:py-0.5 print:px-1">
              PARAF &amp; INISIAL
            </td>
            {MONTH_KEYS.map((m) => (
              <td
                key={m}
                className="py-1.5 px-1 text-center align-middle text-[10px] print:text-[7px] text-[var(--secondary)] print:py-0.5"
              >
                {grid[m]?.paraf?.trim() ? grid[m]?.paraf : '–'}
              </td>
            ))}
            <td className="py-1.5 px-2 text-center align-middle text-[var(--muted)] print:py-0.5">–</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
