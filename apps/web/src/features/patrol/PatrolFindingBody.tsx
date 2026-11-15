import React from 'react';
import { AlertCircle, Check, Image as ImageIcon, Upload } from 'lucide-react';
import { TERIMA_FOTO_ACCEPT } from './types';

interface PatrolFindingBodyProps {
  imagePreview: string;
  caption: string;
  tanggal: string;
  errorMessage: string;
  isMenyimpan: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPilihFoto: () => void;
  onCaptionChange: (nilai: string) => void;
  onTanggalChange: (nilai: string) => void;
}

/**
 * Isi form tambah foto patroli: foto (wajib) → caption → tanggal → Terbitkan.
 *
 * Presentasional saja: semua state + validasi + FileReader hidup di
 * `AddPatrolFindingModal`. Satu tombol footer (`Terbitkan`, tanpa `Batal`):
 * API patroli tidak membawa status terbit, jadi Terbitkan = simpan.
 */
export const PatrolFindingBody: React.FC<PatrolFindingBodyProps> = ({
  imagePreview,
  caption,
  tanggal,
  errorMessage,
  isMenyimpan,
  fileInputRef,
  onFileChange,
  onPilihFoto,
  onCaptionChange,
  onTanggalChange,
}) => (
  <>
    {errorMessage && (
      <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
        <AlertCircle size={14} className="flex-shrink-0" />
        <span>{errorMessage}</span>
      </div>
    )}

    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-[var(--primary)]">Foto Patroli</label>
      <input
        ref={fileInputRef}
        type="file"
        accept={TERIMA_FOTO_ACCEPT}
        onChange={onFileChange}
        className="hidden"
      />
      {imagePreview ? (
        <div className="relative group rounded-[6px] border border-[var(--border)] overflow-hidden bg-black/10 aspect-[4/3] flex items-center justify-center">
          <img
            src={imagePreview}
            alt="Pratinjau patroli"
            className="w-full h-full object-contain mx-auto"
          />
          <button
            type="button"
            onClick={onPilihFoto}
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs gap-1 cursor-pointer"
          >
            <Upload size={18} />
            <span>Ganti Foto</span>
          </button>
        </div>
      ) : (
        <div
          onClick={onPilihFoto}
          className="rounded-[6px] border-2 border-dashed border-[var(--border)] hover:border-[#2f80ed]/60 hover:bg-[#2f80ed]/[0.02] transition-colors p-6 text-center cursor-pointer flex flex-col items-center justify-center gap-2"
        >
          <div className="w-10 h-10 rounded-full bg-[var(--bg-sidebar)] flex items-center justify-center text-[var(--muted)]">
            <ImageIcon size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--primary)]">
              Klik untuk pilih atau unggah foto patroli
            </p>
            <p className="text-[10px] text-[var(--muted)] mt-0.5">
              Format gambar JPG, PNG, atau WebP maks 8 MB (disarankan orientasi tegak / potret)
            </p>
          </div>
        </div>
      )}
    </div>

    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-[var(--primary)]">Keterangan Foto</label>
      <input
        type="text"
        value={caption}
        onChange={(e) => onCaptionChange(e.target.value)}
        placeholder="Contoh: APAR terhalang Tenant, Kabel tidak merekat pada lantai, dll."
        className="w-full text-xs px-2.5 py-2 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] focus:outline-none focus:border-[#2f80ed]"
        required
      />
    </div>

    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-[var(--primary)]">Tanggal Pengambilan</label>
      <input
        type="date"
        value={tanggal}
        onChange={(e) => onTanggalChange(e.target.value)}
        className="w-full text-xs px-2.5 py-2 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] tabular-nums focus:outline-none focus:border-[#2f80ed]"
        required
      />
    </div>

    <div className="pt-2 border-t border-[var(--border)] flex items-center justify-end gap-2">
      <button
        type="submit"
        disabled={isMenyimpan}
        className="px-4 py-1.5 text-xs font-semibold rounded bg-[#2f80ed] hover:bg-[#2b77d4] text-white shadow-2xs cursor-pointer flex items-center gap-1.5 pressable disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Check size={13} strokeWidth={2.5} />
        <span>{isMenyimpan ? 'Menyimpan…' : 'Terbitkan'}</span>
      </button>
    </div>
  </>
);
