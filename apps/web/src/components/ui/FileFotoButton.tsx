import React, { useRef } from 'react';
import { Camera, Upload } from 'lucide-react';

interface FileFotoButtonProps {
  nonaktif?: boolean;
  belumTersimpan?: boolean;
  sibuk?: boolean;
  onFile?: (file: File) => void;
  onFiles?: (files: File[]) => void;
  multiple?: boolean;
  label?: string;
  variant?: 'netral' | 'utama';
}

const GAYA_NETRAL =
  'border border-[var(--border)] bg-[var(--bg-sidebar)] text-[var(--primary)] hover:bg-[var(--bg-hover)]';

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
    <div className="flex items-center gap-2 flex-shrink-0">
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
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
        className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-[4px] whitespace-nowrap flex-shrink-0 cursor-pointer pressable disabled:opacity-40 disabled:cursor-not-allowed ${
          variant === 'utama' ? GAYA_UTAMA : GAYA_NETRAL
        }`}
      >
        {sibuk ? <Camera size={12} className="animate-pulse" /> : <Upload size={12} />}
        <span>{sibuk ? 'Mengunggah…' : label}</span>
      </button>
      {belumTersimpan && (
        <span className="text-[10px] text-[var(--muted)]">
          Simpan laporan dahulu.
        </span>
      )}
    </div>
  );
};
