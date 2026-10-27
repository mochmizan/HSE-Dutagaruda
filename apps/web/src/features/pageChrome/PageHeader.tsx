import React from 'react';
import { Printer } from 'lucide-react';
import { UnduhPdfButton, MonthSwitcher } from '@/components/ui';
import type { KategoriEkspor } from '@/services/api/klien';
import { TombolPerluas } from '@/features/navigation';

interface PageHeaderProps {
  /** Nama proyek + lokasi untuk remah roti. */
  namaProyek: string;
  siteName: string;
  /** Nama kategori di remah roti, mis. `Inspeksi Hydrant`. */
  remahKategori: string;
  /** Ikon kategori di kotak aksen. */
  ikon: React.ReactNode;
  /** Warna aksen kategori (kotak ikon). */
  aksen: string;
  judul: string;
  deskripsi: string;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  /** Blok poros periode. Bila diisi, menggantikan pengalih bulan bawaan
   *  (P3K: pengalih tahun). Bila absen dan `bulan` absen, tanpa poros
   *  (Patroli: umpan tanpa pengalih periode). */
  poros?: React.ReactNode;
  bulan?: Date;
  /** Tampilkan tombol `Bulan Ini` hanya saat bulan terpilih bukan bulan acuan. */
  tampilkanReset?: boolean;
  onResetBulan?: () => void;
  onPilihBulan?: (bulan: Date) => void;
  /** Bila labelTambah + onTambah absen, tombol tambah tidak tampil (P3K). */
  labelTambah?: string;
  onTambah?: () => void;
  /** Ikon tombol tambah (Patroli: kamera); Hydrant/APAR tanpa ikon. */
  ikonTambah?: React.ReactNode;
  kategoriEkspor: KategoriEkspor;
  jangkarEkspor: string | null;
  namaBerkas: string;
  onCetak: () => void;
}

/**
 * Kepala halaman inspeksi, dipakai keempat kategori dengan bentuk yang sama.
 *
 * Urutan aksi dikunci: poros periode (`Bulan Ini` → pengalih bulan, atau
 * poros kustom P3K, atau tanpa poros Patroli) → tambah → Unduh PDF → Cetak.
 * Tombol `Cetak` selalu netral (ghost) di keempat halaman — P3K sempat hijau,
 * kini diseragamkan supaya krom kanan atas tidak menyimpang lagi. Satu slot
 * `poros` opsional menggantikan pengalih bulan bawaan supaya tidak ada tiga
 * varian kepala halaman.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  namaProyek,
  siteName,
  remahKategori,
  ikon,
  aksen,
  judul,
  deskripsi,
  isCollapsed,
  onToggleCollapsed,
  poros,
  bulan,
  tampilkanReset,
  onResetBulan,
  onPilihBulan,
  labelTambah,
  onTambah,
  ikonTambah,
  kategoriEkspor,
  jangkarEkspor,
  namaBerkas,
  onCetak,
}) => (
  <div className="no-print flex flex-col space-y-2 pb-3 mb-4 border-b border-[var(--border)]">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
        {isCollapsed && <TombolPerluas onKlik={onToggleCollapsed} />}
        <span className="text-[var(--primary)] font-medium">{namaProyek}</span>
        <span>/</span>
        <span className="hover:text-[var(--primary)] cursor-pointer">{siteName}</span>
        <span>/</span>
        <span className="text-[var(--primary)] font-medium">{remahKategori}</span>
      </div>
    </div>

    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-[6px] flex items-center justify-center text-lg font-bold flex-shrink-0"
          style={{ backgroundColor: `${aksen}26`, color: aksen }}
        >
          {ikon}
        </div>
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-lg font-bold text-[var(--primary)] tracking-tight">{judul}</h1>
          </div>
          <p className="text-xs text-[var(--muted)] mt-0.5">{deskripsi}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {poros ??
          (bulan && tampilkanReset !== undefined && onResetBulan && onPilihBulan ? (
            <>
              {tampilkanReset && (
                <button
                  type="button"
                  onClick={onResetBulan}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer transition-colors shadow-2xs"
                >
                  Bulan Ini
                </button>
              )}

              <MonthSwitcher value={bulan} accent="#2f80ed" onChange={onPilihBulan} />
            </>
          ) : null)}

        {labelTambah && onTambah && (
          <button
            type="button"
            onClick={onTambah}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2f80ed] hover:bg-[#2b77d4] text-white text-xs font-semibold rounded-[4px] shadow-xs cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {ikonTambah}
            <span>{labelTambah}</span>
          </button>
        )}

        <UnduhPdfButton category={kategoriEkspor} refId={jangkarEkspor} namaBerkas={namaBerkas} />

        <button
          type="button"
          onClick={onCetak}
          title="Cetak lembar laporan ke printer atau simpan sebagai PDF"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--primary)] border border-[var(--border)] text-xs font-semibold rounded-[4px] shadow-2xs cursor-pointer pressable"
        >
          <Printer size={14} />
          <span>Cetak</span>
        </button>
      </div>
    </div>
  </div>
);
