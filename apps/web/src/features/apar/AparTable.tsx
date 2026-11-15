import React from 'react';
import { AlertCircle, Check, CheckCircle2, Clock, X } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { formatIndonesianDate } from '@/lib/dates';
import { KeteranganTeks, NoUrut } from '@/features/pageChrome';
import { hariMenujuKedaluwarsa } from './kartuApar';
import type { AparUnitItem } from '../../types/hse';

/** Tujuh komponen APAR, urut sesuai kertas. */
const KOMPONEN = [
  { label: 'Safety Pin', kunci: 'safetyPin' },
  { label: 'Corong', kunci: 'corong' },
  { label: 'Segel', kunci: 'segel' },
  { label: 'Tekanan', kunci: 'tekanan' },
  { label: 'Tabung', kunci: 'tabung' },
  { label: 'Selang', kunci: 'selang' },
  { label: 'Katup/Tuas', kunci: 'katupTuas' },
] as const;

/** Nilai status ketujuh komponen dari rekam terbit atau draf. */
export function detailKomponen(unit: AparUnitItem) {
  const details = unit.completedReport?.aparDetails || unit.draftDetails;
  return KOMPONEN.map((k) => ({ label: k.label, status: details?.[k.kunci] }));
}

/** Satu unit dianggap tidak layak bila rekam menyatakannya, atau ada komponen
 *  yang TIDAK_BAIK/HILANG (`NA` tampil sebagai HILANG). Dipakai tabel dan kartu
 *  supaya keduanya tak bisa berbeda pendapat. */
export function unitTidakLayak(unit: AparUnitItem, komponen: { status?: string }[]): boolean {
  return (
    unit.completedReport?.overallStatus === 'TIDAK_LAYAK' ||
    unit.draftDetails?.overallStatus === 'TIDAK_LAYAK' ||
    komponen.some((k) => k.status === 'TIDAK_BAIK' || k.status === 'NA')
  );
}

/** Tanggal tampil: tanggal rekam bila sudah terbit, selain itu jadwal. */
export function tanggalTampil(unit: AparUnitItem): string {
  if (unit.status !== 'SELESAI' || !unit.completedReport) return unit.scheduledDate || 'Bulan Ini';
  const t = parseISO(unit.completedReport.date);
  return isValid(t) ? format(t, 'dd MMM yyyy', { locale: idLocale }) : unit.scheduledDate || 'Bulan Ini';
}

interface AparTableProps {
  units: AparUnitItem[];
  onBuka: (unit: AparUnitItem) => void;
  /** Pindahkan satu baris; `arah` -1 naik, +1 turun. */
  onPindah?: (unitId: string, arah: -1 | 1) => void;
}

/**
 * Tabel Section A halaman APAR: satu baris per unit, sembilan kolom.
 *
 * Disiplin lebar Hydrant (total 1028px, `table-fixed` + `<colgroup>`),
 * diisi konten APAR: No. 64 | Kode APAR 80 | Zona 80 | Jenis / Ukuran 110
 * | Periode Expired 120 | Verifikasi 145 | Status 140 | Petugas 170 |
 * Keterangan 119. Sel membungkus, bukan meregang.
 */
