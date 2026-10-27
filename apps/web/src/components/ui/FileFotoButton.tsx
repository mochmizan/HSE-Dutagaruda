import React, { useRef } from 'react';
import { Camera, Upload } from 'lucide-react';

/**
 * Tombol unggah foto/berkas gambar (JPEG/PNG/WebP).
 *
 * Semua prop lama tetap sah (`onFile`, `sibuk`, `belumTersimpan`, `nonaktif`)
 * karena tombol ini dipakai modal inspeksi Hydrant & APAR. Prop baru
 * (`multiple`, `onFiles`, `label`, `variant`) ada untuk pemakaian lain seperti
 * peta proyek, yang mengunggah beberapa denah sekaligus dan butuh tombol aksi
 * biru tanpa menduplikasi markup.
 */
interface FileFotoButtonProps {
  /** Dinonaktifkan manual (mis. slot foto yang tidak berlaku untuk unit ini). */
  nonaktif?: boolean;
  belumTersimpan?: boolean;
  sibuk?: boolean;
  /** Jalur satu berkas (pemakaian lama). */
  onFile?: (file: File) => void;
  /** Jalur banyak berkas; dipakai bila `multiple` aktif. */
  onFiles?: (files: File[]) => void;
  /** Izinkan pilih lebih dari satu gambar dalam satu dialog. */
  multiple?: boolean;
  /** Teks tombol saat diam; berubah jadi `Mengunggah…` ketika sibuk. */
  label?: string;
  /** `utama` = biru aksi `#2f80ed` (konvensi tombol aksi repo); `netral` = bergaris. */
  variant?: 'netral' | 'utama';
}

const GAYA_NETRAL =
  'border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--primary)] hover:bg-[var(--bg-hover)]';

// Biru aksi seragam seluruh aplikasi (bukan aksen kategori).
const GAYA_UTAMA =
  'border border-transparent bg-[#2f80ed] text-white hover:brightness-95';

export const FileFotoButton: React.FC<FileFotoButtonProps> = ({
  nonaktif = false,
  belumTersimpan = false,
  sibuk = false,
  onFile,
  onFiles,
  multiple = false,
  label = 'Unggah Foto',
  variant = 'netral',
}) => {
  const ref = useRef<HTMLInputElement>(null);
  const mati = nonaktif || belumTersimpan || sibuk;
  return (
    <div className="flex items-center gap-2">
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          // Salin ke array SEBELUM nilai input direset: `e.target.files` ikut
          // kosong setelah `value = ''`, sehingga daftar pilihan hilang.
          const berkas = Array.from(e.target.files ?? []);
          e.target.value = '';
          if (berkas.length === 0) return;
          if (multiple) {
            onFiles?.(berkas);
            return;
          }
          onFile?.(berkas[0]);
        }}
      />
      <button
        type="button"
        disabled={mati}
        onClick={() => ref.current?.click()}
        title={
          belumTersimpan
            ? 'Simpan laporan dahulu untuk mengunggah foto'
            : `${label} dari perangkat (JPEG, PNG, atau WebP)`
        }
        className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-[4px] cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed ${
          variant === 'utama' ? GAYA_UTAMA : GAYA_NETRAL
        }`}
      >
        {sibuk ? <Camera size={12} className="animate-pulse" /> : <Upload size={12} />}
        <span>{sibuk ? 'Mengunggah…' : label}</span>
      </button>
      {belumTersimpan && (
        <span className="text-[10px] text-[var(--muted)]">
          Simpan laporan dahulu untuk mengunggah foto.
        </span>
      )}
    </div>
  );
};
