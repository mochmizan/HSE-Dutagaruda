import React from 'react';
import { AlertCircle, Check, CheckCircle2, X } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { formatIndonesianDate } from '@/lib/dates';
import { KeteranganTeks, NoUrut } from '@/features/pageChrome';
import { hariMenujuKedaluwarsa } from './kartuApar';
import { daftarCatatanStatusApar } from './catatanApar';
import type { AparUnitItem, OverallStatus } from '../../types/hse';

/** Tujuh komponen APAR, urut sesuai kertas. */
const KOMPONEN = [
  { label: 'Safety Pin', kunci: 'safetyPin' },
  { label: 'Fire Hose', kunci: 'corong' },
  { label: 'Segel', kunci: 'segel' },
  { label: 'Pressure Gauge', kunci: 'tekanan' },
  { label: 'Tabung/Tube', kunci: 'tabung' },
  { label: 'Nozzle', kunci: 'selang' },
  { label: 'Katup/Tuas', kunci: 'katupTuas' },
] as const;

/** Nilai status ketujuh komponen dari rekam terbit atau draf. */
export function detailKomponen(unit: AparUnitItem) {
  const details = unit.completedReport?.aparDetails || unit.draftDetails;
  return KOMPONEN.map((k) => ({ label: k.label, status: details?.[k.kunci] }));
}

/**
 * Status akhir efektif unit APAR: hormati `overallStatus` tersimpan (termasuk
 * penyesuaian manual `LAYAK_DENGAN_CATATAN`), lalu jatuh ke evaluasi komponen.
 */
export function statusAkhirUnit(
  unit: AparUnitItem,
  komponen: { status?: string }[],
): OverallStatus | null {
  const eksplisit = unit.completedReport?.overallStatus ?? unit.draftDetails?.overallStatus;
  if (eksplisit) return eksplisit;
  if (komponen.some((k) => k.status === 'TIDAK_BAIK' || k.status === 'NA')) {
    return 'TIDAK_LAYAK';
  }
  if (unit.status === 'SELESAI') return 'LAYAK';
  return null;
}

/** Satu unit dianggap tidak standar bila status akhirnya TIDAK_LAYAK. */
export function unitTidakLayak(unit: AparUnitItem, komponen: { status?: string }[]): boolean {
  return statusAkhirUnit(unit, komponen) === 'TIDAK_LAYAK';
}

/** Tanggal tampil: tanggal rekam bila sudah terbit, selain itu jadwal. */
export function tanggalTampil(unit: AparUnitItem): string {
  if (unit.status !== 'SELESAI' || !unit.completedReport) return unit.scheduledDate || 'Bulan Ini';
  const t = parseISO(unit.completedReport.date);
  return isValid(t) ? format(t, 'dd MMM yyyy', { locale: idLocale }) : unit.scheduledDate || 'Bulan Ini';
}

/** Hitung tanggal refill dari tanggalRefill atau 2 tahun sebelum expiredDate. */
export function tanggalRefillTampil(unit: AparUnitItem): string {
  if (unit.tanggalRefill) return formatIndonesianDate(unit.tanggalRefill) || unit.tanggalRefill;
  if (unit.expiredDate && /^\d{4}-\d{2}-\d{2}/.test(unit.expiredDate)) {
    const y = Number(unit.expiredDate.slice(0, 4));
    const refillYear = unit.tahunPembuatan && unit.tahunPembuatan >= 2000 ? unit.tahunPembuatan : y - 2;
    const refillIso = `${refillYear}${unit.expiredDate.slice(4, 10)}`;
    return formatIndonesianDate(refillIso) || refillIso;
  }
  return unit.tahunPembuatan ? `Jan ${unit.tahunPembuatan}` : '–';
}

interface AparTableProps {
  units: AparUnitItem[];
  onBuka: (unit: AparUnitItem) => void;
  /** Pindahkan satu baris; `arah` -1 naik, +1 turun. */
  onPindah?: (unitId: string, arah: -1 | 1) => void;
}

/**
 * Tabel Section A halaman APAR: satu baris per unit, sembilan kolom.
 * - Mendukung 3 status: STANDAR (hijau), STANDAR DENGAN CATATAN (kuning), TIDAK STANDAR (merah).
 * - Kolom Status Standar menampilkan status utama tebal + daftar catatan komponen/catatan/rekomendasi.
 */
