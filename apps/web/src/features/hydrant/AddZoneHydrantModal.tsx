import React, { useState, useEffect, useRef } from 'react';
import { X, Layers, ChevronDown, Check, Plus, AlertCircle } from 'lucide-react';

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

interface UnifiedComboboxItem {
  id: string;
  label: string;
  sublabel?: string;
}

interface UnifiedComboboxProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  items: UnifiedComboboxItem[];
  placeholder: string;
  isNewItem: boolean;
}

const UnifiedCombobox: React.FC<UnifiedComboboxProps> = ({
  label,
  value,
  onChange,
  items,
  placeholder,
  isNewItem,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const trimmedValue = value.trim();
  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(trimmedValue.toLowerCase())
  );
  const hasExactMatch = items.some(
    (item) => item.label.toLowerCase() === trimmedValue.toLowerCase()
  );

  return (
    <div ref={containerRef} className="space-y-1.5 relative">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[var(--primary)]">{label}</label>
        {trimmedValue && (
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded font-medium border ${
              isNewItem
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            }`}
          >
            {isNewItem ? '+ Baru' : '✓ Terdaftar'}
          </span>
        )}
      </div>

      {/* Unified Input + Dropdown Trigger */}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full text-xs pl-2.5 pr-8 py-2 rounded-[4px] border border-[var(--border)] bg-[var(--bg-main)] text-[var(--primary)] focus:outline-none focus:border-[#eb5757]"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-[var(--muted)] hover:text-[var(--primary)] cursor-pointer"
          aria-label={`Buka pilihan ${label}`}
        >
          <ChevronDown
            size={14}
            className={`transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-48 overflow-y-auto rounded-[4px] border border-[var(--border)] bg-[var(--bg-modal)] shadow-lg py-1 divide-y divide-[var(--border)]">
          {/* Option to create new if user typed non-matching value */}
          {trimmedValue && !hasExactMatch && (
            <div
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1.5 text-xs hover:bg-[var(--bg-hover)] cursor-pointer flex items-center justify-between text-[#eb5757] font-medium"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Plus size={12} strokeWidth={2.5} className="flex-shrink-0" />
                <span className="truncate">Gunakan baru: “{trimmedValue}”</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#eb5757]/10 text-[#eb5757] border border-[#eb5757]/20 flex-shrink-0">
                Baru
              </span>
            </div>
          )}

          {/* Existing options */}
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const isSelected = item.label.toLowerCase() === trimmedValue.toLowerCase();
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onChange(item.label);
                    setIsOpen(false);
                  }}
                  className={`px-2.5 py-1.5 text-xs hover:bg-[var(--bg-hover)] cursor-pointer flex items-center justify-between ${
                    isSelected ? 'bg-[#eb5757]/10 text-[#eb5757] font-semibold' : 'text-[var(--primary)]'
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="font-medium truncate">{item.label}</span>
                    {item.sublabel && (
                      <span className="text-[10px] text-[var(--muted)] truncate">{item.sublabel}</span>
                    )}
                  </div>
                  {isSelected && (
                    <Check size={12} strokeWidth={2.5} className="text-[#eb5757] flex-shrink-0" />
                  )}
                </div>
              );
            })
          ) : (
            !trimmedValue && (
              <div className="px-2.5 py-2 text-xs text-[var(--muted)] text-center">
                Belum ada opsi terdaftar
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

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
