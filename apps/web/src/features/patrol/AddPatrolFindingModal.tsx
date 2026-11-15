import React, { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { PatrolFindingShell } from './PatrolFindingShell';
import { PatrolFindingBody } from './PatrolFindingBody';
import { BATAS_FOTO_BYTE, TIPE_FOTO_DITERIMA, type DrafFotoPatroli } from './types';

export interface AddPatrolFindingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFinding: (draf: DrafFotoPatroli) => void;
  /** True saat unggahan berjalan: tombol simpan nonaktif. */
  isMenyimpan?: boolean;
}

const todayIso = (): string => {
  const kini = new Date();
  const bulan = String(kini.getMonth() + 1).padStart(2, '0');
  const hari = String(kini.getDate()).padStart(2, '0');
  return `${kini.getFullYear()}-${bulan}-${hari}`;
};

/**
 * Modal tambah satu foto patroli: foto wajib + caption + tanggal (bawaan hari
 * ini). Semua hook + state + validasi hidup di sini, seperti kontrak
 * `HydrantInspectionModal`; Shell mengurus backdrop/Esc/kunci-gulir, Body
 * hanya menampilkan nilai.
 */
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
    <PatrolFindingShell
      onClose={onClose}
      onSubmit={handleSubmit}
      header={
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-sidebar)]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#2f80ed]/15 text-[#2f80ed] flex items-center justify-center text-xs font-bold flex-shrink-0">
              <Camera size={15} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-[var(--primary)] tracking-tight">
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
      }
    >
      <PatrolFindingBody
        imagePreview={imagePreview}
        caption={caption}
        tanggal={tanggal}
        errorMessage={errorMessage}
        isMenyimpan={isMenyimpan}
        fileInputRef={fileInputRef}
        onFileChange={handleFileChange}
        onPilihFoto={() => fileInputRef.current?.click()}
        onCaptionChange={setCaption}
        onTanggalChange={setTanggal}
      />
    </PatrolFindingShell>
  );
};
