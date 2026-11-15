import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { AparUnitItem } from '../../types/hse';
import type { ApiInspeksiApar } from '@/services/api/klien';
import {
  BULAN_KARTU,
  KUNCI_KOMPONEN_KARTU,
  LABEL_KOMPONEN_KARTU,
  daftarTahunKartu,
  gridKartuKosong,
  petakanKartuTahunan,
  type TandaKartuApar,
} from './kartuApar';

interface AparYearCardProps {
  units: AparUnitItem[];
  inspeksi: ApiInspeksiApar[];
  onCetak: () => void;
}

function namaBulan(tahun: string, bulan: string): string {
  const t = new Date(Number(tahun), Number(bulan) - 1, 1);
  return format(t, 'MMMM', { locale: idLocale });
}

function tanggalTampil(iso: string): string {
  if (!iso) return '–';
  const t = parseISO(iso);
  return isValid(t) ? format(t, 'dd MMM yyyy', { locale: idLocale }) : '–';
}

function tanggalIsiUlang(expiredDate: string): string {
  const t = parseISO(expiredDate);
  return isValid(t) ? format(t, 'dd MMMM yyyy', { locale: idLocale }) : '–';
}

function kelasTanda(tanda: TandaKartuApar): string {
  if (tanda === '✓')
    return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold print:text-black print:border-black print:bg-transparent';
  if (tanda === 'X')
    return 'bg-red-500/20 border-red-500/40 text-red-600 dark:text-red-400 font-bold print:text-black print:border-black print:bg-transparent';
  return 'bg-[var(--bg-hover)] border-[var(--border)] text-[var(--muted)] print:text-black print:border-black print:bg-transparent';
}

/**
 * Section D halaman APAR: kartu tahunan 12 bulan per unit (hanya-baca).
 *
 * Berada DI BAWAH tabel/kartu + rekap (susunan Section B Hydrant), bukan
 * membajak tampilan kartu. Sel kartu diturunkan dari rekam inspeksi apa
 * adanya; cip unit dan pengalih tahun independen dari pilihan tabel.
 */
