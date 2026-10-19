import React from 'react';
import { AlertCircle, Check, CheckCircle2, Clock, X } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { HydrantUnitItem } from '../../types/hse';

/** Enam komponen hydrant, urut sesuai kertas. */
const KOMPONEN = [
  { label: 'Box Hydrant', kunci: 'boxHydrant' },
  { label: 'Fire Hose', kunci: 'fireHose' },
  { label: 'Hose Coupling', kunci: 'hoseCoupling' },
  { label: 'Hose Rack', kunci: 'hoseRack' },
  { label: 'Nozzle', kunci: 'nozzle' },
  { label: 'Valve/Pillar Hydrant', kunci: 'valvePillar' },
] as const;

/** Nilai status keenam komponen dari rekam terbit atau draf. */
export function detailKomponen(unit: HydrantUnitItem) {
  const details = unit.completedReport?.hydrantDetails || unit.draftDetails;
  return KOMPONEN.map((k) => ({ label: k.label, status: details?.[k.kunci] }));
}

/** Satu unit dianggap tidak layak bila rekam menyatakannya, atau ada komponen
 *  yang TIDAK_LAYAK/HILANG. Dipakai tabel dan kartu supaya keduanya tak bisa
 *  berbeda pendapat. */
export function unitTidakLayak(unit: HydrantUnitItem, komponen: { status?: string }[]): boolean {
  return (
    unit.completedReport?.overallStatus === 'TIDAK_LAYAK' ||
    unit.draftDetails?.overallStatus === 'TIDAK_LAYAK' ||
    komponen.some((k) => k.status === 'TIDAK_LAYAK' || k.status === 'HILANG')
  );
}

/** Tanggal tampil: tanggal rekam bila sudah terbit, selain itu jadwal. */
export function tanggalTampil(unit: HydrantUnitItem): string {
  if (unit.status !== 'SELESAI' || !unit.completedReport) return unit.scheduledDate || 'Bulan Ini';
  const t = parseISO(unit.completedReport.date);
  return isValid(t) ? format(t, 'dd MMM yyyy', { locale: idLocale }) : unit.scheduledDate || 'Bulan Ini';
}

interface HydrantTableProps {
  units: HydrantUnitItem[];
  onBuka: (unit: HydrantUnitItem) => void;
}

/**
 * Tabel Section A halaman Hydrant: satu baris per unit, tujuh kolom.
 *
 * Dipisah dari HydrantPage agar halaman tidak lagi 1000+ baris. Markup dan
 * kelasnya sama dengan versi sebelumnya.
 */
