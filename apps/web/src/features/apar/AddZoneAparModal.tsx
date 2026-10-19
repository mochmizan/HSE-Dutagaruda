import React, { useState, useEffect } from 'react';
import { X, Layers, Check, AlertCircle } from 'lucide-react';
import { UnifiedCombobox, type UnifiedComboboxItem } from '@/components/ui';

export interface AparCreationItem {
  kode: string;
  zoneName: string;
  jenis: 'POWDER' | 'CO2';
  ukuran: string;
  tahunPembuatan: number;
  expiredDate: string;
  inspectorName?: string;
}

export interface AddZoneAparModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingZones: string[];
  existingUnits: { id: string; kode: string; zoneName: string }[];
  lastUnitNumber?: number;
  onAddZone: (zoneName: string) => void;
  onAddAparUnits: (newUnits: AparCreationItem[]) => void;
  onReassignUnitZone: (unitId: string, newZoneName: string) => void;
}

export const AddZoneAparModal: React.FC<AddZoneAparModalProps> = ({
  isOpen,
  onClose,
  existingZones,
  existingUnits = [],
  onAddZone,
  onAddAparUnits,
  onReassignUnitZone,
}) => {
  const [zoneInput, setZoneInput] = useState<string>('');
  const [aparInput, setAparInput] = useState<string>('');
  const [jenis, setJenis] = useState<'POWDER' | 'CO2'>('POWDER');
  const [ukuran, setUkuran] = useState<string>('3 kg');
  const [ukuranTouched, setUkuranTouched] = useState(false);
  const [tahunPembuatan, setTahunPembuatan] = useState<number>(2026);
  const [expiredDate, setExpiredDate] = useState<string>('');
  const [inspectorName, setInspectorName] = useState<string>('Alex Chen (Staff HSE)');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setZoneInput(existingZones.length > 0 ? existingZones[0] : '');
      setAparInput('');
      setJenis('POWDER');
      setUkuran('3 kg');
      setUkuranTouched(false);
      setTahunPembuatan(2026);
      setExpiredDate('');
      setInspectorName('Alex Chen (Staff HSE)');
      setErrorMessage('');
    }
  }, [isOpen, existingZones]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleJenisChange = (next: 'POWDER' | 'CO2') => {
    setJenis(next);
    if (!ukuranTouched) {
      setUkuran(next === 'CO2' ? '5 kg' : '3 kg');
    }
  };

  if (!isOpen) return null;

  const isNewZone =
    Boolean(zoneInput.trim()) &&
    !existingZones.some((z) => z.toLowerCase() === zoneInput.trim().toLowerCase());

  const isNewApar =
    Boolean(aparInput.trim()) &&
    !existingUnits.some((u) => u.kode.toLowerCase() === aparInput.trim().toLowerCase());

  const zoneOptions: UnifiedComboboxItem[] = existingZones.map((z) => ({
    id: z,
    label: z,
  }));

  const aparOptions: UnifiedComboboxItem[] = existingUnits.map((u) => ({
    id: u.id,
    label: u.kode,
    sublabel: `Zona saat ini: ${u.zoneName}`,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const targetZone = zoneInput.trim();
    if (!targetZone) {
      setErrorMessage('Tentukan nama zona (pilih dari dropdown atau ketik nama baru).');
      return;
    }

    const targetApar = aparInput.trim();

    if (!targetApar) {
      if (isNewZone) {
        onAddZone(targetZone);
        onClose();
        return;
      }
      setErrorMessage('Tentukan kode APAR (pilih dari dropdown atau ketik kode baru).');
      return;
    }

    const matchedExistingUnit = existingUnits.find(
      (u) => u.kode.toLowerCase() === targetApar.toLowerCase()
    );

    if (matchedExistingUnit) {
      if (isNewZone) {
        onAddZone(targetZone);
      }
      onReassignUnitZone(matchedExistingUnit.id, targetZone);
      onClose();
      return;
    }

    if (!expiredDate) {
      setErrorMessage('Tanggal kedaluwarsa wajib diisi untuk unit APAR baru.');
      return;
    }

    if (!ukuran.trim()) {
      setErrorMessage('Ukuran APAR wajib diisi (contoh: 3 kg).');
      return;
    }

    if (!Number.isFinite(tahunPembuatan) || tahunPembuatan < 1990 || tahunPembuatan > 2030) {
      setErrorMessage('Tahun pembuatan tidak valid (1990–2030).');
      return;
    }

    const codes = targetApar
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    if (codes.length === 0) {
      setErrorMessage('Masukkan kode APAR yang valid.');
      return;
    }

    const duplicate = codes.find((c) =>
      existingUnits.some((u) => u.kode.toLowerCase() === c.toLowerCase())
    );
    if (duplicate) {
      setErrorMessage(`Kode APAR “${duplicate}” sudah terdaftar. Gunakan kode lain.`);
      return;
    }

    if (isNewZone) {
      onAddZone(targetZone);
    }

    const payload: AparCreationItem[] = codes.map((kode) => ({
      kode,
      zoneName: targetZone,
      jenis,
      ukuran: ukuran.trim(),
      tahunPembuatan,
      expiredDate,
      inspectorName,
    }));

    onAddAparUnits(payload);
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
        className="w-full max-w-md bg-[var(--bg-modal)] text-[var(--primary)] rounded-lg border border-[var(--border)] shadow-xl overflow-hidden emil-modal font-sans flex flex-col max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unified-add-zone-apar-title"
      >
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-sidebar)]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#f2994a]/15 text-[#f2994a] flex items-center justify-center text-xs font-bold flex-shrink-0">
              <Layers size={15} strokeWidth={2.2} />
            </div>
            <div>
              <h2
                id="unified-add-zone-apar-title"
                className="text-xs font-bold text-[var(--primary)] tracking-tight"
              >
                Kelola Zona &amp; APAR
              </h2>
              <p className="text-[11px] text-[var(--muted)]">
                Pilih dari daftar dropdown atau ketik langsung untuk baru
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
            label="Zona"
            value={zoneInput}
            onChange={setZoneInput}
            items={zoneOptions}
            placeholder="Pilih atau ketik nama zona..."
            isNewItem={isNewZone}
            accent="#f2994a"
            tabularNums
          />

          <UnifiedCombobox
            label="Unit APAR"
            value={aparInput}
            onChange={setAparInput}
            items={aparOptions}
            placeholder="Pilih atau ketik kode APAR..."
            isNewItem={isNewApar}
            accent="#f2994a"
            tabularNums
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[var(--primary)]">
                Jenis APAR
              </label>
              <select
                value={jenis}
                onChange={(e) => handleJenisChange(e.target.value as 'POWDER' | 'CO2')}
                className="w-full text-xs px-2.5 py-2 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] focus:outline-none focus:border-[#f2994a]"
              >
                <option value="POWDER">Powder</option>
                <option value="CO2">CO₂</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[var(--primary)]">
                Ukuran
              </label>
              <input
                type="text"
                value={ukuran}
                onChange={(e) => {
                  setUkuran(e.target.value);
                  setUkuranTouched(true);
                }}
                placeholder="cth: 3 kg"
                className="w-full text-xs px-2.5 py-2 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] tabular-nums focus:outline-none focus:border-[#f2994a]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[var(--primary)]">
                Tahun Pembuatan
              </label>
              <input
                type="number"
                value={tahunPembuatan}
                min={1990}
                max={2030}
                onChange={(e) => setTahunPembuatan(Number(e.target.value))}
                className="w-full text-xs px-2.5 py-2 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] tabular-nums focus:outline-none focus:border-[#f2994a]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[var(--primary)]">
                Tanggal Kedaluwarsa
              </label>
              <input
                type="date"
                value={expiredDate}
                onChange={(e) => setExpiredDate(e.target.value)}
                className="w-full text-xs px-2.5 py-2 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] tabular-nums focus:outline-none focus:border-[#f2994a]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--primary)]">
              Petugas Pemeriksa
            </label>
            <select
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              className="w-full text-xs px-2.5 py-2 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] focus:outline-none focus:border-[#f2994a]"
            >
              <option value="Alex Chen (Staff HSE)">Alex Chen (Staff HSE)</option>
              <option value="Budi Santoso (Staff HSE)">Budi Santoso (Staff HSE)</option>
              <option value="Siti Rahma (Inspector K3)">Siti Rahma (Inspector K3)</option>
              <option value="Deni Kurniawan (Teknisi K3)">Deni Kurniawan (Teknisi K3)</option>
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
              className="px-4 py-1.5 text-xs font-semibold rounded bg-[#f2994a] hover:bg-[#e08838] text-white shadow-2xs cursor-pointer flex items-center gap-1.5 pressable"
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