export const AparYearCard: React.FC<AparYearCardProps> = ({ units, inspeksi, onCetak }) => {
  const tahunTersedia = useMemo(() => daftarTahunKartu(), []);
  const [tahun, setTahun] = useState(() => String(new Date().getFullYear()));
  const [unitId, setUnitId] = useState<string | null>(null);

  const kartu = useMemo(() => petakanKartuTahunan(inspeksi), [inspeksi]);

  const unitAktif: AparUnitItem | null =
    (unitId ? units.find((u) => u.id === unitId) : undefined) ?? units[0] ?? null;
  const grid = unitAktif ? (kartu[unitAktif.id]?.[tahun] ?? gridKartuKosong()) : gridKartuKosong();

  const idxTahun = tahunTersedia.indexOf(tahun);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-[var(--primary)] tracking-tight print:text-black print:text-sm">
            D. Kartu Tahunan APAR
          </h2>
          <p className="no-print text-xs text-[var(--muted)] mt-0.5">
            Kartu gantung 12 bulan per unit — tanggal, kondisi 7 komponen, dan tindak lanjut
          </p>
        </div>
        <button
          type="button"
          onClick={onCetak}
          disabled={!unitAktif}
          title="Cetak kartu tahunan"
          className="no-print px-3 py-1.5 text-xs font-semibold rounded-[4px] border border-[var(--border)] hover:bg-[var(--bg-hover)] text-[var(--primary)] cursor-pointer flex items-center gap-1.5 pressable disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Printer size={13} strokeWidth={2.2} />
          <span>Cetak Kartu</span>
        </button>
      </div>

      <div className="no-print flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
          Pilih APAR:
        </span>
        {units.length === 0 && (
          <span className="text-[11px] text-[var(--muted)]">Belum ada unit APAR terdaftar.</span>
        )}
        {units.map((u) => {
          const aktif = unitAktif?.id === u.id;
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => setUnitId(u.id)}
              aria-pressed={aktif}
              className={`px-2.5 py-1 text-xs font-semibold rounded-[4px] border cursor-pointer pressable tabular-nums ${
                aktif
                  ? 'bg-[#f2994a]/15 border-[#f2994a]/50 text-[#f2994a]'
                  : 'border-[var(--border)] text-[var(--secondary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {u.kode}
            </button>
          );
        })}
        <span className="inline-flex items-center gap-1 ml-auto">
          <button
            type="button"
            onClick={() => idxTahun > 0 && setTahun(tahunTersedia[idxTahun - 1])}
            disabled={idxTahun <= 0}
            title="Tahun sebelumnya"
            aria-label="Tahun sebelumnya"
            className="w-7 h-7 grid place-items-center rounded-[4px] border border-[var(--border)] text-[var(--secondary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="min-w-12 text-center text-xs font-bold text-[var(--primary)] tabular-nums">
            {tahun}
          </span>
          <button
            type="button"
            onClick={() =>
              idxTahun >= 0 &&
              idxTahun < tahunTersedia.length - 1 &&
              setTahun(tahunTersedia[idxTahun + 1])
            }
            disabled={idxTahun < 0 || idxTahun >= tahunTersedia.length - 1}
            title="Tahun berikutnya"
            aria-label="Tahun berikutnya"
            className="w-7 h-7 grid place-items-center rounded-[4px] border border-[var(--border)] text-[var(--secondary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight size={14} />
          </button>
        </span>
      </div>

      {!unitAktif ? (
        <div className="p-8 rounded-[6px] border border-dashed border-[var(--border)] text-center text-xs text-[var(--muted)]">
          <p className="font-semibold text-[var(--secondary)]">Belum ada kartu tahunan</p>
          <p className="text-[11px] mt-1">Daftarkan unit APAR dahulu untuk membuka kartunya.</p>
        </div>
      ) : (
        <div className="rounded-[6px] border border-[var(--border)] bg-[var(--bg-main)] shadow-2xs overflow-hidden print:border-black print:shadow-none">
          <div className="px-3 py-2 border-b border-[var(--border)] print:border-black flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-[var(--primary)] tabular-nums print:text-black">
              {unitAktif.kode} <span className="font-medium text-[var(--muted)]">· {unitAktif.zoneName}</span>
            </p>
            <p className="text-xs font-bold text-[var(--primary)] tabular-nums print:text-black">
              Tahun {tahun}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider print:text-black">
                  <th className="py-2 px-3 text-center align-middle">Bulan</th>
                  <th className="py-2 px-3 text-center align-middle">Tanggal</th>
                  <th className="py-2 px-3 text-center align-middle">Kondisi 7 Komponen</th>
                  <th className="py-2 px-3 text-center align-middle">Tindak Lanjut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] print:divide-black">
                {BULAN_KARTU.map((bulan) => {
                  const sel = grid[bulan];
                  const merah = KUNCI_KOMPONEN_KARTU.some((k) => sel.kondisi[k] === 'X');
                  return (
                    <tr
                      key={bulan}
                      className={
                        merah
                          ? 'bg-red-500/[0.06] dark:bg-red-500/[0.10] print:bg-transparent'
                          : undefined
                      }
                    >
                      <td className="py-2 px-3 align-middle font-semibold text-[var(--primary)] tabular-nums print:text-black">
                        {namaBulan(tahun, bulan)}
                      </td>
                      <td className="py-2 px-3 text-center align-middle text-[var(--secondary)] tabular-nums print:text-black">
                        {tanggalTampil(sel.tanggal)}
                      </td>
                      <td className="py-2 px-3 align-middle">
                        <div className="flex items-center justify-start gap-1 flex-wrap">
                          {KUNCI_KOMPONEN_KARTU.map((k) => (
                            <span
                              key={k}
                              title={`${LABEL_KOMPONEN_KARTU[k]}: ${
                                sel.kondisi[k] === '✓'
                                  ? 'Baik'
                                  : sel.kondisi[k] === 'X'
                                    ? 'Tidak Baik/Hilang'
                                    : 'Belum diperiksa'
                              }`}
                              className={`px-1.5 py-0.5 rounded-[3px] text-[10px] font-mono border inline-flex items-center gap-0.5 ${kelasTanda(sel.kondisi[k])}`}
                            >
                              <span>{LABEL_KOMPONEN_KARTU[k]}</span>
                              <span>{sel.kondisi[k]}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 px-3 align-middle text-[11px] text-[var(--secondary)] print:text-black">
                        {merah && sel.tindakLanjut ? (
                          <span className="text-red-600 dark:text-red-400 font-medium print:text-black">
                            {sel.tindakLanjut}
                          </span>
                        ) : (
                          <span>{sel.tindakLanjut || '–'}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-2 border-t border-[var(--border)] print:border-black flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-[var(--secondary)] tabular-nums print:text-black">
              <span className="font-semibold text-[var(--primary)] print:text-black">Tgl Isi Ulang:</span>{' '}
              {tanggalIsiUlang(unitAktif.expiredDate)}
            </p>
            <p className="text-[10px] text-[var(--muted)] print:text-black">
              <span className="font-semibold">Legenda:</span> ✓ Baik · X Tidak Baik/Hilang · –
              Belum diperiksa
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
