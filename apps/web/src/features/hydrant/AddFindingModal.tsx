import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Camera, AlertCircle, Check, Image as ImageIcon } from 'lucide-react';
import type { HydrantFindingItem } from './types';

export interface AddFindingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFinding: (finding: Omit<HydrantFindingItem, 'id' | 'createdAt'>) => void;
  existingUnits?: string[];
}

export const AddFindingModal: React.FC<AddFindingModalProps> = ({
  isOpen,
  onClose,
  onAddFinding,
  existingUnits = [],
}) => {
  const [imagePreview, setImagePreview] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [unitCode, setUnitCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setImagePreview('');
      setDescription('');
      setUnitCode(existingUnits[0] || '');
      setErrorMessage('');
    }
  }, [isOpen, existingUnits]);

  // Handle ESC key
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

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('File yang dipilih harus berupa gambar (JPG, PNG, WebP).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
        setErrorMessage('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!imagePreview) {
      setErrorMessage('Unggah atau pilih foto temuan terlebih dahulu.');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Tuliskan deskripsi temuan kondisi fisik hydrant.');
      return;
    }

    onAddFinding({
      imageUrl: imagePreview,
      description: description.trim(),
      unitCode: unitCode || undefined,
    });

    onClose();
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
        aria-labelledby="add-finding-title"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-sidebar)]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#eb5757]/15 text-[#eb5757] flex items-center justify-center text-xs font-bold flex-shrink-0">
              <Camera size={15} strokeWidth={2.2} />
            </div>
            <div>
              <h2
                id="add-finding-title"
                className="text-xs font-bold text-[var(--primary)] tracking-tight"
              >
                Tambah Catatan Hasil Temuan
              </h2>
              <p className="text-[11px] text-[var(--muted)]">
                Unggah foto dokumentasi visual dan deskripsi temuan lapangan
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {errorMessage && (
            <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Image Upload Box */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--primary)]">
              Foto Temuan Fisik
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {imagePreview ? (
              <div className="relative group rounded-[6px] border border-[var(--border)] overflow-hidden bg-black/10 aspect-[4/3] flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Preview Temuan"
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
                className="rounded-[6px] border-2 border-dashed border-[var(--border)] hover:border-[#eb5757]/60 hover:bg-[#eb5757]/[0.02] transition-colors p-6 text-center cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--bg-sidebar)] flex items-center justify-center text-[var(--muted)]">
                  <ImageIcon size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--primary)]">
                    Klik untuk pilih atau unggah foto temuan
                  </p>
                  <p className="text-[10px] text-[var(--muted)] mt-0.5">
                    Format gambar JPG, PNG, atau WebP (Disarankan orientasi tegak / potret)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 2. Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--primary)]">
              Deskripsi / Keterangan Temuan
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Hose Coupling tidak ada, Selang Hydrant robek, dll."
              className="w-full text-xs px-2.5 py-2 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] focus:outline-none focus:border-[#eb5757]"
              required
            />
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-[var(--muted)]">Saran:</span>
              {[
                'Hose Coupling tidak ada',
                'Selang Hydrant robek',
                'Outlet sambungan karat dan berair',
                'Tidak ada isi pada box Hydrant',
                'Hydrant tidak bisa menutup rapat',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDescription(preset)}
                  className="px-2 py-0.5 rounded text-[10px] bg-[var(--bg-sidebar)] hover:bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--secondary)] hover:text-[var(--primary)] cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Unit Hydrant Terkait (Optional) */}
          {existingUnits.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[var(--primary)]">
                Unit Hydrant Terkait (Opsional)
              </label>
              <select
                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)}
                className="w-full text-xs px-2.5 py-2 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] focus:outline-none focus:border-[#eb5757]"
              >
                <option value="">-- Tanpa Tautan Unit Khusus --</option>
                {existingUnits.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Buttons */}
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
              className="px-4 py-1.5 text-xs font-semibold rounded bg-[#eb5757] hover:bg-[#d94444] text-white shadow-2xs cursor-pointer flex items-center gap-1.5 pressable"
            >
              <Check size={13} strokeWidth={2.5} />
              <span>Simpan Temuan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
