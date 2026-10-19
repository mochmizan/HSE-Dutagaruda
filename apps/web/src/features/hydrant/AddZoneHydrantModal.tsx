import React, { useState, useEffect } from 'react';
import { X, Layers, Check, AlertCircle } from 'lucide-react';
import { UnifiedCombobox, type UnifiedComboboxItem } from '@/components/ui';

export interface HydrantCreationItem {
  kode: string;
  zoneName: string;
  inspectorName?: string;
}

export interface AddZoneHydrantModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingZones: string[];
  existingUnits: { id: string; kode: string; zoneName: string }[];
  onAddZone?: (zoneName: string) => void;
  onAddHydrantUnits: (newUnits: HydrantCreationItem[]) => void;
  onReassignUnitZone?: (unitId: string, newZoneName: string) => void;
  // Optional backward compatibility
  lastUnitNumber?: number;
  onAddZoneAndUnits?: (data: {
    zoneName: string;
    isNewZone: boolean;
    count: number;
    inspectorName: string;
    unitCodes: string[];
  }) => void;
}

export const AddZoneHydrantModal: React.FC<AddZoneHydrantModalProps> = ({
  isOpen,
  onClose,
  existingZones,
  existingUnits = [],
  onAddZone,
  onAddHydrantUnits,
  onReassignUnitZone,
  onAddZoneAndUnits,
}) => {
  // Single unified combobox state for Zona
  const [zoneInput, setZoneInput] = useState<string>('');

  // Single unified combobox state for Hydrant
  const [hydrantInput, setHydrantInput] = useState<string>('');

  // Inspector state
  const [inspectorName, setInspectorName] = useState<string>('Alex Chen (Staff HSE)');

  // Error message
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Initialize defaults on open
  useEffect(() => {
    if (isOpen) {
      setZoneInput(existingZones.length > 0 ? existingZones[0] : '');
      setHydrantInput('');
      setInspectorName('Alex Chen (Staff HSE)');
      setErrorMessage('');
    }
  }, [isOpen, existingZones]);

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

  // Determine if zone is new
  const isNewZone =
    Boolean(zoneInput.trim()) &&
    !existingZones.some((z) => z.toLowerCase() === zoneInput.trim().toLowerCase());

  // Determine if hydrant is new
  const isNewHydrant =
    Boolean(hydrantInput.trim()) &&
    !existingUnits.some((u) => u.kode.toLowerCase() === hydrantInput.trim().toLowerCase());

  // Combobox options
  const zoneOptions: UnifiedComboboxItem[] = existingZones.map((z) => ({
    id: z,
    label: z,
  }));

  const hydrantOptions: UnifiedComboboxItem[] = existingUnits.map((u) => ({
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

    const targetHydrant = hydrantInput.trim();

    // If no hydrant is specified, but a new zone was typed:
    if (!targetHydrant) {
      if (isNewZone) {
        onAddZone?.(targetZone);
        onClose();
        return;
      }
      setErrorMessage('Tentukan kode hydrant (pilih dari dropdown atau ketik kode baru).');
      return;
    }

    // 1. Zone creation if new
    if (isNewZone && onAddZone) {
      onAddZone(targetZone);
    }

    // 2. Hydrant handling: check if user picked an existing unit
    const matchedExistingUnit = existingUnits.find(
      (u) => u.kode.toLowerCase() === targetHydrant.toLowerCase()
    );

    if (matchedExistingUnit) {
      // Reassign existing unit to the target zone
      if (onReassignUnitZone) {
        onReassignUnitZone(matchedExistingUnit.id, targetZone);
      }
    } else {
      // Create new unit(s) - supports comma-separated codes if needed
      const codes = targetHydrant
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      if (codes.length === 0) {
        setErrorMessage('Masukkan kode hydrant yang valid.');
        return;
      }

      const payload: HydrantCreationItem[] = codes.map((kode) => ({
        kode,
        zoneName: targetZone,
        inspectorName,
      }));

      onAddHydrantUnits(payload);

      if (onAddZoneAndUnits) {
        onAddZoneAndUnits({
          zoneName: targetZone,
          isNewZone,
          count: codes.length,
          inspectorName,
          unitCodes: codes,
        });
      }
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md bg-[var(--bg-modal)] text-[var(--primary)] rounded-lg border border-[var(--border)] shadow-xl overflow-hidden emil-modal font-sans flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unified-add-zone-hydrant-title"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-sidebar)]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#eb5757]/15 text-[#eb5757] flex items-center justify-center text-xs font-bold flex-shrink-0">
              <Layers size={15} strokeWidth={2.2} />
            </div>
            <div>
              <h2
                id="unified-add-zone-hydrant-title"
                className="text-xs font-bold text-[var(--primary)] tracking-tight"
              >
                Kelola Zona & Hydrant
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {errorMessage && (
            <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Unified Combobox: Zona */}
          <UnifiedCombobox
            label="Zona"
            value={zoneInput}
            onChange={setZoneInput}
            items={zoneOptions}
            placeholder="Pilih atau ketik nama zona..."
            isNewItem={isNewZone}
          />

          {/* 2. Unified Combobox: Hydrant */}
          <UnifiedCombobox
            label="Unit Hydrant"
            value={hydrantInput}
            onChange={setHydrantInput}
            items={hydrantOptions}
            placeholder="Pilih atau ketik kode hydrant..."
            isNewItem={isNewHydrant}
          />

          {/* 3. Petugas Pemeriksa */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--primary)]">
              Petugas Pemeriksa
            </label>
            <select
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              className="w-full text-xs px-2.5 py-2 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] focus:outline-none focus:border-[#eb5757]"
            >
              <option value="Alex Chen (Staff HSE)">Alex Chen (Staff HSE)</option>
              <option value="Budi Santoso (Staff HSE)">Budi Santoso (Staff HSE)</option>
              <option value="Siti Rahma (Inspector K3)">Siti Rahma (Inspector K3)</option>
              <option value="Deni Kurniawan (Teknisi K3)">Deni Kurniawan (Teknisi K3)</option>
            </select>
          </div>

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
              <span>Simpan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
