import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Camera, AlertCircle, Check, Image as ImageIcon } from 'lucide-react';

export interface AddPatrolFindingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFinding: (finding: { file: File; caption: string; tanggal: string }) => void;
  /** True saat unggahan berjalan: tombol simpan nonaktif. */
  isMenyimpan?: boolean;
}

const todayIso = (): string => new Date().toISOString().slice(0, 10);

/** Format yang diterima server dan batas ukuran unggahan. */
const TIPE_FOTO_DITERIMA = ['image/jpeg', 'image/png', 'image/webp'];
const BATAS_FOTO_BYTE = 8 * 1024 * 1024;

/** Add form for one patrol photo: photo required, caption required, date defaults to today. */
export const AddPatrolFindingModal: React.FC<AddPatrolFindingModalProps> = ({
  isOpen,
  onClose,
  onAddFinding,
  isMenyimpan = false,
}) => {
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState<string>('');
  const [tanggal, setTanggal] = useState<string>(todayIso());
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setImagePreview('');
      setSelectedFile(null);
      setCaption('');
      setTanggal(todayIso());
      setErrorMessage('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!TIPE_FOTO_DITERIMA.includes(file.type)) {
      setErrorMessage('Format foto harus JPEG, PNG, atau WebP.');
      return;
    }
    if (file.size > BATAS_FOTO_BYTE) {
      setErrorMessage('Ukuran foto maksimal 8 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
      setSelectedFile(file);
      setErrorMessage('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!selectedFile) {
      setErrorMessage('Unggah foto patroli terlebih dahulu.');
      return;
    }
    if (!caption.trim()) {
      setErrorMessage('Tuliskan keterangan foto patroli.');
      return;
    }
    if (!tanggal) {
      setErrorMessage('Pilih tanggal pengambilan foto.');
      return;
    }
    onAddFinding({ file: selectedFile, caption: caption.trim(), tanggal });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg bg-[var(--bg-modal)] text-[var(--primary)] rounded-lg border border-[var(--border)] shadow-2xl overflow-hidden emil-modal font-sans flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-patrol-title"
      >
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-sidebar)]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#2f80ed]/15 text-[#2f80ed] flex items-center justify-center text-xs font-bold flex-shrink-0">
              <Camera size={15} strokeWidth={2.2} />
            </div>
            <div>
              <h2 id="add-patrol-title" className="text-xs font-bold text-[var(--primary)] tracking-tight">
                Tambah Foto Patroli
              </h2>
              <p className="text-[11px] text-[var(--muted)]">
                Unggah foto lapangan dan keterangan temuan patroli
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded flex items-center justify-center text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-hover)] cursor-pointer pressable"
            aria-label="Tutup modal"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative group rounded-[6px] border border-[var(--border)] overflow-hidden bg-black/10 aspect-[4/3] flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Preview Patroli"
                  className="w-full h-full object-contain mx-auto"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs gap-1 cursor-pointer"
                >
                  <Upload size={18} />
                  <span>Ganti Foto</span>
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
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
                    Format gambar JPG, PNG, atau WebP (Disarankan orientasi tegak / potret)
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--primary)]">
              Keterangan Foto
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Contoh: APAR terhalang Tenant, Kabel tidak merekat pada lantai, dll."
              className="w-full text-xs px-2.5 py-2 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] focus:outline-none focus:border-[#2f80ed]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--primary)]">
              Tanggal Pengambilan
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full text-xs px-2.5 py-2 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] tabular-nums focus:outline-none focus:border-[#2f80ed]"
              required
            />
          </div>

          <div className="pt-2 border-t border-[var(--border)] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium rounded border border-[var(--border)] hover:bg-[var(--bg-hover)] text-[var(--secondary)] cursor-pointer pressable"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isMenyimpan}
              className="px-4 py-1.5 text-xs font-semibold rounded bg-[#2f80ed] hover:brightness-95 text-white shadow-2xs cursor-pointer flex items-center gap-1.5 pressable disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check size={13} strokeWidth={2.5} />
              <span>{isMenyimpan ? 'Menyimpan…' : 'Simpan Foto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
