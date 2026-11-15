import React, { useMemo } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { AparUnitItem } from '../../types/hse';
import { formatNoList, hariMenujuKedaluwarsa } from './kartuApar';

interface AparExpiryRecapProps {
  units: AparUnitItem[];
}

interface BarisKedaluwarsa {
  unit: AparUnitItem;
  sisa: number | null;
}

function tanggalTampil(expiredDate: string): string {
  const t = parseISO(expiredDate);
  return isValid(t) ? format(t, 'dd MMM yyyy', { locale: idLocale }) : '–';
}

/**
 * Section C halaman APAR: rekap kedaluwarsa antar tabel dan kartu tahunan.
 *
 * Dihitung dari `expiredDate` unit terdaftar (bukan dari rekam inspeksi):
 * merah bila sudah lewat, amber bila sisa ≤ 90 hari. Bahasa visual kartu
 * netral + sel tabel, angka `tabular-nums`.
 */
export const AparExpiryRecap: React.FC<AparExpiryRecapProps> = ({ units }) => {
  const baris: BarisKedaluwarsa[] = useMemo(
    () =>
      units.map((unit) => ({
        unit,
        sisa: hariMenujuKedaluwarsa(unit.expiredDate),
      })),
    [units],
  );

  const lewat = useMemo(
    () => baris.filter((b) => b.sisa !== null && b.sisa < 0).sort((a, b) => (a.sisa ?? 0) - (b.sisa ?? 0)),
    [baris],
  );
  const segera = useMemo(
    () =>
      baris
        .filter((b) => b.sisa !== null && b.sisa >= 0 && b.sisa <= 90)
        .sort((a, b) => (a.sisa ?? 0) - (b.sisa ?? 0)),
    [baris],
  );
  const aman = baris.length - lewat.length - segera.length;

  return (
    <div className="space-y-4 print:break-before-page">
      <div>
        <h2 className="text-sm font-bold text-[var(--primary)] tracking-tight print:text-black print:text-sm">
          C. Rekap Kadaluwarsa
        </h2>
        <p className="no-print text-xs text-[var(--muted)] mt-0.5">
          Sisa masa isi ulang per unit dari tanggal kedaluwarsa terdaftar
        </p>
      </div>

      <div className="rounded-[6px] border border-[var(--border)] bg-[var(--bg-main)] shadow-2xs print:border-black print:shadow-none">
        <div className="p-3 border-b border-[var(--border)] print:border-black grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="rounded-[5px] border border-red-500/30 bg-red-500/[0.06] dark:bg-red-500/[0.10] px-2.5 py-2 print:border-black print:bg-transparent">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 print:text-black">
              Kedaluwarsa
            </p>
            <p className="mt-0.5 text-xs font-bold text-[var(--primary)] tabular-nums print:text-black">
              {lewat.length} <span className="font-medium">Unit</span>
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--secondary)] print:text-black">
              {lewat.length === 0
                ? 'Belum ada unit yang kedaluwarsa'
                : formatNoList(lewat.map((b) => b.unit.kode))}
            </p>
          </div>
          <div className="rounded-[5px] border border-amber-500/30 bg-amber-500/[0.06] dark:bg-amber-500/[0.10] px-2.5 py-2 print:border-black print:bg-transparent">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 print:text-black">
              Segera Habis ≤ 90 Hari
            </p>
            <p className="mt-0.5 text-xs font-bold text-[var(--primary)] tabular-nums print:text-black">
              {segera.length} <span className="font-medium">Unit</span>
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--secondary)] print:text-black">
              {segera.length === 0
                ? 'Belum ada unit yang mendekati kedaluwarsa'
                : formatNoList(segera.map((b) => b.unit.kode))}
            </p>
          </div>
          <div className="rounded-[5px] border border-[var(--border)] bg-[var(--bg-sidebar)] px-2.5 py-2 print:border-black print:bg-transparent">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] print:text-black">
              Aman
            </p>
            <p className="mt-0.5 text-xs font-bold text-[var(--primary)] tabular-nums print:text-black">
              {aman} <span className="font-medium">Unit</span>
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--secondary)] print:text-black">
              Sisa lebih dari 90 hari
            </p>
          </div>
        </div>

        {baris.length === 0 ? (
          <p className="p-6 text-center text-xs text-[var(--muted)]">
            Belum ada unit APAR terdaftar.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-xs">
              <thead>
                <tr className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider print:text-black">
                  <th className="py-2 px-3 text-center align-middle">Kode APAR</th>
                  <th className="py-2 px-3 text-center align-middle">Zona</th>
                  <th className="py-2 px-3 text-center align-middle">Tgl Isi Ulang</th>
                  <th className="py-2 px-3 text-center align-middle">Sisa Hari</th>
                  <th className="py-2 px-3 text-center align-middle">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] print:divide-black">
                {baris.map(({ unit, sisa }) => {
                  const status =
                    sisa === null ? 'tak-diketahui' : sisa < 0 ? 'lewat' : sisa <= 90 ? 'segera' : 'aman';
                  return (
                    <tr
                      key={unit.id}
                      className={
                        status === 'lewat'
                          ? 'bg-red-500/[0.06] dark:bg-red-500/[0.10] print:bg-transparent'
                          : status === 'segera'
                            ? 'bg-amber-500/[0.05] dark:bg-amber-500/[0.08] print:bg-transparent'
                            : undefined
                      }
                    >
                      <td className="py-2 px-3 text-center align-middle font-semibold text-[var(--primary)] font-mono tabular-nums print:text-black">
                        {unit.kode}
                      </td>
                      <td className="py-2 px-3 text-center align-middle text-[var(--secondary)] print:text-black">
                        {unit.zoneName}
                      </td>
                      <td className="py-2 px-3 text-center align-middle text-[var(--secondary)] tabular-nums print:text-black">
                        {tanggalTampil(unit.expiredDate)}
                      </td>
                      <td className="py-2 px-3 text-center align-middle tabular-nums text-[var(--secondary)] print:text-black">
                        {sisa === null ? '–' : sisa < 0 ? `Lewat ${-sisa} hari` : `${sisa} hari`}
                      </td>
                      <td className="py-2 px-3 text-center align-middle">
                        {status === 'lewat' ? (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 print:text-black print:border-black print:bg-transparent">
                            KEDALUWARSA
                          </span>
                        ) : status === 'segera' ? (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 print:text-black print:border-black print:bg-transparent">
                            SEGERA HABIS
                          </span>
                        ) : status === 'aman' ? (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 print:text-black print:border-black print:bg-transparent">
                            AMAN
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-[3px] text-[10px] font-medium bg-[var(--bg-hover)] text-[var(--muted)] border border-[var(--border)] print:text-black print:border-black print:bg-transparent">
                            –
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
