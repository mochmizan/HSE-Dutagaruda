import React, { useRef } from 'react';
import { Camera, Upload } from 'lucide-react';

/** Tombol unggah foto inspeksi (JPEG/PNG/WebP). Nonaktif sebelum laporan tersimpan. */
interface FileFotoButtonProps {
  terkunci?: boolean;
  belumTersimpan?: boolean;
  sibuk?: boolean;
  onFile: (file: File) => void;
}

export const FileFotoButton: React.FC<FileFotoButtonProps> = ({
  terkunci = false,
  belumTersimpan = false,
  sibuk = false,
  onFile,
}) => {
  const ref = useRef<HTMLInputElement>(null);
  const mati = terkunci || belumTersimpan || sibuk;
  return (
    <div className="flex items-center gap-2">
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        disabled={mati}
        onClick={() => ref.current?.click()}
        title={
          terkunci
            ? 'Laporan terkunci — menunggu persetujuan'
            : belumTersimpan
              ? 'Simpan laporan dahulu untuk mengunggah foto'
              : 'Unggah foto dari perangkat (JPEG, PNG, atau WebP, maks 8 MB)'
        }
        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-[4px] border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {sibuk ? <Camera size={12} className="animate-pulse" /> : <Upload size={12} />}
        <span>{sibuk ? 'Mengunggah…' : 'Unggah Foto'}</span>
      </button>
      {belumTersimpan && !terkunci && (
        <span className="text-[10px] text-[var(--muted)]">
          Simpan laporan dahulu untuk mengunggah foto.
        </span>
      )}
    </div>
  );
};