export const AparTable: React.FC<AparTableProps> = ({ units, onBuka, onPindah }) => (
  <div className="overflow-x-auto rounded-[6px] border border-[var(--border)] bg-[var(--bg-main)] shadow-2xs">
    <table className="table-fixed w-full text-center border-collapse text-xs [&_th]:border [&_th]:border-[var(--border)] [&_td]:border [&_td]:border-[var(--border)]">
      <colgroup>
        <col style={{ width: 64 }} />
        <col style={{ width: 80 }} />
        <col style={{ width: 80 }} />
        <col style={{ width: 110 }} />
        <col style={{ width: 120 }} />
        <col style={{ width: 145 }} />
        <col style={{ width: 140 }} />
        <col style={{ width: 170 }} />
        <col style={{ width: 119 }} />
      </colgroup>
      <thead>
        <tr className="border-b border-[var(--border)] bg-[var(--bg-sidebar)]/80 text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider">
          <th className="py-2.5 px-3 w-16 text-center align-middle">No.</th>
          <th className="py-2.5 px-3 min-w-[80px] text-center align-middle">Kode APAR</th>
          <th className="py-2.5 px-3 min-w-[80px] text-center align-middle">Zona</th>
          <th className="py-2.5 px-3 min-w-[110px] text-center align-middle">Jenis / Ukuran</th>
          <th className="py-2.5 px-3 min-w-[120px] text-center align-middle">Periode Expired</th>
          <th className="py-2.5 px-3 min-w-[145px] text-center align-middle">
            <div className="flex items-center justify-center gap-1 text-center">
              <span>Verifikasi 7 Komponen</span>
            </div>
          </th>
          <th className="py-2.5 px-3 min-w-[140px] text-center align-middle">Status Kelayakan</th>
          <th className="py-2.5 px-3 min-w-[170px] text-center align-middle">Petugas &amp; Tanggal</th>
          <th className="py-2.5 px-3 min-w-[119px] text-center align-middle">Keterangan</th>
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
                <NoUrut
                  nomor={idx + 1}
                  bisaNaik={Boolean(onPindah) && idx > 0}
                  bisaTurun={Boolean(onPindah) && idx < units.length - 1}
                  onNaik={() => onPindah?.(unit.id, -1)}
                  onTurun={() => onPindah?.(unit.id, 1)}
                />
              </td>

              <td className="py-2.5 px-3 text-center align-middle font-semibold text-[var(--primary)] font-mono tabular-nums">
                <span>{unit.kode}</span>
              </td>

              <td className="py-2.5 px-3 text-center align-middle font-semibold text-[var(--primary)]">
                <span>{unit.zoneName}</span>
              </td>

              <td className="py-2.5 px-3 text-center align-middle text-[11px] font-medium text-[var(--secondary)] break-words">
                {unit.jenis && unit.ukuran ? (
                  <span>
                    {unit.jenis} • {unit.ukuran}
                  </span>
                ) : (
                  <span>–</span>
                )}
              </td>

              {(() => {
                const teksExpired = unit.expiredDate ? formatIndonesianDate(unit.expiredDate) : '';
                const sisa = unit.expiredDate ? hariMenujuKedaluwarsa(unit.expiredDate) : null;
                const segera = sisa !== null && sisa <= 90;
                return (
                  <td className="py-2.5 px-3 text-center align-middle text-[11px] tabular-nums break-words">
                    {teksExpired ? (
                      <span className={segera ? 'font-semibold text-amber-600 dark:text-amber-400' : 'text-[var(--secondary)]'}>
                        {teksExpired}
                      </span>
                    ) : (
                      <span className="text-[var(--secondary)]">–</span>
                    )}
                  </td>
                );
              })()}

              <td className="py-2.5 px-3 text-left align-middle">
                <div className="flex items-center justify-start gap-1 flex-wrap break-words">
                  {komponen.map((item) => {
                    const isOk = item.status === 'BAIK';
                    const isNotLayak = item.status === 'TIDAK_BAIK' || item.status === 'NA';
                    const isChecked = Boolean(item.status);

                    return (
                      <span
                        key={item.label}
                        title={`${item.label}: ${
                          item.status === 'BAIK'
                            ? 'Baik'
                            : item.status === 'TIDAK_BAIK'
                            ? 'Tidak Baik'
                            : item.status === 'NA'
                            ? 'Hilang'
                            : 'Belum diperiksa'
                        }`}
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
                  <p className="font-medium text-[var(--primary)] truncate max-w-[150px] text-center">
                    {unit.inspectorName || 'Pengawas K3'}
                  </p>
                  <p className="text-[10px] text-[var(--muted)] font-mono mt-0.5 text-center tabular-nums">
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
