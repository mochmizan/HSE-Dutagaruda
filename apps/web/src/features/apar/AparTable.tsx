import React from 'react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { formatIndonesianDate } from '../../lib/dates';
import type { AparUnitItem } from '../../types/hse';
import { COMPONENT_LABELS, ComponentChip, EligibilityBadge } from './AparBadges';

/** Sisa hari sampai kedaluwarsa; negatif berarti sudah lewat. */
export const daysToExpiry = (iso: string) =>
  Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

/** Gabungan detail rekam terbit dan draf; draf menang bila keduanya ada. */
export const getEffectiveDetails = (unit: AparUnitItem) => {
  const rep = unit.completedReport?.aparDetails as Record<string, string | undefined> | undefined;
  const draft = unit.draftDetails as Record<string, string | undefined> | undefined;
  if (!rep && !draft) return undefined;
  const merged: Record<string, string | undefined> = { ...rep };
  for (const [k, v] of Object.entries(draft ?? {})) if (v !== undefined) merged[k] = v;
  return merged;
};

interface AparTableProps {
  units: AparUnitItem[];
  onBuka: (unit: AparUnitItem) => void;
}

/**
 * Tabel Section A halaman APAR: satu baris per unit, delapan kolom.
 *
 * Dipisah dari AparPage agar halaman tidak lagi 1000+ baris. Markup, kelas,
 * dan urutan kolom sama dengan versi sebelumnya.
 */
export const AparTable: React.FC<AparTableProps> = ({ units, onBuka }) => (
  <div className="overflow-x-auto rounded-[6px] border border-[var(--border)] bg-[var(--bg-main)] shadow-2xs">
    <table className="apar-report-table w-full text-center border-collapse text-xs [&_th]:border [&_th]:border-[var(--border)] [&_td]:border [&_td]:border-[var(--border)]">
      <thead>
        <tr className="border-b border-[var(--border)] bg-[var(--bg-sidebar)]/80 text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider">
          <th className="py-2.5 px-3 w-12 text-center align-middle">No.</th>
          <th className="py-2.5 px-3 min-w-[80px] text-center align-middle">Kode APAR</th>
          <th className="py-2.5 px-3 min-w-[80px] text-center align-middle">Zona</th>
          <th className="py-2.5 px-3 min-w-[110px] text-center align-middle">Jenis / Ukuran</th>
          <th className="py-2.5 px-3 min-w-[120px] text-center align-middle">Periode Expired</th>
          <th className="py-2.5 px-3 min-w-[264px] text-center align-middle">Verifikasi 7 Komponen</th>
          <th className="py-2.5 px-3 min-w-[140px] text-center align-middle">Status Kelayakan</th>
          <th className="py-2.5 px-3 min-w-[170px] text-center align-middle">Petugas &amp; Tanggal</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--border)] text-xs">
        {units.map((unit, idx) => {
          const details = getEffectiveDetails(unit);
          const isCompleted = unit.status === 'SELESAI';
          const remaining = daysToExpiry(unit.expiredDate);
          return (
            <tr
              key={unit.id}
              onClick={() => onBuka(unit)}
              title="Klik baris untuk melihat detail atau memperbarui hasil inspeksi"
              className={`transition-colors cursor-pointer ${
                remaining < 0
                  ? 'bg-gradient-to-r from-red-500/[0.12] via-red-500/[0.06] to-red-500/[0.02] dark:from-red-500/[0.18] dark:via-red-500/[0.09] dark:to-red-500/[0.04] hover:from-red-500/[0.18] hover:to-red-500/[0.08]'
                  : isCompleted
                  ? 'bg-gradient-to-r from-emerald-500/[0.12] via-emerald-500/[0.06] to-emerald-500/[0.02] dark:from-emerald-500/[0.18] dark:via-emerald-500/[0.09] dark:to-emerald-500/[0.04] hover:from-emerald-500/[0.18] hover:to-emerald-500/[0.08]'
                  : 'hover:bg-[var(--bg-hover)]/60'
              }`}
            >
              <td className="py-2.5 px-3 text-center align-middle font-mono text-[var(--muted)] tabular-nums">{idx + 1}</td>
              <td className="py-2.5 px-3 text-center align-middle font-semibold text-[var(--primary)] font-mono tabular-nums">{unit.kode}</td>
              <td className="py-2.5 px-3 text-center align-middle font-semibold text-[var(--primary)]">{unit.zoneName}</td>
              <td className="py-2.5 px-3 text-center align-middle text-[var(--secondary)]">
                {unit.jenis} • {unit.ukuran}
              </td>
              <td className={`py-2.5 px-3 text-center align-middle tabular-nums ${remaining <= 90 ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-[var(--secondary)]'}`}>
                {formatIndonesianDate(parseISO(unit.expiredDate))}
              </td>
              <td className="py-2.5 px-3 text-left align-middle">
                <div className="apar-chip-wrap flex items-center justify-start gap-1 flex-wrap">
                  {COMPONENT_LABELS.map((c) => (
                    <ComponentChip key={c.key} label={c.label} status={details?.[c.key]} />
                  ))}
                </div>
              </td>
              <td className="py-2.5 px-3 text-center align-middle"><EligibilityBadge unit={unit} /></td>
              <td className="py-2.5 px-3 text-center align-middle text-[11px] text-[var(--secondary)]">
                <div className="leading-tight flex flex-col items-center justify-center">
                  <p className="font-medium text-[var(--primary)] truncate max-w-[160px]">{unit.inspectorName || '–'}</p>
                  <p className="text-[10px] text-[var(--muted)] font-mono mt-0.5 tabular-nums">
                    {unit.lastInspectionDate
                      ? format(parseISO(unit.lastInspectionDate), 'dd MMM yyyy', { locale: idLocale })
                      : unit.scheduledDate || 'Bulan Ini'}
                  </p>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
