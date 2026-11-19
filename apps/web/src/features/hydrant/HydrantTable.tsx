import React from 'react';
import { AlertCircle, Check, CheckCircle2, X } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { KeteranganTeks, NoUrut } from '@/features/pageChrome';
import type { HydrantUnitItem, OverallStatus } from '../../types/hse';
import { daftarCatatanStatusHidran } from './catatanHidran';

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

/**
 * Status akhir efektif unit: hormati `overallStatus` tersimpan (termasuk
 * penyesuaian manual `LAYAK_DENGAN_CATATAN`), lalu jatuh ke evaluasi komponen.
 */
export function statusAkhirUnit(
  unit: HydrantUnitItem,
  komponen: { status?: string }[],
): OverallStatus | null {
  const eksplisit = unit.completedReport?.overallStatus ?? unit.draftDetails?.overallStatus;
  if (eksplisit) return eksplisit;
  if (komponen.some((k) => k.status === 'TIDAK_LAYAK' || k.status === 'HILANG')) {
    return 'TIDAK_LAYAK';
  }
  if (unit.status === 'SELESAI') return 'LAYAK';
  return null;
}

/** Satu unit dianggap tidak standar bila status akhirnya TIDAK_LAYAK. */
export function unitTidakLayak(unit: HydrantUnitItem, komponen: { status?: string }[]): boolean {
  return statusAkhirUnit(unit, komponen) === 'TIDAK_LAYAK';
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
  /** Pindahkan satu baris; `arah` -1 naik, +1 turun. */
  onPindah?: (unitId: string, arah: -1 | 1) => void;
}

/**
 * Tabel Section A halaman Hydrant: satu baris per unit, 7 kolom.
 * - Mendukung 3 status: STANDAR (hijau), STANDAR DENGAN CATATAN (kuning), TIDAK STANDAR (merah).
 * - Kolom Status Standar menampilkan status utama tebal + daftar catatan komponen/catatan/rekomendasi.
 */
