import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, Layers, X } from 'lucide-react';
import { UnifiedCombobox, type UnifiedComboboxItem } from '@/components/ui';
import type { P3kBoxType } from '@/lib/p3kItems';

export interface P3kBoxCreationPayload {
  kode: string;
  zoneName: string;
  boxType: P3kBoxType;
  inspectorName: string;
}

interface AddZoneP3kModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingZones: string[];
  existingBoxes: { id: string; kode: string; zoneName: string; boxType: P3kBoxType }[];
  onAddP3kBox: (data: P3kBoxCreationPayload) => Promise<void> | void;
}

export const AddZoneP3kModal: React.FC<AddZoneP3kModalProps> = ({
  isOpen,
  onClose,
  existingZones,
  existingBoxes,
  onAddP3kBox,
}) => {
  const [zoneInput, setZoneInput] = useState('');
  const [kodeInput, setKodeInput] = useState('');
  const [boxType, setBoxType] = useState<P3kBoxType>('A');
  const [inspectorName, setInspectorName] = useState(
    'Takamay Jason Hermantika Irsyad (Junior HSE Analyst)',
  );
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setZoneInput(existingZones[0] ?? 'Lantai 2');
      setKodeInput(`P3K-${String(existingBoxes.length + 1).padStart(2, '0')}`);
      setBoxType('A');
      setInspectorName('Takamay Jason Hermantika Irsyad (Junior HSE Analyst)');
      setErrorMessage('');
    }
  }, [isOpen, existingZones, existingBoxes.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isNewZone =
    Boolean(zoneInput.trim()) &&
    !existingZones.some((z) => z.toLowerCase() === zoneInput.trim().toLowerCase());

  const isNewKode =
    Boolean(kodeInput.trim()) &&
    !existingBoxes.some((b) => b.kode.toLowerCase() === kodeInput.trim().toLowerCase());

  const zoneOptions: UnifiedComboboxItem[] = existingZones.map((z) => ({ id: z, label: z }));
  const boxOptions: UnifiedComboboxItem[] = existingBoxes.map((b) => ({
    id: b.id,
    label: b.kode,
    sublabel: `${b.zoneName} · Tipe ${b.boxType}`,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const zone = zoneInput.trim();
    const kode = kodeInput.trim();
    if (!zone) {
      setErrorMessage('Tentukan nama zona / lantai (mis. Lantai 2 atau Lantai 3).');
      return;
    }
    if (!kode) {
      setErrorMessage('Tentukan kode kotak P3K (mis. P3K-01).');
      return;
    }
    const dup = existingBoxes.find((b) => b.kode.toLowerCase() === kode.toLowerCase());
    if (dup) {
      setErrorMessage(`Kode kotak “${kode}” sudah terdaftar. Gunakan kode lain.`);
      return;
    }
    await onAddP3kBox({ kode, zoneName: zone, boxType, inspectorName });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none no-print"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md bg-[var(--bg-modal)] text-[var(--primary)] rounded-lg border border-[var(--border)] shadow-xl overflow-hidden emil-modal font-sans flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-zone-p3k-title"
      >
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-sidebar)]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#27ae60]/15 text-[#27ae60] flex items-center justify-center text-xs font-bold flex-shrink-0">
              <Layers size={15} strokeWidth={2.2} />
            </div>
            <div>
              <h2 id="add-zone-p3k-title" className="text-xs font-bold text-[var(--primary)] tracking-tight">
                Kelola Zona &amp; Kotak P3K
              </h2>
              <p className="text-[11px] text-[var(--muted)]">
                Tambahkan kotak P3K baru beserta tipe standarnya (A, B, atau C)
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

          <UnifiedCombobox
            label="Zona / Lantai"
            value={zoneInput}
            onChange={setZoneInput}
            items={zoneOptions}
            placeholder="Pilih atau ketik lantai/zona (cth: Lantai 2)..."
            isNewItem={isNewZone}
            accent="#27ae60"
          />

          <UnifiedCombobox
            label="Kode Kotak P3K"
            value={kodeInput}
            onChange={setKodeInput}
            items={boxOptions}
            placeholder="Ketik kode kotak (cth: P3K-03)..."
            isNewItem={isNewKode}
            accent="#27ae60"
            tabularNums
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--primary)]">
              Tipe Kotak P3K (Permenakertrans 15/2008)
            </label>
            <select
              value={boxType}
              onChange={(e) => setBoxType(e.target.value as P3kBoxType)}
              className="w-full text-xs px-2.5 py-2 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] focus:outline-none focus:border-[#27ae60]"
            >
              <option value="A">Tipe A — Untuk 25 pekerja/buruh atau kurang</option>
              <option value="B">Tipe B — Untuk 50 pekerja/buruh atau kurang</option>
              <option value="C">Tipe C — Untuk 100 pekerja/buruh atau kurang</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--primary)]">
              Petugas Pemeriksa
            </label>
            <select
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              className="w-full text-xs px-2.5 py-2 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] focus:outline-none focus:border-[#27ae60]"
            >
              <option value="Takamay Jason Hermantika Irsyad (Junior HSE Analyst)">
                Takamay Jason Hermantika Irsyad (Junior HSE Analyst)
              </option>
              <option value="Hizri (Governance, Risk, HSE & Quality Group Head)">
                Hizri (Governance, Risk, HSE &amp; Quality Group Head)
              </option>
            </select>
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
              className="px-4 py-1.5 text-xs font-semibold rounded bg-[#27ae60] hover:bg-[#219653] text-white shadow-2xs cursor-pointer flex items-center gap-1.5 pressable"
            >
              <Check size={13} strokeWidth={2.5} />
              <span>Simpan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
