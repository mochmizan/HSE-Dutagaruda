import React from 'react';
import { BriefcaseMedical, Layers, MapPin } from 'lucide-react';
import { P3K_BOX_TYPES, type P3kBoxType } from '@/lib/p3kItems';
import type { ApiP3kBox } from '@/services/api/klien';

interface P3kKepalaProps {
  year: string;
  unitKerja: string;
  onUbahUnitKerja: (nilai: string) => void;
  lokasiKerja: string;
  onUbahLokasiKerja: (nilai: string) => void;
  boxType: P3kBoxType;
  onUbahBoxType: (tipe: P3kBoxType) => void;
  daftarKotak?: ApiP3kBox[];
  kotakAktifId?: string;
  onPilihKotak?: (boxId: string) => void;
}

/**
 * Kop dokumen layar P3K: judul, pemilih Kotak P3K (Lantai 2 Tipe A, Lantai 3 Tipe B, Tipe C),
 * Unit/Lokasi Kerja, dan lencana legenda tanda.
 */
export const P3kKepala: React.FC<P3kKepalaProps> = ({
  year,
  unitKerja,
  onUbahUnitKerja,
  lokasiKerja,
  onUbahLokasiKerja,
  boxType,
  onUbahBoxType,
  daftarKotak = [],
  kotakAktifId,
  onPilihKotak,
}) => {
  const infoTipe = P3K_BOX_TYPES[boxType];

  return (
    <div className="rounded-[6px] border border-[var(--border)] bg-[var(--bg-sidebar)]/50 p-3.5 shadow-2xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-[5px] bg-[#27ae60]/15 border border-[#27ae60]/30 text-[#27ae60] grid place-items-center flex-shrink-0">
            <BriefcaseMedical size={14} strokeWidth={2.2} />
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs font-bold text-[var(--primary)] tracking-wider uppercase">
                Inspeksi Kotak P3K — {infoTipe.label}
              </h2>
              <span className="px-2 py-0.5 rounded-[4px] bg-[#27ae60]/15 border border-[#27ae60]/35 text-[#27ae60] text-[10px] font-bold uppercase">
                {boxType === 'A'
                  ? 'Lantai 2 · Tipe A'
                  : boxType === 'B'
                  ? 'Lantai 3 · Tipe B'
                  : 'Tipe C'}
              </span>
            </div>
            <p className="text-[11px] text-[var(--muted)] tabular-nums">
              Rekapitulasi Tahunan 21 Item Standar · Periode Pemeriksaan{' '}
              <span className="font-semibold text-[var(--primary)]">{year}</span>
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
            <span className="font-bold">×</span> Tidak Standar (Kurang)
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-red-500/15 border border-red-500/35 text-red-600 dark:text-red-400 font-bold">
            <span>KD</span> Kadaluarsa
          </span>
        </div>
      </div>

      {/* Pemilih Tipe Kotak P3K (Tipe A Lantai 2, Tipe B Lantai 3, Tipe C) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[var(--border)]/70">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--secondary)] mr-1">
            <Layers size={12} className="text-[#27ae60]" />
            <span>Pilih Tipe Kotak P3K:</span>
          </span>
          {(
            [
              { tipe: 'A' as const, judul: 'Tipe A — Lantai 2 (≤ 25 Pekerja)' },
              { tipe: 'B' as const, judul: 'Tipe B — Lantai 3 (≤ 50 Pekerja)' },
              { tipe: 'C' as const, judul: 'Tipe C (≤ 100 Pekerja)' },
            ]
          ).map((pil) => {
            const aktif = boxType === pil.tipe;
            return (
              <button
                key={pil.tipe}
                type="button"
                onClick={() => onUbahBoxType(pil.tipe)}
                className={`px-2.5 py-1 rounded-[4px] text-xs font-semibold border cursor-pointer pressable transition-colors ${
                  aktif
                    ? 'bg-[#27ae60] border-[#27ae60] text-white shadow-2xs'
                    : 'bg-[var(--bg-main)] border-[var(--border)] text-[var(--secondary)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                {pil.judul}
              </button>
            );
          })}
        </div>

        {daftarKotak.length > 1 && onPilihKotak && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-semibold text-[var(--secondary)]">Kotak Terdaftar:</span>
            <select
              value={kotakAktifId ?? ''}
              onChange={(e) => onPilihKotak(e.target.value)}
              className="px-2 py-1 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] font-semibold text-xs focus:outline-none focus:border-[#27ae60]"
            >
              {daftarKotak.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
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
              className="no-print w-64 bg-[var(--bg-main)] border border-[var(--border)] rounded-[4px] focus:outline-none focus:border-[#27ae60] px-2 py-1 text-xs font-semibold text-[var(--primary)]"
            />
            <span className="hidden print:inline font-semibold">{lokasiKerja}</span>
          </label>
        </div>

        <p className="no-print text-[11px] text-[var(--muted)]">
          Klik nama bulan pada kepala tabel untuk mengisi pemeriksaan bulan tersebut.
        </p>
      </div>
    </div>
  );
};
