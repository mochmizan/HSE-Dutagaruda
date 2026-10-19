import React from 'react';

interface P3kKepalaProps {
  year: string;
  unitKerja: string;
  onUbahUnitKerja: (nilai: string) => void;
  lokasiKerja: string;
  onUbahLokasiKerja: (nilai: string) => void;
}

/** Kop dokumen: judul, periode, Unit/Lokasi Kerja, dan legenda tanda. */
export const P3kKepala: React.FC<P3kKepalaProps> = ({
  year,
  unitKerja,
  onUbahUnitKerja,
  lokasiKerja,
  onUbahLokasiKerja,
}) => (
  <>
    <h2 className="text-base font-bold text-center text-[var(--primary)] tracking-tight print:text-black">
      INSPEKSI KOTAK P3K
    </h2>
    <div className="mt-1 px-2 py-1 text-[11px] font-semibold bg-[#dbe7f3] dark:bg-[var(--bg-sidebar)] print:bg-[#dbe7f3] print:text-black rounded-[3px] tabular-nums">
      Periode : {year}
    </div>
    <div className="mt-1.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-[11px] print:text-[10px] print:text-black">
      <span>
        <span className="font-semibold">Unit Kerja : </span>
        <input
          value={unitKerja}
          onChange={(e) => onUbahUnitKerja(e.target.value)}
          aria-label="Unit Kerja"
          className="no-print w-28 bg-transparent border-b border-[var(--border)] focus:outline-none focus:border-[#27ae60] px-1"
        />
        <span className="hidden print:inline">{unitKerja}</span>
      </span>
      <span>
        <span className="font-semibold">Lokasi Kerja : </span>
        <input
          value={lokasiKerja}
          onChange={(e) => onUbahLokasiKerja(e.target.value)}
          aria-label="Lokasi Kerja"
          className="no-print w-48 bg-transparent border-b border-[var(--border)] focus:outline-none focus:border-[#27ae60] px-1"
        />
        <span className="hidden print:inline">{lokasiKerja}</span>
      </span>
      <span className="sm:ml-auto text-[var(--muted)] print:text-black">
        <span className="font-semibold">Keterangan: </span>
        Standar ( √ ) | Di Bawah Standar ( × ) | Kadaluarsa (KD)
      </span>
    </div>
    <p className="no-print text-[11px] text-[var(--muted)] mt-1.5 mb-2">
      Klik nama bulan untuk mengisi hasil pemeriksaan bulan tersebut.
    </p>
  </>
);