export const HydrantTable: React.FC<HydrantTableProps> = ({ units, onBuka, onPindah }) => (
  <div className="overflow-x-auto rounded-[6px] border border-[var(--border)] bg-[var(--bg-main)] shadow-2xs">
    <table className="w-full table-fixed text-center border-collapse text-xs [&_th]:border [&_th]:border-[var(--border)] [&_td]:border [&_td]:border-[var(--border)]">
      <colgroup>
        <col className="w-[64px]" />
        <col className="w-[96px]" />
        <col className="w-[120px]" />
        <col className="w-[216px]" />
        <col className="w-[184px]" />
        <col className="w-[180px]" />
        <col className="w-[168px]" />
      </colgroup>
      <thead>
        <tr className="border-b border-[var(--border)] bg-[var(--bg-sidebar)]/80 text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider">
          <th className="py-2.5 px-3 w-16 text-center align-middle">No.</th>
          <th className="py-2.5 px-3 min-w-[96px] text-center align-middle">Kode Hydrant</th>
          <th className="py-2.5 px-3 min-w-[120px] text-center align-middle">Zona</th>
          <th className="py-2.5 px-3 min-w-[216px] text-center align-middle">
            <div className="flex items-center justify-center gap-1 text-center">
              <span>Verifikasi 6 Komponen</span>
            </div>
          </th>
          <th className="py-2.5 px-3 min-w-[184px] text-center align-middle">Status Standar</th>
          <th className="py-2.5 px-3 min-w-[180px] text-center align-middle">Petugas &amp; Tanggal</th>
          <th className="py-2.5 px-3 min-w-[168px] text-center align-middle">Catatan Temuan &amp; Rekomendasi</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--border)] text-xs">
        {units.map((unit, idx) => {
          const komponen = detailKomponen(unit);
          const statusAkhir = statusAkhirUnit(unit, komponen);
          const tidakStandar = statusAkhir === 'TIDAK_LAYAK';
          const denganCatatan = statusAkhir === 'LAYAK_DENGAN_CATATAN';
          const standar = statusAkhir === 'LAYAK';
          const notesText = unit.completedReport?.summaryNotes || unit.draftDetails?.notes || '';
          const statusList = daftarCatatanStatusHidran(notesText);

          return (
            <tr
              key={unit.id}
              onClick={() => onBuka(unit)}
              title="Klik baris untuk melihat detail atau memperbarui hasil inspeksi"
              className={`transition-colors cursor-pointer ${
                tidakStandar
                  ? 'bg-gradient-to-r from-[#eb5757]/[0.12] via-[#eb5757]/[0.06] to-[#eb5757]/[0.02] dark:from-[#eb5757]/[0.18] dark:via-[#eb5757]/[0.09] dark:to-[#eb5757]/[0.04] hover:from-[#eb5757]/[0.18] hover:to-[#eb5757]/[0.08]'
                  : denganCatatan
                  ? 'bg-gradient-to-r from-amber-500/[0.15] via-amber-500/[0.08] to-amber-500/[0.02] dark:from-amber-500/[0.22] dark:via-amber-500/[0.11] dark:to-amber-500/[0.04] hover:from-amber-500/[0.22] hover:to-amber-500/[0.10]'
                  : standar
                  ? 'bg-gradient-to-r from-emerald-500/[0.12] via-emerald-500/[0.06] to-emerald-500/[0.02] dark:from-emerald-500/[0.18] dark:via-emerald-500/[0.09] dark:to-emerald-500/[0.04] hover:from-emerald-500/[0.18] hover:to-emerald-500/[0.08]'
                  : 'hover:bg-[var(--bg-hover)]/60'
              }`}
            >
              <td className="py-2.5 px-3 text-center align-middle font-mono text-[var(--muted)] tabular-nums">
                <NoUrut
                  nomor={idx + 1}
                  bisaNaik={Boolean(onPindah) && idx > 0}
                  bisaTurun={Boolean(onPindah) && idx < units.length - 1}
                  onNaik={() => onPindah?.(unit.id, -1)}
                  onTurun={() => onPindah?.(unit.id, 1)}
                />
              </td>

              <td className="py-2.5 px-3 text-center align-middle font-semibold text-[var(--primary)] font-mono">
                <span>{unit.kode}</span>
              </td>

              <td className="py-2.5 px-3 text-center align-middle font-semibold text-[var(--primary)]">
                <span>{unit.zoneName}</span>
              </td>

              <td className="py-2.5 px-3 text-left align-middle">
                <div className="flex items-center justify-start gap-1 flex-wrap max-w-[216px]">
                  {komponen.map((item) => {
                    const isOk = item.status === 'LAYAK';
                    const isNotStandar = item.status === 'TIDAK_LAYAK' || item.status === 'HILANG';
                    const isChecked = Boolean(item.status);

                    return (
                      <span
                        key={item.label}
                        title={`${item.label}: ${
                          isOk ? 'Standar' : isNotStandar ? 'Tidak Standar' : 'Belum diperiksa'
                        }`}
                        className={`px-1.5 py-0.5 rounded-[3px] text-[10px] font-mono border inline-flex items-center gap-0.5 ${
                          isOk
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold'
                            : isNotStandar
                            ? 'bg-red-500/20 border-red-500/40 text-red-600 dark:text-red-400 font-bold'
                            : isChecked
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                            : 'bg-[var(--bg-hover)] border-[var(--border)] text-[var(--muted)]'
                        }`}
                      >
                        <span>{item.label}</span>
                        {isOk ? (
                          <Check size={9} strokeWidth={2.5} />
                        ) : isNotStandar ? (
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
                <div className="flex flex-col items-center gap-1">
                  {tidakStandar ? (
                    <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                      <X size={11} strokeWidth={2.5} /> TIDAK STANDAR
                    </span>
                  ) : denganCatatan ? (
                    <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/35">
                      <AlertCircle size={11} strokeWidth={2.3} /> STANDAR DENGAN CATATAN
                    </span>
                  ) : standar ? (
                    <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 size={11} /> STANDAR
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-medium bg-[var(--bg-hover)] text-[var(--muted)] border border-[var(--border)]">
                      <AlertCircle size={11} /> Belum Diperiksa
                    </span>
                  )}
                  {statusList.length > 0 && (
                    <ul className="w-full text-left list-none space-y-0.5 text-[10px] leading-snug text-[var(--secondary)]">
                      {statusList.map((item, i) => (
                        <li key={i} className="pl-2.5 -indent-2.5 break-words">
                          - {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </td>

              <td className="py-2.5 px-3 text-center align-middle text-[11px] text-[var(--secondary)]">
                <div className="leading-tight text-center flex flex-col items-center justify-center">
                  <p className="font-medium text-[var(--primary)] truncate max-w-[170px] text-center">
                    {unit.inspectorName || 'Takamay Jason Hermantika Irsyad (Junior HSE Analyst)'}
                  </p>
                  <p className="text-[10px] text-[var(--muted)] font-mono mt-0.5 text-center">
                    {tanggalTampil(unit)}
                  </p>
                </div>
              </td>

              <td className="py-2.5 px-3 align-middle text-[11px] text-[var(--secondary)]">
                <KeteranganTeks teks={notesText} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
