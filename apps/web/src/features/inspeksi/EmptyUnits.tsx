import React from 'react';
import type { FilterTab } from '@/features/pageChrome';

interface EmptyUnitsProps {
  /** Ikon 32px polos; warna aksen + redup 40% diterapkan komponen ini. */
  ikon: React.ReactNode;
  /** Aksen halaman kategori (Hydrant `#eb5757`, APAR `#f2994a`). */
  aksen: string;
  /** Judul baris, mis. `Tidak ada unit hydrant yang cocok`. */
  judul: string;
  filterTab: FilterTab;
  onTampilkanSemua: () => void;
  /**
   * Bila ada, varian baris tombol Hydrant (`Tampilkan Semua Unit` +
   * `+ Tambah Unit Baru`). Bila tidak ada, varian tunggal APAR (tanpa tombol
   * tambah — laman APAR tidak pernah menawarkannya di status kosong).
   */
  onTambah?: () => void;
}

/**
 * Status kosong Section A Hydrant + APAR.
 *
 * Satu komponen supaya wadah, judul, subjudul, dan biru aksi `#2f80ed` tidak
 * menyimpang lagi. Satu-satunya cabang didokumentasikan di `onTambah`.
 */
export const EmptyUnits: React.FC<EmptyUnitsProps> = ({
  ikon,
  aksen,
  judul,
  filterTab,
  onTampilkanSemua,
  onTambah,
}) => (
  <div className="py-16 text-center text-xs text-[var(--muted)] border border-dashed border-[var(--border)] rounded-[8px] bg-[var(--bg-sidebar)]/50">
    <span className="mx-auto mb-2 block w-fit opacity-40" style={{ color: aksen }}>
      {ikon}
    </span>
    <p className="font-semibold text-sm text-[var(--primary)]">{judul}</p>
    <p className="text-xs text-[var(--muted)] mt-1">
      Coba sesuaikan tab filter atau kata kunci pencarian Anda.
    </p>
    {onTambah ? (
      <div className="mt-3 flex items-center justify-center gap-2">
        {filterTab !== 'ALL' && (
          <button
            type="button"
            onClick={onTampilkanSemua}
            className="px-3 py-1.5 text-xs font-semibold text-[#2f80ed] bg-[#2f80ed]/10 hover:bg-[#2f80ed]/20 rounded-[4px] cursor-pointer"
          >
            Tampilkan Semua Unit
          </button>
        )}
        <button
          type="button"
          onClick={onTambah}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-[#2f80ed] hover:bg-[#2b77d4] rounded-[4px] cursor-pointer"
        >
          + Tambah Unit Baru
        </button>
      </div>
    ) : (
      filterTab !== 'ALL' && (
        <button
          type="button"
          onClick={onTampilkanSemua}
          className="no-print mt-3 px-3 py-1.5 text-xs font-semibold rounded-[4px] cursor-pointer"
          style={{ color: '#2f80ed', backgroundColor: 'rgba(47, 128, 237, 0.10)' }}
        >
          Tampilkan Semua Unit
        </button>
      )
    )}
  </div>
);
