import React, { useState, useEffect, useRef } from 'react';
import { X, Layers, Check, AlertCircle } from 'lucide-react';
import { UnifiedCombobox, type UnifiedComboboxItem } from '@/components/ui';

export interface HydrantCreationItem {
  kode: string;
  zoneName: string;
  inspectorName?: string;
}

export interface HydrantUpdatePayload {
  kode?: string;
  zoneName: string;
}

export interface AddZoneHydrantModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingZones: string[];
  existingUnits: { id: string; kode: string; zoneName: string }[];
  onAddZone?: (zoneName: string) => void;
  onAddHydrantUnits: (newUnits: HydrantCreationItem[]) => void;
  onReassignUnitZone?: (unitId: string, newZoneName: string) => void;
  onUpdateHydrantUnit?: (unitId: string, data: HydrantUpdatePayload) => void;
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
  onUpdateHydrantUnit,
  onAddZoneAndUnits,
}) => {
  const [zoneInput, setZoneInput] = useState<string>('');
  const [hydrantInput, setHydrantInput] = useState<string>('');
  const [newKodeInput, setNewKodeInput] = useState<string>('');
  const [inspectorName, setInspectorName] = useState<string>(
    'Takamay Jason Hermantika Irsyad (Junior HSE Analyst)',
  );
  const [errorMessage, setErrorMessage] = useState<string>('');
  const lastMatchedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setZoneInput(existingZones.length > 0 ? existingZones[0] : '');
      setHydrantInput('');
      setNewKodeInput('');
      setInspectorName('Takamay Jason Hermantika Irsyad (Junior HSE Analyst)');
      setErrorMessage('');
      lastMatchedIdRef.current = null;
    }
  }, [isOpen, existingZones]);

  const matchedExistingUnit = existingUnits.find(
    (u) => u.kode.toLowerCase() === hydrantInput.trim().toLowerCase(),
  );

  // Prefill zona & kode saat pengguna memilih unit hydrant yang sudah ada.
  useEffect(() => {
    if (!isOpen) return;
    if (matchedExistingUnit && lastMatchedIdRef.current !== matchedExistingUnit.id) {
      lastMatchedIdRef.current = matchedExistingUnit.id;
      setZoneInput(matchedExistingUnit.zoneName);
      setNewKodeInput(matchedExistingUnit.kode);
    } else if (!matchedExistingUnit) {
      lastMatchedIdRef.current = null;
    }
  }, [isOpen, matchedExistingUnit]);

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

  const isNewZone =
    Boolean(zoneInput.trim()) &&
    !existingZones.some((z) => z.toLowerCase() === zoneInput.trim().toLowerCase());

  const isNewHydrant = Boolean(hydrantInput.trim()) && !matchedExistingUnit;

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

    if (!targetHydrant) {
      if (isNewZone) {
        onAddZone?.(targetZone);
        onClose();
        return;
      }
      setErrorMessage('Tentukan kode hydrant (pilih dari dropdown atau ketik kode baru).');
      return;
    }

    if (matchedExistingUnit) {
      const updatedKode = newKodeInput.trim() || matchedExistingUnit.kode;
      const duplicateOther = existingUnits.find(
        (u) =>
          u.id !== matchedExistingUnit.id &&
          u.kode.toLowerCase() === updatedKode.toLowerCase(),
      );
      if (duplicateOther) {
        setErrorMessage(`Kode hydrant “${updatedKode}” sudah digunakan unit lain.`);
        return;
      }
      if (onUpdateHydrantUnit) {
        onUpdateHydrantUnit(matchedExistingUnit.id, {
          kode: updatedKode,
          zoneName: targetZone,
        });
      } else if (onReassignUnitZone) {
        onReassignUnitZone(matchedExistingUnit.id, targetZone);
      }
      onClose();
      return;
    }

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
                Kelola Zona &amp; Hydrant
              </h2>
              <p className="text-[11px] text-[var(--muted)]">
                Pilih unit yang ada untuk mengubahnya, atau ketik kode baru
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

          {matchedExistingUnit && (
            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-[11px]">
              Mode sunting unit <strong>{matchedExistingUnit.kode}</strong> — ubah zona atau kode di bawah lalu klik <strong>Simpan Perubahan</strong>.
            </div>
          )}

          <UnifiedCombobox
            label="Unit Hydrant"
            value={hydrantInput}
            onChange={setHydrantInput}
            items={hydrantOptions}
            placeholder="Pilih unit yang ada atau ketik kode baru..."
            isNewItem={isNewHydrant}
          />

          <UnifiedCombobox
            label="Zona"
            value={zoneInput}
            onChange={setZoneInput}
            items={zoneOptions}
            placeholder="Pilih atau ketik nama zona..."
            isNewItem={isNewZone}
          />

          {matchedExistingUnit && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[var(--primary)]">
                Kode Unit Hydrant
              </label>
              <input
                type="text"
                value={newKodeInput}
                onChange={(e) => setNewKodeInput(e.target.value)}
                placeholder="cth: HYD-01"
                className="w-full text-xs px-2.5 py-2 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] font-mono tabular-nums focus:outline-none focus:border-[#eb5757]"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--primary)]">
              Petugas Pemeriksa
            </label>
            <select
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              className="w-full text-xs px-2.5 py-2 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] focus:outline-none focus:border-[#eb5757]"
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
              className="px-4 py-1.5 text-xs font-semibold rounded bg-[#eb5757] hover:bg-[#d94444] text-white shadow-2xs cursor-pointer flex items-center gap-1.5 pressable"
            >
              <Check size={13} strokeWidth={2.5} />
              <span>{matchedExistingUnit ? 'Simpan Perubahan' : 'Simpan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