export const HydrantTable: React.FC<HydrantTableProps> = ({ units, onBuka }) => (
  <div className="overflow-x-auto rounded-[6px] border border-[var(--border)] bg-[var(--bg-main)] shadow-2xs">
    <table className="w-full text-center border-collapse text-xs [&_th]:border [&_th]:border-[var(--border)] [&_td]:border [&_td]:border-[var(--border)]">
      <thead>
        <tr className="border-b border-[var(--border)] bg-[var(--bg-sidebar)]/80 text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider">
          <th className="py-2.5 px-3 w-12 text-center align-middle">No.</th>
          <th className="py-2.5 px-3 min-w-[90px] text-center align-middle">Kode Unit</th>
          <th className="py-2.5 px-3 min-w-[120px] text-center align-middle">Lokasi &amp; Zona</th>
          <th className="py-2.5 px-3 min-w-[354px] text-center align-middle">
            <div className="flex items-center justify-center gap-1 text-center">
              <span>Verifikasi 6 Komponen</span>
            </div>
          </th>
          <th className="py-2.5 px-3 min-w-[140px] text-center align-middle">Status Kelayakan</th>
          <th className="py-2.5 px-3 min-w-[200px] text-center align-middle">Petugas &amp; Tanggal</th>
          <th className="py-2.5 px-3 min-w-[280px] text-center align-middle">Catatan / Temuan</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--border)] text-xs">
        {units.map((unit, idx) => {
          const isCompleted = unit.status === 'SELESAI';
          const isOnProgress = unit.status === 'SEDANG_BERJALAN';
          const komponen = detailKomponen(unit);
          const tidakLayak = unitTidakLayak(unit, komponen);
          const notesText = unit.completedReport?.summaryNotes || unit.draftDetails?.notes || '';

          return (
            <tr
              key={unit.id}
              onClick={() => onBuka(unit)}
              title="Klik baris untuk melihat detail atau memperbarui hasil inspeksi"
              className={`transition-colors cursor-pointer ${
                tidakLayak
                  ? 'bg-gradient-to-r from-[#eb5757]/[0.12] via-[#eb5757]/[0.06] to-[#eb5757]/[0.02] dark:from-[#eb5757]/[0.18] dark:via-[#eb5757]/[0.09] dark:to-[#eb5757]/[0.04] hover:from-[#eb5757]/[0.18] hover:to-[#eb5757]/[0.08]'
                  : isCompleted
                  ? 'bg-gradient-to-r from-emerald-500/[0.12] via-emerald-500/[0.06] to-emerald-500/[0.02] dark:from-emerald-500/[0.18] dark:via-emerald-500/[0.09] dark:to-emerald-500/[0.04] hover:from-emerald-500/[0.18] hover:to-emerald-500/[0.08]'
                  : isOnProgress
                  ? 'bg-[#eb5757]/[0.02] hover:bg-[var(--bg-hover)]/60'
                  : 'hover:bg-[var(--bg-hover)]/60'
              }`}
            >
              <td className="py-2.5 px-3 text-center align-middle font-mono text-[var(--muted)] tabular-nums">
                {idx + 1}
              </td>

              <td className="py-2.5 px-3 text-center align-middle font-semibold text-[var(--primary)] font-mono">
                <span>{unit.kode}</span>
              </td>

              <td className="py-2.5 px-3 text-center align-middle font-semibold text-[var(--primary)]">
                <span>{unit.zoneName}</span>
              </td>

              <td className="py-2.5 px-3 text-left align-middle">
                <div className="flex items-center justify-start gap-1 flex-wrap">
                  {komponen.map((item) => {
                    const isOk = item.status === 'LAYAK';
                    const isNotLayak = item.status === 'TIDAK_LAYAK' || item.status === 'HILANG';
                    const isChecked = Boolean(item.status);

                    return (
                      <span
                        key={item.label}
                        title={`${item.label}: ${item.status || 'Belum diperiksa'}`}
                        className={`px-1.5 py-0.5 rounded-[3px] text-[10px] font-mono border inline-flex items-center gap-0.5 ${
                          isOk
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold'
                            : isNotLayak
                            ? 'bg-red-500/20 border-red-500/40 text-red-600 dark:text-red-400 font-bold'
                            : isChecked
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                            : 'bg-[var(--bg-hover)] border-[var(--border)] text-[var(--muted)]'
                        }`}
                      >
                        <span>{item.label}</span>
                        {isOk ? (
                          <Check size={9} strokeWidth={2.5} />
                        ) : isNotLayak ? (
                          <X size={10} strokeWidth={2.5} className="text-red-600 dark:text-red-400" />
                        ) : (
                          <span className="text-[8px] text-[var(--muted)]">•</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </td>

              <td className="py-2.5 px-3 text-center align-middle">
                {tidakLayak ? (
                  <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                    <X size={11} strokeWidth={2.5} /> TIDAK LAYAK
                  </span>
                ) : isCompleted ? (
                  <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 size={11} /> LAYAK
                  </span>
                ) : isOnProgress ? (
                  <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    <Clock size={11} /> Berjalan
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-medium bg-[var(--bg-hover)] text-[var(--muted)] border border-[var(--border)]">
                    <AlertCircle size={11} /> Belum Dimulai
                  </span>
                )}
              </td>

              <td className="py-2.5 px-3 text-center align-middle text-[11px] text-[var(--secondary)]">
                <div className="leading-tight text-center flex flex-col items-center justify-center">
                  <p className="font-medium text-[var(--primary)] truncate max-w-[190px] text-center">
                    {unit.inspectorName || 'Alex Chen (Staff)'}
                  </p>
                  <p className="text-[10px] text-[var(--muted)] font-mono mt-0.5 text-center">
                    {tanggalTampil(unit)}
                  </p>
                </div>
              </td>

              <td className="py-2.5 px-3 text-center align-middle text-[11px] text-[var(--secondary)]">
                <div className="flex items-start justify-center text-left">
                  {notesText ? (
                    <span
                      className="italic line-clamp-3 max-w-[320px] text-[var(--primary)] inline-block"
                      title={notesText}
                    >
                      {notesText.split('\n').filter(Boolean).map((baris, i) => (
                        <span key={i} className="block leading-snug">
                          {baris}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="text-[var(--muted)] text-[10px] text-center inline-block">–</span>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
