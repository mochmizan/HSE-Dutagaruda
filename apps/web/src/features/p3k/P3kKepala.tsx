import React from 'react';
import { BriefcaseMedical, MapPin } from 'lucide-react';

interface P3kKepalaProps {
  year: string;
  unitKerja: string;
  onUbahUnitKerja: (nilai: string) => void;
  lokasiKerja: string;
  onUbahLokasiKerja: (nilai: string) => void;
}

/** Kop dokumen layar P3K: judul, periode, Unit/Lokasi Kerja, dan lencana legenda tanda. */
export const P3kKepala: React.FC<P3kKepalaProps> = ({
  year,
  unitKerja,
  onUbahUnitKerja,
  lokasiKerja,
  onUbahLokasiKerja,
}) => (
  <div className="rounded-[6px] border border-[var(--border)] bg-[var(--bg-sidebar)]/50 p-3.5 shadow-2xs space-y-2.5">
    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[var(--border)]">
      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-[5px] bg-[#27ae60]/15 border border-[#27ae60]/30 text-[#27ae60] grid place-items-center flex-shrink-0">
          <BriefcaseMedical size={14} strokeWidth={2.2} />
        </span>
        <div>
          <h2 className="text-xs font-bold text-[var(--primary)] tracking-wider uppercase">
            Inspeksi Kotak P3K Gedung (21 Item Standar Permenakertrans)
          </h2>
          <p className="text-[11px] text-[var(--muted)] tabular-nums">
            Rekapitulasi Tahunan · Periode Pemeriksaan <span className="font-semibold text-[var(--primary)]">{year}</span>
          </p>
        </div>
      </div>

      {/* Legenda Tanda Visual */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] mr-1">
          Keterangan:
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-emerald-500/12 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold">
          <span className="font-bold">√</span> Standar
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-amber-500/12 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-semibold">
          <span className="font-bold">×</span> Di Bawah Standar
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-red-500/15 border border-red-500/35 text-red-600 dark:text-red-400 font-bold">
          <span>KD</span> Kadaluarsa
        </span>
      </div>
    </div>

    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div className="flex flex-wrap items-center gap-4">
        <label className="inline-flex items-center gap-2">
          <span className="text-[11px] font-semibold text-[var(--secondary)]">Unit Kerja:</span>
          <input
            value={unitKerja}
            onChange={(e) => onUbahUnitKerja(e.target.value)}
            aria-label="Unit Kerja"
            className="no-print w-28 bg-[var(--bg-main)] border border-[var(--border)] rounded-[4px] focus:outline-none focus:border-[#27ae60] px-2 py-1 text-xs font-semibold text-[var(--primary)]"
          />
          <span className="hidden print:inline font-semibold">{unitKerja}</span>
        </label>

        <label className="inline-flex items-center gap-2">
          <MapPin size={12} className="text-[var(--muted)]" />
          <span className="text-[11px] font-semibold text-[var(--secondary)]">Lokasi Kerja:</span>
          <input
            value={lokasiKerja}
            onChange={(e) => onUbahLokasiKerja(e.target.value)}
            aria-label="Lokasi Kerja"
            className="no-print w-52 bg-[var(--bg-main)] border border-[var(--border)] rounded-[4px] focus:outline-none focus:border-[#27ae60] px-2 py-1 text-xs font-semibold text-[var(--primary)]"
          />
          <span className="hidden print:inline font-semibold">{lokasiKerja}</span>
        </label>
      </div>

      <p className="no-print text-[11px] text-[var(--muted)]">
        Klik nama bulan pada kepala tabel untuk mengisi atau menyunting pemeriksaan bulan tersebut.
      </p>
    </div>
  </div>
);