export const AparTable: React.FC<AparTableProps> = ({ units, onBuka, onPindah }) => (
  <div className="overflow-x-auto rounded-[6px] border border-[var(--border)] bg-[var(--bg-main)] shadow-2xs">
    <table className="table-fixed w-full text-center border-collapse text-xs [&_th]:border [&_th]:border-[var(--border)] [&_td]:border [&_td]:border-[var(--border)]">
      <colgroup>
        <col style={{ width: 60 }} />
        <col style={{ width: 78 }} />
        <col style={{ width: 78 }} />
        <col style={{ width: 104 }} />
        <col style={{ width: 118 }} />
        <col style={{ width: 145 }} />
        <col style={{ width: 175 }} />
        <col style={{ width: 155 }} />
        <col style={{ width: 115 }} />
      </colgroup>
      <thead>
        <tr className="border-b border-[var(--border)] bg-[var(--bg-sidebar)]/80 text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider">
          <th className="py-2.5 px-3 w-16 text-center align-middle">No.</th>
          <th className="py-2.5 px-3 min-w-[78px] text-center align-middle">Kode APAR</th>
          <th className="py-2.5 px-3 min-w-[78px] text-center align-middle">Zona</th>
          <th className="py-2.5 px-3 min-w-[104px] text-center align-middle">Jenis / Ukuran</th>
          <th className="py-2.5 px-3 min-w-[118px] text-center align-middle">Tgl Refill &amp; Expired</th>
          <th className="py-2.5 px-3 min-w-[145px] text-center align-middle">
            <div className="flex items-center justify-center gap-1 text-center">
              <span>Verifikasi 7 Komponen</span>
            </div>
          </th>
          <th className="py-2.5 px-3 min-w-[175px] text-center align-middle">Status Standar</th>
          <th className="py-2.5 px-3 min-w-[155px] text-center align-middle">Petugas &amp; Tanggal</th>
          <th className="py-2.5 px-3 min-w-[115px] text-center align-middle">Catatan Temuan &amp; Rekomendasi</th>
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
          const statusList = daftarCatatanStatusApar(notesText);

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
                const teksRefill = tanggalRefillTampil(unit);
                const teksExpired = unit.expiredDate ? formatIndonesianDate(unit.expiredDate) : '';
                const sisa = unit.expiredDate ? hariMenujuKedaluwarsa(unit.expiredDate) : null;
                const segera = sisa !== null && sisa <= 90;
                return (
                  <td className="py-2 px-2.5 text-center align-middle text-[10px] tabular-nums break-words space-y-0.5">
                    <div className="text-[var(--primary)] font-medium">
                      <span className="text-[9px] text-[var(--muted)]">Refill: </span>
                      <span>{teksRefill}</span>
                    </div>
                    {teksExpired ? (
                      <div className={segera ? 'font-semibold text-amber-600 dark:text-amber-400' : 'text-[var(--secondary)]'}>
                        <span className="text-[9px] text-[var(--muted)]">Exp: </span>
                        <span>{teksExpired}</span>
                      </div>
                    ) : (
                      <div className="text-[var(--secondary)]">–</div>
                    )}
                  </td>
                );
              })()}

              <td className="py-2.5 px-3 text-left align-middle">
                <div className="flex items-center justify-start gap-1 flex-wrap break-words">
                  {komponen.map((item) => {
                    const isOk = item.status === 'BAIK';
                    const isNotStandar = item.status === 'TIDAK_BAIK' || item.status === 'NA';
                    const isChecked = Boolean(item.status);

                    return (
                      <span
                        key={item.label}
                        title={`${item.label}: ${
                          isOk
                            ? 'Standar'
                            : isNotStandar
                            ? 'Tidak Standar'
                            : 'Belum diperiksa'
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
                    <ul className="w-full text-left list-disc pl-3.5 space-y-0.5 text-[10px] leading-snug text-[var(--secondary)]">
                      {statusList.map((item, i) => (
                        <li key={i} className="break-words">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </td>

              <td className="py-2.5 px-3 text-center align-middle text-[11px] text-[var(--secondary)]">
                <div className="leading-tight text-center flex flex-col items-center justify-center">
                  <p className="font-medium text-[var(--primary)] truncate max-w-[145px] text-center">
                    {unit.inspectorName || 'Takamay Jason Hermantika Irsyad (Junior HSE Analyst)'}
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
